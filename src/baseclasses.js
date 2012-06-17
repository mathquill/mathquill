/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCommand's descend from it.
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
var MathCommand = P(MathElement, function(_) {
  _.init = function(cmd, htmlTemplate, text_template) {
    var self = this; // minifier optimization

    if (cmd) self.cmd = cmd;
    if (htmlTemplate) self.htmlTemplate = htmlTemplate;
    if (text_template) self.text_template = text_template;
  };
  _.replaces = function(replacedFragment) {
    this.replacedFragment = replacedFragment;
  };
  _.createBlocks = function() {
    var self = this, replacedFragment = self.replacedFragment;
    //single-block commands
    if (self.htmlTemplate.length === 1) {
      self.firstChild =
      self.lastChild =
      self.jQ.data(jQueryDataKey).block =
        (replacedFragment && replacedFragment.blockify()) || MathBlock();

      self.firstChild.parent = self;
      self.firstChild.jQ = self.jQ.append(self.firstChild.jQ);

      return;
    }
    //otherwise, the succeeding elements of htmlTemplate should be child blocks
    var newBlock, prev, num_blocks = self.htmlTemplate.length;
    this.firstChild = newBlock = prev =
      (replacedFragment && replacedFragment.blockify()) || MathBlock();

    newBlock.parent = self;
    newBlock.jQ = $(self.htmlTemplate[1])
      .data(jQueryDataKey, {block: newBlock})
      .append(newBlock.jQ)
      .appendTo(self.jQ);

    newBlock.blur();

    for (var i = 2; i < num_blocks; i += 1) {
      newBlock = MathBlock();
      newBlock.parent = self;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(self.htmlTemplate[i])
        .data(jQueryDataKey, {block: newBlock})
        .appendTo(self.jQ);

      newBlock.blur();
    }
    self.lastChild = newBlock;
  };
  _.latex = function() {
    return this.foldChildren(this.cmd, function(latex, child) {
      return latex + '{' + (child.latex() || ' ') + '}';
    });
  };
  _.text_template = [''];
  _.text = function() {
    var i = 0;
    return this.foldChildren(this.text_template[i], function(text, child) {
      i += 1;
      var child_text = child.text();
      if (text && this.text_template[i] === '('
          && child_text[0] === '(' && child_text.slice(-1) === ')')
        return text + child_text.slice(1, -1) + this.text_template[i];
      return text + child.text() + (this.text_template[i] || '');
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
    var self = this,
        prev = self.prev,
        next = self.next,
        parent = self.parent;

    if (prev)
      prev.next = next;
    else
      parent.firstChild = next;

    if (next)
      next.prev = prev;
    else
      parent.lastChild = prev;

    self.jQ.remove();

    return self;
  };
});

/**
 * Lightweight command without blocks or children.
 */
var Symbol = P(MathCommand, function(_, _super) {
  _.init = function(cmd, html, text) {
    if (!text) text = cmd && cmd.length > 1 ? cmd.slice(1) : cmd;

    _super.init.call(this, cmd, [ html ], [ text ]);
  };
  _.replaces = function(replacedFragment) {
    replacedFragment.remove();
  };
  _.createBlocks = $.noop;
  _.latex = function(){ return this.cmd; };
  _.text = function(){ return this.text_template; };
  _.placeCursor = $.noop;
  _.isEmpty = function(){ return true; };
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
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
