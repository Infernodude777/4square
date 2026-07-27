import { useEffect, useRef } from 'react'

export type KeyMap = Record<string, boolean>

interface GameControlsOptions {
  /** Keys to listen for. */
  keys?: string[]
  /** Called every frame with the current key state. */
  onFrame?: (pressed: KeyMap) => void
  /** If true, prevents default browser scrolling on arrow/space keys. */
  preventDefault?: boolean
}

/**
 * Lightweight hook for reading keyboard state inside the game loop.
 *
 * Returns a ref that always reflects the currently pressed keys so
 * rAF/physics ticks can read input without re-rendering React.
 *
 * @example
 * const keys = useGameControls({ keys: ['ArrowUp', 'ArrowLeft', ' '] })
 * useFrame(() => {
 *   if (keys.current['ArrowUp']) playerRef.current?.applyImpulse(...)
 * })
 */
export function useGameControls(options: GameControlsOptions = {}) {
  const { keys = [], onFrame, preventDefault = false } = options
  const pressedRef = useRef<KeyMap>({})
  const rafRef = useRef<number | null>(null)
  const onFrameRef = useRef(onFrame)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (!keys.includes(e.key)) return
      if (preventDefault) e.preventDefault()
      pressedRef.current = { ...pressedRef.current, [e.key]: isDown }
    }

    const down = (e: KeyboardEvent) => handleKey(e, true)
    const up = (e: KeyboardEvent) => handleKey(e, false)

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    const tick = () => {
      onFrameRef.current?.(pressedRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [keys.join(','), preventDefault])

  return pressedRef
}
import { useEffect, useRef } from 'react'

export type KeyMap = Record<string, boolean>

interface GameControlsOptions {
  keys?: string[]
  onFrame?: (pressed: KeyMap) => void
  preventDefault?: boolean
}

export function useGameControls(options: GameControlsOptions = {}) {
  const { keys = [], onFrame, preventDefault = true } = options
  const pressedRef = useRef<KeyMap>({})
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (!keys.includes(e.key)) return
      if (preventDefault) e.preventDefault()
      pressedRef.current = { ...pressedRef.current, [e.key]: isDown }
    }

    const down = (e: KeyboardEvent) => handleKey(e, true)
    const up = (e: KeyboardEvent) => handleKey(e, false)

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    const tick = () => {
      onFrame?.(pressedRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      }
    }, [keys.join(','), preventDefault, onFrame])

  return pressedRef
  }

    }
    }
    }
  })
}