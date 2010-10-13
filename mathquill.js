/**
 * Copyright 2010 Jay and Han (laughinghan@gmail.com)
 * License, Usage and Readme at http://mathquill.com
 */
 /****************************
 * Important opening stuff.
 ***************************/

(function($){ //takes in the jQuery function as an argument

//Note: if the following is no longer on line 12 of build/mathquill.js, please modify publish.sh accordingly
$('head').prepend('<link rel="stylesheet" type="text/css" href="http://laughinghan.github.com/mathquill/mathquill.css">');

function todo(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };

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
  eachChild: function(fn)
  {
    for(var child = this.firstChild; child !== null; child = child.next)
      if(fn.call(child) === false)
        break;
    return this;
  },
  reduceChildren: function(fn, initVal)
  {
    this.eachChild(function(){
      initVal = fn.call(this, initVal);
    });
    return initVal;
  },
  keydown: function(e)
  {
    return this.parent.keydown(e);
  },
  keypress: function(e)
  {
    return this.parent.keypress(e);
  }
};

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 * May be passed a MathFragment that's being replaced.
 */
function MathCommand(cmd, html_template, replacedFragment)
{
  if(!arguments.length)
    return;

  this.cmd = cmd;
  if(html_template)
    this.html_template = html_template;

  this.jQ = $(this.html_template[0]).data('[[mathquill internal data]]', {cmd: this});
  this.initBlocks(replacedFragment);
}
MathCommand.prototype = $.extend(new MathElement, {
  initBlocks: function(replacedFragment)
  {
    //single-block commands
    if(this.html_template.length === 1)
    {
      this.firstChild = this.lastChild =
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
    newBlock.jQ = $(this.html_template[1]).data('[[mathquill internal data]]',
      {block: newBlock}).append(newBlock.jQ).appendTo(this.jQ);
    newBlock.setEmpty();
    for(var i = 2; i < num_blocks; i += 1)
    {
      newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(this.html_template[i]).data('[[mathquill internal data]]',
        {block: newBlock}).appendTo(this.jQ);
      newBlock.setEmpty();
    }
    this.lastChild = newBlock;
  },
  latex: function()
  {
    return this.cmd + this.reduceChildren(function(initVal){
      return initVal + '{' + (this.latex() || ' ') + '}';
    }, '');
  },
  remove: function()
  {
    if(this.prev)
      this.prev.next = this.next;
    else
      this.parent.firstChild = this.next;

    if(this.next)
      this.next.prev = this.prev;
    else
      this.parent.lastChild = this.prev;

    this.jQ.remove();

    return this;
  },
  //placeholder for context-sensitive spacing.
  respace: $.noop,
  placeCursor: function(cursor)
  {
    cursor.appendTo(this.reduceChildren(function(prev){
      return prev.isEmpty() ? prev : this;
    }, this.firstChild));
  },
  isEmpty: function()
  {
    return this.reduceChildren(function(initVal){
      return initVal && this.isEmpty();
    }, true);
  }
});

/**
 * Lightweight command without blocks or children.
 */
function Symbol(cmd, html)
{
  MathCommand.call(this, cmd, [ html ]);
}
Symbol.prototype = $.extend(new MathCommand, {
  initBlocks: $.noop,
  latex: function()
  {
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
  latex: function()
  {
    return this.reduceChildren(function(initVal){
      return initVal + this.latex();
    }, '');
  },
  isEmpty: function()
  {
    return this.firstChild === null && this.lastChild === null;
  },
  setEmpty: function()
  {
    this.jQ.removeClass('hasCursor');
    if(this.isEmpty())
      this.jQ.addClass('empty');
    return this;
  },
  removeEmpty:function(cursorJQ)
  {
    this.jQ.addClass('hasCursor');
    if(this.isEmpty())
    {
      this.jQ.removeClass('empty').append(cursorJQ);
      return false;
    }
    return true;
  }
});

/**
 * An entity outside the Math DOM tree with one-way pointers (so it's only
 * a "view" of part of the tree, not an actual node/entity in the tree)
 * that delimit a list of symbols and operators.
 */
function MathFragment(parent, prev, next)
{
  if(!arguments.length)
    return;

  this.parent = parent;
  this.prev = prev || null; //so you can do 'new MathFragment(block)' without
  this.next = next || null; //ending up with this.prev or this.next === undefined

  this.jQinit(this.reduce(function(initVal){ return this.jQ.add(initVal); }, $()));
}
MathFragment.prototype = {
  remove: MathCommand.prototype.remove,
  jQinit: function(children)
  {
    return this.jQ = children;
  },
  each: function(fn)
  {
    for(var el = (this.prev ? this.prev.next : this.parent.firstChild); el !== this.next; el = el.next)
      if(fn.call(el) === false)
        break;
    return this;
  },
  reduce: function(fn, initVal)
  {
    this.each(function()
    {
      initVal = fn.call(this, initVal);
    });
    return initVal;
  },
  blockify: function()
  {
    var newBlock = new MathBlock;
    if(this.prev)
    {
      newBlock.firstChild = this.prev.next;
      this.prev.next = this.next;
    }
    else
    {
      newBlock.firstChild = this.parent.firstChild;
      this.parent.firstChild = this.next;
    }

    if(this.next)
    {
      newBlock.lastChild = this.next.prev;
      this.next.prev = this.prev;
    }
    else
    {
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
/***************************
 * Commands and Operators.
 **************************/

var CharCmds = {}, LatexCmds = {}; //single character commands, LaTeX commands

function proto(parent, child) //shorthand for prototyping
{
  child.prototype = parent.prototype;
  return child;
}

function SupSub(cmd, html, replacedFragment)
{
  MathCommand.call(this, cmd, [ html ], replacedFragment);
  var me = this;
  this.jQ.change(function()
  {
    me.respace();
    if(me.next)
      me.next.respace();
    if(me.prev)
      me.prev.respace();
  });
}
SupSub.prototype = new MathCommand;
SupSub.prototype.latex = function()
{
  var latex = this.firstChild.latex();
  if(latex.length === 1)
    return this.cmd + latex;
  return this.cmd + '{' + (latex || ' ') + '}';
};
SupSub.prototype.respace = function()
{
  if(this.prev && (this.prev.cmd === '\\int '
    || (this.prev instanceof SupSub && this.prev.cmd != this.cmd
      && this.prev.prev && this.prev.prev.cmd === '\\int ')))
  {
    if(!this.limit)
    {
      this.limit = true;
      this.jQ.addClass('limit');
    }
  }
  else
  {
    if(this.limit)
    {
      this.limit = false;
      this.jQ.removeClass('limit');
    }
  }
  if(this.respaced = this.prev instanceof SupSub && this.prev.cmd != this.cmd && !this.prev.respaced)
    if(this.limit && this.cmd === '_')
      this.jQ.css({
        left: -.25-this.prev.jQ.outerWidth()/+this.jQ.css('fontSize').slice(0,-2)+'em',
        marginRight: .1-Math.min(this.jQ.outerWidth(), this.prev.jQ.outerWidth())/+this.jQ.css('fontSize').slice(0,-2)+'em' //1px adjustment very important!
      });
    else
      this.jQ.css({
        left: -this.prev.jQ.outerWidth()/+this.jQ.css('fontSize').slice(0,-2)+'em',
        marginRight: .1-Math.min(this.jQ.outerWidth(), this.prev.jQ.outerWidth())/+this.jQ.css('fontSize').slice(0,-2)+'em' //1px adjustment very important!
      });
  else if(this.limit && this.cmd === '_')
    this.jQ.css({
      left: '-.25em',
      marginRight: ''
    });
  else if(this.cmd === '^' && this.next && this.next.cmd === '\\sqrt')
    this.jQ.css({
      left: '',
      marginRight: Math.max(-.3, .1-this.jQ.outerWidth()/+this.jQ.css('fontSize').slice(0,-2))+'em'
    }).addClass('limit');
  else
    this.jQ.css({
      left: '',
      marginRight: ''
    });
  return this;
};

LatexCmds.subscript = LatexCmds._ = proto(SupSub, function(replacedFragment)
{
  SupSub.call(this, '_', '<sub></sub>', replacedFragment);
});
LatexCmds.superscript = LatexCmds.supscript = LatexCmds['^'] =
  proto(SupSub, function(replacedFragment)
{
  SupSub.call(this, '^', '<sup></sup>', replacedFragment);
});

function Fraction(replacedFragment)
{
  MathCommand.call(this, '\\frac', undefined, replacedFragment);
  this.jQ.append('<span style="width:0">&nbsp;</span>');
}
Fraction.prototype = new MathCommand;
Fraction.prototype.html_template = [
  '<span class="fraction"></span>',
  '<span class="numerator"></span>',
  '<span class="denominator"></span>'
];

LatexCmds.frac = LatexCmds.fraction = Fraction;

function LiveFraction()
{
  Fraction.apply(this, arguments);
}
LiveFraction.prototype = new Fraction;
LiveFraction.prototype.placeCursor = function(cursor)
{
  if(this.firstChild.isEmpty())
  {
    var prev = this.prev;
    while(prev && !(prev instanceof BinaryOperator || prev instanceof TextBlock
        || prev instanceof BigSymbol)) //lookbehind for operator
      prev = prev.prev;
    if(prev instanceof BigSymbol)
      if(prev.next instanceof SupSub)
      {
        prev = prev.next;
        if(prev.next instanceof SupSub && prev.next.cmd != prev.cmd)
          prev = prev.next;
      }
    if(prev !== this.prev)
    {
      var newBlock = new MathFragment(this.parent, prev, this).blockify();
      newBlock.jQ = this.firstChild.jQ.empty().removeClass('empty').append(newBlock.jQ).data('[[mathquill internal data]]', { block: newBlock });
      newBlock.next = this.lastChild;
      newBlock.parent = this;
      this.firstChild = this.lastChild.prev = newBlock;
    }
  }
  cursor.appendTo(this.lastChild);
};

CharCmds['/'] = LiveFraction;

function SquareRoot(replacedFragment)
{
  MathCommand.call(this, '\\sqrt', undefined, replacedFragment);
  this.firstChild.jQ.change(function()
  {
    var block = $(this), height = block.height();
    block.css({
      borderTopWidth: height/30+1 // NOTE: Formula will need to change if our font isn't Symbola
    }).prev().css({
      fontSize: height/+block.css('fontSize').slice(0,-2)+'em'
    });
  });
}
SquareRoot.prototype = new MathCommand;
SquareRoot.prototype.html_template = [
  '<span><span class="sqrt-prefix">&radic;</span></span>',
  '<span class="sqrt-stem"></span>'
];

LatexCmds.sqrt = SquareRoot;

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
function Bracket(open, close, cmd, end, replacedFragment)
{
  MathCommand.call(this, '\\left'+cmd,
    ['<span><span class="paren">'+open+'</span><span></span><span class="paren">'+close+'</span></span>'],
    replacedFragment);
  this.end = '\\right'+end;
  this.firstChild.jQ.change(function()
  {
    var block = $(this);
    block.prev().add(block.next()).css('fontSize', block.height()/(+block.css('fontSize').slice(0,-2)*1.02)+'em');
  });
}
Bracket.prototype = new MathCommand;
Bracket.prototype.initBlocks = function(replacedFragment)
{
  this.firstChild = this.lastChild =
    (replacedFragment && replacedFragment.blockify()) || new MathBlock;
  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ.children(':eq(1)')
    .data('[[mathquill internal data]]', {block: this.firstChild})
    .append(this.firstChild.jQ);
};
Bracket.prototype.latex = function()
{
  return this.cmd + this.firstChild.latex() + this.end;
};

LatexCmds.lbrace = CharCmds['{'] = proto(Bracket, function(replacedFragment)
{
  Bracket.call(this, '{', '}', '\\{', '\\}', replacedFragment);
});
LatexCmds.langle = LatexCmds.lang = proto(Bracket, function(replacedFragment)
{
  Bracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ',replacedFragment);
});

// Closing bracket matching opening bracket above
function CloseBracket(open, close, cmd, end, replacedFragment)
{
  Bracket.apply(this, arguments);
}
CloseBracket.prototype = new Bracket;
CloseBracket.prototype.placeCursor = function(cursor)
{
  //if I'm at the end of my parent who is a matching open-paren, and I was not passed
  //  a selection fragment, get rid of me and put cursor after my parent
  if(!this.next && this.parent.parent && this.parent.parent.end === this.end && this.firstChild.isEmpty())
    cursor.backspace().insertAfter(this.parent.parent);
  else
    this.firstChild.setEmpty().jQ.change();
};

LatexCmds.rbrace = CharCmds['}'] = proto(CloseBracket, function(replacedFragment)
{
  CloseBracket.call(this, '{','}','\\{','\\}',replacedFragment);
});
LatexCmds.rangle = LatexCmds.rang = proto(CloseBracket, function(replacedFragment)
{
  CloseBracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ',replacedFragment);
});

function Paren(open, close, replacedFragment)
{
  Bracket.call(this, open, close, open, close, replacedFragment);
}
Paren.prototype = Bracket.prototype;

LatexCmds.lparen = CharCmds['('] = proto(Paren, function(replacedFragment)
{
  Paren.call(this, '(', ')', replacedFragment);
});
LatexCmds.lbrack = LatexCmds.lbracket = CharCmds['['] = proto(Paren, function(replacedFragment)
{
  Paren.call(this, '[', ']', replacedFragment);
});

function CloseParen(open, close, replacedFragment)
{
  CloseBracket.call(this, open, close, open, close, replacedFragment);
}
CloseParen.prototype = CloseBracket.prototype;

LatexCmds.rparen = CharCmds[')'] = proto(CloseParen, function(replacedFragment)
{
  CloseParen.call(this, '(', ')', replacedFragment);
});
LatexCmds.rbrack = LatexCmds.rbracket = CharCmds[']'] = proto(CloseParen, function(replacedFragment)
{
  CloseParen.call(this, '[', ']', replacedFragment);
});

function Pipes(replacedFragment)
{
  Paren.call(this, '|', '|', replacedFragment);
}
Pipes.prototype = new Paren;
Pipes.prototype.placeCursor = function(cursor)
{
  if(!this.next && this.parent.parent && this.parent.parent.end === this.end && this.firstChild.isEmpty())
    cursor.backspace().insertAfter(this.parent.parent);
  else
    cursor.appendTo(this.firstChild);
};

LatexCmds.lpipe = LatexCmds.rpipe = CharCmds['|'] = Pipes;

function TextBlock(replacedText)
{
  if(replacedText instanceof MathFragment)
    this.replacedText = replacedText.remove().jQ.text();
  else if(typeof replacedText === 'string')
    this.replacedText = replacedText;
  MathCommand.call(this, '\\text');
}
TextBlock.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="text"></span>'],
  initBlocks: function()
  {
    this.firstChild = this.lastChild =
      this.jQ.data('[[mathquill internal data]]').block = new InnerTextBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ.append(this.firstChild.jQ);
  },
  placeCursor: function(cursor)
  {
    (this.cursor = cursor).appendTo(this.firstChild);
    if(this.replacedText)
      for(var i = 0; i < this.replacedText.length; i += 1)
        this.write(this.replacedText.charAt(i));
  },
  write: function(ch)
  {
    this.cursor.insertNew(new VanillaSymbol(ch));
  },
  keydown: function(e)
  {
    //backspace and delete and ends of block don't unwrap
    if(!this.cursor.selection &&
      ((e.which === 8 && !this.cursor.prev) ||
      (e.which === 46 && !this.cursor.next)))
    {
      if(this.isEmpty())
        this.cursor.insertAfter(this);
      return false;
    }
    return this.parent.keydown(e);
  },
  keypress: function(e)
  {
    this.cursor.deleteSelection();
    var ch = String.fromCharCode(e.which);
    if(ch === '$')
      if(this.isEmpty())
        this.cursor.insertAfter(this).backspace().insertNew(new VanillaSymbol('\\$','$'));
      else if(!this.cursor.next)
        this.cursor.insertAfter(this);
      else if(!this.cursor.prev)
        this.cursor.insertBefore(this);
      else //split apart
      {
        var next = new TextBlock(new MathFragment(this.firstChild, this.cursor.prev));
        next.placeCursor = function(cursor) // ********** REMOVEME HACK **********
        {
          this.prev = null;
          delete this.placeCursor;
          this.placeCursor(cursor);
        };
        next.firstChild.removeEmpty = function(){ return this; };
        this.cursor.insertAfter(this).insertNew(next);
        next.prev = this;
        this.cursor.insertBefore(next);
        delete next.firstChild.removeEmpty;
      }
    else
      this.write(ch);
    return false;
  }
});
function InnerTextBlock(){}
InnerTextBlock.prototype = $.extend(new MathBlock, {
  setEmpty: function(cursor)
  {
    this.jQ.removeClass('hasCursor');
    if(this.isEmpty())
    {
      var textblock = this.parent, cursor = textblock.cursor;
      if(cursor.parent === this)
        this.jQ.addClass('empty');
      else
      {
        cursor.hide();
        textblock.remove();
        if(cursor.next === textblock)
          cursor.next = textblock.next;
        else if(cursor.prev === textblock)
          cursor.prev = textblock.prev;
        cursor.show().jQ.change();
      }
    }
    return this;
  },
  removeEmpty: function()
  {
    this.jQ.addClass('hasCursor');
    if(this.isEmpty())
      this.jQ.removeClass('empty');
    var textblock = this.parent;
    if(textblock.next instanceof TextBlock)
    {
      var innerblock = this, cursor = textblock.cursor,
        next = textblock.next.firstChild;
      next.eachChild(function(){
        this.parent = innerblock;
        this.jQ.appendTo(innerblock.jQ);
      });
      next.firstChild.prev = this.lastChild;
      if(this.lastChild)
        this.lastChild.next = next.firstChild;
      else
        this.firstChild = next.firstChild;
      this.lastChild = next.lastChild;
      next.parent.remove();
      if(cursor.prev)
        cursor.insertAfter(cursor.prev);
      else
        cursor.prependTo(this);
      this.jQ.change();
      return false;
    }
    else if(textblock.prev instanceof TextBlock)
    {
      var cursor = textblock.cursor;
      if(cursor.prev)
        textblock.prev.firstChild.removeEmpty();
      else
        cursor.appendTo(textblock.prev.firstChild);
      return false;
    }

    return true;
  }
});

LatexCmds.text = CharCmds.$ = TextBlock;

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedFragment)
{
  MathCommand.call(this, '\\');
  if(replacedFragment)
  {
    this.replacedFragment = replacedFragment.detach();
    this.isEmpty = function(){ return false; };
  }
}
LatexCommandInput.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="latex-command-input"></span>'],
  placeCursor: function(cursor)
  {
    this.cursor = cursor.appendTo(this.firstChild);
    if(this.replacedFragment)
      this.jQ = this.jQ.add(this.replacedFragment.jQ.addClass('blur').insertBefore(this.jQ));
  },
  latex: function()
  {
    return '\\' + this.firstChild.latex() + ' ';
  },
  keydown: function(e)
  {
    if(e.which === 9 || e.which === 13) //tab or enter
    {
      this.renderCommand();
      return false;
    }
    return this.parent.keydown(e);
  },
  keypress: function(e)
  {
    var char = String.fromCharCode(e.which);
    if(char.match(/[a-z]/i))
    {
      this.cursor.deleteSelection();
      this.cursor.insertNew(new VanillaSymbol(char));
      return false;
    }
    this.renderCommand();
    if(char === ' ' || (char === '\\' && this.firstChild.isEmpty()))
      return false;
    return this.cursor.parent.keypress(e);
  },
  renderCommand: function()
  {
    this.jQ = this.jQ.last();
    this.remove();
    if(this.next)
      this.cursor.insertBefore(this.next);
    else
      this.cursor.appendTo(this.parent);
    var latex = this.firstChild.latex(), cmd;
    if(latex)
      if(cmd = LatexCmds[latex])
        cmd = new cmd(this.replacedFragment, latex);
      else
      {
        cmd = new TextBlock(latex);
        cmd.firstChild.removeEmpty = function(){ delete this.removeEmpty; return true; };
        this.cursor.insertNew(cmd).insertAfter(cmd);
        if(this.replacedFragment)
          this.replacedFragment.remove();
        return;
      }
    else
      cmd = new VanillaSymbol('\\backslash ','\\');
    this.cursor.insertNew(cmd);
    if(cmd instanceof Symbol && this.replacedFragment)
      this.replacedFragment.remove();
  }
});

CharCmds['\\'] = LatexCommandInput;
  
function Binomial(replacedFragment)
{
  MathCommand.call(this, '\\binom', undefined, replacedFragment);
  this.jQ.wrapInner('<span class="array"></span>').prepend('<span class="paren">(</span>').append('<span class="paren">)</span>');
  this.firstChild.jQ.parent().change(function()
  {
    var block = $(this);
    block.prev().add(block.next()).css('fontSize', block.height()/(+block.css('fontSize').slice(0,-2)*.9+2)+'em');
  });
}
Binomial.prototype = new MathCommand;
Binomial.prototype.html_template =
  ['<span></span>', '<span></span>', '<span></span>'];

LatexCmds.binom = LatexCmds.binomial = Binomial;

function Choose()
{
  Binomial.apply(this, arguments);
}
Choose.prototype = new Binomial;
Choose.prototype.placeCursor = LiveFraction.prototype.placeCursor;

LatexCmds.choose = Choose;

function Vector(replacedFragment)
{
  MathCommand.call(this, '\\vector', undefined, replacedFragment);
}
Vector.prototype = new MathCommand;
Vector.prototype.html_template =
  ['<span class="array"></span>', '<span></span>'];
Vector.prototype.latex = function()
{
  return '\\begin{matrix}' + this.reduceChildren(function(initValue){
    initValue.push(this.latex());
    return initValue;
  }, []).join('\\\\') + '\\end{matrix}';
};
Vector.prototype.placeCursor = function(cursor)
{
  this.cursor = cursor.appendTo(this.firstChild);
};
Vector.prototype.keydown = function(e)
{
  var currentBlock = this.cursor.parent;
  if(currentBlock.parent === this)
    if(e.which === 13) //enter
    {
      var newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.jQ = $('<span></span>').data('[[mathquill internal data]]', {block: newBlock}).insertAfter(currentBlock.jQ);
      if(currentBlock.next)
        currentBlock.next.prev = newBlock;
      else
        this.lastChild = newBlock;
      newBlock.next = currentBlock.next;
      currentBlock.next = newBlock;
      newBlock.prev = currentBlock;
      this.cursor.appendTo(newBlock);
      this.jQ.change();
      return false;
    }
    else if(e.which === 9 && !e.shiftKey && !currentBlock.next) //tab
    {
      if(currentBlock.isEmpty())
        if(currentBlock.prev)
        {
          this.cursor.insertAfter(this);
          delete currentBlock.prev.next;
          this.lastChild = currentBlock.prev;
          currentBlock.jQ.remove();
          this.jQ.change();
          return false;
        }
        else
          return this.parent.keydown(e);

      var newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.jQ = $('<span></span>').data('[[mathquill internal data]]', {block: newBlock}).appendTo(this.jQ);
      this.lastChild = newBlock;
      currentBlock.next = newBlock;
      newBlock.prev = currentBlock;
      this.cursor.appendTo(newBlock);
      this.jQ.change();
      return false;
    }
    else if(e.which === 8) //backspace
      if(currentBlock.isEmpty())
      {
        if(currentBlock.prev)
        {
          this.cursor.appendTo(currentBlock.prev)
          currentBlock.prev.next = currentBlock.next;
        }
        else
        {
          this.cursor.insertBefore(this);
          this.firstChild = currentBlock.next;
        }
        if(currentBlock.next)
          currentBlock.next.prev = currentBlock.prev;
        else
          this.lastChild = currentBlock.prev;
        currentBlock.jQ.remove();
        if(this.isEmpty())
          this.cursor.deleteForward();
        else
          this.jQ.change();
        return false;
      }
      else if(!this.cursor.prev)
        return false;
  return this.parent.keydown(e);
};

LatexCmds.vector = Vector;
/**********************************
 * Symbols and Special Characters
 *********************************/

function bind(cons) //shorthand for binding arguments to constructor
{
  var args = Array.prototype.slice.call(arguments, 1);

  return proto(cons, function()
  {
    cons.apply(this, args);
  });
}

LatexCmds.f = bind(Symbol, 'f', '<var class="florin">&fnof;</var>');

function Variable(ch, html)
{
  Symbol.call(this, ch, '<var>'+(html || ch)+'</var>');
}
Variable.prototype = Symbol.prototype;

function VanillaSymbol(ch, html)
{
  Symbol.call(this, ch, '<span>'+(html || ch)+'</span>');
}
VanillaSymbol.prototype = Symbol.prototype;

CharCmds[' '] = bind(VanillaSymbol, '\\:', ' ');

LatexCmds.prime = CharCmds["'"] = bind(VanillaSymbol, "'", '&prime;');

function NonSymbolaSymbol(ch, html) //does not use Symbola font
{
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
LatexCmds.omega = proto(Symbol, function(replacedFragment, latex)
{
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
LatexCmds.pi = bind(NonSymbolaSymbol,'\\pi ','&pi;');
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
LatexCmds.forall = proto(Symbol, function(replacedFragment, latex)
{
  VanillaSymbol.call(this,'\\'+latex+' ','&'+latex+';');
});

function BinaryOperator(cmd, html)
{
  Symbol.call(this, cmd, '<span class="binary-operator">'+html+'</span>');
}
BinaryOperator.prototype = new Symbol; //so instanceof will work

function PlusMinus(cmd, html)
{
  VanillaSymbol.apply(this, arguments);
}
PlusMinus.prototype = new BinaryOperator; //so instanceof will work
PlusMinus.prototype.respace = function()
{
  if(!this.prev)
    this.jQ[0].className = '';
  else if(this.prev instanceof BinaryOperator && this.next && !(this.next instanceof BinaryOperator))
    this.jQ[0].className = 'unary-operator';
  else
    this.jQ[0].className = 'binary-operator';
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
LatexCmds.times =
LatexCmds.oplus =
LatexCmds.otimes = proto(BinaryOperator, function(replacedFragment, latex)
{
  BinaryOperator.call(this,'\\'+latex+' ','&'+latex+';');
});

LatexCmds.div = LatexCmds.divide = LatexCmds.divides =
  bind(BinaryOperator,'\\div ','&divide;');

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

LatexCmds.gt = bind(BinaryOperator,'<','&gt;');

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
function BigSymbol(ch, html)
{
  Symbol.call(this, ch, '<big>'+html+'</big>');
}
BigSymbol.prototype = new Symbol; //so instanceof will work

LatexCmds.sum = LatexCmds.summation = bind(BigSymbol,'\\sum ','&sum;');
LatexCmds.prod = LatexCmds.product = bind(BigSymbol,'\\prod ','&prod;');
LatexCmds.coprod = LatexCmds.coproduct = bind(BigSymbol,'\\coprod ','&#8720;');
LatexCmds.int = LatexCmds.integral = bind(BigSymbol,'\\int ','&int;');



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
/* spacing special characters, gonna have to implement this in LatexCommandInput.prototype.keypress somehow
case ',':
  return new VanillaSymbol('\\, ',' ');
case ':':
  return new VanillaSymbol('\\: ','  ');
case ';':
  return new VanillaSymbol('\\; ','   ');
case '!':
  return new Symbol('\\! ','<span style="margin-right:-.2em"></span>');
*/

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


function NonItalicizedFunction(replacedFragment, fn)
{
  Symbol.call(this, '\\'+fn+' ', '<span>'+fn+'</span>');
}
NonItalicizedFunction.prototype = new Symbol;
NonItalicizedFunction.prototype.respace = function()
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

(function()
{
  var trig = ['sin', 'cos', 'tan', 'sec', 'cosec', 'csc', 'cotan', 'cot'];
  for(var i in trig)
    LatexCmds[trig[i]] =
    LatexCmds[trig[i]+'h'] =
    LatexCmds['a'+trig[i]] = LatexCmds['arc'+trig[i]] =
    LatexCmds['a'+trig[i]+'h'] = LatexCmds['arc'+trig[i]+'h'] =
      NonItalicizedFunction;
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
function Cursor(root)
{
  this.parent = root;
  var jQ = this.jQ = this._jQ = $('<span class="cursor"></span>');

  //API for the blinking cursor
  function blink(){ jQ.toggleClass('blink'); }
  var intervalId;
  this.show = function()
  {
    this.jQ = this._jQ.removeClass('blink');
    if(intervalId)
      clearInterval(intervalId);
    else if(this.parent.removeEmpty(this.jQ))
      if(this.next)
        if(this.selection && this.selection.prev === this.prev)
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this.next.jQ);
      else
        this.jQ.appendTo(this.parent.jQ);
    intervalId = setInterval(blink, 500);
    return this;
  };
  this.hide = function()
  {
    if(intervalId)
      clearInterval(intervalId);
    intervalId = undefined;
    this.jQ.detach();
    this.jQ = $();
    return this;
  };
}
Cursor.prototype = {
  prev: null,
  next: null,
  parent: null,
  insertAt: function(parent, next, prev)
  {
    var p = this.parent;
    this.parent = parent;
    this.next = next;
    this.prev = prev;
    p.setEmpty(); //p.setEmpty may want to know where the cursor is going
  },
  insertBefore: function(el)
  {
    this.insertAt(el.parent, el, el.prev)
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first());
    return this;
  },
  insertAfter: function(el)
  {
    this.insertAt(el.parent, el.next, el);
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  },
  prependTo: function(el)
  {
    this.insertAt(el, el.firstChild, null);
    if(el.removeEmpty(this.jQ))
      if(el.parent)
        this.jQ.prependTo(el.jQ);
      else //only root has no parent
        this.jQ.insertAfter(el.textarea);
    return this;
  },
  appendTo: function(el)
  {
    this.insertAt(el, null, el.lastChild);
    if(el.removeEmpty(this.jQ))
      this.jQ.appendTo(el.jQ);
    return this;
  },
  moveLeft: function()
  {
    if(this.selection)
      this.insertBefore(this.selection.prev ? this.selection.prev.next : this.parent.firstChild).clearSelection();
    else
      if(this.prev)
        if(this.prev.lastChild)
          this.appendTo(this.prev.lastChild)
        else
          this.hopLeft();
      else //we're at the beginning of a block
        if(this.parent.prev)
          this.appendTo(this.parent.prev);
        else if(this.parent.parent)
          this.insertBefore(this.parent.parent);
    //otherwise we're at the beginning of the root, so do nothing.
    return this.show();
  },
  moveRight: function()
  {
    if(this.selection)
      this.insertAfter(this.selection.next ? this.selection.next.prev : this.parent.lastChild).clearSelection();
    else
      if(this.next)
        if(this.next.firstChild)
          this.prependTo(this.next.firstChild)
        else
          this.hopRight();
      else //we're at the end of a block
        if(this.parent.next)
          this.prependTo(this.parent.next);
        else if(this.parent.parent)
          this.insertAfter(this.parent.parent);
    //otherwise we're at the end of the root, so do nothing.
    return this.show();
  },
  hopLeft: function()
  {
    this.jQ.insertBefore(this.prev.jQ.first());
    this.next = this.prev;
    this.prev = this.prev.prev;
    return this;
  },
  hopRight: function()
  {
    this.jQ.insertAfter(this.next.jQ.last());
    this.prev = this.next;
    this.next = this.next.next;
    return this;
  },
  write: function(ch)
  {
    if(this.selection)
    {
      //gotta do this before this.selection is mutated by 'new cmd(this.selection)'
      this.prev = this.selection.prev;
      this.next = this.selection.next;
    }

    var cmd;
    if(ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
      cmd = new Variable(ch);
    else if(cmd = CharCmds[ch] || LatexCmds[ch])
      cmd = new cmd(this.selection, ch);
    else
      cmd = new VanillaSymbol(ch);

    if(this.selection)
    {
      if(cmd instanceof Symbol)
        this.selection.remove();
      delete this.selection;
    }

    return this.insertNew(cmd);
  },
  insertNew: function(cmd)
  {
    cmd.parent = this.parent;
    cmd.next = this.next;
    cmd.prev = this.prev;
    if(this.prev)
      this.prev.next = cmd;
    else
      this.parent.firstChild = cmd;
    if(this.next)
      this.next.prev = cmd;
    else
      this.parent.lastChild = cmd;
    cmd.jQ.insertBefore(this.jQ);

    //adjust context-sensitive spacing
    cmd.respace();
    if(this.next)
      this.next.respace();
    if(this.prev)
      this.prev.respace();

    this.prev = cmd;

    cmd.placeCursor(this);

    this.jQ.change();

    return this;
  },
  unwrapParent: function()
  {
    var gramp = this.parent.parent, greatgramp = gramp.parent,
      cursor = this, prev = gramp.prev;

    gramp.eachChild(function()
    {
      if(this.isEmpty())
        return;

      this.eachChild(function()
      {
        this.parent = greatgramp;
        this.jQ.insertBefore(gramp.jQ);
      });
      this.firstChild.prev = prev;
      if(prev)
        prev.next = this.firstChild;
      else
        this.firstChild.parent.firstChild = this.firstChild;

      prev = this.lastChild;
    });
    if(prev)
    {
      prev.next = gramp.next;
      if(prev.next)
        prev.next.prev = prev;
      else
        greatgramp.lastChild = prev;
    }
    else
    {
      greatgramp.firstChild = gramp.next;
      if(gramp.next)
        gramp.next.prev = prev;
      else
        greatgramp.lastChild = prev;
    }

    if(!this.next)
      if(this.prev)
        this.next = this.prev.next;
      else
        while(!this.next)
          if(this.parent = this.parent.next)
            this.next = this.parent.lastChild;
          else
          {
            this.next = gramp.next;
            this.parent = greatgramp;
            break;
          }

    if(this.next)
      this.insertBefore(this.next);
    else
      this.appendTo(greatgramp);

    gramp.jQ.remove();

    if(gramp.prev)
      gramp.prev.respace();
    if(gramp.next)
      gramp.next.respace();
  },
  backspace: function()
  {
    if(this.deleteSelection());
    else if(this.prev)
      if(this.prev.isEmpty())
        this.prev = this.prev.remove().prev;
      else
        this.selectLeft();
    else if(this.parent.parent)
      if(this.parent.parent.isEmpty())
        return this.insertAfter(this.parent.parent).backspace();
      else
        this.unwrapParent();

    if(this.prev)
      this.prev.respace();
    if(this.next)
      this.next.respace();
    this.jQ.change();

    return this;
  },
  deleteForward: function()
  {
    if(this.deleteSelection());
    else if(this.next)
      if(this.next.isEmpty())
        this.next = this.next.remove().next;
      else
        this.selectRight();
    else if(this.parent.parent)
      if(this.parent.parent.isEmpty())
        return this.insertBefore(this.parent.parent).deleteForward();
      else
        this.unwrapParent();

    if(this.prev)
      this.prev.respace();
    if(this.next)
      this.next.respace();
    this.jQ.change();

    return this;
  },
  selectLeft: function()
  {
    if(this.selection)
      if(this.selection.prev === this.prev) //if cursor is at left edge of selection,
      {
        if(this.prev) //then extend left if possible
        {
          this.hopLeft().next.jQ.prependTo(this.selection.jQ);
          this.selection.prev = this.prev;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertBefore(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at right edge of selection, retract left
      {
        this.prev.jQ.insertAfter(this.selection.jQ);
        this.hopLeft().selection.next = this.next;
        if(this.selection.prev === this.prev)
          this.deleteSelection();
      }
    else
      if(this.prev)
        this.hide().hopLeft().selection = new Selection(this.parent, this.prev, this.next.next);
      else //end of a block
        if(this.parent.parent)
          this.hide().insertBefore(this.parent.parent).selection = new Selection(this.parent, this.prev, this.next.next);
  },
  selectRight: function()
  {
    if(this.selection)
      if(this.selection.next === this.next) //if cursor is at right edge of selection,
      {
        if(this.next) //then extend right if possible
        {
          this.hopRight().prev.jQ.appendTo(this.selection.jQ);
          this.selection.next = this.next;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertAfter(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at left edge of selection, retract right
      {
        this.next.jQ.insertBefore(this.selection.jQ);
        this.hopRight().selection.prev = this.prev;
        if(this.selection.next === this.next)
          this.deleteSelection();
      }
    else
      if(this.next)
        this.hide().hopRight().selection = new Selection(this.parent, this.prev.prev, this.next);
      else //end of a block
        if(this.parent.parent)
          this.hide().insertAfter(this.parent.parent).selection = new Selection(this.parent, this.prev.prev, this.next);
  },
  clearSelection: function()
  {
    if(this.show().selection)
    {
      this.selection.clear();
      delete this.selection;
    }
    return this;
  },
  deleteSelection: function()
  {
    if(this.show().selection)
    {
      this.prev = this.selection.prev;
      this.next = this.selection.next;
      this.selection.remove();
      delete this.selection;
      return true;
    }
    else
      return false;
  }
}

function Selection(parent, prev, next)
{
  MathFragment.apply(this, arguments);
}
Selection.prototype = $.extend(new MathFragment, {
  jQinit: function(children)
  {
    return this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //wrapAll clones, so can't do .wrapAll(this.jQ = $(...));
  },
  levelUp: function()
  {
    this.clear().jQinit(this.parent.parent.jQ);

    this.prev = this.parent.parent.prev;
    this.next = this.parent.parent.next;
    this.parent = this.parent.parent.parent;

    return this;
  },
  clear: function()
  {
    this.jQ.replaceWith(this.jQ.children());
    return this;
  },
  blockify: function()
  {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return MathFragment.prototype.blockify.call(this);
  },
  detach: function()
  {
    var block = MathFragment.prototype.blockify.call(this);
    this.blockify = function()
    {
      this.jQ.replaceWith(block.jQ = this.jQ = this.jQ.children());
      return block;
    };
    return this;
  }
});
/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(type)
{
  var textbox = type === 'textbox', editable = textbox || type === 'editable';
  return this.each(function()
  {
    var jQ = $(this), contents = jQ.contents().detach(),
      root = new (textbox ? RootTextBlock : RootMathBlock);
    if(!textbox)
      jQ.addClass('mathquill-rendered-math');
    root.jQ = jQ.data('[[mathquill internal data]]', {
      block: root,
      revert: function()
      {
        jQ.empty().unbind('.mathquill')
          .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
          .append(contents);
      }
    });

    var cursor = root.cursor = new Cursor(root);

    root.renderLatex(contents.text());

    if(!editable)
      return;

    var textarea = root.textarea =
      $('<span class="textarea"><textarea></textarea></span>')
        .prependTo(jQ.addClass('mathquill-editable')).children();
    if(textbox)
      jQ.addClass('mathquill-textbox');

    textarea.focus(function(e)
    {
      if(!cursor.parent)
        cursor.appendTo(root);
      cursor.parent.jQ.addClass('hasCursor');
      if(cursor.selection)
        cursor.selection.jQ.removeClass('blur');
      else
        cursor.show();
      e.stopPropagation();
    }
    ).blur(function(e)
    {
      cursor.hide().parent.setEmpty();
      if(cursor.selection)
        cursor.selection.jQ.addClass('blur');
      e.stopPropagation();
    });

    var lastKeydnEvt; //see Wiki page "Keyboard Events"
    jQ.bind('keydown.mathquill',function(e) //see Wiki page "Keyboard Events"
    {
      lastKeydnEvt = e;
      e.happened = true;
      return e.returnValue = cursor.parent.keydown(e) ||
        (e.stopImmediatePropagation(), false);
    }
    ).bind('keypress.mathquill',function(e)
    {
      //on auto-repeated key events, keypress may get triggered but not keydown
      //  (see Wiki page "Keyboard Events")
      if(lastKeydnEvt.happened)
        lastKeydnEvt.happened = false;
      else
        lastKeydnEvt.returnValue = cursor.parent.keydown(lastKeydnEvt);
      //only call keypress if keydown returned true
      return lastKeydnEvt.returnValue && (e.ctrlKey || e.metaKey || e.which < 32 ||
        cursor.parent.keypress(e) || (e.stopImmediatePropagation(), false));
    }
    ).bind('click.mathquill',function(e)
    {
      var clicked = $(e.target);
      if(clicked.hasClass('empty'))
      {
        cursor.clearSelection().prependTo(clicked.data('[[mathquill internal data]]').block);
        return false;
      }

      var cmd = clicked.data('[[mathquill internal data]]');
      if(cmd)
      {
        if(cmd.cmd && !cmd.block)
        {
          cursor.clearSelection();
          if(clicked.outerWidth() > 2*(e.pageX - clicked.offset().left))
            cursor.insertBefore(cmd.cmd);
          else
            cursor.insertAfter(cmd.cmd);
          return false;
        }
      }
      else if(!(cmd = (clicked = clicked.parent()).data('[[mathquill internal data]]')))
          return;

      cursor.clearSelection();
      if(cmd.cmd)
        cursor.insertAfter(cmd.cmd);
      else
        cursor.appendTo(cmd.block);
      //move cursor to position closest to click
      var prevPrevDist, prevDist, dist = cursor.jQ.offset().left - e.pageX;
      do
      {
        cursor.moveLeft();
        prevPrevDist = prevDist;
        prevDist = dist;
        dist = Math.abs(cursor.jQ.offset().left - e.pageX);
      }
      while(dist <= prevDist && dist != prevPrevDist);
      if(dist != prevPrevDist)
        cursor.moveRight();

      return false;
    }
    ).bind('click.mathquill',function()
    {
      textarea.focus();
    }
    ).bind('focus.mathquill blur.mathquill',function(e)
    {
      textarea.trigger(e);
    }
    ).blur();
  });
}

function RootMathBlock(){}
RootMathBlock.prototype = $.extend(new MathBlock, {
  latex: function()
  {
    return MathBlock.prototype.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
  },
  renderLatex: function(latex)
  {
    latex = latex.match(/\\[a-z]*|[^\s]/ig);
    this.jQ.children(':not(.textarea)').remove();
    this.firstChild = this.lastChild = null;
    this.cursor.show().appendTo(this);
    if(latex)
      (function recurse(cursor)
      {
        while(latex.length)
        {
          var token = latex.shift(); //pop first item
          if(!token || token === '}')
            return;
          var cmd;
          if(token === '\\text')
          {
            var text = latex.shift();
            if(text === '{')
            {
              text = token = latex.shift();
              while(token !== '}')
              {
                if(token === '\\') //skip tokens immediately following backslash
                  text += token = latex.shift();
                text += token = latex.shift();
              }
              text = text.slice(0,-1); //cut trailing '}'
            }
            cmd = new TextBlock(text);
            cursor.insertNew(cmd).insertAfter(cmd);
            continue;
          }
          else if(token === '\\left' || token === '\\right') //REMOVEME HACK for parens
          {
            token = latex.shift();
            if(token === '\\')
              token = latex.shift();
            cursor.write(token);
            cmd = cursor.prev || cursor.parent.parent;
            if(cursor.prev)
              return;
            else
              latex.unshift('{');
          }
          else if(/^\\[a-z]+$/i.test(token))
          {
            token = token.slice(1);
            var cmd = LatexCmds[token];
            if(cmd)
              cursor.insertNew(cmd = new cmd(undefined, token));
            else
            {
              cmd = new TextBlock(token);
              cursor.insertNew(cmd).insertAfter(cmd);
              continue;
            }
          }
          else
          {
            if(token.match(/[a-eg-zA-Z]/)) //exclude f because want florin
              cmd = new Variable(token);
            else if(cmd = LatexCmds[token])
              cmd = new cmd;
            else
              cmd = new VanillaSymbol(token);
            cursor.insertNew(cmd);
          }
          cmd.eachChild(function()
          {
            cursor.appendTo(this);
            var token = latex.shift();
            if(!token)
              return false;
            if(token === '{')
              recurse(cursor);
            else
              cursor.write(token);
          });
          cursor.insertAfter(cmd);
        }
      }(this.cursor));
    this.cursor.hide();
    this.setEmpty();
  },
  keydown: function(e)
  {
    this.skipKeypress = false;
    e.ctrlKey = e.ctrlKey || e.metaKey;
    switch((e.originalEvent && e.originalEvent.keyIdentifier) || e.which)
    {
    case 8: //backspace
    case 'Backspace':
    case 'U+0008':
      if(e.ctrlKey)
        while(this.cursor.prev)
          this.cursor.backspace();
      else
        this.cursor.backspace();
      return false;
    case 27: //esc does something weird in keypress, may as well be the same as tab
             //  until we figure out what to do with it
    case 'Esc':
    case 'U+001B':
    case 9: //tab
    case 'Tab':
    case 'U+0009':
      if(e.ctrlKey)
        return true;
      var parent = this.cursor.parent, gramp = parent.parent;
      if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
      {
        if(!gramp) //cursor is in the root, continue default
          return this.skipKeypress = true;
        else if(parent.prev) //go one block left
          this.cursor.appendTo(parent.prev);
        else //get out of the block
          this.cursor.insertBefore(gramp);
      }
      else //plain Tab = go one block right if it exists, else escape right.
      {
        if(!gramp) //cursor is in the root, continue default
          return this.skipKeypress = true;
        else if(parent.next) //go one block right
          this.cursor.prependTo(parent.next);
        else //get out of the block
          this.cursor.insertAfter(gramp);
      }
      this.cursor.clearSelection();
      return false;
    case 13: //enter
    case 'Enter':
      e.preventDefault();
      return this.skipKeypress = true;
    case 35: //end
    case 'End':
      if(e.shiftKey)
        while(this.cursor.next || (e.ctrlKey && this.cursor.parent.parent))
          this.cursor.selectRight();
      else //move to the end of the root block or the current block.
        this.cursor.clearSelection().appendTo(e.ctrlKey ? this : this.cursor.parent);
      return false;
    case 36: //home
    case 'Home':
      if(e.shiftKey)
        while(this.cursor.prev || (e.ctrlKey && this.cursor.parent.parent))
          this.cursor.selectLeft();
      else //move to the start of the root block or the current block.
        this.cursor.clearSelection().prependTo(e.ctrlKey ? this : this.cursor.parent);
      return false;
    case 37: //left
    case 'Left':
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        this.cursor.selectLeft();
      else
        this.cursor.moveLeft();
      return false;
    case 38: //up
    case 'Up':
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        if(this.cursor.prev)
          while(this.cursor.prev)
            this.cursor.selectLeft();
        else
          this.cursor.selectLeft();
      else if(this.cursor.parent.prev)
        this.cursor.clearSelection().appendTo(this.cursor.parent.prev);
      else if(this.cursor.prev)
        this.cursor.clearSelection().prependTo(this.cursor.parent);
      else if(this.cursor.parent.parent)
        this.cursor.clearSelection().insertBefore(this.cursor.parent.parent);
      return false;
    case 39: //right
    case 'Right':
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        this.cursor.selectRight();
      else
        this.cursor.moveRight();
      return false;
    case 40: //down
    case 'Down':
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        if(this.cursor.next)
          while(this.cursor.next)
            this.cursor.selectRight();
        else
          this.cursor.selectRight();
      else if(this.cursor.parent.next)
        this.cursor.clearSelection().prependTo(this.cursor.parent.next);
      else if(this.cursor.next)
        this.cursor.clearSelection().appendTo(this.cursor.parent);
      else if(this.cursor.parent.parent)
        this.cursor.clearSelection().insertAfter(this.cursor.parent.parent);
      return false;
    case 46: //delete
    case 'Del':
    case 'U+007F':
      if(e.ctrlKey)
        while(this.cursor.next)
          this.cursor.deleteForward();
      else
        this.cursor.deleteForward();
      return false;
    case 65: //'a' character, as in Select All
    case 'A':
    case 'U+0041':
      if(!e.ctrlKey || e.shiftKey || e.altKey)
        return true;
      if(this.parent) //so not stopPropagation'd at RootMathCommand
        return this.parent.keydown(e);
      this.cursor.clearSelection().appendTo(this);
      while(this.cursor.prev)
        this.cursor.selectLeft();
      return false;
    default:
      return true;
    }
  },
  keypress: function(e)
  {
    if(this.skipKeypress)
      return true;
    this.cursor.show().write(String.fromCharCode(e.which));
    return false;
  }
});

function RootMathCommand(cursor)
{
  MathCommand.call(this, '$');
  this.firstChild.cursor = cursor;
  this.firstChild.keypress = function(e)
  {
    if(this.skipKeypress)
      return true;
    var ch = String.fromCharCode(e.which);
    if(ch === '$' && cursor.parent == this)
    {
      if(this.isEmpty())
        cursor.insertAfter(this.parent).backspace().insertNew(new VanillaSymbol('\\$','$')).show();
      else if(!cursor.next)
        cursor.insertAfter(this.parent);
      else if(!cursor.prev)
        cursor.insertBefore(this.parent);
      else
        cursor.show().write(ch);
      return false;
    }
    cursor.show().write(ch);
    return false;
  };
}
RootMathCommand.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="mathquill-rendered-math"></span>'],
  initBlocks: function()
  {
    this.firstChild = this.lastChild =
      this.jQ.data('[[mathquill internal data]]').block = new RootMathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ;
  }
});

function RootTextBlock(){}
RootTextBlock.prototype = $.extend(new MathBlock, {
  renderLatex: $.noop,
  keydown: RootMathBlock.prototype.keydown,
  keypress: function(e)
  {
    if(this.skipKeypress)
      return true;
    this.cursor.deleteSelection();
    var ch = String.fromCharCode(e.which);
    if(ch === '$')
      this.cursor.insertNew(new RootMathCommand(this.cursor));
    else
      this.cursor.insertNew(new VanillaSymbol(ch));
    return false;
  }
});
/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
$.fn.mathquill = function(cmd, latex)
{
  switch(cmd)
  {
  case 'redraw':
    this.find(':not(:has(:first))').change();
    return this;
  case 'revert':
    return this.each(function()
    {
      var mathObj = $(this).data('[[mathquill internal data]]');
      if(mathObj && mathObj.revert)
        mathObj.revert();
    });
  case 'latex':
    if(arguments.length > 1)
      return this.each(function()
      {
        var mathObj = $(this).data('[[mathquill internal data]]');
        if(mathObj && mathObj.block && mathObj.block.renderLatex)
          mathObj.block.renderLatex(latex);
      });
    var mathObj = this.data('[[mathquill internal data]]');
    return mathObj && mathObj.block && mathObj.block.latex();
  case 'html':
    return this.html().replace(/<span class="?cursor( blink)?"?><\/span>|<span class="?textarea"?><textarea><\/textarea><\/span>/ig, '');
  case 'write':
    latex = latex.charAt(0) === '\\' ? latex.slice(1) : latex;
    if(arguments.length > 1)
      return this.each(function()
      {
        var mathObj = $(this).data('[[mathquill internal data]]'),
          block = mathObj && mathObj.block, cursor = block && block.cursor;
        if(cursor)
        {
          cursor.show().write(latex);
          block.textarea.triggerHandler('blur');
        }
      });
  default:
    return createRoot.call(this, cmd);
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function()
{
  $('.mathquill-embedded-latex').mathquill();
  $('.mathquill-editable').mathquill('editable');
  $('.mathquill-textbox').mathquill('textbox');
});

}(jQuery));
