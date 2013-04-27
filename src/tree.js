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
function jQinsDirOf(dir, el, target) {
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

  _.init = function(parent, leftward, rightward) {
    this.parent = parent;
    this[L] = leftward;
    this[R] = rightward;
  };

  this.copy = function(pt) {
    return Point(pt.parent, pt[L], pt[R]);
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

    this.ends = {};
    this.ends[L] = 0;
    this.ends[R] = 0;
  };

  _.dispose = function() { delete Node.byId[this.id]; };

  _.toString = function() { return '{{ MathQuill Node #'+this.id+' }}'; };

  _.jQ = $();
  _.jQadd = function(jQ) { return this.jQ = this.jQ.add(jQ); };
  _.jQize = function() {
    // jQuery-ifies this.html() and links up the .jQ of all corresponding Nodes
    var jQ = $(this.html());
    jQ.find('*').andSelf().each(function() {
      var jQ = $(this),
        cmdId = jQ.attr('mathquill-command-id'),
        blockId = jQ.attr('mathquill-block-id');
      if (cmdId) Node.byId[cmdId].jQadd(jQ);
      if (blockId) Node.byId[blockId].jQadd(jQ);
    });
    return jQ;
  };

  _.createDir = function(dir, cursor) {
    prayDirection(dir);
    var node = this;
    node.jQize();
    jQinsDirOf(dir, node.jQ, cursor.jQ);
    cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]);
    return node;
  };
  _.createBefore = function(el) { return this.createDir(L, el); };

  _.respace = noop;

  _.bubble = iterator(function(yield) {
    for (var ancestor = this; ancestor; ancestor = ancestor.parent) {
      var result = yield(ancestor);
      if (result === false) break;
    }

    return this;
  });

  _.postOrder = iterator(function(yield) {
    (function recurse(descendant) {
      descendant.eachChild(recurse);
      yield(descendant);
    })(this);

    return this;
  });

  _.children = function() {
    return Fragment(this.ends[L], this.ends[R]);
  };

  _.eachChild = function() {
    var children = this.children();
    children.each.apply(children, arguments);
    return this;
  };

  _.foldChildren = function(fold, fn) {
    return this.children().fold(fold, fn);
  };

  _.adopt = function(parent, leftward, rightward) {
    Fragment(this, this).adopt(parent, leftward, rightward);
    return this;
  };

  _.disown = function() {
    Fragment(this, this).disown();
    return this;
  };

  _.remove = function() {
    this.jQ.remove();
    this.postOrder('dispose');
    return this.disown();
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
  _.init = function(leftEnd, rightEnd) {
    pray('no half-empty fragments', !leftEnd === !rightEnd);

    this.ends = {};

    if (!leftEnd) return;

    pray('left end node is passed to Fragment', leftEnd instanceof Node);
    pray('right end node is passed to Fragment', rightEnd instanceof Node);
    pray('leftEnd and rightEnd have the same parent',
         leftEnd.parent === rightEnd.parent);

    this.ends[L] = leftEnd;
    this.ends[R] = rightEnd;

    this.jQ = this.fold(this.jQ, function(jQ, el) { return jQ.add(el.jQ); });
  };
  _.jQ = $();

  function prayWellFormed(parent, leftward, rightward) {
    pray('a parent is always present', parent);
    pray('leftward is properly set up', (function() {
      // either it's empty and `rightward` is the left end child (possibly empty)
      if (!leftward) return parent.ends[L] === rightward;

      // or it's there and its [R] and parent are properly set up
      return leftward[R] === rightward && leftward.parent === parent;
    })());

    pray('rightward is properly set up', (function() {
      // either it's empty and `leftward` is the right end child (possibly empty)
      if (!rightward) return parent.ends[R] === leftward;

      // or it's there and its [L] and parent are properly set up
      return rightward[L] === leftward && rightward.parent === parent;
    })());
  }

  _.adopt = function(parent, leftward, rightward) {
    prayWellFormed(parent, leftward, rightward);

    var self = this;
    self.disowned = false;

    var leftEnd = self.ends[L];
    if (!leftEnd) return this;

    var rightEnd = self.ends[R];

    if (leftward) {
      // NB: this is handled in the ::each() block
      // leftward[R] = leftEnd
    } else {
      parent.ends[L] = leftEnd;
    }

    if (rightward) {
      rightward[L] = rightEnd;
    } else {
      parent.ends[R] = rightEnd;
    }

    self.ends[R][R] = rightward;

    self.each(function(el) {
      el[L] = leftward;
      el.parent = parent;
      if (leftward) leftward[R] = el;

      leftward = el;
    });

    return self;
  };

  _.disown = function() {
    var self = this;
    var leftEnd = self.ends[L];

    // guard for empty and already-disowned fragments
    if (!leftEnd || self.disowned) return self;

    self.disowned = true;

    var rightEnd = self.ends[R]
    var parent = leftEnd.parent;

    prayWellFormed(parent, leftEnd[L], leftEnd);
    prayWellFormed(parent, rightEnd, rightEnd[R]);

    if (leftEnd[L]) {
      leftEnd[L][R] = rightEnd[R];
    } else {
      parent.ends[L] = rightEnd[R];
    }

    if (rightEnd[R]) {
      rightEnd[R][L] = leftEnd[L];
    } else {
      parent.ends[R] = leftEnd[L];
    }

    return self;
  };

  _.remove = function() {
    this.jQ.remove();
    this.each('postOrder', 'dispose');
    return this.disown();
  };

  _.each = iterator(function(yield) {
    var self = this;
    var el = self.ends[L];
    if (!el) return self;

    for (; el !== self.ends[R][R]; el = el[R]) {
      var result = yield(el);
      if (result === false) break;
    }

    return self;
  });

  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });

    return fold;
  };

  // create and return the Fragment between Point A and Point B, or if they
  // don't share a parent, between the ancestor of A and the ancestor of B
  // who share a common parent (which would be the lowest common ancestor (LCA)
  // of A and B)
  // There must exist an LCA, i.e., A and B must be in the same tree, and A
  // and B must not be the same Point.
  this.between = function(A, B) {
    pray('A and B are not the same Point',
      A.parent !== B.parent || A[L] !== B[L] || A[R] !== B[R]
    );

    var ancA = A; // an ancestor of A
    var ancB = B; // an ancestor of B
    var ancMapA = {}; // a map from the id of each ancestor of A visited
    // so far, to the child of that ancestor who is also an ancestor of B, e.g.
    // the LCA's id maps to the ancestor of the cursor whose parent is the LCA
    var ancMapB = {}; // a map of the castle and school grounds magically
    // displaying the current location of everyone within the covered area,
    // activated by pointing one's wand at it and saying "I solemnly swear
    // that I am up to no good".
    // What do you mean, you expected it to be the same as ancMapA, but
    // ancestors of B instead? That's a complete non sequitur.

    do {
      ancMapA[ancA.parent.id] = ancA;
      ancMapB[ancB.parent.id] = ancB;

      if (ancB.parent.id in ancMapA) {
        ancA = ancMapA[ancB.parent.id];
        break;
      }
      if (ancA.parent.id in ancMapB) {
        ancB = ancMapB[ancA.parent.id];
        break;
      }

      if (ancA.parent) ancA = ancA.parent;
      if (ancB.parent) ancB = ancB.parent;
    } while (ancA.parent || ancB.parent);
    // the only way for this condition to fail is if A and B are in separate
    // trees, which should be impossible, but infinite loops must never happen,
    // even under error conditions.

    pray('A and B are in the same tree', ancA.parent || ancB.parent);

    // Now we have two either Nodes or Points, guaranteed to have a common
    // parent and guaranteed that if both are Points, they are not the same,
    // and we have to figure out which is on the left and which on the right
    // of the selection.
    var left, right;

    // This is an extremely subtle algorithm.
    // As a special case, ancA could be a Point and ancB a Node immediately
    // to ancA's left.
    // In all other cases,
    // - both Nodes
    // - ancA a Point and ancB a Node
    // - ancA a Node and ancB a Point
    // ancB[R] === rightward[R] for some rightward that is ancA or to its
    // right if and only if anticursorA is to the right of cursorA.
    if (ancA[L] !== ancB) {
      for (var rightward = ancA; rightward; rightward = rightward[R]) {
        if (rightward[R] === ancB[R]) {
          left = ancA;
          right = ancB;
          break;
        }
      }
    }
    if (!left) {
      left = ancB;
      right = ancA;
    }

    // only want to select Nodes up to Points, can't select Points themselves
    if (left instanceof Point) left = left[R];
    if (right instanceof Point) right = right[L];

    return Fragment(left, right);
  };
});
