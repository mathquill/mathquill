/********************************************************
 * Deals with mouse events for clicking, drag-to-select
 *******************************************************/

function mouseEvents(ultimateContainer) {
  var ultimateRootjQ = ultimateContainer.children('.mathquill-root-block');
  //drag-to-select event handling
  ultimateContainer.bind('mousedown.mathquill', function(e) {
    var rootjQ = $(e.target).closest('.mathquill-root-block');
    var root = Node.byId[rootjQ.attr(mqBlockId) || ultimateRootjQ.attr(mqBlockId)];
    var ctrlr = root.controller, cursor = ctrlr.cursor, blink = cursor.blink;
    var textareaSpan = ctrlr.textareaSpan, textarea = ctrlr.textarea;

    function mousemove(e) {
      cursor.seek($(e.target), e.pageX, e.pageY).select();
      // focus the least-common-ancestor block:
      if (cursor.selection) cursor.insRightOf(cursor.selection.ends[R]);
      return false;
    }

    // docmousemove is attached to the document, so that
    // selection still works when the mouse leaves the window.
    function docmousemove(e) {
      // [Han]: i delete the target because of the way seek works.
      // it will not move the mouse to the target, but will instead
      // just seek those X and Y coordinates.  If there is a target,
      // it will try to move the cursor to document, which will not work.
      // cursor.seek needs to be refactored.
      delete e.target;

      return mousemove(e);
    }

    function mouseup(e) {
      cursor.endSelection();
      cursor.blink = blink;
      if (!cursor.selection) {
        if (ctrlr.editable) {
          cursor.show();
        }
        else {
          textareaSpan.detach();
        }
      }

      // delete the mouse handlers now that we're not dragging anymore
      rootjQ.unbind('mousemove', mousemove);
      $(e.target.ownerDocument).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
    }

    setTimeout(function() { if (ctrlr.blurred) textarea.focus(); });
      // preventDefault won't prevent focus on mousedown in IE<9
      // that means immediately after this mousedown, whatever was
      // mousedown-ed will receive focus
      // http://bugs.jquery.com/ticket/10345

    cursor.blink = noop;
    cursor.seek($(e.target), e.pageX, e.pageY).startSelection();

    if (!ctrlr.editable && ctrlr.blurred) rootjQ.prepend(textareaSpan);

    rootjQ.mousemove(mousemove);
    $(e.target.ownerDocument).mousemove(docmousemove).mouseup(mouseup);
    return false;
  });
}
