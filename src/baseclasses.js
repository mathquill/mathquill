/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCommand's descend from it.
 */
var MathElement = P(Node, function(_) {
  _.bubble = function(event /*, args... */) {
    var args = __slice.call(arguments, 1);

    for (var ancestor = this; ancestor; ancestor = ancestor.parent) {
      var res = ancestor[event] && ancestor[event].apply(ancestor, args);
      if (res === false) break;
    }

    return this;
  };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var MathCommand = P(MathElement, function(_) {
  _.init = function(cmd, html_template, text_template) {
    var self = this; // minifier optimization

    if (!self.cmd) self.cmd = cmd;
    if (html_template) self.html_template = html_template;
    if (text_template) self.text_template = text_template;
  };
  _.replaces = function(replacedFragment) {
    this.replacedFragment = replacedFragment;
  };
  _.createBlocks = function() {
    var self = this, replacedFragment = self.replacedFragment;
    //single-block commands
    if (self.html_template.length === 1) {
      self.firstChild =
      self.lastChild =
      self.jQ.data(jQueryDataKey).block =
        (replacedFragment && replacedFragment.blockify()) || MathBlock();

      self.firstChild.parent = self;
      self.firstChild.jQ = self.jQ.append(self.firstChild.jQ);

      return;
    }
    //otherwise, the succeeding elements of html_template should be child blocks
    var newBlock, prev, num_blocks = self.html_template.length;
    this.firstChild = newBlock = prev =
      (replacedFragment && replacedFragment.blockify()) || MathBlock();

    newBlock.parent = self;
    newBlock.jQ = $(self.html_template[1])
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

      newBlock.jQ = $(self.html_template[i])
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
  _.insertAt = _.adopt;
  _.createBefore = function(cursor) {
    var cmd = this;

    cmd.jQ = $(cmd.html_template[0]).data(jQueryDataKey, {cmd: cmd});
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
  _.respace = noop; //placeholder for context-sensitive spacing
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
    this.disown()
    this.jQ.remove();

    return this;
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
  _.createBlocks = noop;
  _.latex = function(){ return this.cmd; };
  _.text = function(){ return this.text_template; };
  _.placeCursor = noop;
  _.isEmpty = function(){ return true; };
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
var MathBlock = P(MathElement, function(_) {
  _.latex = function() {
    return this.foldChildren('', function(latex, child) {
      return latex + child.latex();
    });
  };
  _.text = function() {
    return this.firstChild === this.lastChild ?
      this.firstChild.text() :
      this.foldChildren('(', function(text, child) {
        return text + child.text();
      }) + ')';
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
var MathFragment = P(Fragment, function(_, _super) {
  _.init = function(first, last) {
    // just select one thing if only one argument
    _super.init.call(this, first, last || first);
    this.jQ = this.fold($(), function(jQ, child){ return child.jQ.add(jQ); });
  };
  _.latex = function() {
    return this.fold('', function(latex, el){ return latex + el.latex(); });
  };
  _.remove = function() {
    this.jQ.remove();
    return this.detach();
  };
  _.detach = function() {
    this.disown();
    this.detach = chainableNoop;

    return this;
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
