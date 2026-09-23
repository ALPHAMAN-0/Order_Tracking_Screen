// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSupportCase } from './flows';
import { makeRef } from './ids';

describe('flows', () => {
  it('makes readable references without ambiguous characters', () => {
    let i = 0;
    const rng = () => (i++ % 10) / 10;
    const ref = makeRef('CASE', rng);
    expect(ref).toMatch(/^CASE-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('creates a case with a 48h update promise and trims the note', () => {
    const now = Date.parse('2026-09-23T08:00:00Z');
    const c = createSupportCase(
      { reason: 'nothing_delivered', note: '  checked reception  ' },
      now,
      () => 0.5,
    );
    expect(c.nextUpdateBy).toBe('2026-09-25T08:00:00.000Z');
    expect(c.note).toBe('checked reception');
    expect(
      createSupportCase({ reason: 'other', note: '   ' }, now, () => 0.5).note,
    ).toBeUndefined();
  });
});
