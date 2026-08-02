/**
 * TrailerPlayer (web) — plain YouTube embed <iframe>. Avoids importing
 * react-native-youtube-iframe / react-native-webview, which don't bundle for web.
 */
export function TrailerPlayer({ youtubeId, height }: { youtubeId: string; height: number }) {
  return (
    <iframe
      title="trailer"
      width="100%"
      height={height}
      src={`https://www.youtube.com/embed/${youtubeId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{ border: 0, borderRadius: 12 }}
    />
  );
}
