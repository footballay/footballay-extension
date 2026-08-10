import { afterEach, describe, expect, it, vi } from "vitest";
import { getPreferredLocale, getSupportedLocale, t } from "./locale";

describe("i18n locale helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes supported locales and falls back to English", () => {
    expect(getSupportedLocale("ko-KR")).toBe("ko");
    expect(getSupportedLocale("en-US")).toBe("en");
    expect(getSupportedLocale("fr-FR")).toBe("en");
    expect(getSupportedLocale(undefined)).toBe("en");
  });

  it("uses Chrome UI language before browser language", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    vi.stubGlobal("chrome", {
      i18n: {
        getMessage: vi.fn().mockReturnValue(""),
        getUILanguage: vi.fn().mockReturnValue("ko-KR")
      }
    });

    expect(getPreferredLocale()).toBe("ko");
  });

  it("returns Chrome i18n messages when available", () => {
    const getMessage = vi.fn().mockReturnValue("Chrome message");
    vi.stubGlobal("chrome", {
      i18n: {
        getMessage,
        getUILanguage: vi.fn().mockReturnValue("en-US")
      }
    });

    expect(t("popup.title")).toBe("Chrome message");
    expect(getMessage).toHaveBeenCalledWith("popup_title", undefined);
  });

  it("falls back to local dictionaries", () => {
    expect(t("overlay.stat.possession", undefined, "ko")).toBe("점유율");
    expect(t("overlay.stat.shotsOnGoal", undefined, "en")).toBe("SOT");
  });
});
