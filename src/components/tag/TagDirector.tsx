import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../game/store";
import { sfx } from "../../game/audio";
import { skillFactor, botReactionFactor } from "../../game/settings";
import {
  TAG_YARD_HALF, TAG_REACH, IT_IMMUNITY,
  FREEZE_UNFREEZE_R, SPRINT_MUL, BOTS, BOT_IDS,
  createTagState, checkRoundEnd, blobCanTag, blobMembers,
  type TagState, type TagEntity,
} from "../../game/tag";

// ── Shared mutable state (outside React) ─────────────────────
export let TS: TagState = createTagState();

const PLAYER_SPEED = 4.6;
const PLAYER_SPRINT_SPEED = PLAYER_SPEED * SPRINT_MUL;
const GRAV = 18;

// Clamp helper
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Input
const keys = { w: false, a: false, s: false, d: false, shift: false };


// Per-bot AI state (reaction timer, wander target)
const botAI: Record<string, { wander: { x: number; z: number }; reactCd: number }> = {};
BOT_IDS.forEach(id => { botAI[id] = { wander: { x: 0, z: 0 }, reactCd: 0 }; });

function randomWander(): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = 2 + Math.random() * 6;
  return { x: cl(Math.cos(angle) * r, -TAG_YARD_HALF + 1, TAG_YARD_HALF - 1), z: cl(Math.sin(angle) * r, -TAG_YARD_HALF + 1, TAG_YARD_HALF - 1) };
}

export function resetTag() {
  TS = createTagState();
  BOT_IDS.forEach(id => {
    botAI[id].wander = randomWander();
    botAI[id].reactCd = BOTS[id].react * botReactionFactor();
  });
}

export function TagDirector() {
  const { camera } = useThree();
  const phase      = useGame(s => s.phase);
  const prevPhase  = useRef("hub");
  const camLook    = useRef(new THREE.Vector3(0, 0, 0));
  const winTimer   = useRef<number | null>(null);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (useGame.getState().phase !== "play") return;
      if (e.code === "KeyW" || e.code === "ArrowUp")    keys.w = true;
      if (e.code === "KeyS" || e.code === "ArrowDown")  keys.s = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft")  keys.a = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp")    keys.w = false;
      if (e.code === "KeyS" || e.code === "ArrowDown")  keys.s = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft")  keys.a = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.04);
    const st = useGame.getState();
    if (st.mode !== "tag") return;

    const t = TS;

    // ── Init on first play frame ──────────────────────────────
    if (phase === "play" && prevPhase.current !== "play" && prevPhase.current !== "point") {
      resetTag();
      sfx.whistle();
    }
    prevPhase.current = phase;

    if (phase !== "play") { doCam(dt); return; }
    if (t.phase === "end") { doCam(dt); return; }

    t.time += dt;

    // ── Countdown ─────────────────────────────────────────────
    if (t.phase === "countdown") {
      t.countdown -= dt;
      if (t.countdown <= 0) {
        t.phase = "play";
        t.banner = "GO!";
        t.bannerAt = t.time;
        sfx.whistle();
      }
      doCam(dt);
      return;
    }

    // ── Round timer ───────────────────────────────────────────
    t.roundTimer -= dt;
    if (t.roundTimer < 0) t.roundTimer = 0;

    // ── Tick immunity & it-time ───────────────────────────────
    Object.values(t.entities).forEach(e => {
      if (e.immunity > 0) e.immunity -= dt;
      if (e.isIt && t.mode === "regular") e.itTime += dt;
    });

    // ── Player movement ───────────────────────────────────────
    const p = t.entities["player"];
    {
      let mx = 0, mz = 0;
      if (keys.w) mz -= 1;
      if (keys.s) mz += 1;
      if (keys.a) mx -= 1;
      if (keys.d) mx += 1;
      const l = Math.hypot(mx, mz) || 1;
      mx /= l; mz /= l;
      const moving = Math.abs(mx) + Math.abs(mz) > 0.01;
      const spd = keys.shift ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
      if (moving) {
        p.pos.x = cl(p.pos.x + mx * spd * dt, -TAG_YARD_HALF + 0.4, TAG_YARD_HALF - 0.4);
        p.pos.z = cl(p.pos.z + mz * spd * dt, -TAG_YARD_HALF + 0.4, TAG_YARD_HALF - 0.4);
        p.facing = Math.atan2(mx, mz);
        p.walkPhase += dt * (keys.shift ? 14 : 10);
      }
      p.moving = moving;
    }

    // ── Bot AI ────────────────────────────────────────────────
    BOT_IDS.forEach(id => {
      const bot = t.entities[id];
      const def = BOTS[id];
      const ai  = botAI[id];
      ai.reactCd -= dt;
      if (ai.reactCd > 0) return;
      ai.reactCd = (def.react + Math.random() * def.react * 0.5) * botReactionFactor();
      updateBotTarget(t, bot, def, ai);
    });

    // ── Move all entities toward their targets ────────────────
    BOT_IDS.forEach(id => {
      const bot = t.entities[id];
      const def = BOTS[id];
      const ai  = botAI[id];

      // Blob members follow the entity ahead of them in the chain
      if (t.mode === "blob" && bot.blobIdx > 0) {
        const m = blobMembers(t.entities);
        if (bot.blobIdx < m.length) {
          const leader = m[bot.blobIdx - 1];
          ai.wander = { ...leader.pos };
          // Maintain minimum spacing
          const dx = bot.pos.x - leader.pos.x;
          const dz = bot.pos.z - leader.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.85) { ai.wander = bot.pos; }
        }
      }

      const dx = ai.wander.x - bot.pos.x;
      const dz = ai.wander.z - bot.pos.z;
      const d  = Math.hypot(dx, dz);
      if (d > 0.1) {
        const spd = ((bot.isIt && t.mode !== "blob") ? def.speed * 1.08 : def.speed) * skillFactor();
        const step = Math.min(d, spd * dt);
        bot.pos.x = cl(bot.pos.x + (dx / d) * step, -TAG_YARD_HALF + 0.4, TAG_YARD_HALF - 0.4);
        bot.pos.z = cl(bot.pos.z + (dz / d) * step, -TAG_YARD_HALF + 0.4, TAG_YARD_HALF - 0.4);
        bot.facing = Math.atan2(dx / d, dz / d);
        bot.walkPhase += dt * 10;
        bot.moving = true;
      } else {
        bot.moving = false;
      }
    });

    // ── Tag resolution ─────────────────────────────────────────
    resolveTagging(t);

    // ── Freeze unfreeze (freeze tag) ───────────────────────────
    if (t.mode === "freeze") resolveUnfreezing(t);

    // ── Check round end ────────────────────────────────────────
    if (checkRoundEnd(t)) {
      if (winTimer.current === null) {
        const youWon = t.winnerMsg.startsWith("YOU");
        if (youWon) { sfx.cheer(); st.addScore(15); }
        else sfx.fault();
        st.setPhase("point");
        winTimer.current = window.setTimeout(() => {
          useGame.getState().win();
          winTimer.current = null;
        }, 3200);
      }
    }

    doCam(dt);
  });

  function doCam(dt: number) {
    const p = TS.entities["player"];
    if (!p) { camera.position.set(0, 14, 12); camera.lookAt(0, 0, 0); return; }
    const cx = p.pos.x * 0.35;
    const cy = 15;
    const cz = p.pos.z + 12;
    const lx = p.pos.x * 0.6;
    const lz = p.pos.z - 2;
    const k  = 1 - Math.exp(-dt * 3.8);
    const k2 = 1 - Math.exp(-dt * 5.2);
    camera.position.x += (cx - camera.position.x) * k;
    camera.position.y += (cy - camera.position.y) * k;
    camera.position.z += (cz - camera.position.z) * k;
    camLook.current.x += (lx - camLook.current.x) * k2;
    camLook.current.y += (0 - camLook.current.y) * k2;
    camLook.current.z += (lz - camLook.current.z) * k2;
    camera.lookAt(camLook.current);
    void GRAV;
  }

  return null;
}

// ── Bot target decision ────────────────────────────────────────
function updateBotTarget(
  t: TagState, bot: TagEntity,
  def: (typeof BOTS)[string],
  ai: { wander: { x: number; z: number } },
) {
  const all = Object.values(t.entities);

  if (t.mode === "regular" || t.mode === "blob") {
    if (bot.isIt || (t.mode === "blob" && bot.blobIdx === 0)) {
      // "it" or blob head: chase the nearest free target
      const targets = all.filter(e =>
        e.id !== bot.id &&
        e.immunity <= 0 &&
        (t.mode === "blob" ? e.blobIdx < 0 : !e.isIt),
      );
      if (targets.length > 0) {
        const nearest = targets.reduce((a, b) => dist(bot, a) < dist(bot, b) ? a : b);
        ai.wander = { ...nearest.pos };
        // Add slight jitter so it looks natural
        ai.wander.x += (Math.random() - 0.5) * 0.4;
        ai.wander.z += (Math.random() - 0.5) * 0.4;
      }
    } else if (t.mode === "blob" && bot.blobIdx > 0) {
      // Blob followers handled in move loop
    } else {
      // Regular tag: runner — flee from "it"
      runFrom(t, bot, def, ai);
    }
  } else {
    // Freeze tag
    if (bot.isIt) {
      const targets = all.filter(e => !e.isIt && !e.frozen && e.immunity <= 0);
      if (targets.length > 0) {
        const nearest = targets.reduce((a, b) => dist(bot, a) < dist(bot, b) ? a : b);
        ai.wander = { ...nearest.pos };
      } else {
        ai.wander = randomWander();
      }
    } else if (bot.frozen) {
      ai.wander = { ...bot.pos }; // stay put
    } else {
      // Brave bots prioritise unfreezing teammates
      const frozen = all.filter(e => e.frozen && !e.isIt);
      if (frozen.length > 0 && Math.random() < def.brave) {
        const nearest = frozen.reduce((a, b) => dist(bot, a) < dist(bot, b) ? a : b);
        ai.wander = { ...nearest.pos };
      } else {
        runFrom(t, bot, def, ai);
      }
    }
  }
}

function runFrom(
  t: TagState, bot: TagEntity,
  def: (typeof BOTS)[string],
  ai: { wander: { x: number; z: number } },
) {
  // Find "it" or blob head to flee from
  let itPos: { x: number; z: number } | null = null;
  if (t.mode === "blob") {
    const head = Object.values(t.entities).find(e => e.blobIdx === 0);
    if (head) itPos = head.pos;
  } else {
    const it = t.entities[t.itId];
    if (it) itPos = it.pos;
  }
  if (!itPos) { ai.wander = randomWander(); return; }

  const dx = bot.pos.x - itPos.x;
  const dz = bot.pos.z - itPos.z;
  const d  = Math.hypot(dx, dz) || 1;
  // Fear factor: close = run hard, far = wander
  const danger = Math.max(0, 1 - d / 8);
  if (danger > def.fear * 0.4 || Math.random() < danger) {
    const fleeX = cl(bot.pos.x + (dx / d) * 5, -TAG_YARD_HALF + 1, TAG_YARD_HALF - 1);
    const fleeZ = cl(bot.pos.z + (dz / d) * 5, -TAG_YARD_HALF + 1, TAG_YARD_HALF - 1);
    ai.wander = { x: fleeX + (Math.random() - 0.5) * 2, z: fleeZ + (Math.random() - 0.5) * 2 };
  } else {
    ai.wander = randomWander();
  }
}

// ── Tag detection and application ──────────────────────────────
function resolveTagging(t: TagState) {
  const all = Object.values(t.entities);

  if (t.mode === "regular") {
    const it = t.entities[t.itId];
    if (!it) return;
    for (const target of all) {
      if (target.id === it.id) continue;
      if (target.isIt) continue;
      if (target.immunity > 0) continue;
      if (dist2(it, target) > TAG_REACH) continue;
      // Tag!
      it.isIt = false;
      target.isIt = true;
      target.immunity = IT_IMMUNITY;
      t.itId = target.id;
      t.banner = target.isPlayer ? "YOU'RE IT!" : `${target.id.toUpperCase()} IS IT!`;
      t.bannerAt = t.time;
      sfx.hit(0.8);
      break;
    }
  } else if (t.mode === "freeze") {
    const it = t.entities[t.itId];
    if (!it) return;
    for (const target of all) {
      if (target.id === it.id) continue;
      if (target.frozen) continue;
      if (target.immunity > 0) continue;
      if (dist2(it, target) > TAG_REACH) continue;
      target.frozen = true;
      t.banner = target.isPlayer ? "YOU'RE FROZEN!" : `${target.id.toUpperCase()} FROZEN!`;
      t.bannerAt = t.time;
      sfx.hit(0.8);
    }
  } else {
    // Blob tag — only end-members of the blob chain can tag
    const taggers = all.filter(e => blobCanTag(e, t.entities));
    const free = all.filter(e => e.blobIdx < 0);
    for (const tagger of taggers) {
      for (const target of free) {
        if (target.immunity > 0) continue;
        if (dist2(tagger, target) > TAG_REACH) continue;
        // Append to blob chain
        target.blobIdx = t.blobSize;
        t.blobSize++;
        target.immunity = IT_IMMUNITY;
        t.banner = target.isPlayer ? "YOU JOINED THE BLOB!" : `${target.id.toUpperCase()} ABSORBED!`;
        t.bannerAt = t.time;
        sfx.hit(0.8);
        sfx.line();
        break;
      }
    }
  }
}

// ── Freeze-tag unfreezing ──────────────────────────────────────
function resolveUnfreezing(t: TagState) {
  const all = Object.values(t.entities);
  const frozen = all.filter(e => e.frozen);
  const free = all.filter(e => !e.frozen && !e.isIt);
  for (const frz of frozen) {
    for (const liberator of free) {
      if (dist2(frz, liberator) < FREEZE_UNFREEZE_R) {
        frz.frozen = false;
        frz.immunity = 1.0;
        t.banner = `${frz.id.toUpperCase()} UNFROZEN!`;
        t.bannerAt = t.time;
        sfx.cheer();
        break;
      }
    }
  }
}

// ── Utils ──────────────────────────────────────────────────────
function dist(a: TagEntity, b: TagEntity) { return Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z); }
function dist2(a: TagEntity, b: TagEntity) { return Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z); }
