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

  each(cb: (el: ChildNode) => void): DOMFragment {
    if (!this.ends) return this;
    const stop = this.ends[R];
    for (let node: ChildNode = this.ends[L]; node; node = node.nextSibling!) {
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

  toJQ(): $ {
    return $(this.toArray() as HTMLElement[]);
  }

  insertBefore(sibling: DOMFragment) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;

    var parent = sibling.ends[L].parentNode!;
    pray('parent is defined', parent);
    let right = sibling.ends[L];
    const arr = this.toArray();
    for (let i = arr.length - 1; i >= 0; i--) {
      const el = arr[i];
      parent.insertBefore(el, right);
      right = el;
    }
    return new DOMFragment(this.ends[L], sibling.ends[R]);
  }

  insertAfter(sibling: DOMFragment) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;

    var parent = sibling.ends[L].parentNode!;
    pray('parent is defined', parent);
    let left = sibling.ends[R];
    const arr = this.toArray();
    for (const el of arr) {
      parent.insertBefore(el, left.nextSibling);
      left = el;
    }
    return new DOMFragment(sibling.ends[L], this.ends[R]);
  }
}

function jQToDOMFragment(jQ: $) {
  return DOMFragment.create(jQ[0], jQ[jQ.length - 1]);
}
