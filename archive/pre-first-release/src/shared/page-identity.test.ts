import { describe, expect, it } from "vitest";
import { getPageIdentity } from "./page-identity";

describe("PageIdentity", () => {
  it("uses the supported site and path without query or fragment tokens", () => {
    expect(getPageIdentity("https://www.coupangplay.com/live/123?token=secret#player")).toEqual({
      site: "coupang-play",
      contentId: "/live/123"
    });
  });

  it("rejects unsupported pages", () => {
    expect(getPageIdentity("https://example.com/live/123")).toBeNull();
  });
});
