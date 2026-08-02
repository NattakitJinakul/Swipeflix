/**
 * TrailerPlayer (native) — YouTube trailer via react-native-youtube-iframe.
 * A web-only variant (TrailerPlayer.web.tsx) uses a plain <iframe> so the app still
 * bundles for web (react-native-webview / youtube-iframe don't support web).
 */
import YoutubePlayer from 'react-native-youtube-iframe';

export function TrailerPlayer({ youtubeId, height }: { youtubeId: string; height: number }) {
  return <YoutubePlayer height={height} videoId={youtubeId} play={false} />;
}
