/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
class Anticursor extends Point {
  ancestors: Record<string | number, Anticursor | MQNode | undefined> = {};
  constructor(parent: MQNode, leftward?: NodeRef, rightward?: NodeRef) {
    super(parent, leftward, rightward);
  }

  static fromCursor(cursor: Cursor) {
    return new Anticursor(cursor.parent, cursor[L], cursor[R]);
  }
}

class Cursor extends Point {
  controller: Controller;
  parent: MQNode;
  options: CursorOptions;
  /** Slightly more than just a "cache", this remembers the cursor's position in each block node, so that we can return to the right
   * point in that node when moving up and down among blocks.
   */
  upDownCache: Record<number | string, Point | undefined> = {};
  blink: () => void;
  _jQ: $;
  jQ: $;
  selection: MQSelection | undefined;
  intervalId: number;
  anticursor: Anticursor | undefined;

  constructor(
    initParent: MQNode,
    options: CursorOptions,
    controller: Controller
  ) {
    super(initParent);
    this.controller = controller;
    this.options = options;

    var jQ = (this.jQ = this._jQ = $('<span class="mq-cursor">&#8203;</span>'));
    //closured for setInterval
    this.blink = function () {
      jQ.toggleClass('mq-blink');
    };
  }

  show() {
    this.jQ = this._jQ.removeClass('mq-blink');
    if (this.intervalId)
      //already was shown, just restart interval
      clearInterval(this.intervalId);
    else {
      //was hidden and detached, insert this.jQ back into HTML DOM
      if (this[R]) {
        var selection = this.selection;
        if (selection && (selection.ends[L] as MQNode)[L] === this[L])
          this.jQ.insertBefore(selection.jQ);
        else this.jQ.insertBefore((this[R] as MQNode).jQ.first());
      } else this.jQ.appendTo(this.parent.jQ);
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  }
  hide() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = 0;
    this.jQ.detach();
    this.jQ = $();
    return this;
  }

  withDirInsertAt(
    dir: Direction,
    parent: MQNode,
    withDir: NodeRef,
    oppDir: NodeRef
  ) {
    var oldParent = this.parent;
    this.parent = parent;
    this[dir as Direction] = withDir;
    this[-dir as Direction] = oppDir;
    // by contract, .blur() is called after all has been said and done
    // and the cursor has actually been moved
    // FIXME pass cursor to .blur() so text can fix cursor pointers when removing itself
    if (oldParent !== parent && oldParent.blur) oldParent.blur(this);
  }
  /** Place the cursor before or after `el`, according the side specified by `dir`. */
  insDirOf(dir: Direction, el: MQNode) {
    prayDirection(dir);
    this.jQ.insDirOf(dir, el.jQ);
    this.withDirInsertAt(dir, el.parent, el[dir], el);
    this.parent.jQ.addClass('mq-hasCursor');
    return this;
  }
  insLeftOf(el: MQNode) {
    return this.insDirOf(L, el);
  }
  insRightOf(el: MQNode) {
    return this.insDirOf(R, el);
  }

  /** Place the cursor inside `el` at either the left or right end, according the side specified by `dir`. */
  insAtDirEnd(dir: Direction, el: MQNode) {
    prayDirection(dir);
    this.jQ.insAtDirEnd(dir, el.jQ);
    this.withDirInsertAt(dir, el, 0, el.ends[dir]);
    el.focus();
    return this;
  }
  insAtLeftEnd(el: MQNode) {
    return this.insAtDirEnd(L, el);
  }
  insAtRightEnd(el: MQNode) {
    return this.insAtDirEnd(R, el);
  }

  /**
   * jump up or down from one block Node to another:
   * - cache the current Point in the node we're jumping from
   * - check if there's a Point in it cached for the node we're jumping to
   *   + if so put the cursor there,
   *   + if not seek a position in the node that is horizontally closest to
   *     the cursor's current position
   */
  jumpUpDown(from: MQNode, to: MQNode) {
    var self = this;
    self.upDownCache[from.id] = Point.copy(self);
    var cached = self.upDownCache[to.id];
    if (cached) {
      var cachedR = cached[R];
      if (cachedR) {
        self.insLeftOf(cachedR);
      } else {
        self.insAtRightEnd(cached.parent);
      }
    } else {
      var pageX = self.offset().left;
      to.seek(pageX, self);
    }
    self.controller.aria.queue(to, true);
  }
  offset() {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    var self = this,
      offset = self.jQ.removeClass('mq-cursor').offset();
    self.jQ.addClass('mq-cursor');
    return offset;
  }
  unwrapGramp() {
    var gramp = this.parent.parent;
    var greatgramp = gramp.parent;
    var rightward = gramp[R];
    var cursor = this;

    var leftward = gramp[L];
    gramp.disown().eachChild(function (uncle) {
      if (uncle.isEmpty()) return true;

      uncle
        .children()
        .adopt(greatgramp, leftward, rightward)
        .each(function (cousin) {
          cousin.jQ.insertBefore(gramp.jQ.first());
          return true;
        });

      leftward = uncle.ends[R];
      return true;
    });

    if (!this[R]) {
      //then find something to be rightward to insLeftOf
      var thisL = this[L];
      if (thisL) this[R] = thisL[R];
      else {
        while (!this[R]) {
          var newParent = this.parent[R];
          if (newParent) {
            this.parent = newParent;
            this[R] = newParent.ends[L];
          } else {
            this[R] = gramp[R];
            this.parent = greatgramp;
            break;
          }
        }
      }
    }

    var thisR = this[R];
    if (thisR) this.insLeftOf(thisR);
    else this.insAtRightEnd(greatgramp);

    gramp.jQ.remove();

    var grampL = gramp[L];
    var grampR = gramp[R];
    if (grampL) grampL.siblingDeleted(cursor.options, R);
    if (grampR) grampR.siblingDeleted(cursor.options, L);
  }
  startSelection() {
    var anticursor = (this.anticursor = Anticursor.fromCursor(this));
    var ancestors = anticursor.ancestors;

    for (
      var ancestor: MQNode | Anticursor = anticursor;
      ancestor.parent;
      ancestor = ancestor.parent
    ) {
      ancestors[ancestor.parent.id] = ancestor;
    }
  }
  endSelection() {
    delete this.anticursor;
  }
  select() {
    var _lca;
    var anticursor = this.anticursor!;
    if (this[L] === anticursor[L] && this.parent === anticursor.parent)
      return false;

    // Find the lowest common ancestor (`lca`), and the ancestor of the cursor
    // whose parent is the LCA (which'll be an end of the selection fragment).
    for (
      var ancestor: MQNode | Point | undefined = this;
      ancestor.parent;
      ancestor = ancestor.parent
    ) {
      if (ancestor.parent.id in anticursor.ancestors) {
        _lca = ancestor.parent;
        break;
      }
    }
    pray('cursor and anticursor in the same tree', _lca);
    var lca = _lca as MQNode;

    // The cursor and the anticursor should be in the same tree, because the
    // mousemove handler attached to the document, unlike the one attached to
    // the root HTML DOM element, doesn't try to get the math tree node of the
    // mousemove target, and Cursor::seek() based solely on coordinates stays
    // within the tree of `this` cursor's root.

    // The other end of the selection fragment, the ancestor of the anticursor
    // whose parent is the LCA.
    var antiAncestor = anticursor.ancestors[lca.id] as MQNode;

    // Now we have two either Nodes or Points, guaranteed to have a common
    // parent and guaranteed that if both are Points, they are not the same,
    // and we have to figure out which is the left end and which the right end
    // of the selection.
    var leftEnd,
      rightEnd,
      dir: Direction = R;

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
      for (
        var rightward: NodeRef | Point | undefined = ancestor;
        rightward;
        rightward = rightward[R]
      ) {
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

    this.hide().selection = lca.selectChildren(
      leftEnd as MQNode,
      rightEnd as MQNode
    );

    var insEl = this.selection!.ends[dir] as MQNode;
    this.insDirOf(dir, insEl);
    this.selectionChanged();
    return true;
  }
  resetToEnd(controller: ControllerBase) {
    this.clearSelection();
    var root = controller.root;
    this[R] = 0;
    this[L] = root.ends[R];
    this.parent = root;
  }
  clearSelection() {
    if (this.selection) {
      this.selection.clear();
      delete this.selection;
      this.selectionChanged();
    }
    return this;
  }
  deleteSelection() {
    var selection = this.selection;
    if (!selection) return;

    this[L] = (selection.ends[L] as MQNode)[L];
    this[R] = (selection.ends[R] as MQNode)[R];
    selection.remove();
    this.selectionChanged();
    delete this.selection;
  }
  replaceSelection() {
    var seln = this.selection;
    if (seln) {
      this[L] = (seln.ends[L] as MQNode)[L];
      this[R] = (seln.ends[R] as MQNode)[R];
      delete this.selection;
    }
    return seln;
  }
  depth() {
    var node: MQNode | Point = this;
    var depth = 0;
    while ((node = node.parent)) {
      depth += node instanceof MathBlock ? 1 : 0;
    }
    return depth;
  }
  isTooDeep(offset?: number) {
    if (this.options.maxDepth !== undefined) {
      return this.depth() + (offset || 0) > this.options.maxDepth;
    } else {
      return false;
    }
  }

  // can be overridden
  selectionChanged() {}
}
class MQSelection extends Fragment {
  constructor(withDir: MQNode, oppDir: MQNode, dir?: Direction) {
    super(withDir, oppDir, dir);

    this.jQ = this.jQ.wrapAll('<span class="mq-selection"></span>').parent();
    //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  }
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
    this.jQ.replaceWith((this.jQ = this.jQ.children()));
    return super.adopt(parent, leftward, rightward);
  }
  clear() {
    // using the browser's native .childNodes property so that we
    // don't discard text nodes.
    this.jQ.replaceWith(this.jQ[0].childNodes);
    return this;
  }
  join(methodName: JoinMethod, separator: string = ''): string {
    return this.fold('', function (fold, child) {
      return fold + separator + child[methodName]();
    });
  }
}
