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
var $: $ = jQuery;
$.fn.insDirOf = function (dir: Direction, el: $) {
  return dir === L
    ? this.insertBefore(el.first())
    : this.insertAfter(el.last());
};
$.fn.insAtDirEnd = function (dir: Direction, el: $) {
  return dir === L ? this.prependTo(el) : this.appendTo(el);
};

/** A cursor-like location in an mq node tree. */
class Point {
  /** The node to the left of this point (or 0 for the position before a first child) */
  [L]?: NodeRef;
  /** The node to the right of this point (or 0 for the position after a last child) */
  [R]?: NodeRef;
  parent: MQNode;

  constructor(parent: MQNode, leftward?: NodeRef, rightward?: NodeRef) {
    this.init(parent, leftward, rightward);
  }

  // keeping init around only for tests
  init(parent: MQNode, leftward?: NodeRef, rightward?: NodeRef) {
    this.parent = parent;
    this[L] = leftward;
    this[R] = rightward;
  }

  static copy(pt: Point) {
    return new Point(pt.parent, pt[L], pt[R]);
  }
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

function eachNode(ends: Ends, yield_: (el: MQNode) => boolean | undefined) {
  var el = ends[L];
  if (!el) return;

  var stop = ends[R];
  if (!stop) return; //shouldn't happen because ends[L] is defined;
  stop = stop[R];

  // TODO - this cast as MQNode is actually important to keep tests passing. I went to
  // fix this code to gracefully handle an undefined el and there are tests that actually
  // verify that this will throw an error. So I'm keeping the behavior but ignoring the
  // type error.
  for (; el !== stop; el = (el as MQNode)[R]) {
    var result = yield_(el as MQNode); // TODO - might be passing in 0 intead of a MQNode, but tests want this
    if (result === false) break;
  }
}

function foldNodes<T>(
  ends: Ends,
  fold: T,
  yield_: (fold: T, el: MQNode) => T
): T {
  var el = ends[L];
  if (!el) return fold;

  var stop = ends[R];
  if (!stop) return fold; //shouldn't happen because ends[L] is defined;
  stop = stop[R];

  // TODO - this cast as MQNode is actually important to keep tests passing. I went to
  // fix this code to gracefully handle an undefined el and there are tests that actually
  // verify that this will throw an error. So I'm keeping the behavior but ignoring the
  // type error.
  for (; el !== stop; el = (el as MQNode)[R]) {
    fold = yield_(fold, el as MQNode); // TODO - might be passing in 0 intead of a MQNode, but tests want this
  }

  return fold;
}

type HTMLElementTrackingNode = {
  mqBlockNode?: NodeBase;
  mqCmdNode?: NodeBase;
};

type Ends = {
  [L]: NodeRef;
  [R]: NodeRef;
};

/**
 * MathQuill virtual-DOM tree-node abstract base class
 */
var defaultJQ = $();

class NodeBase {
  static idCounter = 0;
  static uniqueNodeId() {
    return (NodeBase.idCounter += 1);
  }

  static getNodeOfElement(el: HTMLElement) {
    if (!el) return;
    if (!el.nodeType)
      throw new Error('must pass an HTMLElement to NodeBase.getNodeOfElement');

    var elTrackingNode = el as HTMLElementTrackingNode;
    return elTrackingNode.mqBlockNode || elTrackingNode.mqCmdNode;
  }

  static linkElementByBlockId(elm: HTMLElement, id: number) {
    NodeBase.linkElementByBlockNode(elm, NodeBase.TempByIdDict[id]);
  }

  static linkElementByBlockNode(elm: HTMLElement, blockNode: NodeBase) {
    (elm as HTMLElementTrackingNode).mqBlockNode = blockNode;
  }

  static linkElementByCmdNode(elm: HTMLElement, cmdNode: NodeBase) {
    (elm as HTMLElementTrackingNode).mqCmdNode = cmdNode;
  }

  static TempByIdDict: Record<number | string, NodeBase> = {};
  static cleaningScheduled = false;
  static scheduleDictionaryCleaning() {
    if (!NodeBase.cleaningScheduled) {
      NodeBase.cleaningScheduled = true;
      setTimeout(NodeBase.cleanDictionary);
    }
  }
  static cleanDictionary() {
    NodeBase.cleaningScheduled = false;
    NodeBase.TempByIdDict = {};
  }

  // TODO - life would be so much better in typescript of these were undefined instead of
  // 0. The ! would save us in cases where we know a node is defined.
  [L]: NodeRef = 0;
  [R]: NodeRef = 0;

  // TODO - can this ever actually stay 0? if so we need to add null checks
  parent: MQNode = 0 as any as MQNode;

  /** The (doubly-linked) list of this node's children. */
  ends: Ends = { [L]: 0, [R]: 0 };

  jQ = defaultJQ;
  id = NodeBase.uniqueNodeId();
  ctrlSeq: string | undefined;
  ariaLabel: string | undefined;
  textTemplate: string[] | undefined;
  htmlTemplate: string | undefined;
  mathspeakName: string | undefined;
  sides:
    | {
        [L]: { ch: string; ctrlSeq: string };
        [R]: { ch: string; ctrlSeq: string };
      }
    | undefined;
  blocks: MathBlock[] | undefined;
  mathspeakTemplate: string[] | undefined;
  upInto: MQNode | undefined;
  downInto: MQNode | undefined;
  upOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined);
  downOutOf?: MQNode | ((cursor: Cursor) => Cursor | undefined);

  isPartOfOperator: boolean | undefined;

  constructor() {
    NodeBase.TempByIdDict[this.id] = this;
    NodeBase.scheduleDictionaryCleaning();
  }

  toString() {
    return '{{ MathQuill Node #' + this.id + ' }}';
  }

  jQadd(jQ: $ | HTMLElement | ChildNode) {
    return (this.jQ = this.jQ.add(jQ));
  }
  /** Generate a DOM representation of this node and attach references to the corresponding MQ nodes to each DOM node.
   *
   * TODO: The only part of this method that depends on `this` is generating the DOM, so maybe pull out the rest into
   * a static function (and remove the `el` parameter from this method).
   */
  jQize(el?: $ | HTMLElement) {
    // jQuery-ifies this.html() and links up the .jQ of all corresponding Nodes
    var jQ: $ = $(el || this.html());

    function jQadd(el: HTMLElement | ChildNode) {
      if ('getAttribute' in el) {
        var cmdId = el.getAttribute('mathquill-command-id');
        if (cmdId) {
          el.removeAttribute('mathquill-command-id');
          var cmdNode = NodeBase.TempByIdDict[cmdId];
          cmdNode.jQadd(el);
          NodeBase.linkElementByCmdNode(el, cmdNode);
        }

        var blockId = el.getAttribute('mathquill-block-id');
        if (blockId) {
          el.removeAttribute('mathquill-block-id');
          var blockNode = NodeBase.TempByIdDict[blockId];
          blockNode.jQadd(el);
          NodeBase.linkElementByBlockNode(el, blockNode);
        }
      }
      for (var child = el.firstChild; child; child = child.nextSibling) {
        jQadd(child);
      }
    }

    for (var i = 0; i < jQ.length; i += 1) jQadd(jQ[i]);
    return jQ;
  }

  createDir(dir: Direction, cursor: Cursor) {
    prayDirection(dir);
    var node = this;
    node.jQize();
    node.jQ.insDirOf(dir, cursor.jQ);
    cursor[dir] = node.adopt(cursor.parent, cursor[L]!, cursor[R]!); // TODO - assuming not undefined, could be 0
    return node;
  }
  createLeftOf(cursor: Cursor) {
    this.createDir(L, cursor);
  }

  selectChildren(leftEnd: MQNode, rightEnd: MQNode) {
    return new MQSelection(leftEnd, rightEnd);
  }

  bubble(yield_: (ancestor: MQNode) => boolean | undefined) {
    var self = this.getSelfNode();

    for (var ancestor: NodeRef = self; ancestor; ancestor = ancestor.parent) {
      var result = yield_(ancestor);
      if (result === false) break;
    }

    return this;
  }

  postOrder(yield_: (el: MQNode) => void) {
    var self = this.getSelfNode();

    (function recurse(descendant: MQNode) {
      if (!descendant) return false;
      descendant.eachChild(recurse);
      yield_(descendant);
      return true;
    })(self);

    return self;
  }

  isEmpty() {
    return this.ends[L] === 0 && this.ends[R] === 0;
  }

  isQuietEmptyDelimiter(dlms: { [id: string]: any } | undefined) {
    if (!this.isEmpty()) return false;
    if (!dlms) return false;
    if (!this.parent || this.parent.ctrlSeq === undefined) return false;
    // Remove any leading \left or \right from the ctrl sequence before looking it up.
    var key = this.parent.ctrlSeq.replace(/^\\(left|right)?/, '');
    return dlms.hasOwnProperty(key);
  }

  isStyleBlock() {
    return false;
  }

  isTextBlock() {
    return false;
  }

  children() {
    return new Fragment(this.ends[L] as MQNode, this.ends[R] as MQNode);
  }

  eachChild(yield_: (el: MQNode) => boolean | undefined) {
    eachNode(this.ends, yield_);
    return this;
  }

  foldChildren<T>(fold: T, yield_: (fold: T, el: MQNode) => T) {
    return foldNodes(this.ends, fold, yield_);
  }

  withDirAdopt(
    dir: Direction,
    parent: MQNode,
    withDir: MQNode,
    oppDir: MQNode
  ) {
    const self = this.getSelfNode();
    new Fragment(self, self).withDirAdopt(dir, parent, withDir, oppDir);
    return this;
  }

  /**
   * Add this node to the given parent node's children, at the position between the adjacent
   * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
   * See `Fragment#adopt()`
   */
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
    var self = this.getSelfNode();
    new Fragment(self, self).adopt(parent, leftward, rightward);
    return this.getSelfNode();
  }

  disown() {
    var self = this.getSelfNode();
    new Fragment(self, self).disown();
    return this;
  }

  remove() {
    this.jQ.remove();
    return this.disown();
  }

  shouldIgnoreSubstitutionInSimpleSubscript(options: CursorOptions) {
    if (!options.disableAutoSubstitutionInSubscripts) return false;
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
  }

  getSelfNode() {
    // dumb dance to tell typescript that we eventually become a MQNode
    return this as any as MQNode;
  }

  // Overridden by child classes
  parser(): Parser<MQNode> {
    return undefined as any;
  }
  /** Render this node to an HTML string */
  html(): string {
    return '';
  }
  text(): string {
    return '';
  }
  latex(): string {
    return '';
  }
  finalizeTree(_options: CursorOptions, _dir?: Direction) {}
  contactWeld(_cursor: Cursor, _dir?: Direction) {}
  blur(_cursor: Cursor) {}
  focus() {}
  intentionalBlur() {}
  reflow() {}
  registerInnerField(_innerFields: InnerFields, _mathField: InnerMathField) {}
  chToCmd(_ch: string, _options?: CursorOptions): this {
    return undefined as any;
  }
  mathspeak(_options?: MathspeakOptions) {
    return '';
  }
  seek(_pageX: number, _cursor: Cursor) {}
  siblingDeleted(_options: CursorOptions, _dir: Direction) {}
  siblingCreated(_options: CursorOptions, _dir: Direction) {}
  finalizeInsert(_options: CursorOptions, _cursor: Cursor) {}
  fixDigitGrouping(_opts: CursorOptions) {}
  writeLatex(_cursor: Cursor, _latex: string) {}
  write(_cursor: Cursor, _ch: string) {}
}

function prayWellFormed(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
  pray('a parent is always present', parent);
  pray(
    'leftward is properly set up',
    (function () {
      // either it's empty and `rightward` is the left end child (possibly empty)
      if (!leftward) return parent.ends[L] === rightward;

      // or it's there and its [R] and .parent are properly set up
      return leftward[R] === rightward && leftward.parent === parent;
    })()
  );

  pray(
    'rightward is properly set up',
    (function () {
      // either it's empty and `leftward` is the right end child (possibly empty)
      if (!rightward) return parent.ends[R] === leftward;

      // or it's there and its [L] and .parent are properly set up
      return rightward[L] === leftward && rightward.parent === parent;
    })()
  );
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
  /** The (doubly-linked) list of nodes contained in this fragment. */
  ends: {
    [L]?: MQNode;
    [R]?: MQNode;
  };

  jQ = defaultJQ;
  disowned: boolean = false;

  constructor(withDir?: MQNode, oppDir?: MQNode, dir?: Direction) {
    if (dir === undefined) dir = L;
    prayDirection(dir);

    pray('no half-empty fragments', !withDir === !oppDir);

    this.ends = {};

    if (!withDir || !oppDir) return;

    pray('withDir is passed to Fragment', withDir instanceof MQNode);
    pray('oppDir is passed to Fragment', oppDir instanceof MQNode);
    pray(
      'withDir and oppDir have the same parent',
      withDir.parent === oppDir.parent
    );

    this.ends[dir as Direction] = withDir;
    this.ends[-dir as Direction] = oppDir;

    // To build the jquery collection for a fragment, accumulate elements
    // into an array and then call jQ.add once on the result. jQ.add sorts the
    // collection according to document order each time it is called, so
    // building a collection by folding jQ.add directly takes more than
    // quadratic time in the number of elements.
    //
    // https://github.com/jquery/jquery/blob/2.1.4/src/traversing.js#L112
    var accum = this.fold([], function (accum: HTMLElement[], el: MQNode) {
      accum.push.apply(accum, el.jQ.get());
      return accum;
    });

    this.jQ = this.jQ.add(accum);
  }

  // like Cursor::withDirInsertAt(dir, parent, withDir, oppDir)
  withDirAdopt(
    dir: Direction,
    parent: MQNode,
    withDir: NodeRef,
    oppDir: NodeRef
  ) {
    return dir === L
      ? this.adopt(parent, withDir, oppDir)
      : this.adopt(parent, oppDir, withDir);
  }
  /**
   * Splice this fragment into the given parent node's children, at the position between the adjacent
   * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
   *
   * TODO: why do we need both leftward and rightward? It seems to me that `rightward` is always expected to be `leftward ? leftward[R] : parent.ends[L]`.
   */
  adopt(parent: MQNode, leftward: NodeRef, rightward: NodeRef) {
    prayWellFormed(parent, leftward, rightward);

    var self = this;
    this.disowned = false;

    var leftEnd = self.ends[L];
    if (!leftEnd) return this;

    var rightEnd = self.ends[R];
    if (!rightEnd) return this;

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

    rightEnd[R] = rightward;

    self.each(function (el: MQNode) {
      el[L] = leftward;
      el.parent = parent;
      if (leftward) leftward[R] = el;

      leftward = el;
      return true;
    });

    return self;
  }

  /**
   * Remove the nodes in this fragment from their parent.
   */
  disown() {
    var self = this;
    var leftEnd = self.ends[L];

    // guard for empty and already-disowned fragments
    if (!leftEnd || self.disowned) return self;

    this.disowned = true;

    var rightEnd = self.ends[R];
    if (!rightEnd) return self;
    var parent = leftEnd.parent;

    prayWellFormed(parent, leftEnd[L], leftEnd);
    prayWellFormed(parent, rightEnd, rightEnd[R]);

    if (leftEnd[L]) {
      var leftLeftEnd = leftEnd[L] as MQNode;
      leftLeftEnd[R] = rightEnd[R];
    } else {
      parent.ends[L] = rightEnd[R];
    }

    if (rightEnd[R]) {
      var rightRightEnd = rightEnd[R] as MQNode;
      rightRightEnd[L] = leftEnd[L];
    } else {
      parent.ends[R] = leftEnd[L];
    }

    return self;
  }

  remove() {
    this.jQ.remove();
    return this.disown();
  }

  each(yield_: (el: MQNode) => boolean | undefined) {
    eachNode(this.ends as Ends, yield_); // TODO - the types of Ends are not compatible
    return this;
  }

  fold<T>(fold: T, yield_: (fold: T, el: MQNode) => T) {
    return foldNodes(this.ends as Ends, fold, yield_); // TODO - the types of Ends are not compatible
  }
}

/**
 * Registry of LaTeX commands and commands created when typing
 * a single character.
 *
 * (Commands are all subclasses of Node.)
 */
var LatexCmds: LatexCmds = {};
var CharCmds: CharCmds = {};

function isMQNodeClass(cmd: any): cmd is typeof MQNode {
  return cmd && cmd.prototype instanceof MQNode;
}
