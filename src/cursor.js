/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
var Cursor = P(function(_) {
  _.init = function(root) {
    this.parent = this.root = root;
    var jQ = this.jQ = this._jQ = $('<span class="cursor">&zwj;</span>');

    //closured for setInterval
    this.blink = function(){ jQ.toggleClass('blink'); }

    this.upDownCache = {};
  };

  _[L] = 0;
  _[R] = 0;
  _.parent = 0;
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
  _.insertAtPoint = function(point) {
    var oldParent = this.parent;
    this.parent = point.parent;
    this[L] = point[L];
    this[R] = point[R];
    oldParent.blur();
  };
  _.insertAdjacent = function(dir, el) {
    prayDirection(dir);
    this.insertAtPoint(el.adjacentPoint(dir));
    this.parent.jQ.addClass('hasCursor');
    jQinsertAdjacent(dir, this.jQ, jQgetExtreme(dir, el.jQ));
  };
  _.insertBefore = function(el) { return this.insertAdjacent(L, el); };
  _.insertAfter = function(el) { return this.insertAdjacent(R, el); };

  _.appendDir = function(dir, el) {
    prayDirection(dir);
    this.insertAtPoint(el.extremePoint(dir));

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

  _.hopDir = function(dir) {
    prayDirection(dir);

    jQinsertAdjacent(dir, this.jQ, jQgetExtreme(dir, this[dir].jQ));
    this[-dir] = this[dir];
    this[dir] = this[dir][dir];
    return this;
  };
  _.hopLeft = function() { return this.hopDir(L); };
  _.hopRight = function() { return this.hopDir(R); };

  _.moveDirWithin = function(dir, block) {
    prayDirection(dir);

    if (this[dir]) {
      if (this[dir].ch[-dir]) this.appendDir(-dir, this[dir].ch[-dir]);
      else this.hopDir(dir);
    }
    else {
      // we're at the beginning/end of the containing block, so do nothing
      if (this.parent === block) return;

      if (this.parent[dir]) this.appendDir(-dir, this.parent[dir]);
      else this.insertAdjacent(dir, this.parent.parent);
    }
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
   * - else check the parent's 'up'/'down' property - if it's a function,
   *   call it with the cursor as the sole argument and use the return value.
   *
   *   Given undefined, will bubble up to the next ancestor block.
   *   Given false, will stop bubbling.
   *   Given a MathBlock,
   *     + moveUp will appendTo it
   *     + moveDown will prependTo it
   *
   */
  _.moveUp = function() { return moveUpDown(this, 'up'); };
  _.moveDown = function() { return moveUpDown(this, 'down'); };
  function moveUpDown(self, dir) {
    if (self[R][dir]) self.prependTo(self[R][dir]);
    else if (self[L][dir]) self.appendTo(self[L][dir]);
    else {
      var ancestorBlock = self.parent;
      do {
        var prop = ancestorBlock[dir];
        if (prop) {
          if (typeof prop === 'function') prop = ancestorBlock[dir](self);
          if (prop === false || prop instanceof MathBlock) {
            self.upDownCache[ancestorBlock.id] = Point(self.parent, self[L], self[R]);

            if (prop instanceof MathBlock) {
              var cached = self.upDownCache[prop.id];

              if (cached) {
                if (cached[R]) {
                  self.insertBefore(cached[R]);
                } else {
                  self.appendTo(cached.parent);
                }
              } else {
                var pageX = offset(self).left;
                self.appendTo(prop);
                self.seekHoriz(pageX, prop);
              }
            }
            break;
          }
        }
        ancestorBlock = ancestorBlock.parent.parent;
      } while (ancestorBlock);
    }

    return self.clearSelection().show();
  }

  _.seek = function(target, pageX, pageY) {
    clearUpDownCache(this);
    var cmd, block, cursor = this.clearSelection().show();
    if (target.hasClass('empty')) {
      cursor.prependTo(MathElement[target.attr(mqBlockId)]);
      return cursor;
    }

    cmd = MathElement[target.attr(mqCmdId)];
    if (cmd instanceof Symbol) { //insert at whichever side is closer
      if (target.outerWidth() > 2*(pageX - target.offset().left))
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);

      return cursor;
    }
    if (!cmd) {
      block = MathElement[target.attr(mqBlockId)];
      if (!block) { //if no MathQuill data, try parent, if still no, just start from the root
        target = target.parent();
        cmd = MathElement[target.attr(mqCmdId)];
        if (!cmd) {
          block = MathElement[target.attr(mqBlockId)];
          if (!block) block = cursor.root;
        }
      }
    }

    if (cmd)
      cursor.insertAfter(cmd);
    else
      cursor.appendTo(block);

    return cursor.seekHoriz(pageX, cursor.root);
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
      MathElement.jQize(block.join('html')).insertBefore(self.jQ);
      self[L] = block.ch[R];
      block.finalizeInsert();
      self.parent.bubble('redraw');
    }

    return this.hide();
  };
  _.write = function(ch) {
    return this.show().insertCh(ch);
  };
  _.insertCh = function(ch) {
    var cmd;
    if (ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
      cmd = Variable(ch);
    else if (cmd = CharCmds[ch] || LatexCmds[ch])
      cmd = cmd(ch);
    else
      cmd = VanillaSymbol(ch);

    if (this.selection) {
      this[L] = this.selection.ends[L][L];
      this[R] = this.selection.ends[R][R];
      cmd.replaces(this.selection);
      delete this.selection;
    }

    return this.insertNew(cmd);
  };
  _.insertNew = function(cmd) {
    cmd.createBefore(this);
    return this;
  };
  _.insertCmd = function(latexCmd, replacedFragment) {
    var cmd = LatexCmds[latexCmd];
    if (cmd) {
      cmd = cmd(replacedFragment, latexCmd);
      this.insertNew(cmd);
      if (cmd instanceof Symbol && replacedFragment)
        replacedFragment.remove();
    }
    else {
      cmd = TextBlock(latexCmd);
      cmd.ch[L].focus = function(){ delete this.focus; return this; };
      this.insertNew(cmd).insertAfter(cmd);
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
  _.backspace = function() {
    clearUpDownCache(this);

    if (this.deleteSelection()); // pass
    else if (this[L]) {
      if (this[L].isEmpty())
        this[L] = this[L].remove()[L];
      else
        this.selectLeft();
    }
    else if (this.parent !== this.root) {
      if (this.parent.parent.isEmpty())
        return this.insertAfter(this.parent.parent).backspace();
      else
        this.unwrapGramp();
    }

    if (this[L])
      this[L].respace();
    if (this[R])
      this[R].respace();
    this.parent.bubble('redraw');

    return this.show();
  };
  _.deleteForward = function() {
    clearUpDownCache(this);

    if (this.deleteSelection()); // pass
    else if (this[R]) {
      if (this[R].isEmpty())
        this[R] = this[R].remove()[R];
      else
        this.selectRight();
    }
    else if (this.parent !== this.root) {
      if (this.parent.parent.isEmpty())
        return this.insertBefore(this.parent.parent).deleteForward();
      else
        this.unwrapGramp();
    }

    if (this[L])
      this[L].respace();
    if (this[R])
      this[R].respace();
    this.parent.bubble('redraw');

    return this.show();
  };
  _.selectFrom = function(anticursor) {
    //find ancestors of each with common parent
    var oneA = this, otherA = anticursor; //one ancestor, the other ancestor
    loopThroughAncestors: while (true) {
      for (var oneI = this; oneI !== oneA.parent.parent; oneI = oneI.parent.parent) //one intermediate, the other intermediate
        if (oneI.parent === otherA.parent) {
          left = oneI;
          right = otherA;
          break loopThroughAncestors;
        }

      for (var otherI = anticursor; otherI !== otherA.parent.parent; otherI = otherI.parent.parent)
        if (oneA.parent === otherI.parent) {
          left = oneA;
          right = otherI;
          break loopThroughAncestors;
        }

      if (oneA.parent.parent)
        oneA = oneA.parent.parent;
      if (otherA.parent.parent)
        otherA = otherA.parent.parent;
    }
    //figure out which is left/prev and which is right/next
    var left, right, leftRight;
    if (left[R] !== right) {
      for (var next = left; next; next = next[R]) {
        if (next === right[L]) {
          leftRight = true;
          break;
        }
      }
      if (!leftRight) {
        leftRight = right;
        right = left;
        left = leftRight;
      }
    }
    this.hide().selection = Selection(left[L][R] || left.parent.ch[L], right[R][L] || right.parent.ch[R]);
    this.insertAfter(right[R][L] || right.parent.ch[R]);
    this.root.selectionChanged();
  };
  _.selectDir = function(dir) {
    prayDirection(dir);
    clearUpDownCache(this);

    if (this.selection) {
      // if cursor is at the (dir) edge of selection
      if (this.selection.ends[dir] === this[-dir]) {
        // then extend (dir) if possible
        if (this[dir]) this.hopDir(dir).selection.extendDir(dir);
        // else level up if possible
        else if (this.parent !== this.root) {
          this.insertAdjacent(dir, this.parent.parent).selection.levelUp();
        }
      }
      // else cursor is at the (-dir) edge of selection, retract if possible
      else {
        this.hopDir(dir);

        // clear the selection if we only have one thing selected
        if (this.selection.ends[dir] === this.selection.ends[-dir]) {
          this.clearSelection().show();
          return;
        }

        this.selection.retractDir(dir);
      }
    }
    // no selection, create one
    else {
      if (this[dir]) this.hopDir(dir);
      // else edge of a block
      else {
        if (this.parent === this.root) return;

        this.insertAdjacent(dir, this.parent.parent);
      }

      this.hide().selection = Selection(this[-dir]);
    }

    this.root.selectionChanged();
  };
  _.selectLeft = function() { return this.selectDir(L); };
  _.selectRight = function() { return this.selectDir(R); };

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
  }

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
});

var Selection = P(MathFragment, function(_, _super) {
  _.init = function() {
    var frag = this;
    _super.init.apply(frag, arguments);

    frag.jQwrap(frag.jQ);
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
    this.jQ.replaceWith(this.jQ.children());
    return this;
  };
  _.levelUp = function() {
    var seln = this,
      gramp = seln.ends[L] = seln.ends[R] = seln.ends[R].parent.parent;
    seln.clear().jQwrap(gramp.jQ);
    return seln;
  };
  _.extendDir = function(dir) {
    prayDirection(dir);
    this.ends[dir] = this.ends[dir][dir];
    jQappendDir(dir, this.ends[dir].jQ, this.jQ);
    return this;
  };
  _.extendLeft = function() { return this.extendDir(L); };
  _.extendRight = function() { return this.extendDir(R); };

  _.retractDir = function(dir) {
    prayDirection(dir);
    jQinsertAdjacent(-dir, this.ends[-dir].jQ, this.jQ);
    this.ends[-dir] = this.ends[-dir][dir];
  };
  _.retractRight = function() { return this.retractDir(R); };
  _.retractLeft = function() { return this.retractDir(L); };
});
