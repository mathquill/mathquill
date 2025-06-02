/**
 * Like `el.getBoundingClientRect()` but avoids throwing for
 * disconnected and hidden elements in IE <= 11.
 * */
function getBoundingClientRect(el: HTMLElement): DOMRect {
  // Return zeros for disconnected and hidden (display: none) elements
  // Running getBoundingClientRect on a disconnected node in IE <=11 throws an error
  // https://github.com/jquery/jquery/blob/a684e6ba836f7c553968d7d026ed7941e1a612d8/src/offset.js#L83-L86
  if (!el.getClientRects().length) {
    return {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      bottom: 0,
      right: 0,
    } as DOMRect;
  }

  return el.getBoundingClientRect();
}

/**
 * Returns the number of pixels that the document is currently scrolled
 * horizontally -- `window.scrollX` in modern browsers.
 * */
function getScrollX() {
  // In IE9, scrollX was called pageXOffset
  // Previous versions of IE had neither property and use scrollLeft instead
  //
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX#notes
  return window.pageXOffset !== undefined
    ? window.pageXOffset
    : (document.documentElement || document.body.parentNode || document.body)
        .scrollLeft;
}

/**
 * Returns the number of pixels that the document is currently scrolled
 * vertically -- `window.scrollY` in modern browsers.
 * */
function getScrollY() {
  // In IE9, scrollY was called pageYOffset
  // Previous versions of IE had neither property and use scrollTop instead
  //
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX#notes
  return window.pageYOffset !== undefined
    ? window.pageYOffset
    : (document.documentElement || document.body.parentNode || document.body)
        .scrollTop;
}
