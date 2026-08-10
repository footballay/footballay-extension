import { isSupportedStreamingUrl } from "./page-identity";

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export { isSupportedStreamingUrl };
