/*****************************************
 * Deals with the browser DOM events from
 * interaction with the typist.
 ****************************************/

/**
 * Only one incremental selection may be open at a time. Track whether
 * an incremental selection is open to help enforce this invariant.
 */
var INCREMENTAL_SELECTION_OPEN = false;

class MQNode extends NodeBase {
  keystroke(key: string, e: KeyboardEvent, ctrlr: Controller) {
    var cursor = ctrlr.cursor;

    switch (key) {
      case 'Ctrl-Shift-Backspace':
      case 'Ctrl-Backspace':
        ctrlr.ctrlDeleteDir(L);
        break;

      case 'Shift-Backspace':
      case 'Backspace':
        ctrlr.backspace();
        break;

      // Tab or Esc -> go one block right if it exists, else escape right.
      case 'Esc':
      case 'Tab':
        ctrlr.escapeDir(R, key, e);
        return;

      // Shift-Tab -> go one block left if it exists, else escape left.
      case 'Shift-Tab':
      case 'Shift-Esc':
        ctrlr.escapeDir(L, key, e);
        return;

      // End -> move to the end of the current block.
      case 'End':
        ctrlr.notify('move').cursor.insAtRightEnd(cursor.parent);
        ctrlr.aria.queue('end of').queue(cursor.parent, true);
        break;

      // Ctrl-End -> move all the way to the end of the root block.
      case 'Ctrl-End':
        ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
        ctrlr.aria
          .queue('end of')
          .queue(ctrlr.ariaLabel)
          .queue(ctrlr.root)
          .queue(ctrlr.ariaPostLabel);
        break;

      // Shift-End -> select to the end of the current block.
      case 'Shift-End':
        ctrlr.selectToBlockEndInDir(R);
        break;

      // Ctrl-Shift-End -> select all the way to the end of the root block.
      case 'Ctrl-Shift-End':
        ctrlr.selectToRootEndInDir(R);
        break;

      // Home -> move to the start of the current block.
      case 'Home':
        ctrlr.notify('move').cursor.insAtLeftEnd(cursor.parent);
        ctrlr.aria.queue('beginning of').queue(cursor.parent, true);
        break;

      // Ctrl-Home -> move all the way to the start of the root block.
      case 'Ctrl-Home':
        ctrlr.notify('move').cursor.insAtLeftEnd(ctrlr.root);
        ctrlr.aria
          .queue('beginning of')
          .queue(ctrlr.ariaLabel)
          .queue(ctrlr.root)
          .queue(ctrlr.ariaPostLabel);
        break;

      // Shift-Home -> select to the start of the current block.
      case 'Shift-Home':
        ctrlr.selectToBlockEndInDir(L);
        break;

      // Ctrl-Shift-Home -> select all the way to the start of the root block.
      case 'Ctrl-Shift-Home':
        ctrlr.selectToRootEndInDir(L);
        break;

      case 'Left':
        ctrlr.moveLeft();
        break;
      case 'Shift-Left':
        ctrlr.selectLeft();
        break;
      case 'Ctrl-Left':
        break;

      case 'Right':
        ctrlr.moveRight();
        break;
      case 'Shift-Right':
        ctrlr.selectRight();
        break;
      case 'Ctrl-Right':
        break;

      case 'Up':
        ctrlr.moveUp();
        break;
      case 'Down':
        ctrlr.moveDown();
        break;

      case 'Shift-Up':
        ctrlr.withIncrementalSelection((selectDir) => {
          if (cursor[L]) {
            while (cursor[L]) selectDir(L);
          } else {
            selectDir(L);
          }
        });
        break;

      case 'Shift-Down':
        ctrlr.withIncrementalSelection((selectDir) => {
          if (cursor[R]) {
            while (cursor[R]) selectDir(R);
          } else {
            selectDir(R);
          }
        });
        break;

      case 'Ctrl-Up':
        break;
      case 'Ctrl-Down':
        break;

      case 'Ctrl-Shift-Del':
      case 'Ctrl-Del':
        ctrlr.ctrlDeleteDir(R);
        break;

      case 'Shift-Del':
      case 'Del':
        ctrlr.deleteForward();
        break;

      case 'Meta-A':
      case 'Ctrl-A':
        ctrlr.selectAll();
        break;

      // These remaining hotkeys are only of benefit to people running screen readers.
      case 'Ctrl-Alt-Up': // speak parent block that has focus
        if (cursor.parent.parent && cursor.parent.parent instanceof MQNode)
          ctrlr.aria.queue(cursor.parent.parent);
        else ctrlr.aria.queue('nothing above');
        break;

      case 'Ctrl-Alt-Down': // speak current block that has focus
        if (cursor.parent && cursor.parent instanceof MQNode)
          ctrlr.aria.queue(cursor.parent);
        else ctrlr.aria.queue('block is empty');
        break;

      case 'Ctrl-Alt-Left': // speak left-adjacent block
        if (
          cursor.parent.parent &&
          cursor.parent.parent.ends &&
          cursor.parent.parent.ends[L] &&
          cursor.parent.parent.ends[L] instanceof MQNode
        ) {
          ctrlr.aria.queue(cursor.parent.parent.ends[L]);
        } else {
          ctrlr.aria.queue('nothing to the left');
        }
        break;

      case 'Ctrl-Alt-Right': // speak right-adjacent block
        if (
          cursor.parent.parent &&
          cursor.parent.parent.ends &&
          cursor.parent.parent.ends[R] &&
          cursor.parent.parent.ends[R] instanceof MQNode
        ) {
          ctrlr.aria.queue(cursor.parent.parent.ends[R]);
        } else {
          ctrlr.aria.queue('nothing to the right');
        }
        break;

      case 'Ctrl-Alt-Shift-Down': // speak selection
        if (cursor.selection)
          ctrlr.aria.queue(
            cursor.selection.join('mathspeak', ' ').trim() + ' selected'
          );
        else ctrlr.aria.queue('nothing selected');
        break;

      case 'Ctrl-Alt-=':
      case 'Ctrl-Alt-Shift-Right': // speak ARIA post label (evaluation or error)
        if (ctrlr.ariaPostLabel.length) ctrlr.aria.queue(ctrlr.ariaPostLabel);
        else ctrlr.aria.queue('no answer');
        break;

      default:
        return;
    }
    ctrlr.aria.alert();
    e.preventDefault();
    ctrlr.scrollHoriz();
  }

  moveOutOf(_dir: Direction, _cursor: Cursor, _updown?: 'up' | 'down') {
    pray('overridden or never called on this node');
  } // called by Controller::escapeDir, moveDir
  moveTowards(_dir: Direction, _cursor: Cursor, _updown?: 'up' | 'down') {
    pray('overridden or never called on this node');
  } // called by Controller::moveDir
  deleteOutOf(_dir: Direction, _cursor: Cursor) {
    pray('overridden or never called on this node');
  } // called by Controller::deleteDir
  deleteTowards(_dir: Direction, _cursor: Cursor) {
    pray('overridden or never called on this node');
  } // called by Controller::deleteDir
  unselectInto(_dir: Direction, _cursor: Cursor) {
    pray('overridden or never called on this node');
  } // called by Controller::selectDir
  selectOutOf(_dir: Direction, _cursor: Cursor) {
    pray('overridden or never called on this node');
  } // called by Controller::selectDir
  selectTowards(_dir: Direction, _cursor: Cursor) {
    pray('overridden or never called on this node');
  } // called by Controller::selectDir
}

ControllerBase.onNotify(function (cursor: Cursor, e: ControllerEvent) {
  if (e === 'move' || e === 'upDown') cursor.show().clearSelection();
});
optionProcessors.leftRightIntoCmdGoes = function (updown: 'up' | 'down') {
  if (updown && updown !== 'up' && updown !== 'down') {
    throw (
      '"up" or "down" required for leftRightIntoCmdGoes option, ' +
      'got "' +
      updown +
      '"'
    );
  }
  return updown;
};

ControllerBase.onNotify(function (cursor: Cursor, e: ControllerEvent) {
  if (e !== 'upDown') cursor.upDownCache = {};
});
ControllerBase.onNotify(function (cursor: Cursor, e: ControllerEvent) {
  if (e === 'edit') cursor.show().deleteSelection();
});
ControllerBase.onNotify(function (cursor: Cursor, e: ControllerEvent) {
  if (e !== 'select') cursor.endSelection();
});

class Controller_keystroke extends Controller_focusBlur {
  keystroke(key: string, evt: KeyboardEvent) {
    this.cursor.parent.keystroke(key, evt, this.getControllerSelf());
  }

  escapeDir(dir: Direction, _key: string, e: KeyboardEvent) {
    prayDirection(dir);
    var cursor = this.cursor;

    // only prevent default of Tab if not in the root editable
    if (cursor.parent !== this.root) e.preventDefault();

    // want to be a noop if in the root editable (in fact, Tab has an unrelated
    // default browser action if so)
    if (cursor.parent === this.root) return;

    cursor.parent.moveOutOf(dir, cursor);
    cursor.controller.aria.alert();
    return this.notify('move');
  }
  moveDir(dir: Direction) {
    prayDirection(dir);
    var cursor = this.cursor,
      updown = cursor.options.leftRightIntoCmdGoes;
    var cursorDir = cursor[dir];

    if (cursor.selection) {
      cursor.insDirOf(dir, cursor.selection.ends[dir] as MQNode);
    } else if (cursorDir) cursorDir.moveTowards(dir, cursor, updown);
    else cursor.parent.moveOutOf(dir, cursor, updown);

    return this.notify('move');
  }
  moveLeft() {
    return this.moveDir(L);
  }
  moveRight() {
    return this.moveDir(R);
  }

  /**
   * moveUp and moveDown have almost identical algorithms:
   * - first check left and right, if so insAtLeft/RightEnd of them
   * - else check the parent's 'upOutOf'/'downOutOf' property:
   *   + if it's a function, call it with the cursor as the sole argument and
   *     use the return value as if it were the value of the property
   *   + if it's a Node, jump up or down into it:
   *     - if there is a cached Point in the block, insert there
   *     - else, seekHoriz within the block to the current x-coordinate (to be
   *       as close to directly above/below the current position as possible)
   *   + unless it's exactly `true`, stop bubbling
   */
  moveUp() {
    return this.moveUpDown('up');
  }
  moveDown() {
    return this.moveUpDown('down');
  }
  moveUpDown(dir: 'up' | 'down') {
    var self = this;
    var cursor = self.notify('upDown').cursor;
    var dirInto: 'upInto' | 'downInto';
    var dirOutOf: 'upOutOf' | 'downOutOf';

    if (dir === 'up') {
      dirInto = 'upInto';
      dirOutOf = 'upOutOf';
    } else {
      dirInto = 'downInto';
      dirOutOf = 'downOutOf';
    }

    var cursorL = cursor[L];
    var cursorR = cursor[R];
    var cursorR_dirInto = cursorR && cursorR[dirInto];
    var cursorL_dirInto = cursorL && cursorL[dirInto];

    if (cursorR_dirInto) cursor.insAtLeftEnd(cursorR_dirInto);
    else if (cursorL_dirInto) cursor.insAtRightEnd(cursorL_dirInto);
    else {
      cursor.parent.bubble(function (ancestor: MQNode) {
        // TODO - revist this
        var prop = ancestor[dirOutOf];
        if (prop) {
          if (typeof prop === 'function')
            prop = prop.call(ancestor, cursor) as any; // TODO - figure out if we need to assign to prop
          if (prop instanceof MQNode) cursor.jumpUpDown(ancestor, prop);
          if ((prop as any) !== true) return false; // TODO - figure out how this can return true
        }
        return undefined;
      });
    }
    return self;
  }
  deleteDir(dir: Direction) {
    prayDirection(dir);
    var cursor = this.cursor;
    var cursorEl = cursor[dir] as MQNode;
    var cursorElParent = cursor.parent.parent;
    var ctrlr = cursor.controller;

    if (cursorEl && cursorEl instanceof MQNode) {
      if (cursorEl.sides) {
        ctrlr.aria.queue(
          cursorEl.parent
            .chToCmd(cursorEl.sides[-dir as Direction].ch)
            .mathspeak({ createdLeftOf: cursor })
        );
        // generally, speak the current element if it has no blocks,
        // but don't for text block commands as the deleteTowards method
        // in the TextCommand class is responsible for speaking the new character under the cursor.
      } else if (!cursorEl.blocks && cursorEl.parent.ctrlSeq !== '\\text') {
        ctrlr.aria.queue(cursorEl);
      }
    } else if (cursorElParent && cursorElParent instanceof MQNode) {
      if (cursorElParent.sides) {
        ctrlr.aria.queue(
          cursorElParent.parent
            .chToCmd(cursorElParent.sides[dir].ch)
            .mathspeak({ createdLeftOf: cursor })
        );
      } else if (cursorElParent.blocks && cursorElParent.mathspeakTemplate) {
        if (cursorElParent.upInto && cursorElParent.downInto) {
          // likely a fraction, and we just backspaced over the slash
          ctrlr.aria.queue(cursorElParent.mathspeakTemplate[1]);
        } else {
          var mst = cursorElParent.mathspeakTemplate;
          var textToQueue = dir === L ? mst[0] : mst[mst.length - 1];
          ctrlr.aria.queue(textToQueue);
        }
      } else {
        ctrlr.aria.queue(cursorElParent);
      }
    }

    var hadSelection = cursor.selection;
    this.notify('edit'); // deletes selection if present
    if (!hadSelection) {
      const cursorDir = cursor[dir];
      if (cursorDir) cursorDir.deleteTowards(dir, cursor);
      else cursor.parent.deleteOutOf(dir, cursor);
    }

    const cursorL = cursor[L] as MQNode;
    const cursorR = cursor[R] as MQNode;
    if (cursorL.siblingDeleted) cursorL.siblingDeleted(cursor.options, R);
    if (cursorR.siblingDeleted) cursorR.siblingDeleted(cursor.options, L);
    cursor.parent.bubble(function (node) {
      (node as MQNode).reflow();
      return undefined;
    });

    return this;
  }
  ctrlDeleteDir(dir: Direction) {
    prayDirection(dir);
    var cursor = this.cursor;
    if (!cursor[dir] || cursor.selection) return this.deleteDir(dir);

    this.notify('edit');
    var fragRemoved;
    if (dir === L) {
      fragRemoved = new Fragment(
        (cursor.parent as MQNode).ends[L] as MQNode,
        cursor[L] as MQNode
      );
    } else {
      fragRemoved = new Fragment(
        cursor[R] as MQNode,
        (cursor.parent as MQNode).ends[R] as MQNode
      );
    }
    cursor.controller.aria.queue(fragRemoved);
    fragRemoved.remove();

    cursor.insAtDirEnd(dir, cursor.parent);

    const cursorL = cursor[L];
    const cursorR = cursor[R];
    if (cursorL) cursorL.siblingDeleted(cursor.options, R);
    if (cursorR) cursorR.siblingDeleted(cursor.options, L);
    cursor.parent.bubble(function (node) {
      (node as MQNode).reflow();
      return undefined;
    });

    return this;
  }
  backspace() {
    return this.deleteDir(L);
  }
  deleteForward() {
    return this.deleteDir(R);
  }

  /**
   * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
   * should only be called by withIncrementalSelection because they must
   * be called in sequence.
   */
  private startIncrementalSelection() {
    pray(
      "Multiple selections can't be simultaneously open",
      !INCREMENTAL_SELECTION_OPEN
    );

    INCREMENTAL_SELECTION_OPEN = true;
    this.notify('select');
    var cursor = this.cursor;
    if (!cursor.anticursor) cursor.startSelection();
  }

  /**
   * Update the selection model, stored in cursor, without modifying
   * selection DOM.
   *
   * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
   * should only be called by withIncrementalSelection because they must
   * be called in sequence.
   */
  private selectDirIncremental(dir: Direction) {
    pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
    INCREMENTAL_SELECTION_OPEN = true;

    var cursor = this.cursor,
      seln = cursor.selection;
    prayDirection(dir);

    var node = cursor[dir];
    if (node) {
      // "if node we're selecting towards is inside selection (hence retracting)
      // and is on the *far side* of the selection (hence is only node selected)
      // and the anticursor is *inside* that node, not just on the other side"
      if (
        seln &&
        seln.ends[dir] === node &&
        (cursor.anticursor as Anticursor)[-dir as Direction] !== node
      ) {
        node.unselectInto(dir, cursor);
      } else node.selectTowards(dir, cursor);
    } else cursor.parent.selectOutOf(dir, cursor);
  }

  /**
   * Update selection DOM to match cursor model
   *
   * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
   * should only be called by withIncrementalSelection because they must
   * be called in sequence.
   */
  private finishIncrementalSelection() {
    pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
    var cursor = this.cursor;
    cursor.clearSelection();
    cursor.select() || cursor.show();
    var selection = cursor.selection;
    if (selection) {
      cursor.controller.aria
        .clear()
        .queue(selection.join('mathspeak', ' ').trim() + ' selected'); // clearing first because selection fires several times, and we don't want repeated speech.
    }
    INCREMENTAL_SELECTION_OPEN = false;
  }

  /**
   * Used to build a selection incrementally in a loop. Calls the passed
   * callback with a selectDir function that may be called many times,
   * and defers updating the view until the incremental selection is
   * complete
   *
   * Wraps up calling
   *
   *     this.startSelection()
   *     this.selectDirIncremental(dir) // possibly many times
   *     this.finishSelection()
   *
   * with extra error handling and invariant enforcement
   */
  withIncrementalSelection(cb: (selectDir: (dir: Direction) => void) => void) {
    try {
      this.startIncrementalSelection();
      try {
        cb((dir) => this.selectDirIncremental(dir));
      } finally {
        // Since we have started a selection, attempt to finish it even
        // if the callback throws an error
        this.finishIncrementalSelection();
      }
    } finally {
      // Mark selection as closed even if finishSelection throws an
      // error. Makes a possible error in finishSelection more
      // recoverable
      INCREMENTAL_SELECTION_OPEN = false;
    }
  }

  /**
   * Grow selection one unit in the given direction
   *
   * Note, this should not be called in a loop. To incrementally grow a
   * selection, use withIncrementalSelection
   */
  selectDir(dir: Direction) {
    this.withIncrementalSelection((selectDir) => selectDir(dir));
  }
  selectLeft() {
    return this.selectDir(L);
  }
  selectRight() {
    return this.selectDir(R);
  }
  selectAll() {
    this.notify('move');
    const cursor = this.cursor;
    cursor.insAtRightEnd(this.root);
    this.withIncrementalSelection((selectDir) => {
      while (cursor[L]) selectDir(L);
    });
  }
  selectToBlockEndInDir(dir: Direction) {
    const cursor = this.cursor;
    this.withIncrementalSelection((selectDir) => {
      while (cursor[dir]) selectDir(dir);
    });
  }
  selectToRootEndInDir(dir: Direction) {
    const cursor = this.cursor;
    this.withIncrementalSelection((selectDir) => {
      while (cursor[dir] || cursor.parent !== this.root) {
        selectDir(dir);
      }
    });
  }
}
