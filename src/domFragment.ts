class DOMFragment {
  private ends: Ends<ChildNode> | undefined;

  static create(
    first: ChildNode | undefined,
    last: ChildNode | undefined
  ): DOMFragment {
    pray('No half-empty DOMFragments', !!first === !!last);
    if (first && last) {
      let reached = false;
      for (
        let node: ChildNode | null = first || null;
        node;
        node = node.nextSibling
      ) {
        if (node === last) {
          reached = true;
          break;
        }
      }
      pray('last is a forward sibling of first', reached);
    }
    return new DOMFragment(first, last);
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
    for (
      let node: ChildNode | null = this.ends[L];
      node;
      node = node.nextSibling!
    ) {
      cb(node);
      if (node === this.ends[R]) break;
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
}

function jQToDOMFragment(jQ: $) {
  return DOMFragment.create(jQ[0], jQ[jQ.length - 1]);
}
