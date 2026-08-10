import type { PageIdentity, StreamingSite } from "./page-session";

const siteByHost: Record<string, StreamingSite> = {
  "www.coupangplay.com": "coupang-play",
  "www.spotvnow.co.kr": "spotv-now"
};

export function getPageIdentity(url: string): PageIdentity | null {
  try {
    const parsed = new URL(url);
    const site = siteByHost[parsed.hostname];
    if (!site) {
      return null;
    }

    // Temporary fallback only: each StreamingSiteAdapter must replace this with a
    // site-verified stable content identifier before 1B ships. Query strings are
    // intentionally excluded because they commonly carry transient session tokens.
    const contentId = parsed.pathname.replace(/\/+$/, "") || "/";
    return { contentId, site };
  } catch {
    return null;
  }
}

export function isSupportedStreamingUrl(url: string): boolean {
  return getPageIdentity(url) !== null;
}
