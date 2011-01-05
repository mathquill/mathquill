/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCommand's descend from it.
 */
function MathElement(){}
MathElement.prototype = {
  prev: null,
  next: null,
  parent: null,
  firstChild: null,
  lastChild: null,
  eachChild: function(fn) {
    for (var child = this.firstChild; child !== null; child = child.next)
      if (fn.call(child) === false) break;

    return this;
  },
  foldChildren: function(fold, fn) {
    this.eachChild(function() {
      fold = fn.call(this, fold);
    });
    return fold;
  },
  keydown: function(e) {
    return this.parent.keydown(e);
  },
  keypress: function(e) {
    return this.parent.keypress(e);
  }
};

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 * May be passed a MathFragment that's being replaced.
 */
function MathCommand(cmd, html_template, replacedFragment) {
  if (!arguments.length) return;

  this.cmd = cmd;
  if (html_template) {
    this.html_template = html_template;
  }

  this.jQ = $(this.html_template[0]).data('[[mathquill internal data]]', {cmd: this});
  this.initBlocks(replacedFragment);
}

MathCommand.prototype = $.extend(new MathElement, {
  initBlocks: function(replacedFragment) {
    //single-block commands
    if (this.html_template.length === 1) {
      this.firstChild =
      this.lastChild =
      this.jQ.data('[[mathquill internal data]]').block =
        (replacedFragment && replacedFragment.blockify()) || new MathBlock;

      this.firstChild.parent = this;
      this.firstChild.jQ = this.jQ.append(this.firstChild.jQ);
      return;
    }
    //otherwise, the succeeding elements of html_template should be child blocks
    var newBlock, prev, num_blocks = this.html_template.length;
    this.firstChild = newBlock = prev =
      (replacedFragment && replacedFragment.blockify()) || new MathBlock;

    newBlock.parent = this;
    newBlock.jQ = $(this.html_template[1]).
      data('[[mathquill internal data]]', {block: newBlock}).
      append(newBlock.jQ).
      appendTo(this.jQ)
    ;

    newBlock.blur();

    for (var i = 2; i < num_blocks; i += 1) {
      newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(this.html_template[i]).data('[[mathquill internal data]]',
        {block: newBlock}).appendTo(this.jQ);
      newBlock.blur();
    }
    this.lastChild = newBlock;
  },
  latex: function() {
    return this.foldChildren(this.cmd, function(latex){
      return latex + '{' + (this.latex() || ' ') + '}';
    });
  },
  remove: function() {
    if (this.prev) {
      this.prev.next = this.next;
    }
    else {
      this.parent.firstChild = this.next;
    }

    if (this.next) {
      this.next.prev = this.prev;
    }
    else {
      this.parent.lastChild = this.prev;
    }

    this.jQ.remove();

    return this;
  },
  //placeholder for context-sensitive spacing.
  respace: $.noop,
  placeCursor: function(cursor) {
    //append the cursor to the first empty child, or if none empty, the last one
    cursor.appendTo(this.foldChildren(this.firstChild, function(prev){
      return prev.isEmpty() ? prev : this;
    }));
  },
  isEmpty: function() {
    return this.foldChildren(true, function(isEmpty){
      return isEmpty && this.isEmpty();
    });
  }
});

/**
 * Lightweight command without blocks or children.
 */
function Symbol(cmd, html) {
  MathCommand.call(this, cmd, [ html ]);
}
Symbol.prototype = $.extend(new MathCommand, {
  initBlocks: $.noop,
  latex: function() {
    return this.cmd;
  },
  placeCursor: $.noop,
  isEmpty: function(){ return true; }
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
function MathBlock(){}
MathBlock.prototype = $.extend(new MathElement, {
  latex: function() {
    return this.foldChildren('', function(latex){
      return latex + this.latex();
    });
  },
  isEmpty: function() {
    return this.firstChild === null && this.lastChild === null;
  },
  focus: function(cursorJQ) {
    this.jQ.addClass('hasCursor');
    if (this.isEmpty()) {
      this.jQ.removeClass('empty').append(cursorJQ);
      return false;
    }
    return true;
  },
  blur: function() {
    this.jQ.removeClass('hasCursor');
    if (this.isEmpty())
      this.jQ.addClass('empty');

    return this;
  }
});

/**
 * An entity outside the Math DOM tree with one-way pointers (so it's only
 * a "view" of part of the tree, not an actual node/entity in the tree)
 * that delimit a list of symbols and operators.
 */
function MathFragment(parent, prev, next) {
  if (!arguments.length) return;

  this.parent = parent;
  this.prev = prev || null; //so you can do 'new MathFragment(block)' without
  this.next = next || null; //ending up with this.prev or this.next === undefined

  this.jQinit(this.fold($(), function(jQ){ return this.jQ.add(jQ); }));
}
MathFragment.prototype = {
  remove: MathCommand.prototype.remove,
  jQinit: function(children) {
    return this.jQ = children;
  },
  each: function(fn) {
    for (var el = (this.prev ? this.prev.next : this.parent.firstChild); el !== this.next; el = el.next)
      if (fn.call(el) === false) break;

    return this;
  },
  fold: function(fold, fn) {
    this.each(function() {
      fold = fn.call(this, fold);
    });
    return fold;
  },
  blockify: function() {
    var newBlock = new MathBlock;
    if (this.prev) {
      newBlock.firstChild = this.prev.next;
      this.prev.next = this.next;
    }
    else {
      newBlock.firstChild = this.parent.firstChild;
      this.parent.firstChild = this.next;
    }

    if (this.next) {
      newBlock.lastChild = this.next.prev;
      this.next.prev = this.prev;
    }
    else {
      newBlock.lastChild = this.parent.lastChild;
      this.parent.lastChild = this.prev;
    }

    newBlock.firstChild.prev = this.prev = null;
    newBlock.lastChild.next = this.next = null;

    this.parent = newBlock;
    this.each(function(){ this.parent = newBlock; });

    newBlock.jQ = this.jQ;

    return newBlock;
  }
};
