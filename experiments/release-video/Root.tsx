import {Composition} from "remotion";
import {AgenFetchReleaseVideo} from "./AgenFetchReleaseVideo";

export function RemotionRoot() {
  return (
    <Composition
      id="AgenFetchRelease-v031"
      component={AgenFetchReleaseVideo}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  );
}
