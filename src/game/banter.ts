// ─────────────────────────────────────────────────────────────
//  BANTER — the bots have a mouth on them
//
//  A single source of playground trash talk. Every mode's
//  director can pull a line with pickBanter(kind) and fire it
//  through the existing popup system. Keeping the lines in one
//  place means the whole yard talks like one yard.
// ─────────────────────────────────────────────────────────────

export type BanterKind =
  | "ko"        // you knocked a bot out
  | "botKo"     // a bot knocked YOU out
  | "win"       // you won the match
  | "lose"      // you lost the match
  | "serve"     // a serve moment
  | "perfect"   // perfect timing hit
  | "fault"     // you faulted
  | "rally"     // a long rally is happening
  | "rule"      // the king called a house rule (Season 3)
  | "start"     // match start
  | "taunt";    // generic mid-match ribbing

const LINES: Record<BanterKind, string[]> = {
  ko: [
    "ADA: “the algorithm says you're done”",
    "GRACE: “precise. Devastating.”",
    "ALAN: “my servos felt that”",
    "TURING: “unexpected outcome detected”",
    "ZIGGY: “okay okay, nice one”",
    "REX: “I was NOT ready for that”",
  ],
  botKo: [
    "ADA: “reevaluating your vector”",
    "GRACE: “clean execution, human”",
    "ALAN: “better luck next recess”",
    "TURING: “probability favors me”",
    "ZIGGY: “that one was MINE”",
    "REX: “the yard has a new sheriff”",
  ],
  win: [
    "ADA: “acceptable. Impressive, even.”",
    "GRACE: “perfect form. I'll study this.”",
    "ALAN: “the bots will rebuild”",
    "TURING: “victory logged. curiosity remains.”",
    "REX: “you're fast. I'll give you that.”",
    "ZIGGY: “rematch. NOW.”",
    "ADA: “the light never even fazed you”",
    "REX: “green or red, you run the lane”",
  ],
  lose: [
    "ADA: “I ran the numbers. You lost.”",
    "GRACE: “precision over passion, human”",
    "ALAN: “it's okay. Recess is long.”",
    "TURING: “a fascinating failure mode”",
    "REX: “that's how it's done”",
    "ZIGGY: “don't worry, I got lucky”",
    "ZIGGY: “red light got you too, huh?”",
    "REX: “the light said stop. You didn't.”",
  ],
  serve: [
    "ADA: “serve it like you mean it”",
    "GRACE: “the line is watching”",
    "ALAN: “easy does it”",
    "TURING: “let's see what you've got”",
    "ZIGGY: “new ball, new me”",
  ],
  perfect: [
    "ADA: “textbook timing. Suspicious.”",
    "GRACE: “surgical”",
    "ALAN: “woah. What was that?”",
    "TURING: “beautiful data point”",
    "REX: “show-off”",
    "ZIGGY: “did you practice overnight??”",
  ],
  fault: [
    "ADA: “fault detected. Obviously.”",
    "GRACE: “that's going in the report”",
    "ALAN: “no worries, it happens”",
    "TURING: “interesting choice”",
    "ZIGGY: “yikes”",
    "REX: “the light was RED, champ”",
    "REX: “the rule is the rule”",
  ],
  rally: [
    "ADA: “this is getting statistically improbable”",
    "GRACE: “keep it coming”",
    "ALAN: “my fans are loving this”",
    "TURING: “the crowd is calculating too”",
    "REX: “nobody quits, nobody”",
  ],
  rule: [
    "ADA: “a new rule. How… democratic.”",
    "GRACE: “the king has spoken”",
    "ALAN: “rules are rules. I guess.”",
    "TURING: “new constraint detected”",
    "REX: “who made THAT rule??”",
    "ZIGGY: “house rules!! okay okay”",
    "TURING: “I don't make the rules. I compute them.”",
    "REX: “fine. fine. no smashing. FINE.”",
  ],
  start: [
    "ADA: “let's see what you learned”",
    "GRACE: “begin when ready”",
    "ALAN: “good luck, human”",
    "TURING: “the game is a function. Play it.”",
    "REX: “I don't lose”",
    "ZIGGY: “this is MY court”",
  ],
  taunt: [
    "ADA: “your technique is… creative”",
    "GRACE: “the geometry is against you”",
    "ALAN: “you've got this. Probably.”",
    "TURING: “randomness favors the brave”",
    "REX: “I've seen better footwork”",
    "ZIGGY: “that's it? that's the shot?”",
    "REX: “green means GO, not maybe”",
    "ZIGGY: “my sneakers are faster than you”",
  ],
};

/** Random line for a banter kind. */
export function pickBanter(kind: BanterKind): string {
  const pool = LINES[kind];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Fire a banter line through the game store popups. */
export function say(kind: BanterKind, tone: "gold" | "cyan" | "red" | "green" | "purple" | "white" = "white", big = false) {
  // Import lazily to keep this module cycle-free (store imports settings,
  // not banter — but directors do, so a top-level import is fine too).
  import("./store").then(({ useGame }) => {
    useGame.getState().popup(pickBanter(kind), tone, big);
  });
}
