/*************************************************
 * Base classes of the MathQuill virtual DOM tree
 *
 * Only doing tree node manipulation via these
 * adopt/ disown methods guarantees well-formedness
 * of the tree.
 ************************************************/

/**
 * MathQuill virtual-DOM tree-node abstract base class
 */
var Node = P(function(_) {
  _.left = 0;
  _.right = 0;
  _.parent = 0;
  _.leftmostChild = 0;
  _.rightmostChild = 0;

  _.children = function() {
    return Fragment(this.leftmostChild, this.rightmostChild);
  };

  _.eachChild = function(fn) {
    return this.children().each(fn);
  };

  _.foldChildren = function(fold, fn) {
    return this.children().fold(fold, fn);
  };

  _.adopt = function(parent, prev, next) {
    Fragment(this, this).adopt(parent, prev, next);
    return this;
  };

  _.disown = function() {
    Fragment(this, this).disown();
    return this;
  };
});

/**
 * An entity outside the virtual tree with one-way pointers (so it's only a
 * "view" of part of the tree, not an actual node/entity in the tree) that
 * delimits a doubly-linked list of sibling nodes.
 * It's like a fanfic love-child between HTML DOM DocumentFragment and the Range
 * classes: like DocumentFragment, its contents must be sibling nodes
 * (unlike Range, whose contents are arbitrary contiguous pieces of subtrees),
 * but like Range, it has only one-way pointers to its contents, its contents
 * have no reference to it and in fact may still be in the visible tree (unlike
 * DocumentFragment, whose contents must be detached from the visible tree
 * and have their 'parent' pointers set to the DocumentFragment).
 */
var Fragment = P(function(_) {
  _.leftmost = 0;
  _.rightmost = 0;

  _.init = function(first, last) {
    pray('no half-empty fragments', !first === !last);

    if (!first) return;

    pray('first node is passed to Fragment', first instanceof Node);
    pray('last node is passed to Fragment', last instanceof Node);
    pray('first and last have the same parent',
         first.parent === last.parent);

    this.leftmost = first;
    this.rightmost = last;
  };

  function prayWellFormed(parent, prev, next) {
    pray('a parent is always present', parent);
    pray('prev is properly set up', (function() {
      // either it's empty and next is the first child (possibly empty)
      if (!prev) return parent.leftmostChild === next;

      // or it's there and its next and parent are properly set up
      return prev.right === next && prev.parent === parent;
    })());

    pray('next is properly set up', (function() {
      // either it's empty and prev is the last child (possibly empty)
      if (!next) return parent.rightmostChild === prev;

      // or it's there and its next and parent are properly set up
      return next.left === prev && next.parent === parent;
    })());
  }

  _.adopt = function(parent, prev, next) {
    prayWellFormed(parent, prev, next);

    var self = this;
    self.disowned = false;

    var first = self.leftmost;
    if (!first) return this;

    var last = self.rightmost;

    if (prev) {
      // NB: this is handled in the ::each() block
      // prev.right = first
    } else {
      parent.leftmostChild = first;
    }

    if (next) {
      next.left = last;
    } else {
      parent.rightmostChild = last;
    }

    self.rightmost.right = next;

    self.each(function(el) {
      el.left = prev;
      el.parent = parent;
      if (prev) prev.right = el;

      prev = el;
    });

    return self;
  };

  _.disown = function() {
    var self = this;
    var first = self.leftmost;

    // guard for empty and already-disowned fragments
    if (!first || self.disowned) return self;

    self.disowned = true;

    var last = self.rightmost;
    var parent = first.parent;

    prayWellFormed(parent, first.left, first);
    prayWellFormed(parent, last, last.right);

    if (first.left) {
      first.left.right = last.right;
    } else {
      parent.leftmostChild = last.right;
    }

    if (last.right) {
      last.right.left = first.left;
    } else {
      parent.rightmostChild = first.left;
    }

    return self;
  };

  _.each = function(fn) {
    var self = this;
    var el = self.leftmost;
    if (!el) return self;

    for (;el !== self.rightmost.right; el = el.right) {
      if (fn.call(self, el) === false) break;
    }

    return self;
  };

  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });

    return fold;
  };
});
