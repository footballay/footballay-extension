import { describe, expect, it } from 'vitest';
import { resolveTeamColors } from './teamColor';

describe('resolveTeamColors', () => {
  it('keeps distinct primary colors', () => {
    expect(
      resolveTeamColors(
        { playerColor: { primary: 'ff0000', number: 'ffffff', border: null } },
        { playerColor: { primary: '0000ff', number: 'ffffff', border: null } },
      ),
    ).toEqual({ home: '#ff0000', away: '#0000ff' });
  });

  it('uses number before border or the fallback palette for similar primaries', () => {
    expect(
      resolveTeamColors(
        { playerColor: { primary: 'ff0000', number: 'ffffff', border: null } },
        {
          playerColor: {
            primary: 'ee0011',
            number: '00aaff',
            border: '00ff00',
          },
        },
      ).away,
    ).toBe('#00aaff');
  });

  it('uses border when primary and number are similar', () => {
    expect(
      resolveTeamColors(
        { playerColor: { primary: 'ff0000', number: 'ffffff', border: null } },
        {
          playerColor: {
            primary: 'ee0011',
            number: 'ee1100',
            border: '00aa55',
          },
        },
      ).away,
    ).toBe('#00aa55');
  });

  it('uses the fallback palette when every provided color is similar', () => {
    expect(
      resolveTeamColors(
        {
          playerColor: {
            primary: 'ff0000',
            number: 'ff1100',
            border: 'ee0000',
          },
        },
        {
          playerColor: {
            primary: 'f90000',
            number: 'fe1000',
            border: 'ef0000',
          },
        },
      ).away,
    ).toBe('#3cbeff');
  });
});
