import * as THREE from three;
import type  EntityId, MoveId } from ./constants;

export type FaceState = idle | alert | hit | out | happy | serve;

export interface EntRT 
  id: EntityId;
  pos: THREE.Vector3; // ground-plane position
  target: THREE.Vector3; // where the brain wants to be
  y: number; // jump height
  vy: number;
  crouch: boolean;
  moving: boolean;
  walkPhase: number;
  facing: number;
  swing: number; // seconds since last swing large = idle)
    face: FaceState;
  faceUntil: number;
  hitCooldown: number;
  serveTimer: number;
  plan: BotPlan | null;
    /** true while seated on the playground swing */
       sitting: boolean;
  /** body tilt along the facing axis radians) — used by the swing */
     lean: number;
}

export interface BotPlan 
  miss: boolean;
  whiff: boolean;
  move: MoveId;
  aim: THREE.Vector3;
  react: number;
  bounceAt: number; // game time when legal bounce happened
}

export interface Leg 
  hitter: EntityId;
    isServe: boolean;
  serveBounced: boolean;
  firstBounced: boolean;
  receiver: EntityId | null;
  move: MoveId;
  quality: number; // timing quality of the stroke that started this leg
  createdAt: number;
  done: boolean;
}

export type BurstKind = hit | perfect | dust | star;
export interface Burst 
  kind: BurstKind;
  pos: THREE.Vector3;
  color: string;
  at: number;
}

interface RT 
  time: number;
  entities: Record<EntityId, EntRT>;
  ball: 
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    move: MoveId;
    curve: number; // lateral accel until first bounce
        active: boolean;
    grounded: number; // seconds rolling on the ground
    visible: boolean;
};
  leg: Leg | null;
  serveStage: idle | hold | tossed | armed;
    aim: THREE.Vector3;
  aimLegal: boolean;
  mouse:  x: number; y: number };
  input: 
    fwd: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
        crouch: boolean;
    lob: boolean;
};
  hitQueue: power | soft)];
  bursts: Burst];
  lastHitInfo:  move: MoveId; quality: number; at: number } | null;
  shake: number;
}

function mkEntid: EntityId, x: number, z: number): EntRT 
  return 
    id,
    pos: new THREE.Vector3x, 0, z),
    target: new THREE.Vector3x, 0, z),
    y: 0,
    vy: 0,
    crouch: false,
    moving: false,
    walkPhase: 0,
        facing: 0,
    swing: 9,
    face: idle,
    faceUntil: 0,
    hitCooldown: 0,
    serveTimer: 0,
    plan: null,
    sitting: false,
    lean: 0,
};
}

export const RT: RT = 
  time: 0,
  entities: 
    player: mkEntplayer, -2, -2),
    ada: mkEntada, 2, 2),
        alan: mkEntalan, -6.4, -0.4),
    grace: mkEntgrace, -2, 2),
    turing: mkEntturing, 2, -2),
},
