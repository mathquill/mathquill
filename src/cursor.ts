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
  constructor(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
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
  private readonly cursorElement: HTMLElement = h(
    'span',
    { class: 'mq-cursor' },
    [h.text(U_ZERO_WIDTH_SPACE)]
  );
  private _domFrag = domFrag();
  selection: MQSelection | undefined;
  intervalId: number;
  anticursor: Anticursor | undefined;

  constructor(
    initParent: MQNode,
    options: CursorOptions,
    controller: Controller
  ) {
    super(initParent, 0, 0);
    this.controller = controller;
    this.options = options;

    this.setDOMFrag(domFrag(this.cursorElement));

    //closured for setInterval
    this.blink = () => {
      domFrag(this.cursorElement).toggleClass('mq-blink');
    };
  }

  setDOMFrag(frag: DOMFragment) {
    this._domFrag = frag;
    return this;
  }

  domFrag(): DOMFragment {
    return this._domFrag;
  }

  show() {
    domFrag(this.cursorElement).removeClass('mq-blink');
    this.setDOMFrag(domFrag(this.cursorElement));
    if (this.intervalId)
      //already was shown, just restart interval
      clearInterval(this.intervalId);
    else {
      //was hidden and detached, insert this.jQ back into HTML DOM
      const right = this[R];
      if (right) {
        var selection = this.selection;
        if (selection && selection.getEnd(L)[L] === this[L])
          this.domFrag().insertBefore(selection.domFrag());
        else this.domFrag().insertBefore(right.domFrag());
      } else this.domFrag().appendTo(this.parent.domFrag().oneElement());
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  }
  hide() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = 0;
    this.domFrag().detach();
    this.setDOMFrag(domFrag());
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
    this.domFrag().insDirOf(dir, el.domFrag());
    this.withDirInsertAt(dir, el.parent, el[dir], el);
    this.parent.domFrag().addClass('mq-hasCursor');
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
    this.domFrag().insAtDirEnd(dir, el.domFrag().oneElement());
    this.withDirInsertAt(dir, el, 0, el.getEnd(dir));
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
      var clientX = self.getBoundingClientRectWithoutMargin().left;
      to.seek(clientX, self);
    }
    self.controller.aria.queue(to, true);
  }
  getBoundingClientRectWithoutMargin() {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    const frag = this.domFrag();
    frag.removeClass('mq-cursor');
    const { left, right } = getBoundingClientRect(frag.oneElement());
    frag.addClass('mq-cursor');
    return {
      left,
      right,
    };
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
          cousin.domFrag().insertBefore(gramp.domFrag());
          return true;
        });

      leftward = uncle.getEnd(R);
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
            this[R] = newParent.getEnd(L);
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

    gramp.domFrag().remove();

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

    var insEl = this.selection!.getEnd(dir);
    this.insDirOf(dir, insEl);
    this.selectionChanged();
    return true;
  }
  resetToEnd(controller: ControllerBase) {
    this.clearSelection();
    var root = controller.root;
    this[R] = 0;
    this[L] = root.getEnd(R);
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

    this[L] = selection.getEnd(L)[L];
    this[R] = selection.getEnd(R)[R];
    selection.remove();
    this.selectionChanged();
    delete this.selection;
  }
  replaceSelection() {
    var seln = this.selection;
    if (seln) {
      this[L] = seln.getEnd(L)[L];
      this[R] = seln.getEnd(R)[R];
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
  protected ends: Ends<MQNode>;
  private _el: HTMLElement | undefined;

  constructor(withDir: MQNode, oppDir: MQNode, dir?: Direction) {
    super(withDir, oppDir, dir);
    this._el = h('span', { class: 'mq-selection' });
    this.getDOMFragFromEnds().wrapAll(this._el);
  }

  isCleared() {
    return this._el === undefined;
  }

  domFrag() {
    return this.isCleared() ? this.getDOMFragFromEnds() : domFrag(this._el);
  }

  setEnds(ends: Ends<MQNode>) {
    pray('Selection ends are never empty', ends[L] && ends[R]);
    this.ends = ends;
  }

  getEnd(dir: Direction): MQNode {
    return this.ends[dir];
  }

  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
    this.clear();
    return super.adopt(parent, leftward, rightward);
  }
  clear() {
    // NOTE it's important here that DOMFragment::children includes all
    // child nodes (including Text nodes), and not just Element nodes.
    // This makes it more similar to the native DOM childNodes property
    // and jQuery's .collection() method than jQuery's .children() method
    const childFrag = this.getDOMFragFromEnds();
    this.domFrag().replaceWith(childFrag);
    this._el = undefined;
    return this;
  }
  join(methodName: JoinMethod, separator: string = ''): string {
    return this.fold('', function (fold, child) {
      return fold + separator + child[methodName]();
    });
  }
}
