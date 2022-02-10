/**
 * Given `duration` in ms and callback `cb`, immediately calls `cb` with
 * `progress` set to `0`, `scheduleNext` a function that schedules a
 * future call to `cb`, and `cancel` a function that cancels any pending
 * `scheduleNext` call.
 *
 * `scheduleNext` schedules a call to `cb` with `progress` set to the
 * ratio of currently elapsed time and `duration`.
 *
 * To continue running the animation, `cb` should call `scheduleNext`.
 *
 * To stop the animation, it is the responsibility of `cb` to check
 * whether progress is greater than or equal to 1, in which case `cb`
 * should not call `scheduleNext`.
 *
 * `scheduleNext` uses `requestAnimationFrame` if available and falls
 * back to `setTimeout(..., 13)` otherwise. Times are always based on
 * `Date.now()` for compatibility between `requestAnimationFrame` and
 * the `setTimeout` fallback. `cb` will only be called with strictly
 * monotonic `progress` values.
 *
 * Note: `animate` purposely puts a lot of responsibility on the caller
 * to keep its implementation simple because it isn't used very widely
 * in the project.
 */
const animate = (function () {
  // IIFE exists just to hang on to configured rafShim and cancelShim
  // functions
  let rafShim: (cb: () => void) => number, cancelShim: (token: number) => void;
  if (
    typeof requestAnimationFrame === 'function' &&
    typeof cancelAnimationFrame === 'function'
  ) {
    rafShim = requestAnimationFrame;
    cancelShim = cancelAnimationFrame;
  } else {
    rafShim = (cb: () => void) => setTimeout(cb, 13);
    cancelShim = clearTimeout;
  }

  return function (
    duration: number,
    cb: (progress: number, scheduleNext: () => void, cancel: () => void) => void
  ) {
    let start = Date.now();
    let cancelToken: number | undefined;
    let progress = 0;
    function step() {
      const proposedProgress = (Date.now() - start) / duration;

      // Enforce that progress is strictly monotonic
      if (proposedProgress <= progress) {
        scheduleNext();
      } else {
        progress = proposedProgress;
      }

      cb(progress, scheduleNext, cancel);
    }
    function cancel() {
      if (cancelToken !== undefined) cancelShim(cancelToken);
      cancelToken = undefined;
    }
    function scheduleNext() {
      // Calling cancel here ensures that there are never multiple
      // concurrent callbacks scheduled for a single animation, even if
      // the caller calls `scheduleNext` multiple times in a single
      // event loop (which is always a mistake)
      cancel();
      cancelToken = rafShim(step);
    }
    cb(0, scheduleNext, cancel);
  };
})();
