/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCmd's descend from it.
 */
var MathElement = P(function(_) {
  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.firstChild = 0;
  _.lastChild = 0;

  _.eachChild = function(fn) {
    for (var child = this.firstChild; child; child = child.next)
      if (fn.call(this, child) === false) break;

    return this;
  };
  _.foldChildren = function(fold, fn) {
    this.eachChild(function(child) {
      fold = fn.call(this, fold, child);
    });
    return fold;
  };
  _.bubble = function(event, arg) {
    for (var ancestor = this; ancestor; ancestor = ancestor.parent)
      if (ancestor[event] && ancestor[event](arg) === false) break;

    return this;
  };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 * May be passed a MathFragment that's being replaced.
 */
var MathCmd = P(MathElement, function(_) {
  _.init = function(ctrlSeq, htmlTemplate, textTemplate) {
    var cmd = this;

    if (ctrlSeq) cmd.ctrlSeq = ctrlSeq;
    if (htmlTemplate) cmd.htmlTemplate = htmlTemplate;
    if (textTemplate) cmd.textTemplate = textTemplate;
  };
  _.replaces = function(replacedFragment) {
    this.replacedFragment = replacedFragment;
  };
  _.createBlocks = function() {
    var cmd = this, replacedFragment = cmd.replacedFragment;
    //single-block commands
    if (cmd.htmlTemplate.length === 1) {
      cmd.firstChild =
      cmd.lastChild =
      cmd.jQ.data(jQueryDataKey).block =
        (replacedFragment && replacedFragment.blockify()) || MathBlock();

      cmd.firstChild.parent = cmd;
      cmd.firstChild.jQ = cmd.jQ.append(cmd.firstChild.jQ);

      return;
    }
    //otherwise, the succeeding elements of htmlTemplate should be child blocks
    var newBlock, prev, num_blocks = cmd.htmlTemplate.length;
    this.firstChild = newBlock = prev =
      (replacedFragment && replacedFragment.blockify()) || MathBlock();

    newBlock.parent = cmd;
    newBlock.jQ = $(cmd.htmlTemplate[1])
      .data(jQueryDataKey, {block: newBlock})
      .append(newBlock.jQ)
      .appendTo(cmd.jQ);

    newBlock.blur();

    for (var i = 2; i < num_blocks; i += 1) {
      newBlock = MathBlock();
      newBlock.parent = cmd;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(cmd.htmlTemplate[i])
        .data(jQueryDataKey, {block: newBlock})
        .appendTo(cmd.jQ);

      newBlock.blur();
    }
    cmd.lastChild = newBlock;
  };
  _.latex = function() {
    return this.foldChildren(this.ctrlSeq, function(latex, child) {
      return latex + '{' + (child.latex() || ' ') + '}';
    });
  };
  _.textTemplate = [''];
  _.text = function() {
    var i = 0;
    return this.foldChildren(this.textTemplate[i], function(text, child) {
      i += 1;
      var child_text = child.text();
      if (text && this.textTemplate[i] === '('
          && child_text[0] === '(' && child_text.slice(-1) === ')')
        return text + child_text.slice(1, -1) + this.textTemplate[i];
      return text + child.text() + (this.textTemplate[i] || '');
    });
  };
  _.insertAt = function(parent, prev, next) {
    var cmd = this;

    cmd.parent = parent;
    cmd.next = next;
    cmd.prev = prev;

    if (prev)
      prev.next = cmd;
    else
      parent.firstChild = cmd;

    if (next)
      next.prev = cmd;
    else
      parent.lastChild = cmd;

    return cmd;
  };
  _.createBefore = function(cursor) {
    var cmd = this;

    cmd.jQ = $(cmd.htmlTemplate[0]).data(jQueryDataKey, {cmd: cmd});
    cmd.createBlocks();
    cursor.jQ.before(cmd.jQ);

    cursor.prev = cmd.insertAt(cursor.parent, cursor.prev, cursor.next);

    //adjust context-sensitive spacing
    cmd.respace();
    if (cmd.next)
      cmd.next.respace();
    if (cmd.prev)
      cmd.prev.respace();

    cmd.placeCursor(cursor);

    cmd.bubble('redraw');
  };
  _.respace = $.noop; //placeholder for context-sensitive spacing
  _.placeCursor = function(cursor) {
    //append the cursor to the first empty child, or if none empty, the last one
    cursor.appendTo(this.foldChildren(this.firstChild, function(prev, child) {
      return prev.isEmpty() ? prev : child;
    }));
  };
  _.isEmpty = function() {
    return this.foldChildren(true, function(isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  };
  _.remove = function() {
    var cmd = this,
        prev = cmd.prev,
        next = cmd.next,
        parent = cmd.parent;

    if (prev)
      prev.next = next;
    else
      parent.firstChild = next;

    if (next)
      next.prev = prev;
    else
      parent.lastChild = prev;

    cmd.jQ.remove();

    return cmd;
  };
});

/**
 * Lightweight command without blocks or children.
 */
var Symbol = P(MathCmd, function(_, _super) {
  _.init = function(ctrlSeq, html, text) {
    if (!text) text = ctrlSeq && ctrlSeq.length > 1 ? ctrlSeq.slice(1) : ctrlSeq;

    _super.init.call(this, ctrlSeq, [ html ], [ text ]);
  };
  _.replaces = function(replacedFragment) {
    replacedFragment.remove();
  };
  _.createBlocks = $.noop;
  _.latex = function(){ return this.ctrlSeq; };
  _.text = function(){ return this.textTemplate; };
  _.placeCursor = $.noop;
  _.isEmpty = function(){ return true; };
});

/**
 * Children and parent of MathCmd's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
var MathBlock = P(MathElement, function(_) {
  _.join = function(methodName) {
    return this.foldChildren('', function(fold, child) {
      return fold + child[methodName]();
    });
  };
  _.latex = function() { return this.join('latex'); };
  _.text = function() {
    return this.firstChild === this.lastChild ?
      this.firstChild.text() :
      '(' + this.join('text') + ')'
    ;
  };
  _.isEmpty = function() {
    return this.firstChild === 0 && this.lastChild === 0;
  };
  _.focus = function() {
    this.jQ.addClass('hasCursor');
    if (this.isEmpty())
      this.jQ.removeClass('empty');

    return this;
  };
  _.blur = function() {
    this.jQ.removeClass('hasCursor');
    if (this.isEmpty())
      this.jQ.addClass('empty');

    return this;
  };
});

/**
 * An entity outside the Math DOM tree with one-way pointers (so it's only
 * a "view" of part of the tree, not an actual node/entity in the tree)
 * that delimit a list of symbols and operators.
 */
var MathFragment = P(function(_) {
  _.init = function(first, last) {
    if (!arguments.length) return;

    var self = this;

    self.first = first;
    self.last = last || first; //just select one thing if only one argument

    self.jQinit(self.fold($(), function(jQ, child){ return child.jQ.add(jQ); }));
  }
  _.jQinit = function(children) {
    this.jQ = children;
  };
  _.each = function(fn) {
    for (var el = this.first; el !== this.last.next; el = el.next)
      if (fn.call(this, el) === false) break;

    return this;
  };
  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });
    return fold;
  };
  _.latex = function() {
    return this.fold('', function(latex, el){ return latex + el.latex(); });
  };
  _.remove = function() {
    this.jQ.remove();
    return this.detach();
  };
  _.detach = function() {
    var self = this,
      prev = self.first.prev,
      next = self.last.next,
      parent = self.last.parent;

    if (prev)
      prev.next = next;
    else
      parent.firstChild = next;

    if (next)
      next.prev = prev;
    else
      parent.lastChild = prev;

    self.detach = chainableNoop;

    return self;
  };
  function chainableNoop(){ return this; };
  _.blockify = function() {
    var self = this.detach();
      newBlock = MathBlock();
      first = newBlock.firstChild = self.first,
      last = newBlock.lastChild = self.last;

    first.prev = 0;
    last.next = 0;

    self.each(function(el){ el.parent = newBlock; });

    newBlock.jQ = self.jQ;

    return newBlock;
  };
});
