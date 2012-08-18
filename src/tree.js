/*************************************************
 * Base classes of the MathQuill virtual DOM tree
 *
 * Only doing tree node manipulation via these
 * adopt/ disown methods guarantees well-formedness
 * of the tree.
 ************************************************/

// L = 'left'
// R = 'right'
//
// the contract is that they can be used as object properties
// and (-L) === R, and (-R) === L.
var L = -1;
var R = 1;

function prayDirection(dir) {
  pray('a direction was passed', dir === L || dir === R);
}

// directionalizable versions of common jQuery traversals
function jQinsertAdjacent(dir, el, target) {
  return (
    dir === L ?
    el.insertBefore(target) :
    el.insertAfter(target)
  );
}

function jQappendDir(dir, el, target) {
  return (
    dir === L ?
    el.prependTo(target) :
    el.appendTo(target)
  );
}

function jQgetExtreme(dir, el) {
  return (
    dir === L ?
    el.first() :
    el.last()
  )
}

var Point = P(function(_) {
  _.parent = 0;
  _[L] = 0;
  _[R] = 0;

  _.init = function(parent, prev, next) {
    this.parent = parent;
    this[L] = prev;
    this[R] = next;
  };
});

/**
 * MathQuill virtual-DOM tree-node abstract base class
 */
var Node = P(function(_) {
  _[L] = 0;
  _[R] = 0
  _.parent = 0;

  var id = 0;
  function uniqueNodeId() { return id += 1; }
  this.byId = {};

  _.init = function() {
    this.id = uniqueNodeId();
    Node.byId[this.id] = this;

    this.ch = {};
    this.ch[L] = 0;
    this.ch[R] = 0;
  };

  _.toString = function() { return '{{ MathQuill Node #'+this.id+' }}'; };

  _.children = function() {
    return Fragment(this.ch[L], this.ch[R]);
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
  _.init = function(first, last) {
    pray('no half-empty fragments', !first === !last);

    this.ends = {};

    if (!first) return;

    pray('first node is passed to Fragment', first instanceof Node);
    pray('last node is passed to Fragment', last instanceof Node);
    pray('first and last have the same parent',
         first.parent === last.parent);

    this.ends[L] = first;
    this.ends[R] = last;
  };

  function prayWellFormed(parent, prev, next) {
    pray('a parent is always present', parent);
    pray('prev is properly set up', (function() {
      // either it's empty and next is the first child (possibly empty)
      if (!prev) return parent.ch[L] === next;

      // or it's there and its next and parent are properly set up
      return prev[R] === next && prev.parent === parent;
    })());

    pray('next is properly set up', (function() {
      // either it's empty and prev is the last child (possibly empty)
      if (!next) return parent.ch[R] === prev;

      // or it's there and its next and parent are properly set up
      return next[L] === prev && next.parent === parent;
    })());
  }

  _.adopt = function(parent, prev, next) {
    prayWellFormed(parent, prev, next);

    var self = this;
    self.disowned = false;

    var first = self.ends[L];
    if (!first) return this;

    var last = self.ends[R];

    if (prev) {
      // NB: this is handled in the ::each() block
      // prev[R] = first
    } else {
      parent.ch[L] = first;
    }

    if (next) {
      next[L] = last;
    } else {
      parent.ch[R] = last;
    }

    self.ends[R][R] = next;

    self.each(function(el) {
      el[L] = prev;
      el.parent = parent;
      if (prev) prev[R] = el;

      prev = el;
    });

    return self;
  };

  _.disown = function() {
    var self = this;
    var first = self.ends[L];

    // guard for empty and already-disowned fragments
    if (!first || self.disowned) return self;

    self.disowned = true;

    var last = self.ends[R]
    var parent = first.parent;

    prayWellFormed(parent, first[L], first);
    prayWellFormed(parent, last, last[R]);

    if (first[L]) {
      first[L][R] = last[R];
    } else {
      parent.ch[L] = last[R];
    }

    if (last[R]) {
      last[R][L] = first[L];
    } else {
      parent.ch[R] = first[L];
    }

    return self;
  };

  _.each = function(fn) {
    var self = this;
    var el = self.ends[L];
    if (!el) return self;

    for (;el !== self.ends[R][R]; el = el[R]) {
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
