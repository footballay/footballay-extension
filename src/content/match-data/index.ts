import type { FixtureDto } from '@/shared/api/dto';
import { matchDataManager } from './matchDataManager';

export const matchData = Object.freeze({
  activateFixture: (fixtureInfo: FixtureDto) =>
    matchDataManager.activateFixture(fixtureInfo),
  updateFixtureInfo: (fixtureInfo: FixtureDto) =>
    matchDataManager.updateFixtureInfo(fixtureInfo),
  clearFixture: () => matchDataManager.clearFixture(),
  refresh: () => matchDataManager.refresh(),
  reloadLocalized: () => matchDataManager.reloadLocalized(),
  dispose: () => matchDataManager.dispose(),
});
