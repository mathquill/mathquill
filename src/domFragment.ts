/**
 * A `DOMFragment` represents a contiguous span of sibling DOM Nodes,
 * which may include both Element nodes and other nodes like Text and
 * Comment nodes. A `DOMFragment` may represent zero or more nodes.
 *
 * `DOMFragments` are created using the `DOMFragment.create` factory
 * function, which is also aliased as `domFrag` for convenience.
 *
 * A `DOMFragment` simply holds references to nodes. It doesn't move or
 * mutate them in the way that the native `DocumentFragment` does.
 *
 * `DOMFragment` implements many of the same methods for manipulating a
 * collection of DOM elements that jQuery does, but it has some notable
 * differences:
 *
 * 1.  A jQuery collection can hold an arbitrary ordered set of DOM
 *     elements, but a `DOMFragment` can only hold a contiguous span of
 *     sibling nodes.
 * 2.  Some jQuery DOM manipulation methods like `insert{Before,After}`,
 *     `append`, `prepend`, `appendTo`, `prependTo`, etc. may insert
 *     several clones of a collection into different places in the DOM.
 *     `DOMFragment` never makes clones of DOM nodes--instead, when
 *     targeting multi-element fragments, it moves source nodes before
 *     or after the targeted fragment as appropriate without ever making
 *     more copies.
 * 3.  For methods like `.children()`, where it's likely to be a mistake
 *     to call the method on a fragment that doesn't contain exactly one
 *     node or element, `DOMFragment` will throw whereas jQuery will
 *     silently do something possibly unintended. Methods that assert
 *     are commented with the properties that they assert.
 *
 * Internally, `DOMFragment` holds immutable references to the left and
 * right end nodes (if the fragment is not empty). The other nodes are
 * represented implicitly through the sibling pointers of the DOM nodes
 * themselves. This means that it is possible to invalidate a
 * `DOMFragment` by moving one of its ends without moving the other in
 * such a way that they are no longer siblings. It is also possible to
 * change the contents of a `DOMFragment` by adding or removing DOM
 * nodes between its ends.
 */
class DOMFragment {
  private ends: Ends<Node> | undefined;

  /**
   * Returns a `DOMFragment` representing the contiguous span of sibling
   * DOM nodes betewen `first` and `last`. If only one element is
   * passed, creates a `DOMFragment` representing that single element.
   * If no elements are passed, creates and empty `DOMFragment`.
   *
   * If two elements are passed, asserts that the second element is a
   * forward sibling of the first element. Checking this invariant is
   * O(n) in the total number of nodes in the fragment
   */
  static create(
    first?: Node | undefined,
    last?: Node | undefined
  ): DOMFragment {
    if (arguments.length === 1) last = first;
    pray('No half-empty DOMFragments', !!first === !!last);
    const out = new DOMFragment(first, last);
    pray('last is a forward sibling of first', out.isValid());
    return out;
  }

  /**
   * Constructor is private to enforce that the invariant checks in
   * `create` are applied to outside callers. Internal methods are
   * allowed to use this constructor when they can guarantee they're
   * passing sibling nodes (such as children of a parent node).
   */
  private constructor(first?: Node, last?: Node) {
    if (arguments.length === 1) last = first;
    if (!first || !last) return;
    this.ends = { [L]: first, [R]: last };
  }

  isEmpty(): boolean {
    return this.ends === undefined;
  }

  isOneNode(): boolean {
    return !!(this.ends && this.ends[L] === this.ends[R]);
  }

  /**
   * Returns true if the fragment is empty or if its last node is equal
   * to its first node or is a forward sibling of its first node.
   *
   * DOMFragments may be invalidated if any of the nodes they contain
   * are moved or removed independently of the other nodes they contain.
   *
   * Note that this check visits each node in the fragment, so it is
   * O(n).
   */
  isValid(): boolean {
    if (!this.ends) return true;
    if (this.ends[L] === this.ends[R]) return true;
    let maybeLast: Node | undefined;
    this.eachNode((el) => (maybeLast = el));
    return maybeLast === this.ends[R];
  }

  /**
   * Return the first Node of this fragment. May be a a Node that is not
   * an Element such as a Text or Comment node.
   *
   * Asserts fragment is not empty.
   */
  firstNode() {
    pray('Fragment is not empty', this.ends);
    return this.ends[L];
  }

  /**
   * Return the last Node of this fragment. May be a a Node that is not
   * an Element such as a Text or Comment node.
   *
   * Asserts fragment is not empty.
   */
  lastNode() {
    pray('Fragment is not empty', this.ends);
    return this.ends[R];
  }

  /**
   * Return a fragment representing the children (including Text and
   * Comment nodes) of the node represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Node.
   *
   * Note, because this includes text and comment nodes, this is more
   * like jQuery's .contents() than jQuery's .children()
   */
  children() {
    const el = this.oneNode();
    const first = el.firstChild;
    const last = el.lastChild;
    return first && last ? new DOMFragment(first, last) : new DOMFragment();
  }

  /**
   * Return a new `DOMFragment` spanning this fragment and `sibling`
   * fragment. Does not perform any DOM operations.
   *
   * Asserts that `sibling` is either empty or a forward sibling of
   * this fragment that may share its first node with the last node of
   * this fragment
   */
  join(sibling: DOMFragment) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;

    // Check if sibling is actually a sibling of this span
    let found = false;
    let current: Node | null = this.ends[R].nextSibling;
    while (current) {
      if (current === sibling.ends[L]) {
        found = true;
        break;
      }
      current = current.nextSibling;
    }
    pray('sibling must be a forward DOM sibling of this fragment', found);

    return new DOMFragment(this.ends[L], sibling.ends[R]);
  }

  /**
   * Return the single DOM Node represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Node.
   */
  oneNode(): Node {
    pray(
      'Fragment has a single node',
      this.ends && this.ends[L] === this.ends[R]
    );
    return this.ends[L];
  }

  /**
   * Return the single DOM Element represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Node, and that node
   * is an Element node.
   */
  oneElement(): HTMLElement {
    const el = this.oneNode();
    pray('Node is an Element', el.nodeType === Node.ELEMENT_NODE);
    return el as HTMLElement;
  }

  /**
   * Return the single DOM Text node represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Node, and that node
   * is a Text node.
   */
  oneText(): Text {
    const el = this.oneNode();
    pray('Node is Text', el.nodeType === Node.TEXT_NODE);
    return el as Text;
  }

  /**
   * Calls callback sequentially with each node in this fragment.
   * Includes nodes that are not Elements, such as Text and Comment
   * nodes.
   */
  eachNode(cb: (el: Node) => void): DOMFragment {
    if (!this.ends) return this;
    const stop = this.ends[R];
    for (let node: Node = this.ends[L], next: Node; node; node = next) {
      // Note, this loop is organized in a slightly tricky way in order
      // cache "next" before calling the callback. This is done because
      // the callback could mutate node.nextSibling (e.g. by moving the
      // node to a documentFragment, like toDocumentFragment does).
      //
      // It's still possible to break this iteration by messing with
      // forward siblings of node in the callback, although it's
      // probably rare to want to do that. Perhaps this means "each" is
      // too dangerous to have as a public method.
      next = node.nextSibling!;
      cb(node);
      if (node === stop) break;
    }
    return this;
  }

  /**
   * Calls callback sequentially with each Element node in this
   * fragment. Skips nodes that are not Elements, such as Text and
   * Comment nodes.
   */
  eachElement(cb: (el: HTMLElement) => void): DOMFragment {
    this.eachNode((el) => {
      if (el.nodeType === Node.ELEMENT_NODE) cb(el as HTMLElement);
    });
    return this;
  }

  /**
   * Returns the concatenated text content of all of the nodes in the
   * fragment.
   */
  text() {
    let accum = '';
    this.eachNode((node) => {
      accum += node.textContent || '';
    });
    return accum;
  }

  /**
   * Returns an array of all the Nodes in this fragment, including nodes
   * that are not Element nodes such as Text and Comment nodes;
   */
  toNodeArray() {
    const accum: Node[] = [];
    this.eachNode((el) => accum.push(el));
    return accum;
  }

  /**
   * Returns an array of all the Element nodes in this fragment. The
   * result does not include nodes that are not Elements, such as Text
   * and Comment nodes.
   */
  toElementArray() {
    const accum: HTMLElement[] = [];
    this.eachElement((el) => accum.push(el));
    return accum;
  }

  /**
   * Moves all of the nodes in this fragment into a new DocumentFragment
   * and returns it. This includes Nodes that are not Elements such as
   * Text and Comment nodes.
   */
  toDocumentFragment() {
    const frag = document.createDocumentFragment();
    this.eachNode((el) => frag.appendChild(el));
    return frag;
  }

  /**
   * Insert all the nodes in this fragment into the DOM directly before
   * the first node of `sibling` fragment. If `sibling` is empty or does
   * not have a parent node, detaches this fragment from the document.
   *
   * Note that this behavior differs from jQuery if `sibling` is a
   * collection with multiple nodes. In that case, jQuery inserts this
   * collection before the first node in `sibling`, and then inserts a
   * clone of this collection before each additional node in the
   * `sibling` collection. DOMFragment only ever inserts this collection
   * before the first node of the sibling fragment, and never inserts
   * additional clones.
   */
  insertBefore(sibling: DOMFragment) {
    return this.insDirOf(L, sibling);
  }

  /**
   * Insert all the nodes in this fragment into the DOM directly after
   * the last node of `sibling` fragment. If `sibling` is empty or does
   * not have a parent node, detaches this fragment from the document.
   *
   * Note that this behavior differs from jQuery if `sibling` is a
   * collection with multiple nodes. In that case, jQuery inserts this
   * collection before the first node in `sibling`, and then inserts a
   * clone of this collection before each additional node in the
   * `sibling` collection. DOMFragment only ever inserts this collection
   * before the first node of the sibling fragment, and never inserts
   * additional clones.
   */
  insertAfter(sibling: DOMFragment) {
    return this.insDirOf(R, sibling);
  }

  /**
   * Append children to the node represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Element.
   */
  append(children: DOMFragment) {
    children.appendTo(this.oneElement());
    return this;
  }

  /**
   * Prepend children to the node represented by this fragment.
   *
   * Asserts that this fragment contains exactly one Element.
   */
  prepend(children: DOMFragment) {
    children.prependTo(this.oneElement());
    return this;
  }

  /**
   * Append all the nodes in this fragment to the children of `el`.
   */
  appendTo(el: HTMLElement) {
    return this.insAtDirEnd(R, el);
  }

  /**
   * Prepend all the nodes in this fragment to the children of `el`.
   */
  prependTo(el: HTMLElement) {
    return this.insAtDirEnd(L, el);
  }

  /**
   * Return a fragment containing the parent node of the nodes in this
   * fragment. Returns an empty fragment if this fragment is empty or
   * does not have a parent node.
   */
  parent() {
    if (!this.ends) return this;
    const parent = this.ends[L].parentNode;
    if (!parent) return new DOMFragment();
    return new DOMFragment(parent);
  }

  /**
   * Replace the children of `el` with the contents of this fragment,
   * and place `el` into the DOM at the previous location of this
   * fragment.
   */
  wrapAll(el: HTMLElement) {
    el.textContent = ''; // First empty the wrapping element
    if (!this.ends) return this;
    const parent = this.ends[L].parentNode;
    const next = this.ends[R].nextSibling;
    this.appendTo(el);
    if (parent) {
      parent.insertBefore(el, next);
    }
    return this;
  }

  /**
   * Replace this fragment with the fragment given by `children`. If
   * this fragment is empty or does not have a parent node, detaches
   * `children` from the document.
   *
   * Note that this behavior differs from jQuery if this is a collection
   * with multiple nodes. In that case, jQuery replaces the first
   * element of this collection with `children`, and then replaces each
   * additional element in this collection with a clone of `children`.
   * DOMFragment replaces this entire fragment with `children` and never
   * makes additional clones of `children`.
   */
  replaceWith(children: DOMFragment) {
    const rightEnd = this.ends?.[R];

    // Note: important to cache parent and nextSibling (if they exist)
    // before detaching this fragment from the document (which will
    // mutate its parent and sibling references)
    const parent = rightEnd?.parentNode;
    const nextSibling = rightEnd?.nextSibling;
    this.detach();
    // Note, this purposely detaches children from the document, even if
    // they can't be reinserted because this fragment is empty or has no
    // parent
    const childDocumentFragment = children.toDocumentFragment();
    if (!rightEnd || !parent) return this;
    parent.insertBefore(childDocumentFragment, nextSibling || null);
    return this;
  }

  /**
   * Return the nth Element node of this collection, or undefined if
   * there is no nth Element. Skips Nodes that are not Elements (e.g.
   * Text and Comment nodes).
   *
   * Analogous to jQuery's array indexing syntax, or jQuery's .get()
   * with positive arguments.
   */
  nthElement(n: number): HTMLElement | undefined {
    if (!this.ends) return undefined;
    if (n < 0 || n !== Math.floor(n)) return undefined;
    let current: Node | null = this.ends[L];
    while (current) {
      // Only count element nodes
      if (current.nodeType === Node.ELEMENT_NODE) {
        if (n <= 0) return current as HTMLElement;
        n -= 1;
      }
      if (current === this.ends[R]) return undefined;
      current = current.nextSibling;
    }
    return undefined;
  }

  /**
   * Return the first Element node of this fragment, or undefined if
   * the fragment is empty. Skips Nodes that are not Elements (e.g.
   * Text and Comment nodes).
   */
  firstElement() {
    return this.nthElement(0);
  }

  /**
   * Return the last Element node of this fragment, or undefined if
   * the fragment is empty. Skips Nodes that are not Elements (e.g.
   * Text and Comment nodes).
   */
  lastElement(): HTMLElement | undefined {
    if (!this.ends) return undefined;
    let current: Node | null = this.ends[R];
    while (current) {
      // Only count element nodes
      if (current.nodeType === Node.ELEMENT_NODE) {
        return current as HTMLElement;
      }
      if (current === this.ends[L]) return undefined;
      current = current.previousSibling;
    }
    return undefined;
  }

  /**
   * Return a new fragment holding the first Element node of this
   * fragment, or an empty fragment if this fragment is empty. Skips
   * Nodes that are not Elements (e.g. Text and Comment nodes).
   */
  first() {
    return new DOMFragment(this.firstElement());
  }

  /**
   * Return a new fragment holding the last Element node of this
   * fragment, or an empty fragment if this fragment is empty. Skips
   * Nodes that are not Elements (e.g. Text and Comment nodes).
   */
  last() {
    return new DOMFragment(this.lastElement());
  }

  /**
   * Return a new fragment holding the nth Element node of this
   * fragment, or an empty fragment if there is no nth node of this
   * fragment. Skips Nodes that are not Elements (e.g. Text and Comment
   * nodes).
   */
  eq(n: number) {
    return new DOMFragment(this.nthElement(n));
  }

  /**
   * Return a new fragment beginning with the nth Element node of this
   * fragment, and ending with the same end as this fragment, or an
   * empty fragment if there is no nth node in this fragment. Skips
   * Nodes that are not Elements (e.g. Text and Comment nodes).
   */
  slice(n: number) {
    // Note, would be reasonable to extend this to take a second
    // argument if we ever find we need this
    if (!this.ends) return this;
    const el = this.nthElement(n);
    if (!el) return new DOMFragment();
    return new DOMFragment(el, this.ends[R]);
  }

  /**
   * Return a new fragment containing the next Element after the Node
   * represented by this fragment, or an empty fragment if there is no
   * next Element. Skips Nodes that are not Elements (e.g. Text and
   * Comment nodes).
   *
   * Asserts that this fragment contains exactly one Node.
   */
  next() {
    let current: Node | null = this.oneNode();
    while (current) {
      current = current.nextSibling;
      if (current && current.nodeType === Node.ELEMENT_NODE)
        return new DOMFragment(current);
    }
    return new DOMFragment();
  }

  /**
   * Return a new fragment containing the previousElement after the Node
   * represented by this fragment, or an empty fragment if there is no
   * previous Element. Skips Nodes that are not Elements (e.g. Text and
   * Comment nodes).
   *
   * Asserts that this fragment contains exactly one Node.
   */
  prev() {
    let current: Node | null = this.oneNode();
    while (current) {
      current = current.previousSibling;
      if (current && current.nodeType === Node.ELEMENT_NODE)
        return new DOMFragment(current);
    }
    return new DOMFragment();
  }

  /**
   * Remove all children of every Element Node in the fragment. Skips
   * Nodes that are not Elements (e.g. Text and Comment nodes).
   */
  empty() {
    // TODO the corresponding jQuery methods clean up some internal
    // references before removing elements from the DOM. That won't
    // matter once jQuery is totally gone, but until then, this may
    // introduce memory leaks
    this.eachElement((el) => {
      el.textContent = '';
    });
    return this;
  }

  /**
   * Remove every node in the fragment from the DOM.
   *
   * Implemented by moving every node in the fragment into a new
   * document fragment in order to preserve the sibling relationships
   * of the removed element. If you want to get access to this document
   * fragment, use `.toDocumentFragment()` instead.
   */
  remove() {
    // TODO the corresponding jQuery methods clean up some internal
    // references before removing elements from the DOM. That won't
    // matter once jQuery is totally gone, but until then, this may
    // introduce memory leaks

    // Note, removing the elements by moving them to a document fragment
    // because this way their sibling references stay intact. This is
    // important if we want to reattach them somewhere else later
    this.toDocumentFragment();
    return this;
  }

  /**
   * Remove every node in the fragment from the DOM. Alias of remove.
   *
   * Implemented by moving every node in the fragment into a new
   * document fragment in order to preserve the sibling relationships
   * of the removed element. If you want to get access to this document
   * fragment, use `.toDocumentFragment()` instead.
   *
   * Note: jQuery makes a distinction between detach() and remove().
   * remove() cleans up internal references, and detach() does not.
   */
  detach() {
    // In jQuery, detach() is similar to remove() but it does not clean
    // up internal references. Here they're aliases, but I'm leaving
    // this as a separate method for the moment to keep track of where
    // mathquill did one vs the other.
    return this.remove();
  }

  /**
   * Insert this fragment either just before or just after `sibling`
   * fragment according to the direction specified by `dir`. If
   * `sibling` is empty or does not have a parent node, detaches this
   * fragment from the document.
   */
  insDirOf(dir: Direction, sibling: DOMFragment): DOMFragment {
    if (!this.ends) return this;
    const el = sibling.ends?.[dir];
    if (!el || !el.parentNode) return this.detach();
    _insDirOf(dir, el.parentNode, this.toDocumentFragment(), el);
    return this;
  }

  /**
   * Insert this fragment into `el` either at the beginning or end of
   * its children, according to the direction specified by `dir`.
   */
  insAtDirEnd(dir: Direction, el: HTMLElement): DOMFragment {
    if (!this.ends) return this;
    _insAtDirEnd(dir, this.toDocumentFragment(), el);
    return this;
  }

  /**
   * Return true if any element in this fragment has class `className`
   * and false otherwise.
   */
  hasClass(className: string): boolean {
    let out = false;
    this.eachElement((el) => {
      if (el.classList.contains(className)) out = true;
    });
    return out;
  }

  /**
   * Add each class in space separated list of classes given by
   * `classNames` to each element in this fragment.
   */
  addClass(classNames: string) {
    for (const className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.add(className);
      });
    }
    return this;
  }

  /**
   * Remove each class in space separated list of classes given by
   * `classNames` from each element in this fragment.
   */
  removeClass(classNames: string) {
    for (const className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.remove(className);
      });
    }
    return this;
  }

  /**
   * Toggle each class in space separated list of classes given by
   * `classNames` on each element in this fragment.
   *
   * If second arg `on` is given as `true`, always toggle classes on.
   * If second arg `on` is passed as `false`, always toggle classes off.
   */
  toggleClass(classNames: string, on?: boolean) {
    if (on === true) return this.addClass(classNames);
    if (on === false) return this.removeClass(classNames);
    for (const className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.toggle(className);
      });
    }
    return this;
  }
}

const domFrag = DOMFragment.create;

/**
 * Insert `source` before or after `target` child of `parent` denending
 * on `dir`. Only intended to be used internally as a helper in this module
 */
function _insDirOf(
  dir: Direction,
  parent: ParentNode,
  source: Node | DocumentFragment,
  target: Node
) {
  parent.insertBefore(source, dir === L ? target : target.nextSibling);
}

/**
 * Insert `source` before or after `target` child of `parent` denending
 * on `dir`. Only intended to be used internally as a helper in this module
 */
function _insAtDirEnd(
  dir: Direction,
  source: Node | DocumentFragment,
  parent: ParentNode
) {
  if (dir === L) {
    parent.insertBefore(source, parent.firstChild);
  } else {
    parent.appendChild(source);
  }
}
