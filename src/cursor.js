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
  _.init = function(initParent, options) {
    this.parent = initParent;
    this.options = options;

    var jQ = this.jQ = this._jQ = $('<span class="mq-cursor">&#8203;</span>');
    //closured for setInterval
    this.blink = function(){ jQ.toggleClass('mq-blink'); };

    this.upDownCache = {};
  };

  _.show = function() {
    this.jQ = this._jQ.removeClass('mq-blink');
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
    // by contract, .blur() is called after all has been said and done
    // and the cursor has actually been moved
    // FIXME pass cursor to .blur() so text can fix cursor pointers when removing itself
    if (oldParent !== parent && oldParent.blur) oldParent.blur(this);
  };
  _.insDirOf = function(dir, el) {
    prayDirection(dir);
    this.jQ.insDirOf(dir, el.jQ);
    this.withDirInsertAt(dir, el.parent, el[dir], el);
    this.parent.jQ.addClass('mq-hasCursor');
    return this;
  };
  _.insLeftOf = function(el) { return this.insDirOf(L, el); };
  _.insRightOf = function(el) { return this.insDirOf(R, el); };

  _.insAtDirEnd = function(dir, el) {
    prayDirection(dir);
    this.jQ.insAtDirEnd(dir, el.jQ);
    this.withDirInsertAt(dir, el, 0, el.ends[dir]);
    el.focus();
    return this;
  };
  _.insAtLeftEnd = function(el) { return this.insAtDirEnd(L, el); };
  _.insAtRightEnd = function(el) { return this.insAtDirEnd(R, el); };

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
      cached[R] ? self.insLeftOf(cached[R]) : self.insAtRightEnd(cached.parent);
    }
    else {
      var pageX = self.offset().left;
      to.seek(pageX, self);
    }
  };
  _.offset = function() {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    var self = this, offset = self.jQ.removeClass('mq-cursor').offset();
    self.jQ.addClass('mq-cursor');
    return offset;
  }
  _.unwrapGramp = function() {
    var gramp = this.parent.parent;
    var greatgramp = gramp.parent;
    var rightward = gramp[R];
    var cursor = this;

    var leftward = gramp[L];
    gramp.disown().eachChild(function(uncle) {
      if (uncle.isEmpty()) return;

      uncle.children()
        .adopt(greatgramp, leftward, rightward)
        .each(function(cousin) {
          cousin.jQ.insertBefore(gramp.jQ.first());
        })
      ;

      leftward = uncle.ends[R];
    });

    if (!this[R]) { //then find something to be rightward to insLeftOf
      if (this[L])
        this[R] = this[L][R];
      else {
        while (!this[R]) {
          this.parent = this.parent[R];
          if (this.parent)
            this[R] = this.parent.ends[L];
          else {
            this[R] = gramp[R];
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    if (this[R])
      this.insLeftOf(this[R]);
    else
      this.insAtRightEnd(greatgramp);

    gramp.jQ.remove();

    if (gramp[L].siblingDeleted) gramp[L].siblingDeleted(cursor.options, R);
    if (gramp[R].siblingDeleted) gramp[R].siblingDeleted(cursor.options, L);
  };
  _.startSelection = function() {
    var anticursor = this.anticursor = Point.copy(this);
    var ancestors = anticursor.ancestors = {}; // a map from each ancestor of
      // the anticursor, to its child that is also an ancestor; in other words,
      // the anticursor's ancestor chain in reverse order
    for (var ancestor = anticursor; ancestor.parent; ancestor = ancestor.parent) {
      ancestors[ancestor.parent.id] = ancestor;
    }
  };
  _.endSelection = function() {
    delete this.anticursor;
  };
  _.select = function() {
    var anticursor = this.anticursor;
    if (this[L] === anticursor[L] && this.parent === anticursor.parent) return false;

    // Find the lowest common ancestor (`lca`), and the ancestor of the cursor
    // whose parent is the LCA (which'll be an end of the selection fragment).
    for (var ancestor = this; ancestor.parent; ancestor = ancestor.parent) {
      if (ancestor.parent.id in anticursor.ancestors) {
        var lca = ancestor.parent;
        break;
      }
    }
    pray('cursor and anticursor in the same tree', lca);
    // The cursor and the anticursor should be in the same tree, because the
    // mousemove handler attached to the document, unlike the one attached to
    // the root HTML DOM element, doesn't try to get the math tree node of the
    // mousemove target, and Cursor::seek() based solely on coordinates stays
    // within the tree of `this` cursor's root.

    // The other end of the selection fragment, the ancestor of the anticursor
    // whose parent is the LCA.
    var antiAncestor = anticursor.ancestors[lca.id];

    // Now we have two either Nodes or Points, guaranteed to have a common
    // parent and guaranteed that if both are Points, they are not the same,
    // and we have to figure out which is the left end and which the right end
    // of the selection.
    var leftEnd, rightEnd, dir = R;

    // This is an extremely subtle algorithm.
    // As a special case, `ancestor` could be a Point and `antiAncestor` a Node
    // immediately to `ancestor`'s left.
    // In all other cases,
    // - both Nodes
    // - `ancestor` a Point and `antiAncestor` a Node
    // - `ancestor` a Node and `antiAncestor` a Point
    // `antiAncestor[R] === rightward[R]` for some `rightward` that is
    // `ancestor` or to its right, if and only if `antiAncestor` is to
    // the right of `ancestor`.
    if (ancestor[L] !== antiAncestor) {
      for (var rightward = ancestor; rightward; rightward = rightward[R]) {
        if (rightward[R] === antiAncestor[R]) {
          dir = L;
          leftEnd = ancestor;
          rightEnd = antiAncestor;
          break;
        }
      }
    }
    if (dir === R) {
      leftEnd = antiAncestor;
      rightEnd = ancestor;
    }

    // only want to select Nodes up to Points, can't select Points themselves
    if (leftEnd instanceof Point) leftEnd = leftEnd[R];
    if (rightEnd instanceof Point) rightEnd = rightEnd[L];

    this.hide().selection = lca.selectChildren(leftEnd, rightEnd);
    this.insDirOf(dir, this.selection.ends[dir]);
    this.selectionChanged();
    return true;
  };

  _.clearSelection = function() {
    if (this.selection) {
      this.selection.clear();
      delete this.selection;
      this.selectionChanged();
    }
    return this;
  };
  _.deleteSelection = function() {
    if (!this.selection) return;

    this[L] = this.selection.ends[L][L];
    this[R] = this.selection.ends[R][R];
    this.selection.remove();
    this.selectionChanged();
    delete this.selection;
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
  _.depth = function() {
    var node = this;
    var depth = 0;
    while (node = node.parent) {
      depth += (node instanceof MathBlock) ? 1 : 0;
    }
    return depth;
  };
  _.isTooDeep = function(offset) {
    if (this.options.maxDepth !== undefined) {
      return this.depth() + (offset || 0) > this.options.maxDepth;
    }
  };
});

var Selection = P(Fragment, function(_, super_) {
  _.init = function() {
    super_.init.apply(this, arguments);
    this.jQ = this.jQ.wrapAll('<span class="mq-selection"></span>').parent();
      //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  };
  _.adopt = function() {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return super_.adopt.apply(this, arguments);
  };
  _.clear = function() {
    // using the browser's native .childNodes property so that we
    // don't discard text nodes.
    this.jQ.replaceWith(this.jQ[0].childNodes);
    return this;
  };
  _.join = function(methodName) {
    return this.fold('', function(fold, child) {
      return fold + child[methodName]();
    });
  };
});
