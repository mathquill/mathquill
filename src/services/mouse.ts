/********************************************************
 * Deals with mouse events for clicking, drag-to-select
 *******************************************************/
const ignoreNextMouseDownNoop = (_el: MouseEvent) => {
  return false;
};
Options.prototype.ignoreNextMousedown = ignoreNextMouseDownNoop;

// Whenever edits to the tree occur, in-progress selection events
// must be invalidated and selection changes must not be applied to
// the edited tree. cancelSelectionOnEdit takes care of this.
var cancelSelectionOnEdit:
  | undefined
  | {
      cb: () => void;
      cursor: Cursor;
    };

(function () {
  ControllerBase.onNotify(function (cursor, e) {
    if (e === 'edit' || e === 'replace') {
      // this will be called any time ANY mathquill is edited. We only want
      // to cancel selection if the selection is happening within the mathquill
      // that dispatched the notify. Otherwise you won't be able to select any
      // mathquills while a slider is playing.
      if (cancelSelectionOnEdit && cancelSelectionOnEdit.cursor === cursor) {
        cancelSelectionOnEdit.cb();
      }
    }
  });
})();

class Controller_mouse extends Controller_latex {
  delegateMouseEvents() {
    var ultimateRootjQ = this.root.jQ;
    //drag-to-select event handling
    this.container.bind('mousedown.mathquill', function (_e: Event) {
      var e = _e as MouseEvent;
      var rootjQ = $(e.target).closest('.mq-root-block');
      var root = (NodeBase.getNodeOfElement(rootjQ[0]) ||
        NodeBase.getNodeOfElement(ultimateRootjQ[0])) as ControllerRoot;
      var ctrlr = root.controller,
        cursor = ctrlr.cursor,
        blink = cursor.blink;
      var textareaSpan = ctrlr.getTextareaSpanOrThrow();
      var textarea = ctrlr.getTextareaOrThrow();

      e.preventDefault(); // doesn't work in IE≤8, but it's a one-line fix:
      (e.target as any).unselectable = true; // http://jsbin.com/yagekiji/1 // TODO - no idea what this unselectable property is

      if (cursor.options.ignoreNextMousedown(e)) return;
      else cursor.options.ignoreNextMousedown = ignoreNextMouseDownNoop;

      var target: $ | undefined;
      function mousemove(e: Event) {
        target = $(e.target);
      }
      function docmousemove(e: MouseEvent) {
        if (!cursor.anticursor) cursor.startSelection();
        ctrlr.seek(target!, e.pageX, e.pageY).cursor.select();
        if (cursor.selection)
          cursor.controller.aria
            .clear()
            .queue(cursor.selection.join('mathspeak') + ' selected')
            .alert();
        target = undefined;
      }
      // outside rootjQ, the MathQuill node corresponding to the target (if any)
      // won't be inside this root, so don't mislead Controller::seek with it

      function unbindListeners(e: MouseEvent) {
        // delete the mouse handlers now that we're not dragging anymore
        rootjQ.unbind('mousemove', mousemove);

        const anyTarget = e.target as any; // TODO - why do we need to cast to any?
        $(anyTarget.ownerDocument)
          .unbind('mousemove', docmousemove)
          .unbind('mouseup', mouseup);
        cancelSelectionOnEdit = undefined;
      }

      function updateCursor() {
        if (ctrlr.editable) {
          cursor.show();
          cursor.controller.aria.queue(cursor.parent).alert();
        } else {
          textareaSpan.detach();
        }
      }

      function mouseup(e: MouseEvent) {
        cursor.blink = blink;
        if (!cursor.selection) updateCursor();
        unbindListeners(e);
      }

      var wasEdited;
      cancelSelectionOnEdit = {
        cursor: cursor,
        cb: function () {
          // If an edit happens while the mouse is down, the existing
          // selection is no longer valid. Clear it and unbind listeners,
          // similar to what happens on mouseup.
          wasEdited = true;
          cursor.blink = blink;
          cursor.clearSelection();
          updateCursor();
          unbindListeners(e);
        },
      };

      if (ctrlr.blurred) {
        if (!ctrlr.editable) rootjQ.prepend(textareaSpan);
        textarea[0].focus();
        // focus call may bubble to clients, who may then write to
        // mathquill, triggering cancelSelectionOnEdit. If that happens, we
        // don't want to stop the cursor blink or bind listeners,
        // so return early.
        if (wasEdited) return;
      }

      cursor.blink = noop;
      ctrlr.seek($(e.target), e.pageX, e.pageY).cursor.startSelection();

      rootjQ.mousemove(mousemove);
      const anyTarget = e.target as any; // TODO - why do we need to cast to any?
      $(anyTarget.ownerDocument).mousemove(docmousemove).mouseup(mouseup);
      // listen on document not just body to not only hear about mousemove and
      // mouseup on page outside field, but even outside page, except iframes: https://github.com/mathquill/mathquill/commit/8c50028afcffcace655d8ae2049f6e02482346c5#commitcomment-6175800
    });
  }

  seek($target: $, pageX: number, _pageY: number) {
    var cursor = this.notify('select').cursor;
    var node;
    var targetElm: HTMLElement | null = $target && $target[0];

    // we can click on an element that is deeply nested past the point
    // that mathquill knows about. We need to traverse up to the first
    // node that mathquill is aware of
    while (targetElm) {
      // try to find the MQ Node associated with the DOM Element
      node = NodeBase.getNodeOfElement(targetElm);
      if (node) break;

      // must be too deep, traverse up to the parent DOM Element
      targetElm = targetElm.parentElement;
    }

    // Could not find any nodes, just use the root
    if (!node) {
      node = this.root;
    }

    // don't clear selection until after getting node from target, in case
    // target was selection span, otherwise target will have no parent and will
    // seek from root, which is less accurate (e.g. fraction)
    cursor.clearSelection().show();

    node.seek(pageX, cursor);
    this.scrollHoriz(); // before .selectFrom when mouse-selecting, so
    // always hits no-selection case in scrollHoriz and scrolls slower
    return this;
  }
}
