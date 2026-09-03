import { fixtureSelection } from '@/content/features/fixture-selection';
import { matchData } from '@/content/features/match-data';
import { settingsStore } from './settingsStore';
import {
  loadExtensionSettings,
  normalizeSettings,
  saveExtensionSettings,
  watchExtensionSettings,
  type ExtensionSettings,
} from '@/shared/settings/settings';

function sameSettings(left: ExtensionSettings, right: ExtensionSettings) {
  return (
    left.enabled === right.enabled &&
    left.locale === right.locale &&
    left.timezone === right.timezone &&
    left.panelOpacity === right.panelOpacity &&
    left.lineupPlayerCardOpacity === right.lineupPlayerCardOpacity
  );
}

class SettingsManager {
  private unwatch: (() => void) | undefined;
  private lifecycleGeneration = 0;
  private changeGeneration = 0;
  private pendingLocal:
    { settings: ExtensionSettings; generation: number } | undefined;
  private pendingLocalEchoes: ExtensionSettings[] = [];
  private localUpdateLoop: Promise<void> | undefined;
  private pendingReaction:
    { settings: ExtensionSettings; generation: number } | undefined;
  private reactionScheduled = false;

  async initialize(): Promise<void> {
    if (settingsStore.getState().hydrated) {
      this.startWatching();
      return;
    }

    const generation = ++this.lifecycleGeneration;
    const loaded = await loadExtensionSettings();
    if (generation !== this.lifecycleGeneration) return;

    settingsStore.setState({ settings: loaded, hydrated: true });
    this.startWatching();
  }

  async updateSettings(nextSettings: ExtensionSettings): Promise<void> {
    const normalized = normalizeSettings(nextSettings);
    if (
      sameSettings(settingsStore.getState().settings, normalized) &&
      !this.pendingLocal
    ) {
      return;
    }

    const generation = ++this.changeGeneration;
    this.pendingLocal = { settings: normalized, generation };
    const loop = (this.localUpdateLoop ??= this.flushLocalUpdates());
    await loop;
  }

  dispose(): void {
    ++this.lifecycleGeneration;
    ++this.changeGeneration;
    this.pendingLocal = undefined;
    this.pendingLocalEchoes = [];
    this.pendingReaction = undefined;
    this.unwatch?.();
    this.unwatch = undefined;
    settingsStore.setState({ hydrated: false });
  }

  private startWatching(): void {
    this.unwatch ??= watchExtensionSettings((nextSettings) => {
      const normalized = normalizeSettings(nextSettings);
      const echoIndex = this.pendingLocalEchoes.findIndex((settings) =>
        sameSettings(settings, normalized),
      );
      if (echoIndex !== -1) {
        this.pendingLocalEchoes.splice(echoIndex, 1);
        return;
      }

      this.pendingLocal = undefined;
      this.scheduleReaction(normalized, ++this.changeGeneration);
    });
  }

  private async flushLocalUpdates(): Promise<void> {
    try {
      while (this.pendingLocal) {
        const current = this.pendingLocal;
        this.pendingLocal = undefined;
        this.pendingLocalEchoes.push(current.settings);

        try {
          await saveExtensionSettings(current.settings);
        } catch (error) {
          const echoIndex = this.pendingLocalEchoes.indexOf(current.settings);
          if (echoIndex !== -1) this.pendingLocalEchoes.splice(echoIndex, 1);
          throw error;
        }

        if (this.pendingLocal) continue;
        if (current.generation !== this.changeGeneration) continue;
        this.scheduleReaction(current.settings, current.generation);
      }
    } finally {
      this.localUpdateLoop = undefined;
    }
  }

  private scheduleReaction(
    settings: ExtensionSettings,
    generation: number,
  ): void {
    this.pendingReaction = { settings, generation };
    if (this.reactionScheduled) return;

    this.reactionScheduled = true;
    queueMicrotask(() => {
      this.reactionScheduled = false;
      const pending = this.pendingReaction;
      this.pendingReaction = undefined;
      if (!pending || pending.generation !== this.changeGeneration) return;
      void this.applySettings(pending.settings, pending.generation);
    });
  }

  private async applySettings(
    nextSettings: ExtensionSettings,
    generation: number,
  ): Promise<void> {
    if (generation !== this.changeGeneration) return;

    const previous = settingsStore.getState().settings;
    const enabledChanged = previous.enabled !== nextSettings.enabled;
    const localeChanged = previous.locale !== nextSettings.locale;
    const timezoneChanged = previous.timezone !== nextSettings.timezone;
    const panelOpacityChanged =
      previous.panelOpacity !== nextSettings.panelOpacity;
    const lineupPlayerCardOpacityChanged =
      previous.lineupPlayerCardOpacity !== nextSettings.lineupPlayerCardOpacity;
    if (
      !localeChanged &&
      !timezoneChanged &&
      !panelOpacityChanged &&
      !lineupPlayerCardOpacityChanged &&
      !enabledChanged
    ) {
      return;
    }

    settingsStore.setState({ settings: nextSettings });
    if (enabledChanged) matchData.setEnabled(nextSettings.enabled);
    if (
      !settingsStore.getState().hydrated ||
      (!localeChanged && !timezoneChanged)
    ) {
      return;
    }

    const tasks: Promise<unknown>[] = [
      fixtureSelection.reloadForSettings({ localeChanged, timezoneChanged }),
    ];
    if (localeChanged) tasks.push(matchData.reloadLocalized());
    await Promise.allSettled(tasks);
  }
}

export const settingsManager = new SettingsManager();
