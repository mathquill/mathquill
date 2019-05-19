/********************************************************
 * Deals with mouse events for clicking, drag-to-select
 *******************************************************/

Controller.open(function(_) {
  Options.p.ignoreNextMousedown = noop;
  _.delegateMouseEvents = function() {
    var ultimateRootjQ = this.root.jQ;
    //drag-to-select event handling
    this.container.bind('mousedown.mathquill touchstart.mathquill', function(e) {
      var rootjQ = $(e.target).closest('.mq-root-block');
      var root = Node.byId[rootjQ.attr(mqBlockId) || ultimateRootjQ.attr(mqBlockId)];
      var ctrlr = root.controller, cursor = ctrlr.cursor, blink = cursor.blink;
      var textareaSpan = ctrlr.textareaSpan, textarea = ctrlr.textarea;

      e.preventDefault(); // doesn't work in IE≤8, but it's a one-line fix:
      e.target.unselectable = true; // http://jsbin.com/yagekiji/1

      if (cursor.options.ignoreNextMousedown(e)) return;
      else cursor.options.ignoreNextMousedown = noop;

      var target;
      function mousemove(e) { target = $(e.target); }
      function docmousemove(e) {
        if (!cursor.anticursor) cursor.startSelection();
        if (e.type == 'touchmove') {
          var touch = e.originalEvent.changedTouches[0] || e.originalEvent.touches[0];
          // for touch, target is the original element, not element under thumb.
          var touchtarget = $(document.elementFromPoint(touch.clientX, touch.clientY));
          // this target may not be in original element, so check
          if (jQuery.contains(rootjQ[0], touchtarget[0])) {
            ctrlr.seek(touchtarget, touch.pageX, touch.pageY).cursor.select();
          }
        } else {
          ctrlr.seek(target, e.pageX, e.pageY).cursor.select();
        }
        target = undefined;
      }
      // outside rootjQ, the MathQuill node corresponding to the target (if any)
      // won't be inside this root, so don't mislead Controller::seek with it

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
        rootjQ.unbind('mousemove touchmove', mousemove);
        $(e.target.ownerDocument).unbind('mousemove touchmove', docmousemove).unbind('mouseup touchend', mouseup);
      }

      if (ctrlr.blurred) {
        if (!ctrlr.editable) rootjQ.prepend(textareaSpan);
        textarea.focus();
      }

      cursor.blink = noop;
      if (e.type == 'touchstart') {
        var touch = e.originalEvent.changedTouches[0] || e.originalEvent.touches[0];
        // for touch, target is the original element, not element under thumb.
        var touchtarget = $(document.elementFromPoint(touch.clientX, touch.clientY));
        // this target may not be in original element, so check
        if (jQuery.contains(rootjQ[0], touchtarget[0])) {
          ctrlr.seek(touchtarget, touch.pageX, touch.pageY).cursor.startSelection();
        }
      } else {
        ctrlr.seek($(e.target), e.pageX, e.pageY).cursor.startSelection();
      }

      rootjQ.bind('mousemove touchmove', mousemove);
      $(e.target.ownerDocument).bind('mousemove touchmove', docmousemove).bind('mouseup touchend', mouseup);
      // listen on document not just body to not only hear about mousemove and
      // mouseup on page outside field, but even outside page, except iframes: https://github.com/mathquill/mathquill/commit/8c50028afcffcace655d8ae2049f6e02482346c5#commitcomment-6175800
    });
  }
});

Controller.open(function(_) {
  _.seek = function(target, pageX, pageY) {
    var cursor = this.notify('select').cursor;

    if (target) {
      var nodeId = target.attr(mqBlockId) || target.attr(mqCmdId);
      if (!nodeId) {
        var targetParent = target.parent();
        nodeId = targetParent.attr(mqBlockId) || targetParent.attr(mqCmdId);
      }
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
