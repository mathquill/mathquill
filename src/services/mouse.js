/********************************************************
 * Deals with mouse events for clicking, drag-to-select
 *******************************************************/

Controller.open(function(_) {
  _.delegateMouseEvents = function() {
    var ultimateRootjQ = this.root.jQ;
    //drag-to-select event handling
    this.container.bind('mousedown.mathquill', function(e) {
      var rootjQ = $(e.target).closest('.mathquill-root-block');
      var root = Node.byId[rootjQ.attr(mqBlockId) || ultimateRootjQ.attr(mqBlockId)];
      var ctrlr = root.controller, cursor = ctrlr.cursor, blink = cursor.blink;
      var textareaSpan = ctrlr.textareaSpan, textarea = ctrlr.textarea;

      function mousemove(e) {
        if (!cursor.anticursor) cursor.startSelection();
        ctrlr.seek($(e.target), e.pageX, e.pageY).cursor.select();
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
      ctrlr.seek($(e.target), e.pageX, e.pageY).cursor.startSelection();

      if (!ctrlr.editable && ctrlr.blurred) rootjQ.prepend(textareaSpan);

      rootjQ.mousemove(mousemove);
      $(e.target.ownerDocument).mousemove(docmousemove).mouseup(mouseup);
    });
  }
});

Controller.open(function(_) {
  _.seek = function(target, pageX, pageY) {
    var cursor = this.notify('select').cursor;

    var nodeId = target.attr(mqBlockId) || target.attr(mqCmdId);
    if (!nodeId) {
      var targetParent = target.parent();
      nodeId = targetParent.attr(mqBlockId) || targetParent.attr(mqCmdId);
    }
    var node = nodeId ? Node.byId[nodeId] : this.root;
    pray('nodeId is the id of some Node that exists', node);

    // don't clear selection until after getting node from target, in case
    // target was selection span, otherwise target will have no parent and will
    // seek from root, which is less accurate (e.g. fraction)
    cursor.clearSelection().show();

    node.seek(pageX, cursor);
    this.scrollHoriz(); // before .selectFrom when mouse-selecting, so
                        // always hits no-selection case in scrollHoriz and scrolls slower
    return this;
  };
});
