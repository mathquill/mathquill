class DOMFragment {
  private ends: Ends<ChildNode> | undefined;

  static create(
    first: ChildNode | undefined,
    last: ChildNode | undefined
  ): DOMFragment {
    pray('No half-empty DOMFragments', !!first === !!last);
    const out = new DOMFragment(first, last);
    let maybeLast: ChildNode | undefined;
    out.each((el) => (maybeLast = el));
    pray('last is a forward sibling of first', maybeLast === last);
    return out;
  }

  private constructor(
    first: ChildNode | undefined,
    last: ChildNode | undefined
  ) {
    if (!first || !last) return;
    this.ends = { [L]: first, [R]: last };
  }

  isEmpty() {
    this.ends === undefined;
  }

  one(): ChildNode {
    pray(
      'Fragment has a single node',
      this.ends && this.ends[L] === this.ends[R]
    );
    return this.ends[L] as ChildNode;
  }

  each(cb: (el: ChildNode) => void): DOMFragment {
    if (!this.ends) return this;
    const stop = this.ends[R];
    for (
      let node: ChildNode = this.ends[L], next: ChildNode;
      node;
      node = next
    ) {
      next = node.nextSibling!;
      cb(node);
      if (node === stop) break;
    }
    return this;
  }

  fold<T>(fold: T, cb: (fold: T, el: ChildNode) => T): T {
    if (!this.ends) return fold;
    this.each((el) => (fold = cb(fold, el)));
    return fold;
  }

  text() {
    return this.fold('', (fold, el) => fold + (el.textContent || ''));
  }

  toArray() {
    const accum: ChildNode[] = [];
    this.each((el) => accum.push(el));
    return accum;
  }

  toDocumentFragment() {
    const frag = document.createDocumentFragment();
    this.each((el) => frag.appendChild(el));
    return frag;
  }

  toJQ(): $ {
    return $(this.toArray() as HTMLElement[]);
  }

  insertBefore(sibling: DOMFragment) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;

    var parent = sibling.ends[L].parentNode!;
    pray('parent is defined', parent);
    parent.insertBefore(this.toDocumentFragment(), sibling.ends[L]);
    return new DOMFragment(this.ends[L], sibling.ends[R]);
  }

  insertAfter(sibling: DOMFragment) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;

    var parent = sibling.ends[L].parentNode!;
    pray('parent is defined', parent);
    parent.insertBefore(this.toDocumentFragment(), sibling.ends[R].nextSibling);
    return new DOMFragment(sibling.ends[L], this.ends[R]);
  }

  appendTo(el: ChildNode) {
    if (!this.ends) return this;
    el.appendChild(this.toDocumentFragment());
    return new DOMFragment(this.ends[L], this.ends[R]);
  }
}

function jQToDOMFragment(jQ: $) {
  return DOMFragment.create(jQ[0], jQ[jQ.length - 1]);
}
