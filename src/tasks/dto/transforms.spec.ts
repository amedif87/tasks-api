import { toIsoUtc, trim } from './transforms';

describe('DTO transforms', () => {
  it('trim only touches strings', () => {
    expect(trim({ value: '  hola ' })).toBe('hola');
    expect(trim({ value: 42 })).toBe(42);
    expect(trim({ value: null })).toBeNull();
  });

  it('toIsoUtc normalises valid ISO dates to UTC', () => {
    expect(toIsoUtc({ value: '2026-12-01' })).toBe('2026-12-01T00:00:00.000Z');
    expect(toIsoUtc({ value: '2026-12-01T10:00:00-03:00' })).toBe('2026-12-01T13:00:00.000Z');
  });

  it('toIsoUtc does NOT "fix" impossible dates (new Date would roll 2026-02-30 into March)', () => {
    expect(toIsoUtc({ value: '2026-02-30' })).toBe('2026-02-30');
    expect(toIsoUtc({ value: 'mañana' })).toBe('mañana');
  });
});
