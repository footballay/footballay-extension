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

  it('uses secondary before border or the fallback palette for similar primaries', () => {
    expect(
      resolveTeamColors(
        { playerColor: { primary: 'ff0000', number: 'ffffff', border: null } },
        {
          playerColor: {
            primary: 'ee0011',
            secondary: '00aaff',
            number: 'ffffff',
            border: '00ff00',
          },
        },
      ).away,
    ).toBe('#00aaff');
  });

  it('uses border when primary and secondary are similar', () => {
    expect(
      resolveTeamColors(
        { playerColor: { primary: 'ff0000', number: 'ffffff', border: null } },
        {
          playerColor: {
            primary: 'ee0011',
            secondary: 'ee1100',
            number: 'ffffff',
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
