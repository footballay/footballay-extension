import { fallbackMessages, supportedLocales } from "./messages";
import type { MessageKey, SupportedLocale } from "./messages";

export type I18nSubstitutions = string | string[];

const defaultLocale: SupportedLocale = "en";

export function getSupportedLocale(locale?: string | null): SupportedLocale {
  const normalizedLocale = locale?.toLowerCase();
  const language = normalizedLocale?.split("-")[0];

  return supportedLocales.find((supportedLocale) => supportedLocale === language) ?? defaultLocale;
}

export function getPreferredLocale(): SupportedLocale {
  const chromeLocale = getChromeUiLocale();
  if (chromeLocale) {
    return getSupportedLocale(chromeLocale);
  }

  const browserLocale = typeof navigator === "undefined" ? undefined : navigator.language;
  return getSupportedLocale(browserLocale);
}

export function t(
  key: MessageKey,
  substitutions?: I18nSubstitutions,
  locale = getPreferredLocale()
): string {
  const chromeMessage = getChromeMessage(key, substitutions);
  if (chromeMessage) {
    return chromeMessage;
  }

  return interpolateMessage(fallbackMessages[locale][key] ?? fallbackMessages.en[key], substitutions);
}

function getChromeUiLocale(): string | undefined {
  return typeof chrome === "undefined" ? undefined : chrome.i18n?.getUILanguage?.();
}

function getChromeMessage(key: MessageKey, substitutions?: I18nSubstitutions): string {
  if (typeof chrome === "undefined" || !chrome.i18n?.getMessage) {
    return "";
  }

  return chrome.i18n.getMessage(getChromeMessageKey(key), substitutions);
}

function getChromeMessageKey(key: MessageKey): string {
  return key.replaceAll(".", "_");
}

function interpolateMessage(message: string, substitutions?: I18nSubstitutions): string {
  if (!substitutions) {
    return message;
  }

  const substitutionList = Array.isArray(substitutions) ? substitutions : [substitutions];
  return substitutionList.reduce(
    (nextMessage, substitution, index) =>
      nextMessage.replaceAll(`$${index + 1}`, substitution),
    message
  );
}
