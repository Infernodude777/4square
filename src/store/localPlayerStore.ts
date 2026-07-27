import { create } from 'zustand'
import { PLAYER_SPAWN } from '@/config/world'

interface LocalPlayerState {
  posX: number
  posZ: number
  facing: number
  setPos: (x: number, z: number) => void
  setFacing: (f: number) => void
}

export const useLocalPlayerStore = create<LocalPlayerState>((set) => ({
  posX: PLAYER_SPAWN.position[0],
  posZ: PLAYER_SPAWN.position[2],
  facing: 0,
  setPos: (x, z) => set({ posX: x, posZ: z }),
  setFacing: (f) => set({ facing: f }),
}))
}))