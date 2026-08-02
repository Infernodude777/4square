import { World } from "../World";
import { Atmosphere } from "../Atmosphere";
import { KICK_ORIGIN } from "../../game/kickball";
import { KickballCourt } from "./KickballCourt";
import { KickballBall } from "./KickballBall";
import { KickballPlayers } from "./KickballPlayers";
import { KickballDirector } from "./KickballDirector";

export function KickballScene() {
  return (
    <>
      <Atmosphere />

      <World />

      {/* kickball field lives in the open centre of the yard */}
      <group position={KICK_ORIGIN}>
        <KickballCourt />
        <KickballBall />
        <KickballPlayers />
      </group>

      <KickballDirector />
    </>
  );
}
