/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

var uuid = (function() {
  var id = 0;

  return function() { return id += 1; };
})();

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCmd's descend from it.
 */
var MathElement = P(function(_) {
  _.init = function(obj) {
    this.id = uuid();
    MathElement[this.id] = this;
  };
  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.firstChild = 0;
  _.lastChild = 0;

  _.toString = function() {
    return '[MathElement '+this.id+']';
  };

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
  _.jQ = $();
  _.jQadd = function(jQ) { this.jQ = this.jQ.add(jQ); };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var MathCmd = P(MathElement, function(_, _super) {
  _.init = function(ctrlSeq, htmlTemplate, textTemplate) {
    var cmd = this;

    _super.init.call(cmd);

    if (!cmd.ctrlSeq) cmd.ctrlSeq = ctrlSeq;
    if (htmlTemplate) cmd.htmlTemplate = htmlTemplate;
    if (textTemplate) cmd.textTemplate = textTemplate;
  };

  // obvious methods
  _.replaces = function(replacedFragment) {
    this.replacedFragment = replacedFragment;
  };
  _.isEmpty = function() {
    return this.foldChildren(true, function(isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  };

  // createBefore(cursor) and the methods it calls
  _.createBefore = function(cursor) {
    var cmd = this;

    if (cmd.htmlTemplate instanceof Array) {
      cmd.jQ = $(cmd.htmlTemplate[0]).attr(mqCmdId, cmd.id);
    }
    cmd.createBlocks();
    if (!(cmd.htmlTemplate instanceof Array)) {
      cmd.jQize();
      if (cmd.replacedFragment) {
        var firstBlock = cmd.firstChild,
          replacementBlock = cmd.replacedFragment.blockify();
        firstBlock.jQ.append(replacementBlock.jQ);
        // insert math tree contents of replacementBlock into firstBlock
        firstBlock.firstChild = replacementBlock.firstChild;
        firstBlock.lastChild = replacementBlock.lastChild;
        firstBlock.eachChild(function(child) {
          child.parent = firstBlock;
        });
      }
    }
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
  _.createBlocks = function() {
    var cmd = this,
      htmlTemplate = cmd.htmlTemplate,
      replacedFragment = cmd.replacedFragment;
    if (!(htmlTemplate instanceof Array)) {
      var prev = 0,
        numBlocks = cmd.numBlocks,
        blocks = cmd.blocks = Array(numBlocks);
      for (var i = 0; i < numBlocks; i += 1) {
        var newBlock = blocks[i] = prev.next = MathBlock();
        newBlock.parent = cmd;
        newBlock.prev = prev;
        newBlock.blur();
      }
      cmd.firstChild = blocks[0];
      cmd.lastChild = blocks[-1 + numBlocks];
      return;
    }
    //single-block commands
    if (htmlTemplate.length === 1) {
      cmd.firstChild =
      cmd.lastChild =
        (replacedFragment && replacedFragment.blockify()) || MathBlock();

      cmd.jQ.attr(mqBlockId, cmd.firstChild.id);

      cmd.firstChild.parent = cmd;
      cmd.firstChild.jQ = cmd.jQ.append(cmd.firstChild.jQ);

      return;
    }
    //otherwise, the succeeding elements of htmlTemplate should be child blocks
    var newBlock, prev, num_blocks = htmlTemplate.length;
    this.firstChild = newBlock = prev =
      (replacedFragment && replacedFragment.blockify()) || MathBlock();

    newBlock.parent = cmd;
    newBlock.jQ = $(htmlTemplate[1])
      .attr(mqBlockId, newBlock.id)
      .append(newBlock.jQ)
      .appendTo(cmd.jQ);

    newBlock.blur();

    for (var i = 2; i < num_blocks; i += 1) {
      newBlock = MathBlock();
      newBlock.parent = cmd;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(htmlTemplate[i])
        .attr(mqBlockId, newBlock.id)
        .appendTo(cmd.jQ);

      newBlock.blur();
    }
    cmd.lastChild = newBlock;
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
  _.respace = $.noop; //placeholder for context-sensitive spacing
  _.placeCursor = function(cursor) {
    //append the cursor to the first empty child, or if none empty, the last one
    cursor.appendTo(this.foldChildren(this.firstChild, function(prev, child) {
      return prev.isEmpty() ? prev : child;
    }));
  };

  // remove()
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

    (function deleteMe(me) {
      delete MathElement[me.id];
      me.eachChild(deleteMe);
    }(cmd));

    return cmd;
  };

  // methods to get a string representation of the math tree
  _.numBlocks = 1;
  _.htmlTemplate = '<span #mqCmdId #mqBlockId:0>#mqBlock:0</span>';
  _.html = function() {
    var cmd = this;
    return (cmd.htmlTemplate
      .replace(/#mqCmdId\b/g, 'mathquill-command-id=' + cmd.id)
      .replace(/#mqBlockId:(\d+)/g, function($0, $1) {
        return 'mathquill-block-id=' + cmd.blocks[$1].id;
      })
      .replace(/#mqBlock:(\d+)/g, function($0, $1) {
        return cmd.blocks[$1].join('html');
      })
    );
  };
  _.jQize = function() {
    $(this.html()).find('*').andSelf().each(function() {
      var jQ = $(this),
        cmdId = jQ.attr('mathquill-command-id'),
        blockId = jQ.attr('mathquill-block-id');
      if (cmdId) MathElement[cmdId].jQadd(jQ);
      if (blockId) MathElement[blockId].jQadd(jQ);
    });
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
    var frag = this;

    frag.first = first;
    frag.last = last || first; //just select one thing if only one argument

    frag.jQ = frag.fold($(), function(jQ, child){ return child.jQ.add(jQ); });
  }
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
    var frag = this,
      prev = frag.first.prev,
      next = frag.last.next,
      parent = frag.last.parent;

    if (prev)
      prev.next = next;
    else
      parent.firstChild = next;

    if (next)
      next.prev = prev;
    else
      parent.lastChild = prev;

    frag.detach = chainableNoop;

    return frag;
  };
  function chainableNoop(){ return this; };
  _.blockify = function() {
    var frag = this.detach();
      newBlock = MathBlock();
      first = newBlock.firstChild = frag.first,
      last = newBlock.lastChild = frag.last;

    first.prev = 0;
    last.next = 0;

    frag.each(function(el){ el.parent = newBlock; });

    newBlock.jQ = frag.jQ;

    return newBlock;
  };
});
