/**
 * Copyright 2010 Jay and Han (laughinghan@gmail.com)
 * License, Usage and Readme at http://mathquill.com
 */
(function($){ //takes in the jQuery function as an argument

var _, //temp variable of prototypes
  undefined,
  jQueryDataKey = '[[mathquill internal data]]';

/*************************************************
 * Helper functions
 ************************************************/   
var glyphs={
  //Each glyph is 2000px tall and centered horizontally at 0.
  "(":{
    d:"M 259,19.313304 Q 259,0 238.62318,0 226.82609,0 189.28985,31.115879 -53.08695,230.68668 -156.04347,456.00855 -259,681.33044 -259,999.9999 q 0,318.6696 102.95653,543.9915 102.95652,225.3219 345.33332,424.8927 Q 226.82609,2000 238.62318,2000 259,2000 259,1980.6867 q 0,-8.5837 -25.73913,-34.3348 -321.73913,-316.5236 -321.73913,-946.352 0,-629.82825 321.73913,-946.351844 Q 259,27.896995 259,19.313304 z",
    attr:{
      fill:'#000',
      stroke:'none'
    },
    width:15
  },
  ")":{
    d:"M -259,19.313304 Q -259,0 -238.62318,0 -226.82609,0 -189.28985,31.115879 53.08695,230.68668 156.04347,456.00855 259,681.33044 259,999.9999 259,1318.6695 156.04347,1543.9914 53.08695,1769.3133 -189.28985,1968.8841 -226.82609,2000 -238.62318,2000 -259,2000 -259,1980.6867 q 0,-8.5837 25.73913,-34.3348 321.73913,-316.5236 321.73913,-946.352 0,-629.82825 -321.73913,-946.351844 Q -259,27.896995 -259,19.313304 z",
    attr:{
      fill:'#000',
      stroke:'none'
    },
    width:15
  },
  "[":{
    d:"m 195,50 -390,0 0,1900 390,0",
    width:20,
    attr:{
      'stroke-width':1,
      'stroke-linecap':'round',
      'stroke-linejoin':'miter',
      'stroke-miterlimit':4,
      'stroke-opacity':1,
      'stroke-dasharray':''
    }
  },
  "]":{
    d:"m -195,50 390,0 0,1900 -390,0",
    width:20,
    attr:{
      'stroke-width':1,
      'stroke-linecap':'round',
      'stroke-linejoin':'miter',
      'stroke-miterlimit':4,
      'stroke-opacity':1,
      'stroke-dasharray':''
    }
  },
  "{":{
    d:"M 400,24.678112 Q 400,0 354.88309,0 163.41129,0 41.26547,83.690988 -39.06464,138.41202 -61.07289,208.15451 -75.37825,253.21889 -75.37825,368.02575 v 335.83691 q 0,125.53649 -79.22971,194.20605 -79.22973,68.66948 -209.07842,78.32613 Q -400,978.54077 -400,998.92703 q 0,20.38627 19.80743,23.60517 19.80743,3.2189 38.51444,4.2918 266.29988,33.2618 266.29988,270.3863 v 335.8369 q 0,114.8069 14.30536,159.8713 22.00825,69.7424 102.33836,124.4635 Q 161.21045,2000 354.88309,2000 400,2000 400,1978.0043 q 0,-21.9957 -19.80742,-26.2876 -169.46355,-9.6566 -260.79781,-100.8583 -46.21733,-46.1374 -59.42228,-122.3176 -5.50206,-36.4807 -5.50206,-138.412 v -297.2103 q 0,-95.4936 -23.10867,-141.631 Q -20.35762,1048.2833 -190.92159,999.99999 -20.35762,951.71673 31.36176,848.71245 54.47043,803.64807 54.47043,708.15451 v -297.2103 q 0,-101.93133 5.50206,-138.41202 13.20495,-76.18026 59.42228,-122.3176 Q 210.72903,59.012876 380.19258,49.356223 400,45.064378 400,24.678112 z",
    width:20,
    attr:{
      fill:'#000',
      stroke:'none'
    }
  },
  "|":{
    d:"M 0,50 0,1950",
    width:10,
    attr:{
      'stroke-width':1,
      'stroke-linecap':'round',
      'stroke-linejoin':'miter',
      'stroke-miterlimit':4,
      'stroke-opacity':1,
      'stroke-dasharray':''
    }
  },
  "}":{
    d:"M -400,24.678112 Q -400,0 -354.88309,0 -163.41129,0 -41.26547,83.690988 39.06464,138.41202 61.07289,208.15451 75.37825,253.21889 75.37825,368.02575 v 335.83691 q 0,125.53649 79.22971,194.20605 79.22973,68.66948 209.07842,78.32613 Q 400,978.54077 400,998.92703 q 0,20.38627 -19.80743,23.60517 -19.80743,3.2189 -38.51444,4.2918 -266.29988,33.2618 -266.29988,270.3863 v 335.8369 q 0,114.8069 -14.30536,159.8713 Q 39.06464,1862.6609 -41.26547,1917.382 -161.21045,2000 -354.88309,2000 -400,2000 -400,1978.0043 q 0,-21.9957 19.80742,-26.2876 169.46355,-9.6566 260.79781,-100.8583 46.21733,-46.1374 59.42228,-122.3176 5.50206,-36.4807 5.50206,-138.412 v -297.2103 q 0,-95.4936 23.10867,-141.631 Q 20.35762,1048.2833 190.92159,999.99999 20.35762,951.71673 -31.36176,848.71245 -54.47043,803.64807 -54.47043,708.15451 v -297.2103 q 0,-101.93133 -5.50206,-138.41202 -13.20495,-76.18026 -59.42228,-122.3176 Q -210.72903,59.012876 -380.19258,49.356223 -400,45.064378 -400,24.678112 z",
    width:20,
    attr:{
      fill:'#000',
      stroke:'none'
    }
  },
  "&lang;":{
    d:"m 211,43 -422,957 422,957",
    attr:{
      'stroke-width':1,
      'stroke-linecap':'round',
      'stroke-linejoin':'miter',
      'stroke-miterlimit':4,
      'stroke-opacity':1,
      'stroke-dasharray':''
    },
    width:20
  },
  "&rang;":{
    d:"m -211,43 422,957 -422,957",
    attr:{
      'stroke-width':1,
      'stroke-linecap':'round',
      'stroke-linejoin':'miter',
      'stroke-miterlimit':4,
      'stroke-opacity':1,
      'stroke-dasharray':''
    },
    width:20
  }
}
Raphael.fn.bracket = function(character,height) {
  var g = glyphs[character];
  return this.path(g.d).attr(g.attr).scale(g.width/2000,height/2000,4,0);
};

Raphael.el.bracketResize = function(character, height) {
  var g = glyphs[character];
  return this.scale(g.width/2000,height/2000,4,0);
};
/*************************************************
 * Abstract base classes of blocks and commands.
 ************************************************/

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCommand's descend from it.
 */
function MathElement(){}
_ = MathElement.prototype;
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
_.keydown = function(e) {
  return this.parent.keydown(e);
};
_.textInput = function(ch) {
  return this.parent.textInput(ch);
};

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 * May be passed a MathFragment that's being replaced.
 */
function MathCommand(cmd, html_template, text_template, replacedFragment) {
  if (!arguments.length) return;
  var self = this; // minifier optimization

  self.cmd = cmd;
  if (html_template) self.html_template = html_template;
  if (text_template) self.text_template = text_template;

  self.jQ = $(self.html_template[0]).data(jQueryDataKey, {cmd: self});
  self.initBlocks(replacedFragment);
}

_ = MathCommand.prototype = new MathElement;
_.initBlocks = function(replacedFragment) {
  var self = this;
  //single-block commands
  if (self.html_template.length === 1) {
    self.firstChild =
    self.lastChild =
    self.jQ.data(jQueryDataKey).block =
      (replacedFragment && replacedFragment.blockify()) || new MathBlock;

    self.firstChild.parent = self;
    self.firstChild.jQ = self.jQ.append(self.firstChild.jQ);

    return;
  }
  //otherwise, the succeeding elements of html_template should be child blocks
  var newBlock, prev, num_blocks = self.html_template.length;
  this.firstChild = newBlock = prev =
    (replacedFragment && replacedFragment.blockify()) || new MathBlock;

  newBlock.parent = self;
  newBlock.jQ = $(self.html_template[1])
    .data(jQueryDataKey, {block: newBlock})
    .append(newBlock.jQ)
    .appendTo(self.jQ);

  newBlock.blur();

  for (var i = 2; i < num_blocks; i += 1) {
    newBlock = new MathBlock;
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

/**
 * Lightweight command without blocks or children.
 */
function Symbol(cmd, html, text) {
  MathCommand.call(this, cmd, [ html ],
    [ text || (cmd && cmd.length > 1 ? cmd.slice(1) : cmd) ]);
}
_ = Symbol.prototype = new MathCommand;
_.initBlocks = $.noop;
_.latex = function(){ return this.cmd; };
_.text = function(){ return this.text_template; };
_.placeCursor = $.noop;
_.isEmpty = function(){ return true; };

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
function MathBlock(){}
_ = MathBlock.prototype = new MathElement;
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

/**
 * An entity outside the Math DOM tree with one-way pointers (so it's only
 * a "view" of part of the tree, not an actual node/entity in the tree)
 * that delimit a list of symbols and operators.
 */
function MathFragment(parent, prev, next) {
  if (!arguments.length) return;

  var self = this;

  self.parent = parent;
  self.prev = prev || 0; //so you can do 'new MathFragment(block)' without
  self.next = next || 0; //ending up with this.prev or this.next === undefined

  self.jQinit(self.fold($(), function(jQ, child){ return child.jQ.add(jQ); }));
}
_ = MathFragment.prototype;
_.remove= MathCommand.prototype.remove;
_.jQinit = function(children) {
  this.jQ = children;
};
_.each = function(fn) {
  for (var el = this.prev.next || this.parent.firstChild; el !== this.next; el = el.next)
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
_.blockify = function() {
  var self = this,
      prev = self.prev,
      next = self.next,
      parent = self.parent,
      newBlock = new MathBlock,
      newFirstChild = newBlock.firstChild = prev.next || parent.firstChild,
      newLastChild = newBlock.lastChild = next.prev || parent.lastChild;

  if (prev)
    prev.next = next;
  else
    parent.firstChild = next;

  if (next)
    next.prev = prev;
  else
    parent.lastChild = prev;

  newFirstChild.prev = self.prev = 0;
  newLastChild.next = self.next = 0;

  self.parent = newBlock;
  self.each(function(el){ el.parent = newBlock; });

  newBlock.jQ = self.jQ;

  return newBlock;
};

/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox)
    jQ.addClass('mathquill-rendered-math');

  root.jQ = jQ.data(jQueryDataKey, {
    block: root,
    revert: function() {
      jQ.empty().unbind('.mathquill')
        .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
        .append(contents);
    }
  });

  var cursor = root.cursor = new Cursor(root);

  root.renderLatex(contents.text());

  if (!editable) //if static, quit once we render the LaTeX
    return;

  root.textarea = $('<span class="textarea"><textarea></textarea></span>')
    .prependTo(jQ.addClass('mathquill-editable'));
  var textarea = root.textarea.children();
  if (textbox)
    jQ.addClass('mathquill-textbox');

  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.appendTo(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged);
    } else
      cursor.show();
    e.stopPropagation();
  }).blur(function(e) {
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
    e.stopPropagation();
  });

  //trigger virtual textInput event (see Wiki page "Keyboard Events")
  function textInput() {
    if (skipTextInput) return;
    var text = textarea.val();
    if (!text) return;
    textarea.val('');
    // textarea can contain more than one character
    // when typing quickly on slower platforms;
    // so process each character separately
    for (var i=0; i<text.length; i++) {
        cursor.parent.textInput(text[i]);
    }
  }

  //see Wiki page "Keyboard Events"
  var lastKeydn = {}, skipTextInput = false;
  jQ.bind('focus.mathquill blur.mathquill', function(e) {
    textarea.trigger(e);
  }).bind('keydown.mathquill', function(e) {
    lastKeydn.evt = e;
    lastKeydn.happened = true;
    if (cursor.parent.keydown(e) === false)
      e.preventDefault();
  }).bind('keypress.mathquill', function(e) {
    //on auto-repeated key events, keypress may get triggered but not keydown
    if (lastKeydn.happened)
      lastKeydn.happened = false;
    else
      cursor.parent.keydown(lastKeydn.evt);

    //after keypress event, trigger virtual textInput event if text was
    //input to textarea
    skipTextInput = false;
    setTimeout(textInput);
  }).bind('mousedown.mathquill', function(e) {
    cursor.seek($(e.target), e.pageX, e.pageY).blink = $.noop;

    anticursor = new Cursor(root);
    anticursor.jQ = anticursor._jQ = $();
    if (cursor.next)
      anticursor.insertBefore(cursor.next);
    else
      anticursor.appendTo(cursor.parent);

    jQ.mousemove(mousemove);
    $(document).mousemove(docmousemove).mouseup(mouseup);

    setTimeout(function(){textarea.focus();});
  }).bind('cut', function() {
    if (cursor.selection)
      cursor.deleteSelection();
  }).bind('copy', function() {
    skipTextInput = true;
  }).bind('paste', function() {
    skipTextInput = true;
    setTimeout(function() {
      cursor.writeLatex(textarea.val()).clearSelection();
    });
  }).bind('selectstart.mathquill', function(e) {
    if (e.target != textarea[0])
      e.preventDefault();
    e.stopPropagation();
  }).blur();

  root.selectionChanged = function() {
    var latex = cursor.selection ? cursor.selection.latex() : '';
    textarea.val(latex);
    if (textarea[0].select)
      textarea[0].select();
    else if (document.selection) {
      var range = textarea[0].createTextRange();
      range.expand('textedit');
      range.select();
    }
  };

  function mousemove(e) {
    cursor.seek($(e.target), e.pageX, e.pageY);

    if (cursor.prev === anticursor.prev && cursor.parent === anticursor.parent)
      cursor.clearSelection();
    else
      cursor.selectFrom(anticursor);

    return false;
  }
  function docmousemove(e) {
    delete e.target;
    return mousemove(e);
  }
  function mouseup(e) {
    anticursor = undefined;
    cursor.blink = blink;
    if (!cursor.selection) cursor.show();
    jQ.unbind('mousemove', mousemove);
    $(document).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
  }

  var anticursor, blink = cursor.blink;
}

function RootMathBlock(){}
_ = RootMathBlock.prototype = new MathBlock;
_.latex = function() {
  return MathBlock.prototype.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
};
_.text = function() {
  return this.foldChildren('', function(text, child) {
    return text + child.text();
  });
};
_.renderLatex = function(latex) {
  this.jQ.children().slice(1).remove();
  this.firstChild = this.lastChild = 0;
  this.cursor.appendTo(this).writeLatex(latex);
  this.blur();
};
_.keydown = function(e)
{
  e.ctrlKey = e.ctrlKey || e.metaKey;
  switch ((e.originalEvent && e.originalEvent.keyIdentifier) || e.which) {
  case 8: //backspace
  case 'Backspace':
  case 'U+0008':
    if (e.ctrlKey)
      while (this.cursor.prev || this.cursor.selection)
        this.cursor.backspace();
    else
      this.cursor.backspace();
    break;
  case 27: //may as well be the same as tab until we figure out what to do with it
  case 'Esc':
  case 'U+001B':
  case 9: //tab
  case 'Tab':
  case 'U+0009':
    if (e.ctrlKey) break;

    var parent = this.cursor.parent;
    if (e.shiftKey) { //shift+Tab = go one block left if it exists, else escape left.
      if (parent === this) //cursor is in root editable, continue default
        return this.skipTextInput = true;
      else if (parent.prev) //go one block left
        this.cursor.appendTo(parent.prev);
      else //get out of the block
        this.cursor.insertBefore(parent.parent);
    }
    else { //plain Tab = go one block right if it exists, else escape right.
      if (parent === this) //cursor is in root editable, continue default
        return this.skipTextInput = true;
      else if (parent.next) //go one block right
        this.cursor.prependTo(parent.next);
      else //get out of the block
        this.cursor.insertAfter(parent.parent);
    }

    this.cursor.clearSelection();
    break;
  case 13: //enter
  case 'Enter':
    break;
  case 35: //end
  case 'End':
    if (e.shiftKey)
      while (this.cursor.next || (e.ctrlKey && this.cursor.parent !== this))
        this.cursor.selectRight();
    else //move to the end of the root block or the current block.
      this.cursor.clearSelection().appendTo(e.ctrlKey ? this : this.cursor.parent);
    break;
  case 36: //home
  case 'Home':
    if (e.shiftKey)
      while (this.cursor.prev || (e.ctrlKey && this.cursor.parent !== this))
        this.cursor.selectLeft();
    else //move to the start of the root block or the current block.
      this.cursor.clearSelection().prependTo(e.ctrlKey ? this : this.cursor.parent);
    break;
  case 37: //left
  case 'Left':
    if (e.ctrlKey) break;

    if (e.shiftKey)
      this.cursor.selectLeft();
    else
      this.cursor.moveLeft();
    break;
  case 38: //up
  case 'Up':
    if (e.ctrlKey) break;

    if (e.shiftKey) {
      if (this.cursor.prev)
        while (this.cursor.prev)
          this.cursor.selectLeft();
      else
        this.cursor.selectLeft();
    }
    else if (this.cursor.parent.prev)
      this.cursor.clearSelection().appendTo(this.cursor.parent.prev);
    else if (this.cursor.prev)
      this.cursor.clearSelection().prependTo(this.cursor.parent);
    else if (this.cursor.parent !== this)
      this.cursor.clearSelection().insertBefore(this.cursor.parent.parent);
    break;
  case 39: //right
  case 'Right':
    if (e.ctrlKey) break;

    if (e.shiftKey)
      this.cursor.selectRight();
    else
      this.cursor.moveRight();
    break;
  case 40: //down
  case 'Down':
    if (e.ctrlKey) break;

    if (e.shiftKey) {
      if (this.cursor.next)
        while (this.cursor.next)
          this.cursor.selectRight();
      else
        this.cursor.selectRight();
    }
    else if (this.cursor.parent.next)
      this.cursor.clearSelection().prependTo(this.cursor.parent.next);
    else if (this.cursor.next)
      this.cursor.clearSelection().appendTo(this.cursor.parent);
    else if (this.cursor.parent !== this)
      this.cursor.clearSelection().insertAfter(this.cursor.parent.parent);
    break;
  case 46: //delete
  case 'Del':
  case 'U+007F':
    if (e.ctrlKey)
      while (this.cursor.next || this.cursor.selection)
        this.cursor.deleteForward();
    else
      this.cursor.deleteForward();
    break;
  case 65: //the 'A' key, as in Ctrl+A Select All
  case 'A':
  case 'U+0041':
    if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (this !== this.cursor.root) //so not stopPropagation'd at RootMathCommand
        return this.parent.keydown(e);

      this.cursor.clearSelection().appendTo(this);
      while (this.cursor.prev)
        this.cursor.selectLeft();
      break;
    }
  default:
    this.skipTextInput = false;
    return true;
  }
  this.skipTextInput = true;
  return false;
};
_.textInput = function(ch) {
  if (!this.skipTextInput)
    this.cursor.write(ch);
};

function RootMathCommand(cursor) {
  MathCommand.call(this, '$');
  this.firstChild.cursor = cursor;
  this.firstChild.textInput = function(ch) {
    if (this.skipTextInput) return;

    if (ch !== '$' || cursor.parent !== this)
      cursor.write(ch);
    else if (this.isEmpty()) {
      cursor.insertAfter(this.parent).backspace()
        .insertNew(new VanillaSymbol('\\$','$')).show();
    }
    else if (!cursor.next)
      cursor.insertAfter(this.parent);
    else if (!cursor.prev)
      cursor.insertBefore(this.parent);
    else
      cursor.write(ch);
  };
}
_ = RootMathCommand.prototype = new MathCommand;
_.html_template = ['<span class="mathquill-rendered-math"></span>'];
_.initBlocks = function() {
  this.firstChild =
  this.lastChild =
  this.jQ.data(jQueryDataKey).block =
    new RootMathBlock;

  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ;
};
_.latex = function() {
  return '$' + this.firstChild.latex() + '$';
};

function RootTextBlock(){}
_ = RootTextBlock.prototype = new MathBlock;
_.renderLatex = function(latex) {
  var self = this, cursor = self.cursor;
  self.jQ.children().slice(1).remove();
  self.firstChild = self.lastChild = 0;
  cursor.show().appendTo(self);

  latex = latex.match(/(?:\\\$|[^$])+|\$(?:\\\$|[^$])*\$|\$(?:\\\$|[^$])*$/g) || '';
  for (var i = 0; i < latex.length; i += 1) {
    var chunk = latex[i];
    if (chunk[0] === '$') {
      if (chunk[-1+chunk.length] === '$' && chunk[-2+chunk.length] !== '\\')
        chunk = chunk.slice(1, -1);
      else
        chunk = chunk.slice(1);

      var root = new RootMathCommand(cursor);
      cursor.insertNew(root);
      root.firstChild.renderLatex(chunk);
      cursor.show().insertAfter(root);
    }
    else {
      for (var j = 0; j < chunk.length; j += 1)
        this.cursor.insertNew(new VanillaSymbol(chunk[j]));
    }
  }
};
_.keydown = RootMathBlock.prototype.keydown;
_.textInput = function(ch) {
  if (this.skipTextInput) return;

  this.cursor.deleteSelection();
  if (ch === '$')
    this.cursor.insertNew(new RootMathCommand(this.cursor));
  else
    this.cursor.insertNew(new VanillaSymbol(ch));
};

/***************************
 * Commands and Operators.
 **************************/

var CharCmds = {}, LatexCmds = {}; //single character commands, LaTeX commands

function proto(parent, child) { //shorthand for prototyping
  child.prototype = parent.prototype;
  return child;
}

function SupSub(cmd, html, text, replacedFragment) {
  MathCommand.call(this, cmd, [ html ], [ text ], replacedFragment);
}
_ = SupSub.prototype = new MathCommand;
_.latex = function() {
  var latex = this.firstChild.latex();
  if (latex.length === 1)
    return this.cmd + latex;
  else
    return this.cmd + '{' + (latex || ' ') + '}';
};
_.redraw = function() {
  console.log('Redrawing',this.cmd);
  this.respace();
  if (this.next)
    this.next.respace();
  if (this.prev) {
    this.prev.respace();
  }
};
_.respace = function() {
  if (
    this.prev.cmd === '\\int ' || (
      this.prev instanceof SupSub && this.prev.cmd != this.cmd &&
      this.prev.prev && this.prev.prev.cmd === '\\int '
    )
  ) {
    if (!this.limit) {
      this.limit = true;
      this.jQ.addClass('limit');
    }
  }
  else {
    if (this.limit) {
      this.limit = false;
      this.jQ.removeClass('limit');
    }
  }
  var tall_element
  if( this.prev && (tall_element=this.prev.jQ).hasClass('tall-element') || (this.prev &&
      ( (this.prev.cmd==='_' || this.prev.cmd==='^') && this.prev.prev.jQ && (tall_element=this.prev.prev.jQ).hasClass('tall-element'))) ){
    if(this.cmd==='^') {
      this.jQ.css('vertical-align',tall_element.height()/2-4);
    } else {
      this.jQ.css('vertical-align',-tall_element.height()/2+6);
    }
  } else {
    this.jQ.css('vertical-align','');
  }

  if (this.respaced = this.prev instanceof SupSub && this.prev.cmd != this.cmd && !this.prev.respaced) {
    if (this.limit && this.cmd === '_') {
      this.jQ.css({
        left: -.25-this.prev.jQ.outerWidth()/+this.jQ.css('fontSize').slice(0,-2)+'em',
        marginRight: .1-Math.min(this.jQ.outerWidth(), this.prev.jQ.outerWidth())/+this.jQ.css('fontSize').slice(0,-2)+'em' //1px adjustment very important!
      });
    }
    else {
      this.jQ.css({
        left: -this.prev.jQ.outerWidth()/+this.jQ.css('fontSize').slice(0,-2)+'em',
        marginRight: .1-Math.min(this.jQ.outerWidth(), this.prev.jQ.outerWidth())/+this.jQ.css('fontSize').slice(0,-2)+'em' //1px adjustment very important!
      });
    }
  }
  else if (this.limit && this.cmd === '_') {
    this.jQ.css({
      left: '-.25em',
      marginRight: ''
    });
  }
  else {
    this.jQ.css({
      left: '',
      marginRight: ''
    });
  }

  return this;
};

LatexCmds.subscript = LatexCmds._ = proto(SupSub, function(replacedFragment) {
  SupSub.call(this, '_', '<sub></sub>', '_', replacedFragment);
});

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = proto(SupSub, function(replacedFragment) {
  SupSub.call(this, '^', '<sup></sup>', '**', replacedFragment);
});

function Fraction(replacedFragment) {
  MathCommand.call(this, '\\frac', undefined, undefined, replacedFragment);
  this.jQ.append('<span style="width:0">&nbsp;</span>');
}
_ = Fraction.prototype = new MathCommand;
_.html_template = [
  '<span class="fraction"></span>',
  '<span class="numerator"></span>',
  '<span class="denominator"></span>'
];
_.text_template = ['(', '/', ')'];

LatexCmds.frac = LatexCmds.fraction = Fraction;

function LiveFraction() {
  Fraction.apply(this, arguments);
}
_ = LiveFraction.prototype = new Fraction;
_.placeCursor = function(cursor) { //TODO: better architecture so this can be done more cleanly, highjacking MathCommand::placeCursor doesn't seem like the right place to do this
  if (this.firstChild.isEmpty()) {
    var prev = this.prev;
    while (prev &&
      !(
        prev instanceof BinaryOperator ||
        prev instanceof TextBlock ||
        prev instanceof BigSymbol
      ) //lookbehind for operator
    )
      prev = prev.prev;

    if (prev instanceof BigSymbol && prev.next instanceof SupSub) {
      prev = prev.next;
      if (prev.next instanceof SupSub && prev.next.cmd != prev.cmd)
        prev = prev.next;
    }

    if (prev !== this.prev) { //FIXME: major Law of Demeter violation, shouldn't know here that MathCommand::initBlocks does some initialization that MathFragment::blockify doesn't
      var newBlock = new MathFragment(this.parent, prev, this).blockify();
      newBlock.jQ = this.firstChild.jQ.empty().removeClass('empty').append(newBlock.jQ).data(jQueryDataKey, { block: newBlock });
      newBlock.next = this.lastChild;
      newBlock.parent = this;
      this.firstChild = this.lastChild.prev = newBlock;
    }
  }
  cursor.appendTo(this.lastChild);
};

CharCmds['/'] = LiveFraction;

function SquareRoot(replacedFragment) {
  MathCommand.call(this, '\\sqrt', undefined, undefined, replacedFragment);
}
_ = SquareRoot.prototype = new MathCommand;
_.html_template = [
  '<span><span class="sqrt-prefix">&radic;</span></span>',
  '<span class="sqrt-stem"></span>'
];
_.text_template = ['sqrt(', ')'];
_.redraw = function() {
  var block = this.lastChild.jQ, height = block.outerHeight(true);
  block.css({
    borderTopWidth: height/28+1 // NOTE: Formula will need to change if our font isn't Symbola
  }).prev().css({
    fontSize: .9*height/+block.css('fontSize').slice(0,-2)+'em'
  });
};

LatexCmds.sqrt = LatexCmds['v'] = SquareRoot;

function NthRoot(replacedFragment) {
  SquareRoot.call(this, replacedFragment);
  this.jQ = this.firstChild.jQ.detach().add(this.jQ);
}
_ = NthRoot.prototype = new SquareRoot;
_.html_template = [
  '<span><span class="sqrt-prefix">&radic;</span></span>',
  '<sup class="nthroot"></sup>',
  '<span class="sqrt-stem"></span>'
];
_.text_template = ['sqrt[', '](', ')'];
_.latex = function() {
  return '\\sqrt['+this.firstChild.latex()+']{'+this.lastChild.latex()+'}';
};

LatexCmds.nthroot = NthRoot;

/************************************************************
 * Bracket code.
 ************************************************************/

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
function Bracket(open, close, cmd, end, replacedFragment) {
  if (open) {
    this.open=open; 
    this.close=close;
  }
  MathCommand.call(this, '\\left'+cmd,
    ['<span><span class="paren open"></span><span></span><span class="paren close"></span></span>'],
    [open, close],
    replacedFragment);
  this.end = '\\right'+end;
}
_ = Bracket.prototype = new MathCommand;
_.initBlocks = function(replacedFragment) { //FIXME: possible Law of Demeter violation, hardcore MathCommand::initBlocks knowledge needed here
  this.firstChild = this.lastChild =
    (replacedFragment && replacedFragment.blockify()) || new MathBlock;
  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ.children(':eq(1)')
    .data(jQueryDataKey, {block: this.firstChild})
    .append(this.firstChild.jQ);
  
  if(this.open) {
    var block = this.firstChild.jQ;
    var start = Raphael(block.prev()[0], 8, 20);
    var start_path=start.bracket(this.open,20);
    var end = Raphael(block.next()[0], 8, 20);
    var end_path=end.bracket(this.close,20);
   
    this.raphael = {};
    this.raphael.start=start;
    this.raphael.startBracket = start_path;
    this.raphael.end=end;
    this.raphael.endBracket = end_path;
  }
};
_.latex = function() {
  return this.cmd + this.firstChild.latex() + this.end;
};
_.redraw = function() {
  var block = this.firstChild.jQ;
  
  this.raphael.start.setSize(8,block.height()+2); //Resize the vector spaces
  this.raphael.end.setSize(8,block.height()+2);
  
  //Resize the brackets in the vector spaces
  this.raphael.startBracket.bracketResize(this.open,block.height());
  this.raphael.endBracket.bracketResize(this.close,block.height());
  
  //Resize the actual html elements
  block.prev().add(block.next()).height(block.outerHeight());
  if(block.outerHeight() > 30) {
    block.parent().addClass('tall-element');
  } else {
    block.parent().removeClass('tall-element');
  }
};

LatexCmds.lbrace = CharCmds['{'] = proto(Bracket, function(replacedFragment) {
  Bracket.call(this, '{', '}', '\\{', '\\}', replacedFragment);
});
LatexCmds.langle = LatexCmds.lang = proto(Bracket, function(replacedFragment) {
  Bracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ',replacedFragment);
});

// Closing bracket matching opening bracket above
function CloseBracket(open, close, cmd, end, replacedFragment) {
  Bracket.apply(this, arguments);
}
_ = CloseBracket.prototype = new Bracket;
_.placeCursor = function(cursor) {
  //if I'm at the end of my parent who is a matching open-paren, and I was not passed
  //  a selection fragment, get rid of me and put cursor after my parent
  if (!this.next && this.parent.parent && this.parent.parent.end === this.end && this.firstChild.isEmpty())
    cursor.backspace().insertAfter(this.parent.parent);
  else
    this.firstChild.blur();
};

LatexCmds.rbrace = CharCmds['}'] = proto(CloseBracket, function(replacedFragment) {
  CloseBracket.call(this, '{','}','\\{','\\}',replacedFragment);
});
LatexCmds.rangle = LatexCmds.rang = proto(CloseBracket, function(replacedFragment) {
  CloseBracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ',replacedFragment);
});

function Paren(open, close, replacedFragment) {
  Bracket.call(this, open, close, open, close, replacedFragment);
}
Paren.prototype = Bracket.prototype;

LatexCmds.lparen = CharCmds['('] = proto(Paren, function(replacedFragment) {
  Paren.call(this, '(', ')', replacedFragment);
});
LatexCmds.lbrack = LatexCmds.lbracket = CharCmds['['] = proto(Paren, function(replacedFragment) {
  Paren.call(this, '[', ']', replacedFragment);
});

function CloseParen(open, close, replacedFragment) {
  CloseBracket.call(this, open, close, open, close, replacedFragment);
}
CloseParen.prototype = CloseBracket.prototype;

LatexCmds.rparen = CharCmds[')'] = proto(CloseParen, function(replacedFragment) {
  CloseParen.call(this, '(', ')', replacedFragment);
});
LatexCmds.rbrack = LatexCmds.rbracket = CharCmds[']'] = proto(CloseParen, function(replacedFragment) {
  CloseParen.call(this, '[', ']', replacedFragment);
});

function Pipes(replacedFragment) {
  Paren.call(this, '|', '|', replacedFragment);
}
_ = Pipes.prototype = new Paren;
_.placeCursor = function(cursor) {
  if (!this.next && this.parent.parent && this.parent.parent.end === this.end && this.firstChild.isEmpty())
    cursor.backspace().insertAfter(this.parent.parent);
  else
    cursor.appendTo(this.firstChild);
};

LatexCmds.lpipe = LatexCmds.rpipe = CharCmds['|'] = Pipes;
/************************************************************
 * End of bracket code.
 ************************************************************/

function TextBlock(replacedText) {
  if (replacedText instanceof MathFragment)
    this.replacedText = replacedText.remove().jQ.text();
  else if (typeof replacedText === 'string')
    this.replacedText = replacedText;

  MathCommand.call(this, '\\text');
}
_ = TextBlock.prototype = new MathCommand;
_.html_template = ['<span class="text"></span>'];
_.text_template = ['"', '"'];
_.initBlocks = function() { //FIXME: another possible Law of Demeter violation, but this seems much cleaner, like it was supposed to be done this way
  this.firstChild =
  this.lastChild =
  this.jQ.data(jQueryDataKey).block = new InnerTextBlock;

  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ.append(this.firstChild.jQ);
};
_.placeCursor = function(cursor) { //TODO: this should be done in the constructor that's passed replacedFragment, but you need the cursor to create new characters and insert them
  (this.cursor = cursor).appendTo(this.firstChild);

  if (this.replacedText)
    for (var i = 0; i < this.replacedText.length; i += 1)
      this.write(this.replacedText.charAt(i));
};
_.write = function(ch) {
  this.cursor.insertNew(new VanillaSymbol(ch));
};
_.keydown = function(e) {
  //backspace and delete and ends of block don't unwrap
  if (!this.cursor.selection &&
    (
      (e.which === 8 && !this.cursor.prev) ||
      (e.which === 46 && !this.cursor.next)
    )
  ) {
    if (this.isEmpty())
      this.cursor.insertAfter(this);
    return false;
  }
  return this.parent.keydown(e);
};
_.textInput = function(ch) {
  this.cursor.deleteSelection();
  if (ch !== '$')
    this.write(ch);
  else if (this.isEmpty())
    this.cursor.insertAfter(this).backspace().insertNew(new VanillaSymbol('\\$','$'));
  else if (!this.cursor.next)
    this.cursor.insertAfter(this);
  else if (!this.cursor.prev)
    this.cursor.insertBefore(this);
  else { //split apart
    var next = new TextBlock(new MathFragment(this.firstChild, this.cursor.prev));
    next.placeCursor = function(cursor) { //FIXME HACK: pretend no prev so they don't get merged
      this.prev = 0;
      delete this.placeCursor;
      this.placeCursor(cursor);
    };
    next.firstChild.focus = function(){ return this; };
    this.cursor.insertAfter(this).insertNew(next);
    next.prev = this;
    this.cursor.insertBefore(next);
    delete next.firstChild.focus;
  }
};
function InnerTextBlock(){}
_ = InnerTextBlock.prototype = new MathBlock;
_.blur = function() {
  this.jQ.removeClass('hasCursor');
  if (this.isEmpty()) {
    var textblock = this.parent, cursor = textblock.cursor;
    if (cursor.parent === this)
      this.jQ.addClass('empty');
    else {
      cursor.hide();
      textblock.remove();
      if (cursor.next === textblock)
        cursor.next = textblock.next;
      else if (cursor.prev === textblock)
        cursor.prev = textblock.prev;

      cursor.show().redraw();
    }
  }
  return this;
};
_.focus = function() {
  MathBlock.prototype.focus.call(this);

  var textblock = this.parent;
  if (textblock.next instanceof TextBlock) { //TODO: seems like there should be a better way to move MathElements around
    var innerblock = this,
      cursor = textblock.cursor,
      next = textblock.next.firstChild;

    next.eachChild(function(child){
      child.parent = innerblock;
      child.jQ.appendTo(innerblock.jQ);
    });

    if (this.lastChild)
      this.lastChild.next = next.firstChild;
    else
      this.firstChild = next.firstChild;

    next.firstChild.prev = this.lastChild;
    this.lastChild = next.lastChild;

    next.parent.remove();

    if (cursor.prev)
      cursor.insertAfter(cursor.prev);
    else
      cursor.prependTo(this);

    cursor.redraw();
  }
  else if (textblock.prev instanceof TextBlock) {
    var cursor = textblock.cursor;
    if (cursor.prev)
      textblock.prev.firstChild.focus();
    else
      cursor.appendTo(textblock.prev.firstChild);
  }
  return this;
};

LatexCmds.text = CharCmds.$ = TextBlock;

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedFragment) {
  MathCommand.call(this, '\\');
  if (replacedFragment) {
    this.replacedFragment = replacedFragment.detach();
    this.isEmpty = function(){ return false; };
  }
}
_ = LatexCommandInput.prototype = new MathCommand;
_.html_template = ['<span class="latex-command-input"></span>'];
_.text_template = ['\\'];
_.placeCursor = function(cursor) { //TODO: better architecture, better place for this to be done, and more cleanly
  this.cursor = cursor.appendTo(this.firstChild);
  if (this.replacedFragment)
    this.jQ =
      this.jQ.add(this.replacedFragment.jQ.addClass('blur').bind(
        'mousedown mousemove', //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
        function(e) {
          $(e.target = this.nextSibling).trigger(e);
          return false;
        }
      ).insertBefore(this.jQ));
};
_.latex = function() {
  return '\\' + this.firstChild.latex() + ' ';
};
_.keydown = function(e) {
  if (e.which === 9 || e.which === 13) { //tab or enter
    this.renderCommand();
    return false;
  }
  return this.parent.keydown(e);
};
_.textInput = function(ch) {
  if (ch.match(/[a-z]/i)) {
    this.cursor.deleteSelection();
    this.cursor.insertNew(new VanillaSymbol(ch));
    return;
  }
  this.renderCommand();
  if (ch === ' ' || (ch === '\\' && this.firstChild.isEmpty()))
    return;

  this.cursor.parent.textInput(ch);
};
_.renderCommand = function() {
  this.jQ = this.jQ.last();
  this.remove();
  if (this.next)
    this.cursor.insertBefore(this.next);
  else
    this.cursor.appendTo(this.parent);

  var latex = this.firstChild.latex(), cmd;
  if (latex) {
    if (cmd = LatexCmds[latex])
      cmd = new cmd(this.replacedFragment, latex);
    else {
      cmd = new TextBlock(latex);
      cmd.firstChild.focus = function(){ delete this.focus; return this; };
      this.cursor.insertNew(cmd).insertAfter(cmd);
      if (this.replacedFragment)
        this.replacedFragment.remove();

      return;
    }
  }
  else
    cmd = new VanillaSymbol('\\backslash ','\\');

  this.cursor.insertNew(cmd);
  if (cmd instanceof Symbol && this.replacedFragment)
    this.replacedFragment.remove();
};

CharCmds['\\'] = LatexCommandInput;
  
function Binomial(replacedFragment) {
  MathCommand.call(this, '\\binom', undefined, undefined, replacedFragment);
  this.jQ.wrapInner('<span class="array"></span>').prepend('<span class="paren">(</span>').append('<span class="paren">)</span>');
}
_ = Binomial.prototype = new MathCommand;
_.html_template =
  ['<span></span>', '<span></span>', '<span></span>'];
_.text_template = ['choose(',',',')'];
_.redraw = function() {
  this.jQ.children(':first').add(this.jQ.children(':last'))
    .css('fontSize',
      this.jQ.outerHeight()/(+this.jQ.css('fontSize').slice(0,-2)*.9+2)+'em'
    );
};

LatexCmds.binom = LatexCmds.binomial = Binomial;

function Choose() {
  Binomial.apply(this, arguments);
}
_ = Choose.prototype = new Binomial;
_.placeCursor = LiveFraction.prototype.placeCursor;

LatexCmds.choose = Choose;

function Vector(replacedFragment) {
  MathCommand.call(this, '\\vector', undefined, undefined, replacedFragment);
}
_ = Vector.prototype = new MathCommand;
_.html_template = ['<span class="array"></span>', '<span></span>'];
_.latex = function() {
  return '\\begin{matrix}' + this.foldChildren([], function(latex, child) {
    latex.push(child.latex());
    return latex;
  }).join('\\\\') + '\\end{matrix}';
};
_.text = function() {
  return '[' + this.foldChildren([], function(text, child) {
    text.push(child.text());
    return text;
  }).join() + ']';
}
_.placeCursor = function(cursor) {
  this.cursor = cursor.appendTo(this.firstChild);
};
_.keydown = function(e) {
  var currentBlock = this.cursor.parent;

  if (currentBlock.parent === this) {
    if (e.which === 13) { //enter
      var newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.jQ = $('<span></span>')
        .data(jQueryDataKey, {block: newBlock})
        .insertAfter(currentBlock.jQ);
      if (currentBlock.next)
        currentBlock.next.prev = newBlock;
      else
        this.lastChild = newBlock;

      newBlock.next = currentBlock.next;
      currentBlock.next = newBlock;
      newBlock.prev = currentBlock;
      this.cursor.appendTo(newBlock).redraw();
      return false;
    }
    else if (e.which === 9 && !e.shiftKey && !currentBlock.next) { //tab
      if (currentBlock.isEmpty()) {
        if (currentBlock.prev) {
          this.cursor.insertAfter(this);
          delete currentBlock.prev.next;
          this.lastChild = currentBlock.prev;
          currentBlock.jQ.remove();
          this.cursor.redraw();
          return false;
        }
        else
          return this.parent.keydown(e);
      }

      var newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.jQ = $('<span></span>').data(jQueryDataKey, {block: newBlock}).appendTo(this.jQ);
      this.lastChild = newBlock;
      currentBlock.next = newBlock;
      newBlock.prev = currentBlock;
      this.cursor.appendTo(newBlock).redraw();
      return false;
    }
    else if (e.which === 8) { //backspace
      if (currentBlock.isEmpty()) {
        if (currentBlock.prev) {
          this.cursor.appendTo(currentBlock.prev)
          currentBlock.prev.next = currentBlock.next;
        }
        else {
          this.cursor.insertBefore(this);
          this.firstChild = currentBlock.next;
        }

        if (currentBlock.next)
          currentBlock.next.prev = currentBlock.prev;
        else
          this.lastChild = currentBlock.prev;

        currentBlock.jQ.remove();
        if (this.isEmpty())
          this.cursor.deleteForward();
        else
          this.cursor.redraw();

        return false;
      }
      else if (!this.cursor.prev)
        return false;
    }
  }
  return this.parent.keydown(e);
};

LatexCmds.vector = Vector;

LatexCmds.editable = proto(RootMathCommand, function() {
  MathCommand.call(this, '\\editable');
  createRoot(this.jQ, this.firstChild, false, true);
  var cursor;
  this.placeCursor = function(c) { cursor = c.appendTo(this.firstChild); };
  this.firstChild.blur = function() {
    if (cursor.prev !== this.parent) return; //when cursor is inserted after editable, append own cursor FIXME HACK
    delete this.blur;
    this.cursor.appendTo(this);
    MathBlock.prototype.blur.call(this);
  };
  this.text = function(){ return this.firstChild.text(); };
});

/**********************************
 * Symbols and Special Characters
 *********************************/

function bind(cons) { //shorthand for binding arguments to constructor
  var args = Array.prototype.slice.call(arguments, 1);

  return proto(cons, function() {
    cons.apply(this, args);
  });
}

LatexCmds.f = bind(Symbol, 'f', '<var class="florin">&fnof;</var>');

function Variable(ch, html) {
  Symbol.call(this, ch, '<var>'+(html || ch)+'</var>');
}
_ = Variable.prototype = new Symbol;
_.text = function() {
  var text = this.cmd;
  if (this.prev && !(this.prev instanceof Variable)
      && !(this.prev instanceof BinaryOperator))
    text = '*' + text;
  if (this.next && !(this.next instanceof BinaryOperator)
      && !(this.next.cmd === '^'))
    text += '*';
  return text;
};

function VanillaSymbol(ch, html) {
  Symbol.call(this, ch, '<span>'+(html || ch)+'</span>');
}
VanillaSymbol.prototype = Symbol.prototype;

CharCmds[' '] = bind(VanillaSymbol, '\\:', ' ');

LatexCmds.prime = CharCmds["'"] = bind(VanillaSymbol, "'", '&prime;');

function NonSymbolaSymbol(ch, html) { //does not use Symbola font
  Symbol.call(this, ch, '<span class="nonSymbola">'+(html || ch)+'</span>');
}
NonSymbolaSymbol.prototype = Symbol.prototype;

LatexCmds['@'] = NonSymbolaSymbol;
LatexCmds['&'] = bind(NonSymbolaSymbol, '\\&', '&');
LatexCmds['%'] = bind(NonSymbolaSymbol, '\\%', '%');

//the following are all Greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html

//lowercase Greek letter variables
LatexCmds.alpha =
LatexCmds.beta =
LatexCmds.gamma =
LatexCmds.delta =
LatexCmds.zeta =
LatexCmds.eta =
LatexCmds.theta =
LatexCmds.iota =
LatexCmds.kappa =
LatexCmds.mu =
LatexCmds.nu =
LatexCmds.xi =
LatexCmds.rho =
LatexCmds.sigma =
LatexCmds.tau =
LatexCmds.chi =
LatexCmds.psi =
LatexCmds.omega = proto(Symbol, function(replacedFragment, latex) {
  Variable.call(this,'\\'+latex+' ','&'+latex+';');
});

//why can't anybody FUCKING agree on these
LatexCmds.phi = //W3C or Unicode?
  bind(Variable,'\\phi ','&#981;');

LatexCmds.phiv = //Elsevier and 9573-13
LatexCmds.varphi = //AMS and LaTeX
  bind(Variable,'\\varphi ','&phi;');

LatexCmds.epsilon = //W3C or Unicode?
  bind(Variable,'\\epsilon ','&#1013;');

LatexCmds.epsiv = //Elsevier and 9573-13
LatexCmds.varepsilon = //AMS and LaTeX
  bind(Variable,'\\varepsilon ','&epsilon;');

LatexCmds.sigmaf = //W3C/Unicode
LatexCmds.sigmav = //Elsevier
LatexCmds.varsigma = //LaTeX
  bind(Variable,'\\varsigma ','&sigmaf;');

LatexCmds.upsilon = //AMS and LaTeX and W3C/Unicode
LatexCmds.upsi = //Elsevier and 9573-13
  bind(Variable,'\\upsilon ','&upsilon;');

//these aren't even mentioned in the HTML character entity references
LatexCmds.gammad = //Elsevier
LatexCmds.Gammad = //9573-13 -- WTF, right? I dunno if this was a typo in the reference (see above)
LatexCmds.digamma = //LaTeX
  bind(Variable,'\\digamma ','&#989;');

LatexCmds.kappav = //Elsevier
LatexCmds.varkappa = //AMS and LaTeX
  bind(Variable,'\\varkappa ','&#1008;');

LatexCmds.piv = //Elsevier and 9573-13
LatexCmds.varpi = //AMS and LaTeX
  bind(Variable,'\\varpi ','&#982;');

LatexCmds.rhov = //Elsevier and 9573-13
LatexCmds.varrho = //AMS and LaTeX
  bind(Variable,'\\varrho ','&#1009;');

LatexCmds.thetav = //Elsevier and 9573-13
LatexCmds.vartheta = //AMS and LaTeX
  bind(Variable,'\\vartheta ','&#977;');

//Greek constants, look best in un-italicised Times New Roman
LatexCmds.pi = LatexCmds['p'] = bind(NonSymbolaSymbol,'\\pi ','&pi;');
LatexCmds.lambda = bind(NonSymbolaSymbol,'\\lambda ','&lambda;');

//uppercase greek letters

LatexCmds.Upsilon = //AMS and LaTeX and W3C/Unicode
LatexCmds.Upsi = //Elsevier and 9573-13
  bind(Variable,'\\Upsilon ','&Upsilon;');

LatexCmds.Gamma =
LatexCmds.Delta =
LatexCmds.Theta =
LatexCmds.Lambda =
LatexCmds.Xi =
LatexCmds.Pi =
LatexCmds.Sigma =
LatexCmds.Phi =
LatexCmds.Psi =
LatexCmds.Omega =

//other symbols with the same LaTeX command and HTML character entity reference
LatexCmds.forall = proto(Symbol, function(replacedFragment, latex) {
  VanillaSymbol.call(this,'\\'+latex+' ','&'+latex+';');
});

function BinaryOperator(cmd, html, text) {
  Symbol.call(this, cmd, '<span class="binary-operator">'+html+'</span>', text);
}
BinaryOperator.prototype = new Symbol; //so instanceof will work

function PlusMinus(cmd, html) {
  VanillaSymbol.apply(this, arguments);
}
_ = PlusMinus.prototype = new BinaryOperator; //so instanceof will work
_.respace = function() {
  if (!this.prev) {
    this.jQ[0].className = '';
  }
  else if (
    this.prev instanceof BinaryOperator &&
    this.next && !(this.next instanceof BinaryOperator)
  ) {
    this.jQ[0].className = 'unary-operator';
  }
  else {
    this.jQ[0].className = 'binary-operator';
  }
  return this;
};

LatexCmds['+'] = bind(PlusMinus, '+');
LatexCmds['-'] = bind(PlusMinus, '-', '&minus;');
LatexCmds.pm = LatexCmds.plusmn = LatexCmds.plusminus =
  bind(PlusMinus,'\\pm ','&plusmn;');
LatexCmds.mp = LatexCmds.mnplus = LatexCmds.minusplus =
  bind(PlusMinus,'\\mp ','&#8723;');

CharCmds['*'] = LatexCmds.sdot = LatexCmds.cdot =
  bind(BinaryOperator, '\\cdot ', '&middot;');
//semantically should be &sdot;, but &middot; looks better

LatexCmds['='] = bind(BinaryOperator, '=', '=');
LatexCmds['<'] = bind(BinaryOperator, '<', '&lt;');
LatexCmds['>'] = bind(BinaryOperator, '>', '&gt;');

LatexCmds.notin =
LatexCmds.sim =
LatexCmds.cong =
LatexCmds.equiv =
LatexCmds.oplus =
LatexCmds.otimes = proto(BinaryOperator, function(replacedFragment, latex) {
  BinaryOperator.call(this, '\\'+latex+' ', '&'+latex+';');
});

LatexCmds.times = proto(BinaryOperator, function(replacedFragment, latex) {
  BinaryOperator.call(this, '\\times ', '&times;', '[x]')
});

LatexCmds.div = LatexCmds.divide = LatexCmds.divides =
  bind(BinaryOperator,'\\div ','&divide;', '[/]');

LatexCmds.ne = LatexCmds.neq = bind(BinaryOperator,'\\ne ','&ne;');

LatexCmds.ast = LatexCmds.star = LatexCmds.loast = LatexCmds.lowast =
  bind(BinaryOperator,'\\ast ','&lowast;');
  //case 'there4 = // a special exception for this one, perhaps?
LatexCmds.therefor = LatexCmds.therefore =
  bind(BinaryOperator,'\\therefore ','&there4;');

LatexCmds.cuz = // l33t
LatexCmds.because = bind(BinaryOperator,'\\because ','&#8757;');

LatexCmds.prop = LatexCmds.propto = bind(BinaryOperator,'\\propto ','&prop;');

LatexCmds.asymp = LatexCmds.approx = bind(BinaryOperator,'\\approx ','&asymp;');

LatexCmds.lt = bind(BinaryOperator,'<','&lt;');

LatexCmds.gt = bind(BinaryOperator,'>','&gt;');

LatexCmds.le = LatexCmds.leq = bind(BinaryOperator,'\\le ','&le;');

LatexCmds.ge = LatexCmds.geq = bind(BinaryOperator,'\\ge ','&ge;');

LatexCmds.isin = LatexCmds['in'] = bind(BinaryOperator,'\\in ','&isin;');

LatexCmds.ni = LatexCmds.contains = bind(BinaryOperator,'\\ni ','&ni;');

LatexCmds.notni = LatexCmds.niton = LatexCmds.notcontains = LatexCmds.doesnotcontain =
  bind(BinaryOperator,'\\not\\ni ','&#8716;');

LatexCmds.sub = LatexCmds.subset = bind(BinaryOperator,'\\subset ','&sub;');

LatexCmds.sup = LatexCmds.supset = LatexCmds.superset =
  bind(BinaryOperator,'\\supset ','&sup;');

LatexCmds.nsub = LatexCmds.notsub =
LatexCmds.nsubset = LatexCmds.notsubset =
  bind(BinaryOperator,'\\not\\subset ','&#8836;');

LatexCmds.nsup = LatexCmds.notsup =
LatexCmds.nsupset = LatexCmds.notsupset =
LatexCmds.nsuperset = LatexCmds.notsuperset =
  bind(BinaryOperator,'\\not\\supset ','&#8837;');

LatexCmds.sube = LatexCmds.subeq = LatexCmds.subsete = LatexCmds.subseteq =
  bind(BinaryOperator,'\\subseteq ','&sube;');

LatexCmds.supe = LatexCmds.supeq =
LatexCmds.supsete = LatexCmds.supseteq =
LatexCmds.supersete = LatexCmds.superseteq =
  bind(BinaryOperator,'\\supseteq ','&supe;');

LatexCmds.nsube = LatexCmds.nsubeq =
LatexCmds.notsube = LatexCmds.notsubeq =
LatexCmds.nsubsete = LatexCmds.nsubseteq =
LatexCmds.notsubsete = LatexCmds.notsubseteq =
  bind(BinaryOperator,'\\not\\subseteq ','&#8840;');

LatexCmds.nsupe = LatexCmds.nsupeq =
LatexCmds.notsupe = LatexCmds.notsupeq =
LatexCmds.nsupsete = LatexCmds.nsupseteq =
LatexCmds.notsupsete = LatexCmds.notsupseteq =
LatexCmds.nsupersete = LatexCmds.nsuperseteq =
LatexCmds.notsupersete = LatexCmds.notsuperseteq =
  bind(BinaryOperator,'\\not\\supseteq ','&#8841;');


//sum, product, coproduct, integral
function BigSymbol(ch, html) {
  Symbol.call(this, ch, '<big>'+html+'</big>');
}
BigSymbol.prototype = new Symbol; //so instanceof will work

LatexCmds.sum = LatexCmds.summation = bind(BigSymbol,'\\sum ','&sum;');
LatexCmds.prod = LatexCmds.product = bind(BigSymbol,'\\prod ','&prod;');
LatexCmds.coprod = LatexCmds.coproduct = bind(BigSymbol,'\\coprod ','&#8720;');
LatexCmds.int = LatexCmds.integral = LatexCmds['?'] = bind(BigSymbol,'\\int ','&int;');



//the canonical sets of numbers
LatexCmds.N = LatexCmds.naturals = LatexCmds.Naturals =
  bind(VanillaSymbol,'\\mathbb{N}','&#8469;');

LatexCmds.P =
LatexCmds.primes = LatexCmds.Primes =
LatexCmds.projective = LatexCmds.Projective =
LatexCmds.probability = LatexCmds.Probability =
  bind(VanillaSymbol,'\\mathbb{P}','&#8473;');

LatexCmds.Z = LatexCmds.integers = LatexCmds.Integers =
  bind(VanillaSymbol,'\\mathbb{Z}','&#8484;');

LatexCmds.Q = LatexCmds.rationals = LatexCmds.Rationals =
  bind(VanillaSymbol,'\\mathbb{Q}','&#8474;');

LatexCmds.R = LatexCmds.reals = LatexCmds.Reals =
  bind(VanillaSymbol,'\\mathbb{R}','&#8477;');

LatexCmds.C =
LatexCmds.complex = LatexCmds.Complex =
LatexCmds.complexes = LatexCmds.Complexes =
LatexCmds.complexplane = LatexCmds.Complexplane = LatexCmds.ComplexPlane =
  bind(VanillaSymbol,'\\mathbb{C}','&#8450;');

LatexCmds.H = LatexCmds.Hamiltonian = LatexCmds.quaternions = LatexCmds.Quaternions =
  bind(VanillaSymbol,'\\mathbb{H}','&#8461;');

//spacing
LatexCmds.quad = LatexCmds.emsp = bind(VanillaSymbol,'\\quad ','    ');
LatexCmds.qquad = bind(VanillaSymbol,'\\qquad ','        ');
/* spacing special characters, gonna have to implement this in LatexCommandInput.prototype.textInput somehow
case ',':
  return new VanillaSymbol('\\, ',' ');
case ':':
  return new VanillaSymbol('\\: ','  ');
case ';':
  return new VanillaSymbol('\\; ','   ');
case '!':
  return new Symbol('\\! ','<span style="margin-right:-.2em"></span>');
*/

//binary operators
LatexCmds.diamond = bind(VanillaSymbol, '\\diamond ', '&#9671;');
LatexCmds.bigtriangleup = bind(VanillaSymbol, '\\bigtriangleup ', '&#9651;');
LatexCmds.ominus = bind(VanillaSymbol, '\\ominus ', '&#8854;');
LatexCmds.uplus = bind(VanillaSymbol, '\\uplus ', '&#8846;');
LatexCmds.bigtriangledown = bind(VanillaSymbol, '\\bigtriangledown ', '&#9661;');
LatexCmds.sqcap = bind(VanillaSymbol, '\\sqcap ', '&#8851;');
LatexCmds.triangleleft = bind(VanillaSymbol, '\\triangleleft ', '&#8882;');
LatexCmds.sqcup = bind(VanillaSymbol, '\\sqcup ', '&#8852;');
LatexCmds.triangleright = bind(VanillaSymbol, '\\triangleright ', '&#8883;');
LatexCmds.odot = bind(VanillaSymbol, '\\odot ', '&#8857;');
LatexCmds.bigcirc = bind(VanillaSymbol, '\\bigcirc ', '&#9711;');
LatexCmds.dagger = bind(VanillaSymbol, '\\dagger ', '&#0134;');
LatexCmds.ddagger = bind(VanillaSymbol, '\\ddagger ', '&#135;');
LatexCmds.wr = bind(VanillaSymbol, '\\wr ', '&#8768;');
LatexCmds.amalg = bind(VanillaSymbol, '\\amalg ', '&#8720;');

//relationship symbols
LatexCmds.models = bind(VanillaSymbol, '\\models ', '&#8872;');
LatexCmds.prec = bind(VanillaSymbol, '\\prec ', '&#8826;');
LatexCmds.succ = bind(VanillaSymbol, '\\succ ', '&#8827;');
LatexCmds.preceq = bind(VanillaSymbol, '\\preceq ', '&#8828;');
LatexCmds.succeq = bind(VanillaSymbol, '\\succeq ', '&#8829;');
LatexCmds.simeq = bind(VanillaSymbol, '\\simeq ', '&#8771;');
LatexCmds.mid = bind(VanillaSymbol, '\\mid ', '&#8739;');
LatexCmds.ll = bind(VanillaSymbol, '\\ll ', '&#8810;');
LatexCmds.gg = bind(VanillaSymbol, '\\gg ', '&#8811;');
LatexCmds.parallel = bind(VanillaSymbol, '\\parallel ', '&#8741;');
LatexCmds.bowtie = bind(VanillaSymbol, '\\bowtie ', '&#8904;');
LatexCmds.sqsubset = bind(VanillaSymbol, '\\sqsubset ', '&#8847;');
LatexCmds.sqsupset = bind(VanillaSymbol, '\\sqsupset ', '&#8848;');
LatexCmds.smile = bind(VanillaSymbol, '\\smile ', '&#8995;');
LatexCmds.sqsubseteq = bind(VanillaSymbol, '\\sqsubseteq ', '&#8849;');
LatexCmds.sqsupseteq = bind(VanillaSymbol, '\\sqsupseteq ', '&#8850;');
LatexCmds.doteq = bind(VanillaSymbol, '\\doteq ', '&#8784;');
LatexCmds.frown = bind(VanillaSymbol, '\\frown ', '&#8994;');
LatexCmds.vdash = bind(VanillaSymbol, '\\vdash ', '&#8870;');
LatexCmds.dashv = bind(VanillaSymbol, '\\dashv ', '&#8867;');

//arrows
LatexCmds.longleftarrow = bind(VanillaSymbol, '\\longleftarrow ', '&#8592;');
LatexCmds.longrightarrow = bind(VanillaSymbol, '\\longrightarrow ', '&#8594;');
LatexCmds.Longleftarrow = bind(VanillaSymbol, '\\Longleftarrow ', '&#8656;');
LatexCmds.Longrightarrow = bind(VanillaSymbol, '\\Longrightarrow ', '&#8658;');
LatexCmds.longleftrightarrow = bind(VanillaSymbol, '\\longleftrightarrow ', '&#8596;');
LatexCmds.updownarrow = bind(VanillaSymbol, '\\updownarrow ', '&#8597;');
LatexCmds.Longleftrightarrow = bind(VanillaSymbol, '\\Longleftrightarrow ', '&#8660;');
LatexCmds.Updownarrow = bind(VanillaSymbol, '\\Updownarrow ', '&#8661;');
LatexCmds.mapsto = bind(VanillaSymbol, '\\mapsto ', '&#8614;');
LatexCmds.nearrow = bind(VanillaSymbol, '\\nearrow ', '&#8599;');
LatexCmds.hookleftarrow = bind(VanillaSymbol, '\\hookleftarrow ', '&#8617;');
LatexCmds.hookrightarrow = bind(VanillaSymbol, '\\hookrightarrow ', '&#8618;');
LatexCmds.searrow = bind(VanillaSymbol, '\\searrow ', '&#8600;');
LatexCmds.leftharpoonup = bind(VanillaSymbol, '\\leftharpoonup ', '&#8636;');
LatexCmds.rightharpoonup = bind(VanillaSymbol, '\\rightharpoonup ', '&#8640;');
LatexCmds.swarrow = bind(VanillaSymbol, '\\swarrow ', '&#8601;');
LatexCmds.leftharpoondown = bind(VanillaSymbol, '\\leftharpoondown ', '&#8637;');
LatexCmds.rightharpoondown = bind(VanillaSymbol, '\\rightharpoondown ', '&#8641;');
LatexCmds.nwarrow = bind(VanillaSymbol, '\\nwarrow ', '&#8598;');

//Misc
LatexCmds.ldots = bind(VanillaSymbol, '\\ldots ', '&#8230;');
LatexCmds.cdots = bind(VanillaSymbol, '\\cdots ', '&#8943;');
LatexCmds.vdots = bind(VanillaSymbol, '\\vdots ', '&#8942;');
LatexCmds.ddots = bind(VanillaSymbol, '\\ddots ', '&#8944;');
LatexCmds.surd = bind(VanillaSymbol, '\\surd ', '&#8730;');
LatexCmds.triangle = bind(VanillaSymbol, '\\triangle ', '&#9653;');
LatexCmds.ell = bind(VanillaSymbol, '\\ell ', '&#8467;');
LatexCmds.top = bind(VanillaSymbol, '\\top ', '&#8868;');
LatexCmds.flat = bind(VanillaSymbol, '\\flat ', '&#9837;');
LatexCmds.natural = bind(VanillaSymbol, '\\natural ', '&#9838;');
LatexCmds.sharp = bind(VanillaSymbol, '\\sharp ', '&#9839;');
LatexCmds.wp = bind(VanillaSymbol, '\\wp ', '&#8472;');
LatexCmds.bot = bind(VanillaSymbol, '\\bot ', '&#8869;');
LatexCmds.clubsuit = bind(VanillaSymbol, '\\clubsuit ', '&#9827;');
LatexCmds.diamondsuit = bind(VanillaSymbol, '\\diamondsuit ', '&#9826;');
LatexCmds.heartsuit = bind(VanillaSymbol, '\\heartsuit ', '&#9825;');
LatexCmds.spadesuit = bind(VanillaSymbol, '\\spadesuit ', '&#9824;');

//variable-sized
LatexCmds.oint = bind(VanillaSymbol, '\\oint ', '&#8750;');
LatexCmds.bigcap = bind(VanillaSymbol, '\\bigcap ', '&#8745;');
LatexCmds.bigcup = bind(VanillaSymbol, '\\bigcup ', '&#8746;');
LatexCmds.bigsqcup = bind(VanillaSymbol, '\\bigsqcup ', '&#8852;');
LatexCmds.bigvee = bind(VanillaSymbol, '\\bigvee ', '&#8744;');
LatexCmds.bigwedge = bind(VanillaSymbol, '\\bigwedge ', '&#8743;');
LatexCmds.bigodot = bind(VanillaSymbol, '\\bigodot ', '&#8857;');
LatexCmds.bigotimes = bind(VanillaSymbol, '\\bigotimes ', '&#8855;');
LatexCmds.bigoplus = bind(VanillaSymbol, '\\bigoplus ', '&#8853;');
LatexCmds.biguplus = bind(VanillaSymbol, '\\biguplus ', '&#8846;');

//delimiters
LatexCmds.lfloor = bind(VanillaSymbol, '\\lfloor ', '&#8970;');
LatexCmds.rfloor = bind(VanillaSymbol, '\\rfloor ', '&#8971;');
LatexCmds.lceil = bind(VanillaSymbol, '\\lceil ', '&#8968;');
LatexCmds.rceil = bind(VanillaSymbol, '\\rceil ', '&#8969;');
LatexCmds.slash = bind(VanillaSymbol, '\\slash ', '&#47;');
LatexCmds.opencurlybrace = bind(VanillaSymbol, '\\opencurlybrace ', '&#123;');
LatexCmds.closecurlybrace = bind(VanillaSymbol, '\\closecurlybrace ', '&#125;');

//various symbols

LatexCmds.caret = bind(VanillaSymbol,'\\caret ','^');
LatexCmds.underscore = bind(VanillaSymbol,'\\underscore ','_');
LatexCmds.backslash = bind(VanillaSymbol,'\\backslash ','\\');
LatexCmds.vert = bind(VanillaSymbol,'|');
LatexCmds.perp = LatexCmds.perpendicular = bind(VanillaSymbol,'\\perp ','&perp;');
LatexCmds.nabla = LatexCmds.del = bind(VanillaSymbol,'\\nabla ','&nabla;');
LatexCmds.hbar = bind(VanillaSymbol,'\\hbar ','&#8463;');

LatexCmds.AA = LatexCmds.Angstrom = LatexCmds.angstrom =
  bind(VanillaSymbol,'\\text\\AA ','&#8491;');

LatexCmds.ring = LatexCmds.circ = LatexCmds.circle =
  bind(VanillaSymbol,'\\circ ','&#8728;');

LatexCmds.bull = LatexCmds.bullet = bind(VanillaSymbol,'\\bullet ','&bull;');

LatexCmds.setminus = LatexCmds.smallsetminus =
  bind(VanillaSymbol,'\\setminus ','&#8726;');

LatexCmds.not = //bind(Symbol,'\\not ','<span class="not">/</span>');
LatexCmds.neg = bind(VanillaSymbol,'\\neg ','&not;');

LatexCmds.dots = LatexCmds.ellip = LatexCmds.hellip =
LatexCmds.ellipsis = LatexCmds.hellipsis =
  bind(VanillaSymbol,'\\dots ','&hellip;');

LatexCmds.converges =
LatexCmds.darr = LatexCmds.dnarr = LatexCmds.dnarrow = LatexCmds.downarrow =
  bind(VanillaSymbol,'\\downarrow ','&darr;');

LatexCmds.dArr = LatexCmds.dnArr = LatexCmds.dnArrow = LatexCmds.Downarrow =
  bind(VanillaSymbol,'\\Downarrow ','&dArr;');

LatexCmds.diverges = LatexCmds.uarr = LatexCmds.uparrow =
  bind(VanillaSymbol,'\\uparrow ','&uarr;');

LatexCmds.uArr = LatexCmds.Uparrow = bind(VanillaSymbol,'\\Uparrow ','&uArr;');

LatexCmds.to = bind(BinaryOperator,'\\to ','&rarr;');

LatexCmds.rarr = LatexCmds.rightarrow = bind(VanillaSymbol,'\\rightarrow ','&rarr;');

LatexCmds.implies = bind(BinaryOperator,'\\Rightarrow ','&rArr;');

LatexCmds.rArr = LatexCmds.Rightarrow = bind(VanillaSymbol,'\\Rightarrow ','&rArr;');

LatexCmds.gets = bind(BinaryOperator,'\\gets ','&larr;');

LatexCmds.larr = LatexCmds.leftarrow = bind(VanillaSymbol,'\\leftarrow ','&larr;');

LatexCmds.impliedby = bind(BinaryOperator,'\\Leftarrow ','&lArr;');

LatexCmds.lArr = LatexCmds.Leftarrow = bind(VanillaSymbol,'\\Leftarrow ','&lArr;');

LatexCmds.harr = LatexCmds.lrarr = LatexCmds.leftrightarrow =
  bind(VanillaSymbol,'\\leftrightarrow ','&harr;');

LatexCmds.iff = bind(BinaryOperator,'\\Leftrightarrow ','&hArr;');

LatexCmds.hArr = LatexCmds.lrArr = LatexCmds.Leftrightarrow =
  bind(VanillaSymbol,'\\Leftrightarrow ','&hArr;');

LatexCmds.Re = LatexCmds.Real = LatexCmds.real = bind(VanillaSymbol,'\\Re ','&real;');

LatexCmds.Im = LatexCmds.imag =
LatexCmds.image = LatexCmds.imagin = LatexCmds.imaginary = LatexCmds.Imaginary =
  bind(VanillaSymbol,'\\Im ','&image;');

LatexCmds.part = LatexCmds.partial = bind(VanillaSymbol,'\\partial ','&part;');

LatexCmds.inf = LatexCmds.infin = LatexCmds.infty = LatexCmds.infinity =
  bind(VanillaSymbol,'\\infty ','&infin;');

LatexCmds.alef = LatexCmds.alefsym = LatexCmds.aleph = LatexCmds.alephsym =
  bind(VanillaSymbol,'\\aleph ','&alefsym;');

LatexCmds.xist = //LOL
LatexCmds.xists = LatexCmds.exist = LatexCmds.exists =
  bind(VanillaSymbol,'\\exists ','&exist;');

LatexCmds.and = LatexCmds.land = LatexCmds.wedge =
  bind(VanillaSymbol,'\\wedge ','&and;');

LatexCmds.or = LatexCmds.lor = LatexCmds.vee = bind(VanillaSymbol,'\\vee ','&or;');

LatexCmds.o = LatexCmds.O =
LatexCmds.empty = LatexCmds.emptyset =
LatexCmds.oslash = LatexCmds.Oslash =
LatexCmds.nothing = LatexCmds.varnothing =
  bind(BinaryOperator,'\\varnothing ','&empty;');

LatexCmds.cup = LatexCmds.union = bind(VanillaSymbol,'\\cup ','&cup;');

LatexCmds.cap = LatexCmds.intersect = LatexCmds.intersection =
  bind(VanillaSymbol,'\\cap ','&cap;');

LatexCmds.deg = LatexCmds.degree = bind(VanillaSymbol,'^\\circ ','&deg;');

LatexCmds.ang = LatexCmds.angle = bind(VanillaSymbol,'\\angle ','&ang;');


function NonItalicizedFunction(replacedFragment, fn) {
  Symbol.call(this, '\\'+fn+' ', '<span>'+fn+'</span>');
}
_ = NonItalicizedFunction.prototype = new Symbol;
_.respace = function()
{
  this.jQ[0].className =
    (this.next instanceof SupSub || this.next instanceof Bracket) ?
    '' : 'non-italicized-function';
};

LatexCmds.ln =
LatexCmds.lg =
LatexCmds.log =
LatexCmds.span =
LatexCmds.proj =
LatexCmds.det =
LatexCmds.dim =
LatexCmds.min =
LatexCmds.max =
LatexCmds.mod =
LatexCmds.lcm =
LatexCmds.gcd =
LatexCmds.gcf =
LatexCmds.hcf =
LatexCmds.lim = NonItalicizedFunction;

(function() {
  var trig = ['sin', 'cos', 'tan', 'sec', 'cosec', 'csc', 'cotan', 'cot'];
  for (var i in trig) {
    LatexCmds[trig[i]] =
    LatexCmds[trig[i]+'h'] =
    LatexCmds['a'+trig[i]] = LatexCmds['arc'+trig[i]] =
    LatexCmds['a'+trig[i]+'h'] = LatexCmds['arc'+trig[i]+'h'] =
      NonItalicizedFunction;
  }
}());

/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
function Cursor(root) {
  this.parent = this.root = root;
  var jQ = this.jQ = this._jQ = $('<span class="cursor"></span>');

  //closured for setInterval
  this.blink = function(){ jQ.toggleClass('blink'); }
}
_ = Cursor.prototype;
_.prev = 0;
_.next = 0;
_.parent = 0;
_.show = function() {
  this.jQ = this._jQ.removeClass('blink');
  if ('intervalId' in this) //already was shown, just restart interval
    clearInterval(this.intervalId);
  else { //was hidden and detached, insert this.jQ back into HTML DOM
    if (this.next) {
      if (this.selection && this.selection.prev === this.prev)
        this.jQ.insertBefore(this.selection.jQ);
      else
        this.jQ.insertBefore(this.next.jQ.first());
    }
    else
      this.jQ.appendTo(this.parent.jQ);
    this.parent.focus();
  }
  this.intervalId = setInterval(this.blink, 500);
  return this;
};
_.hide = function() {
  if ('intervalId' in this)
    clearInterval(this.intervalId);
  delete this.intervalId;
  this.jQ.detach();
  this.jQ = $();
  return this;
};
_.redraw = function() {
  for (var ancestor = this.parent; ancestor; ancestor = ancestor.parent)
    if (ancestor.redraw)
      ancestor.redraw();
};
_.insertAt = function(parent, next, prev) {
  var old_parent = this.parent;

  this.parent = parent;
  this.next = next;
  this.prev = prev;

  old_parent.blur(); //blur may need to know cursor's destination
};
_.insertBefore = function(el) {
  this.insertAt(el.parent, el, el.prev)
  this.parent.jQ.addClass('hasCursor');
  this.jQ.insertBefore(el.jQ.first());
  return this;
};
_.insertAfter = function(el) {
  this.insertAt(el.parent, el.next, el);
  this.parent.jQ.addClass('hasCursor');
  this.jQ.insertAfter(el.jQ.last());
  return this;
};
_.prependTo = function(el) {
  this.insertAt(el, el.firstChild, 0);
  if (el.textarea) //never insert before textarea
    this.jQ.insertAfter(el.textarea);
  else
    this.jQ.prependTo(el.jQ);
  el.focus();
  return this;
};
_.appendTo = function(el) {
  this.insertAt(el, 0, el.lastChild);
  this.jQ.appendTo(el.jQ);
  el.focus();
  return this;
};
_.hopLeft = function() {
  this.jQ.insertBefore(this.prev.jQ.first());
  this.next = this.prev;
  this.prev = this.prev.prev;
  return this;
};
_.hopRight = function() {
  this.jQ.insertAfter(this.next.jQ.last());
  this.prev = this.next;
  this.next = this.next.next;
  return this;
};
_.moveLeft = function() {
  if (this.selection)
    this.insertBefore(this.selection.prev.next || this.parent.firstChild).clearSelection();
  else {
    if (this.prev) {
      if (this.prev.lastChild)
        this.appendTo(this.prev.lastChild)
      else
        this.hopLeft();
    }
    else { //we're at the beginning of a block
      if (this.parent.prev)
        this.appendTo(this.parent.prev);
      else if (this.parent !== this.root)
        this.insertBefore(this.parent.parent);
      //else we're at the beginning of the root, so do nothing.
    }
  }
  return this.show();
};
_.moveRight = function() {
  if (this.selection)
    this.insertAfter(this.selection.next.prev || this.parent.lastChild).clearSelection();
  else {
    if (this.next) {
      if (this.next.firstChild)
        this.prependTo(this.next.firstChild)
      else
        this.hopRight();
    }
    else { //we're at the end of a block
      if (this.parent.next)
        this.prependTo(this.parent.next);
      else if (this.parent !== this.root)
        this.insertAfter(this.parent.parent);
      //else we're at the end of the root, so do nothing.
    }
  }
  return this.show();
};
_.seek = function(target, pageX, pageY) {
  var cursor = this;
  if (target.hasClass('empty')) {
    cursor.clearSelection().prependTo(target.data(jQueryDataKey).block);
    return cursor;
  }

  var data = target.data(jQueryDataKey);
  if (data) {
    //if clicked a symbol, insert at whichever side is closer
    if (data.cmd && !data.block) {
      cursor.clearSelection();
      if (target.outerWidth() > 2*(pageX - target.offset().left))
        cursor.insertBefore(data.cmd);
      else
        cursor.insertAfter(data.cmd);

      return cursor;
    }
  }
  //if no MathQuill data, try parent, if still no, forget it
  else {
    target = target.parent();
    data = target.data(jQueryDataKey);
    if (!data)
      data = {block: cursor.root};
  }

  cursor.clearSelection();
  if (data.cmd)
    cursor.insertAfter(data.cmd);
  else
    cursor.appendTo(data.block);

  //move cursor to position closest to click
  var dist = cursor.jQ.offset().left - pageX, prevDist;
  do {
    cursor.moveLeft();
    prevDist = dist;
    dist = cursor.jQ.offset().left - pageX;
  }
  while (dist > 0 && (cursor.prev || cursor.parent !== cursor.root));

  if (-dist > prevDist)
    cursor.moveRight();

  return cursor;
};
_.writeLatex = function(latex) {
  this.deleteSelection();
  latex = ( latex && latex.match(/\\text\{([^}]|\\\})*\}|\\[a-z]*|[^\s]/ig) ) || 0;
  (function writeLatexBlock(cursor) {
    while (latex.length) {
      var token = latex.shift(); //pop first item
      if (!token || token === '}') return;

      var cmd;
      if (token.slice(0, 6) === '\\text{') {
        cmd = new TextBlock(token.slice(6, -1));
        cursor.insertNew(cmd).insertAfter(cmd);
        continue; //skip recursing through children
      }
      else if (token === '\\left' || token === '\\right') { //FIXME HACK: implement real \left and \right LaTeX commands, rather than special casing them here
        token = latex.shift();
        if (token === '\\')
          token = latex.shift();

        cursor.insertCh(token);
        cmd = cursor.prev || cursor.parent.parent;

        if (cursor.prev) //was a close-paren, so break recursion
          return;
        else //was an open-paren, hack to put the following latex
          latex.unshift('{'); //in the ParenBlock in the math DOM
      }
      else if (/^\\[a-z]+$/i.test(token)) {
        token = token.slice(1);
        var cmd = LatexCmds[token];
        if (cmd)
          cursor.insertNew(cmd = new cmd(undefined, token));
        else {
          cmd = new TextBlock(token);
          cursor.insertNew(cmd).insertAfter(cmd);
          continue; //skip recursing through children
        }
      }
      else {
        if (token.match(/[a-eg-zA-Z]/)) //exclude f because want florin
          cmd = new Variable(token);
        else if (cmd = LatexCmds[token])
          cmd = new cmd;
        else
          cmd = new VanillaSymbol(token);

        cursor.insertNew(cmd);
      }
      cmd.eachChild(function(child) {
        cursor.appendTo(child);
        var token = latex.shift();
        if (!token) return false;

        if (token === '{')
          writeLatexBlock(cursor);
        else
          cursor.insertCh(token);
      });
      cursor.insertAfter(cmd);
    }
  }(this));
  return this.hide();
};
_.write = function(ch) {
  return this.show().insertCh(ch);
};
_.insertCh = function(ch) {
  if (this.selection) {
    //gotta do this before this.selection is mutated by 'new cmd(this.selection)'
    this.prev = this.selection.prev;
    this.next = this.selection.next;
  }

  var cmd;
  if (ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
    cmd = new Variable(ch);
  else if (cmd = CharCmds[ch] || LatexCmds[ch])
    cmd = new cmd(this.selection, ch);
  else
    cmd = new VanillaSymbol(ch);

  if (this.selection) {
    if (cmd instanceof Symbol)
      this.selection.remove();
    delete this.selection;
  }

  return this.insertNew(cmd);
};
_.insertNew = function(cmd) {
  cmd.parent = this.parent;
  cmd.next = this.next;
  cmd.prev = this.prev;

  if (this.prev)
    this.prev.next = cmd;
  else
    this.parent.firstChild = cmd;

  if (this.next)
    this.next.prev = cmd;
  else
    this.parent.lastChild = cmd;

  cmd.jQ.insertBefore(this.jQ);

  //adjust context-sensitive spacing
  cmd.respace();
  if (this.next)
    this.next.respace();
  if (this.prev)
    this.prev.respace();

  this.prev = cmd;

  cmd.placeCursor(this);

  this.redraw();

  return this;
};
_.unwrapGramp = function() {
  var gramp = this.parent.parent,
    greatgramp = gramp.parent,
    prev = gramp.prev,
    cursor = this;

  gramp.eachChild(function(uncle) {
    if (uncle.isEmpty()) return;

    uncle.eachChild(function(cousin) {
      cousin.parent = greatgramp;
      cousin.jQ.insertBefore(gramp.jQ.first());
    });
    uncle.firstChild.prev = prev;
    if (prev)
      prev.next = uncle.firstChild;
    else
      greatgramp.firstChild = uncle.firstChild;

    prev = uncle.lastChild;
  });
  prev.next = gramp.next;
  if (gramp.next)
    gramp.next.prev = prev;
  else
    greatgramp.lastChild = prev;

  if (!this.next) { //then find something to be next to insertBefore
    if (this.prev)
      this.next = this.prev.next;
    else {
      while (!this.next) {
        this.parent = this.parent.next;
        if (this.parent)
          this.next = this.parent.firstChild;
        else {
          this.next = gramp.next;
          this.parent = greatgramp;
          break;
        }
      }
    }
  }
  if (this.next)
    this.insertBefore(this.next);
  else
    this.appendTo(greatgramp);

  gramp.jQ.remove();

  if (gramp.prev)
    gramp.prev.respace();
  if (gramp.next)
    gramp.next.respace();
};
_.backspace = function() {
  if (this.deleteSelection());
  else if (this.prev) {
    if (this.prev.isEmpty())
      this.prev = this.prev.remove().prev;
    else
      this.selectLeft();
  }
  else if (this.parent !== this.root) {
    if (this.parent.parent.isEmpty())
      return this.insertAfter(this.parent.parent).backspace();
    else
      this.unwrapGramp();
  }

  if (this.prev)
    this.prev.respace();
  if (this.next)
    this.next.respace();
  this.redraw();

  return this;
};
_.deleteForward = function() {
  if (this.deleteSelection());
  else if (this.next) {
    if (this.next.isEmpty())
      this.next = this.next.remove().next;
    else
      this.selectRight();
  }
  else if (this.parent !== this.root) {
    if (this.parent.parent.isEmpty())
      return this.insertBefore(this.parent.parent).deleteForward();
    else
      this.unwrapGramp();
  }

  if (this.prev)
    this.prev.respace();
  if (this.next)
    this.next.respace();
  this.redraw();

  return this;
};
_.selectFrom = function(anticursor) {
  //find ancestors of each with common parent
  var oneA = this, otherA = anticursor; //one ancestor, the other ancestor
  loopThroughAncestors: while (true) {
    for (var oneI = this; oneI !== oneA.parent.parent; oneI = oneI.parent.parent) //one intermediate, the other intermediate
      if (oneI.parent === otherA.parent) {
        left = oneI;
        right = otherA;
        break loopThroughAncestors;
      }

    for (var otherI = anticursor; otherI !== otherA.parent.parent; otherI = otherI.parent.parent)
      if (oneA.parent === otherI.parent) {
        left = oneA;
        right = otherI;
        break loopThroughAncestors;
      }

    if (oneA.parent.parent)
      oneA = oneA.parent.parent;
    if (otherA.parent.parent)
      otherA = otherA.parent.parent;
  }
  //figure out which is left/prev and which is right/next
  var left, right, leftRight;
  if (left.next !== right) {
    for (var next = left; next; next = next.next) {
      if (next === right.prev) {
        leftRight = true;
        break;
      }
    }
    if (!leftRight) {
      leftRight = right;
      right = left;
      left = leftRight;
    }
  }
  this.hide().selection = new Selection(
    left.parent,
    left.prev,
    right.next
  );
  this.insertAfter(right.next.prev || right.parent.lastChild);
  this.root.selectionChanged();
};
_.selectLeft = function() {
  if (this.selection) {
    if (this.selection.prev === this.prev) { //if cursor is at left edge of selection;
      if (this.prev) { //then extend left if possible
        this.hopLeft().next.jQ.prependTo(this.selection.jQ);
        this.selection.prev = this.prev;
      }
      else if (this.parent !== this.root) //else level up if possible
        this.insertBefore(this.parent.parent).selection.levelUp();
    }
    else { //else cursor is at right edge of selection, retract left
      this.prev.jQ.insertAfter(this.selection.jQ);
      this.hopLeft().selection.next = this.next;
      if (this.selection.prev === this.prev)
        this.deleteSelection();
    }
  }
  else {
    if (this.prev)
      this.hopLeft();
    else //end of a block
      if (this.parent !== this.root)
        this.insertBefore(this.parent.parent);

    this.hide().selection = new Selection(this.parent, this.prev, this.next.next);
  }
  this.root.selectionChanged();
};
_.selectRight = function() {
  if (this.selection) {
    if (this.selection.next === this.next) { //if cursor is at right edge of selection;
      if (this.next) { //then extend right if possible
        this.hopRight().prev.jQ.appendTo(this.selection.jQ);
        this.selection.next = this.next;
      }
      else if (this.parent !== this.root) //else level up if possible
        this.insertAfter(this.parent.parent).selection.levelUp();
    }
    else { //else cursor is at left edge of selection, retract right
      this.next.jQ.insertBefore(this.selection.jQ);
      this.hopRight().selection.prev = this.prev;
      if (this.selection.next === this.next)
        this.deleteSelection();
    }
  }
  else {
    if (this.next)
      this.hopRight();
    else //end of a block
      if (this.parent !== this.root)
        this.insertAfter(this.parent.parent);

    this.hide().selection = new Selection(this.parent, this.prev.prev, this.next);
  }
  this.root.selectionChanged();
};
_.clearSelection = function() {
  this.root.textarea.children().val('');
  if (this.show().selection) {
    this.selection.clear();
    delete this.selection;
  }
  return this;
};
_.deleteSelection = function() {
  if (!this.show().selection) return false;

  this.prev = this.selection.prev;
  this.next = this.selection.next;
  this.selection.remove();
  delete this.selection;
  return true;
};

function Selection(parent, prev, next) {
  MathFragment.apply(this, arguments);
}
_ = Selection.prototype = new MathFragment;
_.jQinit= function(children) {
  this.jQ = children.wrapAll('<span class="selection"></span>').parent();
    //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
};
_.levelUp = function() {
  this.clear().jQinit(this.parent.parent.jQ);

  this.prev = this.parent.parent.prev;
  this.next = this.parent.parent.next;
  this.parent = this.parent.parent.parent;

  return this;
};
_.clear = function() {
  this.jQ.replaceWith(this.jQ.children());
  return this;
};
_.blockify = function() {
  this.jQ.replaceWith(this.jQ = this.jQ.children());
  return MathFragment.prototype.blockify.call(this);
};
_.detach = function() {
  var block = MathFragment.prototype.blockify.call(this);
  this.blockify = function() {
    this.jQ.replaceWith(block.jQ = this.jQ = this.jQ.children());
    return block;
  };
  return this;
};

/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
$.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    this.find(':not(:has(:first))').each(function() {
      var data = $(this).data(jQueryDataKey);
      if (data && data.cmd) Cursor.prototype.redraw.call(data.cmd);
    });
    return this;
  case 'revert':
    return this.each(function() {
      var data = $(this).data(jQueryDataKey);
      if (data && data.revert)
        data.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      return this.each(function() {
        var data = $(this).data(jQueryDataKey);
        if (data && data.block && data.block.renderLatex)
          data.block.renderLatex(latex);
      });
    }

    var data = this.data(jQueryDataKey);
    return data && data.block && data.block.latex();
  case 'text':
    var data = this.data(jQueryDataKey);
    return data && data.block && data.block.text();
  case 'html':
    return this.html().replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.each(function() {
        var data = $(this).data(jQueryDataKey),
          block = data && data.block,
          cursor = block && block.cursor;

        if (cursor) {
          cursor.writeLatex(latex);
          block.blur();
        }
      });
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
    return this.each(function() {
      createRoot($(this), new RootBlock, textbox, editable);
    });
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function() {
  $('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
  $('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
  $('.mathquill-embedded-latex').mathquill();
});


}(jQuery));
