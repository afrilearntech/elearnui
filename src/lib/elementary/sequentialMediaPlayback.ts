/**
 * Lesson media: no skipping ahead — playback cannot jump forward past the
 * furthest point earned by playing linearly. Students may pause and go back;
 * seeking backward pulls the "forward limit" back to that time (rewatches
 * cannot skip to the end without playing through again).
 *
 * Client-side only; URLs in network tools can still be saved. Use signed,
 * short-lived URLs on the server for real protection.
 */

export const SEQUENTIAL_MEDIA_SKIP_TOLERANCE_SEC = 0.85;
/** If the playhead jumps backward by more than this, treat it as a deliberate rewind. */
export const SEQUENTIAL_MEDIA_BACKWARD_SEEK_THRESHOLD_SEC = 0.45;

export function clampSequentialPlayback(
  el: HTMLVideoElement | HTMLAudioElement,
  furthestWatchedRef: { current: number },
): void {
  const duration = el.duration;
  if (!duration || !Number.isFinite(duration)) {
    return;
  }

  const t = el.currentTime;
  const furthest = furthestWatchedRef.current;
  const tol = SEQUENTIAL_MEDIA_SKIP_TOLERANCE_SEC;

  if (t > furthest + tol) {
    const target = Math.max(0, furthest);
    if (Math.abs(el.currentTime - target) > 0.04) {
      el.currentTime = target;
    }
    return;
  }

  furthestWatchedRef.current = Math.max(furthest, t);
}

export function handleSequentialTimeUpdate(
  el: HTMLVideoElement | HTMLAudioElement,
  furthestWatchedRef: { current: number },
  lastKnownTimeRef: { current: number },
): void {
  clampSequentialPlayback(el, furthestWatchedRef);
  lastKnownTimeRef.current = el.currentTime;
}

export function handleSequentialSeeked(
  el: HTMLVideoElement | HTMLAudioElement,
  furthestWatchedRef: { current: number },
  lastKnownTimeRef: { current: number },
): void {
  const t = el.currentTime;
  const last = lastKnownTimeRef.current;
  const backTh = SEQUENTIAL_MEDIA_BACKWARD_SEEK_THRESHOLD_SEC;

  if (t < last - backTh) {
    furthestWatchedRef.current = t;
  }

  clampSequentialPlayback(el, furthestWatchedRef);
  lastKnownTimeRef.current = el.currentTime;
}
