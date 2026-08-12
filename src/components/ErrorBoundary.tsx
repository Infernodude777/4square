import { Component, type ReactNode } from "react";
import { Icon } from "./Icons";

/**
 * Last line of defence (P0-3): a crash anywhere in the 3D tree must never
 * leave the player staring at a white screen. The fallback keeps the game's
 * voice — chalkboard card, gold accents — and offers a clean reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    // This is a genuine crash report — console.error is the right channel.
    console.error("Recess Royale hit a snag:", error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="flex h-dvh w-screen items-center justify-center bg-[#8fbfe0] font-body">
          <div className="chalkboard mx-4 w-full max-w-md rounded-3xl border-4 border-[#f5edc8]/60 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center text-[#ffd23e]">
              <Icon name="bell" size={44} />
            </div>
            <div className="mt-3 font-display text-3xl text-[#ffd23e]" style={{ textShadow: "0 3px 0 rgba(0,0,0,0.55)" }}>
              RECESS RAN AFOUL
            </div>
            <p className="mt-2 text-sm font-bold leading-relaxed text-[#d9efe8]/85">
              Something tripped on the blacktop. The bell's about to ring —
              give it one more go.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl border-b-[4px] border-[#8f6a00] bg-[#ffd23e] px-8 py-3 font-display text-xl text-[#3a2a00] transition hover:-translate-y-0.5 hover:bg-[#ffe066] active:translate-y-0.5 active:border-b-0"
            >
              RING THE BELL AGAIN
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
