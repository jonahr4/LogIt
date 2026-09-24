/**
 * LogIt — pure helpers for the add-event flow.
 *
 * Kept free of React Native imports so they can be unit-tested with plain
 * node (node --test) without pulling in the Expo toolchain.
 */

/** Message shown when a manual/custom event can't be saved yet. */
export const MANUAL_EVENT_UNSUPPORTED_MESSAGE =
  'Manual events aren\u2019t supported yet \u2014 search for the event to log it.';

/**
 * Format a date the same way event dates are displayed across the app
 * ("Sep 24, 2026"). Defaults to right now — used so new logs timestamp to today.
 */
export function formatEventDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Build the score-bug label for a search result card, or null when no score
 * should be shown. Scores are hidden for upcoming events (they may carry
 * placeholder data) and when either side is missing (avoids "undefined–3").
 */
export function scoreLabelFor(
  status: string | null | undefined,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): string | null {
  if (status === 'upcoming' || homeScore == null || awayScore == null) return null;
  return `${awayScore}\u2013${homeScore}`;
}
