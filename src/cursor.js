/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
var Cursor = P(Point, function(_) {
  _.init = function(root) {
    this.parent = this.root = root;
    var jQ = this.jQ = this._jQ = $('<span class="cursor">&zwj;</span>');

    //closured for setInterval
    this.blink = function(){ jQ.toggleClass('blink'); }

    this.upDownCache = {};
  };

  _.show = function() {
    this.jQ = this._jQ.removeClass('blink');
    if ('intervalId' in this) //already was shown, just restart interval
      clearInterval(this.intervalId);
    else { //was hidden and detached, insert this.jQ back into HTML DOM
      if (this[R]) {
        if (this.selection && this.selection.ends[L][L] === this[L])
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this[R].jQ.first());
      }
      else
        this.jQ.appendTo(this.parent.jQ);
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  };
  _.hide = function() {
    if ('intervalId' in this)
      clearInterval(this.intervalId);
    delete this.intervalId;
    this.jQ.detach();
    this.jQ = $();
    return this;
  };

  _.withDirInsertAt = function(dir, parent, withDir, oppDir) {
    var oldParent = this.parent;
    this.parent = parent;
    this[dir] = withDir;
    this[-dir] = oppDir;
    oldParent.blur();
  };
  _.insertAdjacent = function(dir, el) {
    prayDirection(dir);
    this.withDirInsertAt(dir, el.parent, el[dir], el);
    this.parent.jQ.addClass('hasCursor');
    jQinsertAdjacent(dir, this.jQ, jQgetExtreme(dir, el.jQ));
    return this;
  };
  _.insertBefore = function(el) { return this.insertAdjacent(L, el); };
  _.insertAfter = function(el) { return this.insertAdjacent(R, el); };

  _.appendDir = function(dir, el) {
    prayDirection(dir);
    this.withDirInsertAt(dir, el, 0, el.ch[dir]);

    // never insert before textarea
    if (dir === L && el.textarea) {
      jQinsertAdjacent(-dir, this.jQ, el.textarea);
    }
    else {
      jQappendDir(dir, this.jQ, el.jQ);
    }

    el.focus();

    return this;
  };
  _.prependTo = function(el) { return this.appendDir(L, el); };
  _.appendTo = function(el) { return this.appendDir(R, el); };

  _.escapeDir = function(dir, key, e) {
    prayDirection(dir);

    // always prevent default of Spacebar, but only prevent default of Tab if
    // not in the root editable
    if (key === 'Spacebar' || this.parent !== this.root) {
      e.preventDefault();
    }

    // want to be a noop if in the root editable (in fact, Tab has an unrelated
    // default browser action if so)
    if (this.parent === this.root) return;

    clearUpDownCache(this);
    this.show().clearSelection();
    this.parent.moveOutOf(dir, this);
  };

  _.moveDirWithin = function(dir, block) {
    prayDirection(dir);

    if (this[dir]) this[dir].moveTowards(dir, this);
    else if (this.parent !== block) this.parent.moveOutOf(dir, this);
  };
  _.moveLeftWithin = function(block) {
    return this.moveDirWithin(L, block);
  };
  _.moveRightWithin = function(block) {
    return this.moveDirWithin(R, block);
  };
  _.moveDir = function(dir) {
    prayDirection(dir);

    clearUpDownCache(this);

    if (this.selection)  {
      this.insertAdjacent(dir, this.selection.ends[dir]).clearSelection();
    }
    else {
      this.moveDirWithin(dir, this.root);
    }

    return this.show();
  };
  _.moveLeft = function() { return this.moveDir(L); };
  _.moveRight = function() { return this.moveDir(R); };

  /**
   * moveUp and moveDown have almost identical algorithms:
   * - first check next and prev, if so prepend/appendTo them
   * - else check the parent's 'upOutOf'/'downOutOf' property:
   *   + if it's a function, call it with the cursor as the sole argument and
   *     use the return value as if it were the value of the property
   *   + if it's undefined, bubble up to the next ancestor.
   *   + if it's false, stop bubbling.
   *   + if it's a Node, jump up or down to it
   */
  _.moveUp = function() { return moveUpDown(this, 'up'); };
  _.moveDown = function() { return moveUpDown(this, 'down'); };
  function moveUpDown(self, dir) {
    var dirInto = dir+'Into', dirOutOf = dir+'OutOf';
    if (self[R][dirInto]) self.prependTo(self[R][dirInto]);
    else if (self[L][dirInto]) self.appendTo(self[L][dirInto]);
    else {
      var ancestor = self.parent;
      do {
        var prop = ancestor[dirOutOf];
        if (prop) {
          if (typeof prop === 'function') prop = ancestor[dirOutOf](self);
          if (prop === false) break;
          if (prop instanceof Node) {
            self.jumpUpDown(ancestor, prop);
            break;
          }
        }
        ancestor = ancestor.parent;
      } while (ancestor !== self.root);
    }

    return self.clearSelection().show();
  }
  /**
   * jump up or down from one block Node to another:
   * - cache the current Point in the node we're jumping from
   * - check if there's a Point in it cached for the node we're jumping to
   *   + if so put the cursor there,
   *   + if not seek a position in the node that is horizontally closest to
   *     the cursor's current position
   */
  _.jumpUpDown = function(from, to) {
    var self = this;
    self.upDownCache[from.id] = Point.copy(self);
    var cached = self.upDownCache[to.id];
    if (cached) {
      cached[R] ? self.insertBefore(cached[R]) : self.appendTo(cached.parent);
    }
    else {
      var pageX = offset(self).left;
      self.appendTo(to).seekHoriz(pageX, to);
    }
  };

  _.seek = function(target, pageX, pageY) {
    var cursor = this;
    clearUpDownCache(cursor);

    var nodeId = target.attr(mqBlockId) || target.attr(mqCmdId);
    if (!nodeId) {
      var targetParent = target.parent();
      nodeId = targetParent.attr(mqBlockId) || targetParent.attr(mqCmdId);
    }
    var node = nodeId ? Node.byId[nodeId] : cursor.root;
    pray('nodeId is the id of some Node that exists', node);

    // target could've been selection span, so get node from target before
    // clearing selection
    cursor.clearSelection().show();

    node.seek(pageX, cursor);

    return cursor;
  };
  _.seekHoriz = function(pageX, block) {
    //move cursor to position closest to click
    var cursor = this;
    var dist = offset(cursor).left - pageX;
    var prevDist;

    do {
      cursor.moveLeftWithin(block);
      prevDist = dist;
      dist = offset(cursor).left - pageX;
    }
    while (dist > 0 && (cursor[L] || cursor.parent !== block));

    if (-dist > prevDist) cursor.moveRightWithin(block);

    return cursor;
  };
  function offset(self) {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    var offset = self.jQ.removeClass('cursor').offset();
    self.jQ.addClass('cursor');
    return offset;
  }
  _.writeLatex = function(latex) {
    var self = this;
    clearUpDownCache(self);
    self.show().deleteSelection();

    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    if (block) {
      block.children().adopt(self.parent, self[L], self[R]);
      block.jQize().insertBefore(self.jQ);
      self[L] = block.ch[R];
      block.finalizeInsert();
      self.parent.bubble('redraw');
    }

    return this.hide();
  };
  _.write = function(ch) {
    var seln = this.prepareWrite();
    return this.insertCh(ch, seln);
  };
  _.insertCh = function(ch, replacedFragment) {
    this.parent.write(this, ch, replacedFragment);
    return this;
  };
  _.insertCmd = function(latexCmd, replacedFragment) {
    var cmd = LatexCmds[latexCmd];
    if (cmd) {
      cmd = cmd(latexCmd);
      if (replacedFragment) cmd.replaces(replacedFragment);
      cmd.createBefore(this);
    }
    else {
      cmd = TextBlock();
      cmd.replaces(latexCmd);
      cmd.ch[L].focus = function(){ delete this.focus; return this; };
      cmd.createBefore(this);
      this.insertAfter(cmd);
      if (replacedFragment)
        replacedFragment.remove();
    }
    return this;
  };
  _.unwrapGramp = function() {
    var gramp = this.parent.parent;
    var greatgramp = gramp.parent;
    var next = gramp[R];
    var cursor = this;

    var prev = gramp[L];
    gramp.disown().eachChild(function(uncle) {
      if (uncle.isEmpty()) return;

      uncle.children()
        .adopt(greatgramp, prev, next)
        .each(function(cousin) {
          cousin.jQ.insertBefore(gramp.jQ.first());
        })
      ;

      prev = uncle.ch[R];
    });

    if (!this[R]) { //then find something to be next to insertBefore
      if (this[L])
        this[R] = this[L][R];
      else {
        while (!this[R]) {
          this.parent = this.parent[R];
          if (this.parent)
            this[R] = this.parent.ch[L];
          else {
            this[R] = gramp[R];
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    if (this[R])
      this.insertBefore(this[R]);
    else
      this.appendTo(greatgramp);

    gramp.jQ.remove();

    if (gramp[L])
      gramp[L].respace();
    if (gramp[R])
      gramp[R].respace();
  };
  _.deleteDir = function(dir) {
    prayDirection(dir);
    clearUpDownCache(this);
    this.show();

    if (this.deleteSelection()); // pass
    else if (this[dir]) this[dir].deleteTowards(dir, this);
    else if (this.parent !== this.root) this.parent.deleteOutOf(dir, this);

    if (this[L])
      this[L].respace();
    if (this[R])
      this[R].respace();
    this.parent.bubble('redraw');

    return this;
  };
  _.backspace = function() { return this.deleteDir(L); };
  _.deleteForward = function() { return this.deleteDir(R); };
  _.select = function() {
    var anticursor = this.anticursor;
    if (this[L] === anticursor[L] && this.parent === anticursor.parent) return;

    // `this` cursor and the anticursor should be in the same tree, because
    // the mousemove handler attached to the document, unlike the one attached
    // to the root HTML DOM element, doesn't try to get the math tree node of
    // the mousemove target, and Cursor::seek() based solely on coordinates
    // stays within the tree of `this` cursor's root.
    var selection = Fragment.between(this, anticursor);

    var leftEnd = selection.ends[L];
    var rightEnd = selection.ends[R];
    var lca = leftEnd.parent;

    lca.selectChildren(this.hide(), leftEnd, rightEnd);
    this.root.selectionChanged();
  };
  _.selectDir = function(dir) {
    var self = this;
    prayDirection(dir);
    clearUpDownCache(this);

    if (self[dir]) {
      var adjacent = self[dir],
          selection = self.selection;

      if (!selection) {
        adjacent.createSelection(dir, self);
      }
      else if (selection.ends[dir] === self[-dir]) {
        adjacent.extendSelection(dir, self);
      }
      else if (selection.ends[dir] === selection.ends[-dir]) {
        adjacent.clearSelection(dir, self);
      }
      else {
        adjacent.retractSelection(dir, self);
      }
    }
    else if (self.parent !== self.root) {
      self.parent.selectOutOf(dir, self);
    }

    self.root.selectionChanged();
  };
  _.selectLeft = function() { return this.selectDir(L); };
  _.selectRight = function() { return this.selectDir(R); };
  _.startSelection = function() {
    this.anticursor = Point.copy(this);
  };
  _.endSelection = function() {
    delete this.anticursor;
  };

  function clearUpDownCache(self) {
    self.upDownCache = {};
  }

  _.prepareMove = function() {
    clearUpDownCache(this);
    return this.show().clearSelection();
  };
  _.prepareEdit = function() {
    clearUpDownCache(this);
    return this.show().deleteSelection();
  };
  _.prepareWrite = function() {
    clearUpDownCache(this);
    return this.show().replaceSelection();
  };

  _.clearSelection = function() {
    if (this.selection) {
      this.selection.clear();
      delete this.selection;
      this.root.selectionChanged();
    }
    return this;
  };
  _.deleteSelection = function() {
    if (!this.selection) return false;

    this[L] = this.selection.ends[L][L];
    this[R] = this.selection.ends[R][R];
    this.selection.remove();
    this.root.selectionChanged();
    return delete this.selection;
  };
  _.replaceSelection = function() {
    var seln = this.selection;
    if (seln) {
      this[L] = seln.ends[L][L];
      this[R] = seln.ends[R][R];
      delete this.selection;
    }
    return seln;
  };
});

var Selection = P(Fragment, function(_, _super) {
  _.init = function(first, last) {
    var seln = this;

    // just select one thing if only one argument
    _super.init.call(seln, first, last || first);

    seln.jQwrap(seln.jQ);
  };
  _.jQwrap = function(children) {
    this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  };
  _.adopt = function() {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return _super.adopt.apply(this, arguments);
  };
  _.clear = function() {
    // using the browser's native .childNodes property so that we
    // don't discard text nodes.
    this.jQ.replaceWith(this.jQ[0].childNodes);
    return this;
  };
});
