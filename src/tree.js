/*************************************************
 * Base classes of edit tree-related objects
 *
 * Only doing tree node manipulation via these
 * adopt/ disown methods guarantees well-formedness
 * of the tree.
 ************************************************/

/**
 * Tiny extension of jQuery adding directionalized DOM manipulation methods.
 */
var $ = jQuery;
$.fn.insDirOf = function (dir, el) {
  return dir === L ?
    this.insertBefore(el.first()) : this.insertAfter(el.last());
};
$.fn.insAtDirEnd = function (dir, el) {
  return dir === L ? this.prependTo(el) : this.appendTo(el);
};

class Point {

  // keeping init around only for tests
  init (parent, leftward, rightward) {
    this.parent = parent;
    this[L] = leftward;
    this[R] = rightward;
  }

  constructor (parent, leftward, rightward) {
    this.init(parent, leftward, rightward);
  };

  static copy (pt) {
    return new Point(pt.parent, pt[L], pt[R]);
  };
}

/*
  Mathquill used to create a global dictionary that held onto
  all nodes ever created. It was up to the mathquill instances
  to call .dispose() on all of the nodes they created. That .dispose()
  method would remove the node from the global dictionary. That
  leaked memory for these reasons:
  1) mathField.revert() didn't actually call the .dispose() method
     on ANY of the nodes.
  2) parts of the code create temporary nodes that never get linked
     to anything. So they definitely didn't get their dispose() method
     called.
  3) even if everything above worked it's really common for users of
     mathquill to forget to tear it down correctly.

  It turns out mathquill always uses the Node and the Element as pairs. So we
  can store the Node on the Element and the Element on the Node. That makes it
  possible to get one from the other. This also has the added benefit of meaning
  the Node isn't stored in a global dictionary. If you lose all references to
  the Element, then you'll also lose all references to the Node. This means the
  browser can garbage collect all of mathquill's internals when the DOM is destroyed.

  There's only 1 small gotcha. The linking between Element and Node is a little clumsy.
  1) All of the Nodes will be created.
  2) Then all of the Elements will be created.
  3) Then the two will be linked

  The problem is that the linking step only has access to the elements. It doesn't have
  access to the nodes. That means we need to store the id of the node we want on the element
  at creation time. Then we need to lookup that Node by id during the linking step. This
  means we still need a dictionary. But at least it can be a temporary dictionary.
  Steps 1 - 3 happen synchronously. So after those steps we can simply clean out the
  temporary dictionary and remove all hard references to the Nodes.

  Any time we create a Node we schedule a task to clean all Nodes out of the dictionary
  on the next frame. That's safe because there's no opportunity for nodes to be created
  and NOT linked between the time we schedule the cleaning step and actually do it.
*/

function eachNode (ends:Ends, yield_:(el:NodeRef) => boolean) {
  var el = ends[L];
  if (!el) return;

  var stop = ends[R];
  if (!stop) return; //shouldn't happen because ends[L] is defined;
  stop = stop[R];

  // TODO - this cas as MQNode is actually important to keep tests passing. I went to
  // fix this code to gracefully handle an undefined el and there are tests that actually
  // verify that this will throw an error. So I'm keeping the behavior but ignoring the
  // type error.
  for (; el !== stop; el = (el as MQNode)[R]) {
    var result = yield_(el);
    if (result === false) break;
  }
}

function foldNodes (ends:Ends, fold:Fold, yield_:(fold:Fold, el:NodeRef) => Fold) {
  var el = ends[L];
  if (!el) return fold;

  var stop = ends[R];
  if (!stop) return; fold; //shouldn't happen because ends[L] is defined;
  stop = stop[R];

  // TODO - this cas as MQNode is actually important to keep tests passing. I went to
  // fix this code to gracefully handle an undefined el and there are tests that actually
  // verify that this will throw an error. So I'm keeping the behavior but ignoring the
  // type error.
  for (; el !== stop; el = (el as MQNode)[R]) {
    fold = yield_(fold, el);
  }

  return fold;
}


type HTMLElementTrackingNode = {
  mqBlockNode?: MQNode;
  mqCmdNode?: MQNode;
}

type Ends = {
  [L]: NodeRef,
  [R]: NodeRef
}

/**
 * MathQuill virtual-DOM tree-node abstract base class
 */
var defaultJQ = $();


class NodeBase {
  static idCounter = 0;
  static uniqueNodeId() { return NodeBase.idCounter += 1; }

  static getNodeOfElement (el:HTMLElement) {
    if (!el) return;
    if (!el.nodeType) throw new Error('must pass an HTMLElement to NodeBase.getNodeOfElement')
    
    var elTrackingNode = el as HTMLElementTrackingNode;
    return elTrackingNode.mqBlockNode || elTrackingNode.mqCmdNode;
  }

  static linkElementByBlockId (elm:HTMLElement, id:number) {
    NodeBase.linkElementByBlockNode(elm, NodeBase.TempByIdDict[id]);
  };

  static linkElementByBlockNode (elm:HTMLElement, blockNode:MQNode) {
    (elm as HTMLElementTrackingNode).mqBlockNode = blockNode;
  };

  static linkElementByCmdNode (elm:HTMLElement, cmdNode:MQNode) {
    (elm as HTMLElementTrackingNode).mqCmdNode = cmdNode;
  };

  static TempByIdDict:Record<number|string, MQNode> = {};
  static cleaningScheduled = false;
  static scheduleDictionaryCleaning () {
    if (!NodeBase.cleaningScheduled) {
      NodeBase.cleaningScheduled = true;
      setTimeout(NodeBase.cleanDictionary);
    }
  }
  static cleanDictionary () {
    NodeBase.cleaningScheduled = false;
    NodeBase.TempByIdDict = {};
  }

  [L]:NodeRef = 0;
  [R]:NodeRef = 0;
  parent:NodeRef = 0;
  ends:Ends = {[L]: 0, [R]: 0}
  jQ = defaultJQ;
  id = NodeBase.uniqueNodeId();
  ctrlSeq:String | undefined;

  constructor () {
    NodeBase.TempByIdDict[this.id] = this;
    NodeBase.scheduleDictionaryCleaning();
  };
  
  toString () { return '{{ MathQuill Node #'+this.id+' }}'; };
  
  jQadd (jQ:$) { return this.jQ = this.jQ.add(jQ); };
  jQize (el?:HTMLElement) {
    // jQuery-ifies this.html() and links up the .jQ of all corresponding Nodes
    var jQ:$ = $(el || this.html());

    function jQadd(el:HTMLElement) {

      if (el.getAttribute) {
        var cmdId = el.getAttribute('mathquill-command-id');
        if (cmdId) {
          el.removeAttribute('mathquill-command-id');
          var cmdNode = NodeBase.TempByIdDict[cmdId]
          cmdNode.jQadd(el);
          NodeBase.linkElementByCmdNode(el, cmdNode);
        }

        var blockId = el.getAttribute('mathquill-block-id');
        if (blockId) {
          el.removeAttribute('mathquill-block-id');
          var blockNode = NodeBase.TempByIdDict[blockId]
          blockNode.jQadd(el);
          NodeBase.linkElementByBlockNode(el, blockNode);
        }
      }
      for (var child = el.firstChild; child; child = child.nextSibling) {
        jQadd(child as HTMLElement); // TODO - revist cast
      }
    }

    for (var i = 0; i < jQ.length; i += 1) jQadd(jQ[i]);
    return jQ;
  };

  createDir (dir:Direction, cursor:Cursor) {
    prayDirection(dir);
    var node = this;
    node.jQize();
    node.jQ.insDirOf(dir, cursor.jQ);
    cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]);
    return node;
  };
  createLeftOf (el:NodeRef) { return this.createDir(L, el); };

  selectChildren (leftEnd:NodeRef, rightEnd:NodeRef) {
    return new MQSelection(leftEnd, rightEnd);
  };

  bubble (yield_:(ancestor:NodeRef) => boolean) {
    for (var ancestor:NodeRef = this; ancestor; ancestor = ancestor.parent) {
      var result = yield_(ancestor);
      if (result === false) break;
    }

    return this;
  };

  postOrder (yield_:(el:NodeRef) => void) {
    (function recurse(descendant:NodeRef) {
      if (!descendant) return false;
      descendant.eachChild(recurse);
      yield_(descendant);
      return true;
    })(this);

    return this;
  };

  isEmpty () {
    return this.ends[L] === 0 && this.ends[R] === 0;
  };
  
  isEmptyParens () {
    if (!this.isEmpty()) return false;
    if (!this.parent) return false;
    return this.parent.ctrlSeq === '\\left(';
  }

  isEmptySquareBrackets () {
    if (!this.isEmpty()) return false;
    if (!this.parent) return false;
    return this.parent.ctrlSeq === '\\left[';
  }

  isStyleBlock () {
    return false;
  };

  isTextBlock () {
    return false;
  };

  children () {
    return new Fragment(this.ends[L], this.ends[R]);
  };

  eachChild (yield_:(el:NodeRef) => boolean) {
    eachNode(this.ends, yield_);
    return this;
  };

  foldChildren (fold:Fold, yield_:(fold:Fold, el:NodeRef) => Fold) {
    return foldNodes(this.ends, fold, yield_);
  };

  withDirAdopt (dir:Direction, parent:NodeRef, withDir:Direction, oppDir:Direction) {
    new Fragment(this, this).withDirAdopt(dir, parent, withDir, oppDir);
    return this;
  };

  adopt (parent:NodeRef, leftward:NodeRef, rightward:NodeRef) {
    new Fragment(this, this).adopt(parent, leftward, rightward);
    return this;
  };

  disown () {
    new Fragment(this, this).disown();
    return this;
  };

  remove () {
    this.jQ.remove();
    return this.disown();
  };

  isParentSimpleSubscript () {
    if (!this.parent) return false;
    if (!(this.parent.parent instanceof SupSub)) return false;

    // Mathquill is gross. There are many different paths that
    // create subscripts and sometimes we don't even construct
    // true instances of `LatexCmds._`. Another problem is that
    // the relationship between the sub and the SupSub isn't
    // completely setup during a paste at the time we check
    // this. I wanted to use: `this.parent.parent.sub !== this.parent`
    // but that check doesn't always work. This seems to be the only
    // check that always works. I'd rather live with this than try
    // to change the init order of things.
    if (!this.parent.jQ.hasClass('mq-sub')) return false;

    return true;
  };

  // Overridden by child classes
  html () {};
  finalizeTree () { };
  contactWeld () { };
  blur () { };
  intentionalBlur () { };
  reflow () { };
  registerInnerField () { };
}

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
class Fragment {
  constructor (withDir, oppDir, dir) {
    this.jQ = $();

    if (dir === undefined) dir = L;
    prayDirection(dir);

    pray('no half-empty fragments', !withDir === !oppDir);

    this.ends = {};

    if (!withDir) return;

    pray('withDir is passed to Fragment', withDir instanceof MQNode);
    pray('oppDir is passed to Fragment', oppDir instanceof MQNode);
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

  // like Cursor::withDirInsertAt(dir, parent, withDir, oppDir)
  withDirAdopt (dir, parent, withDir, oppDir) {
    return (dir === L ? this.adopt(parent, withDir, oppDir)
                      : this.adopt(parent, oppDir, withDir));
  };
  adopt (parent, leftward, rightward) {
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

  disown () {
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

  remove () {
    this.jQ.remove();
    return this.disown();
  };

  each (yield_) {
    eachNode(this.ends, yield_);
    return this;
  };

  fold (fold, yield_) {
    return foldNodes(this.ends, fold, yield_);
  };
}


/**
 * Registry of LaTeX commands and commands created when typing
 * a single character.
 *
 * (Commands are all subclasses of Node.)
 */
var LatexCmds = {}, CharCmds = {};
