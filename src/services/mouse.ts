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
  private handleMouseDown = (e: MouseEvent) => {
    const rootElement = closest(
      e.target as HTMLElement | null,
      '.mq-root-block'
    ) as HTMLElement | null;

    if (!rootElement) return;

    const ownerDocument = rootElement.ownerDocument;

    var root = (NodeBase.getNodeOfElement(rootElement) ||
      NodeBase.getNodeOfElement(
        this.root.domFrag().oneElement()
      )) as ControllerRoot;
    var ctrlr = root.controller,
      cursor = ctrlr.cursor,
      blink = cursor.blink;
    var textareaSpan = ctrlr.getTextareaSpanOrThrow();
    var textarea = ctrlr.getTextareaOrThrow();

    e.preventDefault(); // doesn't work in IE≤8, but it's a one-line fix:
    (e.target as any).unselectable = true; // http://jsbin.com/yagekiji/1 // TODO - no idea what this unselectable property is

    if (cursor.options.ignoreNextMousedown(e)) return;
    else cursor.options.ignoreNextMousedown = ignoreNextMouseDownNoop;

    var lastMousemoveTarget: $ | undefined;
    function mousemove(e: Event) {
      lastMousemoveTarget = $(e.target);
    }
    function onDocumentMouseMove(e: MouseEvent) {
      if (!cursor.anticursor) cursor.startSelection();
      ctrlr.seek(lastMousemoveTarget!, e.clientX, e.clientY).cursor.select();
      if (cursor.selection)
        cursor.controller.aria
          .clear()
          .queue(cursor.selection.join('mathspeak') + ' selected')
          .alert();
      lastMousemoveTarget = undefined;
    }
    // outside rootElement, the MathQuill node corresponding to the target (if any)
    // won't be inside this root, so don't mislead Controller::seek with it

    function unbindListeners() {
      // delete the mouse handlers now that we're not dragging anymore
      rootElement?.removeEventListener('mousemove', mousemove);
      ownerDocument?.removeEventListener('mousemove', onDocumentMouseMove);
      ownerDocument?.removeEventListener('mouseup', onDocumentMouseUp);
      cancelSelectionOnEdit = undefined;
    }

    function updateCursor() {
      if (ctrlr.editable) {
        cursor.show();
        cursor.controller.aria.queue(cursor.parent).alert();
      } else {
        jQToDOMFragment(textareaSpan).detach();
      }
    }

    function onDocumentMouseUp() {
      cursor.blink = blink;
      if (!cursor.selection) updateCursor();
      unbindListeners();
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
        unbindListeners();
      },
    };

    if (ctrlr.blurred) {
      if (!ctrlr.editable)
        domFrag(rootElement).prepend(jQToDOMFragment(textareaSpan));
      textarea[0].focus();
      // focus call may bubble to clients, who may then write to
      // mathquill, triggering cancelSelectionOnEdit. If that happens, we
      // don't want to stop the cursor blink or bind listeners,
      // so return early.
      if (wasEdited) return;
    }

    cursor.blink = noop;
    ctrlr.seek($(e.target), e.clientX, e.clientY).cursor.startSelection();

    rootElement.addEventListener('mousemove', mousemove);
    ownerDocument?.addEventListener('mousemove', onDocumentMouseMove);
    ownerDocument?.addEventListener('mouseup', onDocumentMouseUp);
    // listen on document not just body to not only hear about mousemove and
    // mouseup on page outside field, but even outside page, except iframes: https://github.com/mathquill/mathquill/commit/8c50028afcffcace655d8ae2049f6e02482346c5#commitcomment-6175800
  };

  addMouseEventListener() {
    //drag-to-select event handling
    this.container.addEventListener('mousedown', this.handleMouseDown);
  }

  removeMouseEventListener() {
    this.container.removeEventListener('mousedown', this.handleMouseDown);
  }

  seek($target: $, clientX: number, _clientY: number) {
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

    node.seek(clientX, cursor);
    this.scrollHoriz(); // before .selectFrom when mouse-selecting, so
    // always hits no-selection case in scrollHoriz and scrolls slower
    return this;
  }
}
