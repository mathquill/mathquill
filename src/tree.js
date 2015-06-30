/*************************************************
 * Base classes of edit tree-related objects
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
var L = MathQuill.L = -1;
var R = MathQuill.R = 1;

function prayDirection(dir) {
  pray('a direction was passed', dir === L || dir === R);
}

/**
 * Tiny extension of jQuery adding directionalized DOM manipulation methods.
 *
 * Funny how Pjs v3 almost just works with `jQuery.fn.init`.
 *
 * jQuery features that don't work on $:
 *   - jQuery.*, like jQuery.ajax, obviously (Pjs doesn't and shouldn't
 *                                            copy constructor properties)
 *
 *   - jQuery(function), the shortcut for `jQuery(document).ready(function)`,
 *     because `jQuery.fn.init` is idiosyncratic and Pjs doing, essentially,
 *     `jQuery.fn.init.apply(this, arguments)` isn't quite right, you need:
 *
 *       _.init = function(s, c) { jQuery.fn.init.call(this, s, c, $(document)); };
 *
 *     if you actually give a shit (really, don't bother),
 *     see https://github.com/jquery/jquery/blob/1.7.2/src/core.js#L889
 *
 *   - jQuery(selector), because jQuery translates that to
 *     `jQuery(document).find(selector)`, but Pjs doesn't (should it?) let
 *     you override the result of a constructor call
 *       + note that because of the jQuery(document) shortcut-ness, there's also
 *         the 3rd-argument-needs-to-be-`$(document)` thing above, but the fix
 *         for that (as can be seen above) is really easy. This problem requires
 *         a way more intrusive fix
 *
 * And that's it! Everything else just magically works because jQuery internally
 * uses `this.constructor()` everywhere (hence calling `$`), but never ever does
 * `this.constructor.find` or anything like that, always doing `jQuery.find`.
 */
var $ = P(jQuery, function(_) {
  _.insDirOf = function(dir, el) {
    return dir === L ?
      this.insertBefore(el.first()) : this.insertAfter(el.last());
  };
  _.insAtDirEnd = function(dir, el) {
    return dir === L ? this.prependTo(el) : this.appendTo(el);
  };
});

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
  _.jQize = function(jQ) {
    // jQuery-ifies this.html() and links up the .jQ of all corresponding Nodes
    var jQ = $(jQ || this.html());

    function jQadd(el) {
      if (el.getAttribute) {
        var cmdId = el.getAttribute('mathquill-command-id');
        var blockId = el.getAttribute('mathquill-block-id');
        if (cmdId) Node.byId[cmdId].jQadd(el);
        if (blockId) Node.byId[blockId].jQadd(el);
      }
      for (el = el.firstChild; el; el = el.nextSibling) {
        jQadd(el);
      }
    }

    for (var i = 0; i < jQ.length; i += 1) jQadd(jQ[i]);
    return jQ;
  };

  _.createDir = function(dir, cursor) {
    prayDirection(dir);
    var node = this;
    node.jQize();
    node.jQ.insDirOf(dir, cursor.jQ);
    cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]);
    return node;
  };
  _.createLeftOf = function(el) { return this.createDir(L, el); };

  _.selectChildren = function(leftEnd, rightEnd) {
    return Selection(leftEnd, rightEnd);
  };

  _.bubble = iterator(function(yield_) {
    for (var ancestor = this; ancestor; ancestor = ancestor.parent) {
      var result = yield_(ancestor);
      if (result === false) break;
    }

    return this;
  });

  _.postOrder = iterator(function(yield_) {
    (function recurse(descendant) {
      descendant.eachChild(recurse);
      yield_(descendant);
    })(this);

    return this;
  });

  _.isEmpty = function() {
    return this.ends[L] === 0 && this.ends[R] === 0;
  };

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

  _.withDirAdopt = function(dir, parent, withDir, oppDir) {
    Fragment(this, this).withDirAdopt(dir, parent, withDir, oppDir);
    return this;
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

function prayWellFormed(parent, leftward, rightward) {
  pray('a parent is always present', parent);
  pray('leftward is properly set up', (function() {
    // either it's empty and `rightward` is the left end child (possibly empty)
    if (!leftward) return parent.ends[L] === rightward;

    // or it's there and its [R] and .parent are properly set up
    return leftward[R] === rightward && leftward.parent === parent;
  })());

  pray('rightward is properly set up', (function() {
    // either it's empty and `leftward` is the right end child (possibly empty)
    if (!rightward) return parent.ends[R] === leftward;

    // or it's there and its [L] and .parent are properly set up
    return rightward[L] === leftward && rightward.parent === parent;
  })());
}


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
  _.init = function(withDir, oppDir, dir) {
    if (dir === undefined) dir = L;
    prayDirection(dir);

    pray('no half-empty fragments', !withDir === !oppDir);

    this.ends = {};

    if (!withDir) return;

    pray('withDir is passed to Fragment', withDir instanceof Node);
    pray('oppDir is passed to Fragment', oppDir instanceof Node);
    pray('withDir and oppDir have the same parent',
         withDir.parent === oppDir.parent);

    this.ends[dir] = withDir;
    this.ends[-dir] = oppDir;

    // To build the jquery collection for a fragment, accumulate elements
    // into an array and then call jQ.add once on the result. jQ.add sorts the
    // collection according to document order each time it is called, so
    // building a collection by folding jQ.add directly takes more than
    // quadratic time in the number of elements.
    //
    // https://github.com/jquery/jquery/blob/2.1.4/src/traversing.js#L112
    var accum = this.fold([], function (accum, el) {
      accum.push.apply(accum, el.jQ.get());
      return accum;
    });

    this.jQ = this.jQ.add(accum);
  };
  _.jQ = $();

  // like Cursor::withDirInsertAt(dir, parent, withDir, oppDir)
  _.withDirAdopt = function(dir, parent, withDir, oppDir) {
    return (dir === L ? this.adopt(parent, withDir, oppDir)
                      : this.adopt(parent, oppDir, withDir));
  };
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

  _.each = iterator(function(yield_) {
    var self = this;
    var el = self.ends[L];
    if (!el) return self;

    for (; el !== self.ends[R][R]; el = el[R]) {
      var result = yield_(el);
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
});


/**
 * Registry of LaTeX commands and commands created when typing
 * a single character.
 *
 * (Commands are all subclasses of Node.)
 */
var LatexCmds = {}, CharCmds = {};
