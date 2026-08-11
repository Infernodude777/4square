import { World } from "../World";
import { Atmosphere } from "../Atmosphere";
import { RedLightCourt } from "./RedLightCourt";
import { RedLightPlayers } from "./RedLightPlayers";
import { RedLightDirector } from "./RedLightDirector";

/** The red-light match scene: the whole yard plus the chalk lane. */
export function RedLightScene() {
  return (
    <>
      <Atmosphere />
      <World />
      <RedLightCourt />
      <RedLightPlayers />
      <RedLightDirector />
    </>
  );
}
