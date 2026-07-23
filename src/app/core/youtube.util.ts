const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/** YouTubeの動画URL(watch/youtu.be/embed/shorts)または動画IDそのものからIDを取り出す。 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.slice(1);
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (url.hostname.includes('youtube.com')) {
    const vParam = url.searchParams.get('v');
    if (vParam && YOUTUBE_ID_PATTERN.test(vParam)) {
      return vParam;
    }
    const match = url.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (match) {
      return match[1];
    }
  }

  return null;
}
