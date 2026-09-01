import { describe, expect, it } from 'vitest';
import { handleDemoRuntimeMessage } from './mockResponder';

describe('demo mock responder', () => {
  it('returns the fixture selection and match data protocol responses', () => {
    expect(handleDemoRuntimeMessage({ type: 'GET_AVAILABLE_LEAGUES' })).toEqual(
      expect.objectContaining({ ok: true }),
    );
    expect(
      handleDemoRuntimeMessage({
        type: 'GET_FIXTURE_LINEUP',
        payload: { fixtureUid: 'demo-fixture' },
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ type: 'updated' }),
      }),
    );
  });
});
