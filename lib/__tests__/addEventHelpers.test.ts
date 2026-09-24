/**
 * Unit tests for lib/addEventHelpers.ts
 * Run with: node --test lib/__tests__/addEventHelpers.test.ts
 * (Node 22.18+ strips types natively — no build step needed.)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MANUAL_EVENT_UNSUPPORTED_MESSAGE,
  formatEventDateLabel,
  scoreLabelFor,
} from '../addEventHelpers.ts';

describe('formatEventDateLabel', () => {
  it('formats a known date like the rest of the app', () => {
    const d = new Date(2026, 8, 24); // Sep 24, 2026 (local)
    assert.equal(formatEventDateLabel(d), 'Sep 24, 2026');
  });

  it('defaults to today', () => {
    const expected = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    assert.equal(formatEventDateLabel(), expected);
  });
});

describe('scoreLabelFor', () => {
  it('formats the score for completed games with both scores', () => {
    assert.equal(scoreLabelFor('completed', 3, 2), '2–3');
  });

  it('hides the score for upcoming games even when scores exist', () => {
    assert.equal(scoreLabelFor('upcoming', 3, 2), null);
  });

  it('hides the score when either side is missing', () => {
    assert.equal(scoreLabelFor('completed', null, 2), null);
    assert.equal(scoreLabelFor('completed', 3, undefined), null);
    assert.equal(scoreLabelFor('completed', null, null), null);
  });

  it('shows the score for in-progress games', () => {
    assert.equal(scoreLabelFor('in_progress', 1, 0), '0–1');
  });

  it('treats a missing status as showable when scores exist', () => {
    assert.equal(scoreLabelFor(null, 1, 1), '1–1');
    assert.equal(scoreLabelFor(undefined, 1, 1), '1–1');
  });
});

describe('MANUAL_EVENT_UNSUPPORTED_MESSAGE', () => {
  it('is a non-empty user-facing string', () => {
    assert.ok(MANUAL_EVENT_UNSUPPORTED_MESSAGE.length > 0);
    assert.match(MANUAL_EVENT_UNSUPPORTED_MESSAGE, /Manual events/);
  });
});
