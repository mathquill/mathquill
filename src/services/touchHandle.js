/********************************************************
 * Event handling for touch-draggable handle
 *******************************************************/

/**
 * Usage:
 * jQ.on('touchstart', firstFingerOnly(function(touchstartCoords) {
 *   return { // either of these are optional:
 *     touchmove: function(touchmoveCoords) {},
 *     touchend: function(touchendCoords) {}
 *   };
 * });
 */
function firstFingerOnly(ontouchstart) {
  return function(e) {
    e.preventDefault();
    var e = e.originalEvent;
    if (e.touches.length > 1) return; // not first finger
    var touchstart = e.changedTouches[0];
    var handlers = ontouchstart(touchstart) || 0;
    if (handlers.touchmove) {
      $(this).bind('touchmove', function(e) {
        var touchmove = e.originalEvent.changedTouches[0];
        if (touchmove.id !== touchstart.id) return;
        handlers.touchmove.call(this, touchmove);
      });
    }
    $(this).bind('touchend', function(e) {
      var touchend = e.originalEvent.changedTouches[0];
      if (touchend.id !== touchstart.id) return;
      if (handlers.touchend) handlers.touchend.call(this, touchend);
      $(this).unbind('touchmove touchend');
    });
  };
}

Controller.open(function(_) {
  _.touchEvents = function() {
    var ctrlr = this, container = ctrlr.container, root = ctrlr.root,
      cursor = ctrlr.cursor, blink = cursor.blink;

    /* returns the element at the given point looking "through" the cursor
     * handle, if it's in the current editable */
    function elAtPt(x, y) {
      if (cursor.handle.visible) cursor.handle.hide();
      var el = $(document.elementFromPoint(x, y));
      if (cursor.handle.visible) cursor.handle.show();
      return el.closest(root.jQ).length ? el : root.jQ;
    }

    container.bind('touchstart.mathquill', firstFingerOnly(function(e) {
      if (e.target === cursor.handle[0]) return;
      ctrlr.textarea.focus();
      cursor.blink = noop;

      ctrlr.seek(elAtPt(e.pageX, e.pageY), e.pageX, e.pageY);
      return {
        touchmove: function(e) {
          ctrlr.seek(elAtPt(e.pageX, e.pageY), e.pageX, e.pageY);
        },
        touchend: function(e) {
          cursor.blink = blink;
          cursor.show();
          cursor.showHandle();
        }
      };
    }));
    cursor.handle.bind('touchstart.mathquill', firstFingerOnly(function(e) {
      var cursorPos = cursor.jQ.offset();
      var offsetX = e.pageX - cursorPos.left;
      var offsetY = e.pageY - (cursorPos.top + cursor.jQ.height());
      return {
        touchmove: function(e) {
          var adjustedX = e.pageX - offsetX, adjustedY = e.pageY - offsetY;
          ctrlr.seek(elAtPt(adjustedX, adjustedY), adjustedX, adjustedY);
        }
      };
    }));
  };
});
