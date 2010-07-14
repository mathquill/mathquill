/**
* Usage:
* $(thing).mathquill();
* turns thing into a live editable math thingy.
* AMAZORZ.
*
* Note: turning into a live editable math thingmajiggie works, but
* any LaTeX math in it won't be rendered.
*
*/

jQuery.fn.mathquill = (function($){ //takes in the jQuery function as an argument

//Note: if the following is no longer on line 15, please modify publish.sh accordingly
$('head').append('<link rel="stylesheet" type="text/css" href="http://laughinghan.github.com/mathquill/mathquill.css">');

var todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };

/**********************************************************
 * Back-end code: Core abstract classes and architecture.
 *********************************************************/

var $ = jQuery, todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };

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
function MathCommand(cmd, html_template, replacedBlock)
{
  if(!arguments.length)
    return;

  this.cmd = cmd;
  if(html_template)
    this.html_template = html_template;

  this.jQ = $(this.html_template[0]).data('[[mathquill internal data]]', {cmd: this});
  this.initBlocks(replacedBlock);
}
MathCommand.prototype = $.extend(new MathElement, {
  initBlocks: function(replacedBlock)
  {
    //single-block commands
    if(this.html_template.length === 1)
    {
      this.firstChild = this.lastChild = this.jQ.data('[[mathquill internal data]]').block =
        replacedBlock || new MathBlock;
      this.firstChild.parent = this;
      this.firstChild.jQ = this.jQ.prepend(this.firstChild.jQ);
      return;
    }
    //otherwise, the succeeding elements of html_template should be child blocks
    var newBlock, prev, num_blocks = this.html_template.length;
    this.firstChild = newBlock = prev = replacedBlock || new MathBlock;
    newBlock.parent = this;
    newBlock.jQ = $(this.html_template[1]).data('[[mathquill internal data]]', {block: newBlock}).appendTo(this.jQ).prepend(newBlock.jQ);
    newBlock.setEmpty();
    for(var i = 2; i < num_blocks; i += 1)
    {
      newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.prev = prev;
      prev.next = newBlock;
      prev = newBlock;

      newBlock.jQ = $(this.html_template[i]).data('[[mathquill internal data]]', {block: newBlock}).appendTo(this.jQ);
      newBlock.setEmpty();
    }
    this.lastChild = newBlock;
  },
  latex: function()
  {
    return this.cmd + this.reduceChildren(function(initVal){
      return initVal + '{' + this.latex() + '}';
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
    cursor.prependTo(this.firstChild);
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
    {
      if(this.parent)
        this.jQ.html('&empty;');
      this.jQ.addClass('empty').change();
    }
    return this;
  },
  removeEmpty:function()
  {
    if(this.jQ.addClass('hasCursor').hasClass('empty'))
    {
      if(this.parent)
        this.jQ.html('');
      this.jQ.removeClass('empty');
    }
    return this;
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

/********************************************
 * All the symbols, operators and commands.
 *******************************************/

function VanillaSymbol(ch, html)
{
  Symbol.call(this, ch, '<span>'+(html || ch)+'</span>');
}
VanillaSymbol.prototype = Symbol.prototype;

function NonSymbolaSymbol(ch, html) //does not use Symbola font
{
  Symbol.call(this, ch, '<span class="nonSymbola">'+(html || ch)+'</span>');
}
NonSymbolaSymbol.prototype = Symbol.prototype;

function BigSymbol(ch, html)
{
  Symbol.call(this, ch, '<big>'+html+'</big>');
}
BigSymbol.prototype = new Symbol; //so instanceof will work

function Variable(ch, html)
{
  Symbol.call(this, ch, '<var>'+(html || ch)+'</var>');
}
Variable.prototype = Symbol.prototype;

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

function SupSub(cmd, html, replacedBlock)
{
  MathCommand.call(this, cmd, [ html ], replacedBlock);
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
  return this.cmd + '{' + latex + '}';
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

function Fraction(replacedBlock)
{
  MathCommand.call(this, '\\frac', undefined, replacedBlock);
  this.jQ.append('<span style="width:0">&nbsp;</span>');
  if($.browser.mozilla && +$.browser.version.slice(0,3) < 1.9) //Firefox 2 and below
    this.jQ.css('display','-moz-groupbox');
}
Fraction.prototype = new MathCommand;
Fraction.prototype.html_template = ['<span class="fraction"></span>', '<span class="numerator"></span>', '<span class="denominator"></span>'];
function LiveFraction(replacedBlock)
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
      newBlock.jQ = this.firstChild.removeEmpty().jQ.removeClass('hasCursor').append(newBlock.jQ).data('[[mathquill internal data]]', { block: newBlock });
      newBlock.next = this.lastChild;
      newBlock.parent = this;
      this.firstChild = this.lastChild.prev = newBlock;
    }
  }
  cursor.appendTo(this.lastChild);
};

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
function Bracket(open, close, cmd, end, replacedBlock)
{
  MathCommand.call(this, '\\left'+cmd,
    ['<span><span class="paren">'+open+'</span><span></span><span class="paren">'+close+'</span></span>'],
    replacedBlock);
  this.end = '\\right'+end;
  this.firstChild.jQ.change(function()
  {
    var block = $(this);
    block.prev().add(block.next()).css('fontSize', block.height()/(+block.css('fontSize').slice(0,-2)*1.02)+'em');
  });
}
Bracket.prototype = $.extend(new MathCommand, {
  initBlocks: function(replacedBlock)
  {
    this.firstChild = this.lastChild = replacedBlock || new MathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.firstChild.jQ ? this.jQ.children().eq(1).prepend(this.firstChild.jQ) : this.jQ.children().eq(1);
  },
  latex: function()
  {
    return this.cmd + this.firstChild.latex() + this.end;
  }
});
// Closing bracket matching opening bracket above
function CloseBracket(open, close, cmd, end, replacedBlock)
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
  {
    cursor.insertAfter(this);
    this.firstChild.setEmpty().jQ.change();
  }
};
function Paren(open, close, replacedBlock)
{
  Bracket.call(this, open, close, open, close, replacedBlock);
}
Paren.prototype = Bracket.prototype;
function CloseParen(open, close, replacedBlock)
{
  CloseBracket.call(this, open, close, open, close, replacedBlock);
}
CloseParen.prototype = CloseBracket.prototype;
function Pipes(replacedBlock)
{
  Paren.call(this, '|', '|', replacedBlock);
}
Pipes.prototype = new Paren;
Pipes.prototype.placeCursor = function(cursor)
{
  if(!this.next && this.parent.parent && this.parent.parent.end === this.end && this.firstChild.isEmpty())
    cursor.backspace().insertAfter(this.parent.parent);
  else
    cursor.prependTo(this.firstChild);
};

function TextBlock(replacedBlock)
{
  MathCommand.call(this, '\\text', undefined, new InnerTextBlock);
  if(replacedBlock instanceof MathBlock)
  {
    this.replacedText = replacedBlock.jQ.text();
    replacedBlock.jQ.remove();
  }
  else
    this.replacedText = replacedBlock;
}
TextBlock.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="text"></span>'],
  placeCursor: function(cursor)
  {
    this.cursor = cursor.prependTo(this.firstChild);
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
    if(!this.isEmpty() &&
        ((e.which === 8 && !this.cursor.prev && !this.cursor.selection) ||
          (e.which === 46 && !this.cursor.next)))
      return false;
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
        var next = new TextBlock(new MathFragment(this.firstChild, this.cursor.prev).blockify());
        next.firstChild.removeEmpty = function(){ return this; };
        this.cursor.insertAfter(this).insertNew(next).insertBefore(next);
        delete next.firstChild.removeEmpty;
      }
    else
      this.write(ch);
    return false;
  }
});
function InnerTextBlock(){}
InnerTextBlock.prototype = $.extend(new MathBlock, {
  setEmpty: function()
  {
    this.jQ.removeClass('hasCursor');
    if(this.isEmpty())
    {
      var textblock = this.parent;
      setTimeout(function() //defer execution until after completion of this thread
                            //not the wrong way to do things, merely poorly named
      {
        if(textblock.cursor.prev === textblock)
          textblock.cursor.backspace();
        else if(textblock.cursor.next === textblock)
          textblock.cursor.deleteForward();
        //else must be blur, don't remove textblock
      },0);
    };
    return this;
  },
  removeEmpty: function()
  {
    this.jQ.addClass('hasCursor');
    if(this.parent.prev instanceof TextBlock)
    {
      var me = this, textblock = this.parent, prev = textblock.prev.firstChild;
      setTimeout(function() //defer
      {
        prev.eachChild(function(){
          this.parent = me;
          this.jQ.insertBefore(me.firstChild.jQ);
        });
        prev.lastChild.next = me.firstChild;
        me.firstChild.prev = prev.lastChild;
        me.firstChild = prev.firstChild;
        textblock.prev.remove();
        if(textblock.cursor.next)
          textblock.cursor.insertBefore(textblock.cursor.next);
        else
          textblock.cursor.appendTo(me);
        me.jQ.change();
      },0);
    }
    else if(this.parent.next instanceof TextBlock)
      if(this.parent.cursor.next)
        this.parent.next.firstChild.removeEmpty();
      else
        this.parent.cursor.prependTo(this.parent.next.firstChild);

    return this;
  }
});

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedBlock, replacedFragment)
{
  MathCommand.call(this, '\\');
  this.firstChild.setEmpty = function()
  {
    if(this.isEmpty())
      this.jQ.removeClass('hasCursor').addClass('empty').html('&nbsp;');
    return this;
  };
  if(replacedBlock)
  {
    replacedBlock.jQ.detach();
    this.replacedBlock = replacedBlock;
    this.replacedFragment = replacedFragment;
    this.isEmpty = function(){ return false; };
  }
}
LatexCommandInput.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="latex-command-input"></span>'],
  placeCursor: function(cursor)
  {
    this.cursor = cursor.prependTo(this.firstChild);
    if(this.replacedFragment)
      this.jQ = this.jQ.add(this.replacedFragment.jQ.addClass('blur').insertAfter(this.jQ));
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
    return this.parent.keypress(e);
  },
  renderCommand: function()
  {
    this.jQ = this.jQ.first();
    this.remove();
    if(this.next)
      this.cursor.insertBefore(this.next);
    else
      this.cursor.appendTo(this.parent);
    this.cursor.insertNew(this.firstChild.isEmpty() ?
      new VanillaSymbol('\\backslash ','\\') : createLatexCommand(this.firstChild.latex(), this.replacedBlock));
  }
});

function SquareRoot(replacedBlock)
{
  MathCommand.call(this, '\\sqrt', undefined, replacedBlock);
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
SquareRoot.prototype.html_template = ['<span><span class="sqrt-prefix">&radic;</span></span>','<span class="sqrt-stem"></span>'];

function Binomial(replacedBlock)
{
  MathCommand.call(this, '\\binom', undefined, replacedBlock);
  this.jQ.wrapInner('<span class="array"></span>').prepend('<span class="paren">(</span>').append('<span class="paren">)</span>');
  this.firstChild.jQ.parent().change(function()
  {
    var block = $(this);
    block.prev().add(block.next()).css('fontSize', block.height()/(+block.css('fontSize').slice(0,-2)*.9+2)+'em');
  });
}
Binomial.prototype = new MathCommand;
Binomial.prototype.html_template = ['<span></span>', '<span></span>', '<span></span>'];
function Choose(binomial)
{
  binomial.placeCursor = LiveFraction.prototype.placeCursor;
  return binomial;
}

function Vector(replacedBlock)
{
  MathCommand.call(this, '\\vector', undefined, replacedBlock);
}
Vector.prototype = new MathCommand;
Vector.prototype.html_template = ['<span class="array"></span>', '<span></span>'];
Vector.prototype.latex = function()
{
  return '\\begin{matrix}' + this.reduceChildren(function(initValue){
    initValue.push(this.latex());
    return initValue;
  }, []).join('\\\\') + '\\end{matrix}';
};
Vector.prototype.placeCursor = function(cursor)
{
  this.cursor = cursor.prependTo(this.firstChild);
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
      newBlock.jQ.change();
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
      newBlock.jQ.change();
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

function NonItalicizedFunction(fn)
{
  Symbol.call(this, '\\'+fn+' ', '<span>'+fn+'</span>');
}
NonItalicizedFunction.prototype = new Symbol;
NonItalicizedFunction.prototype.respace = function()
{
  this.jQ[0].className = (this.next instanceof SupSub) ? '' : 'non-italicized-function';
};

var SingleCharacterCommands = {
  //Symbols:
  ' ': function(){ return new VanillaSymbol('\\,', '&nbsp;'); },
  "'": function(){ return new VanillaSymbol("'", '&prime;'); },
  'f': function(){ return new Symbol('f', '<var class="florin">&fnof;</var>'); },
  '@': function(){ return new NonSymbolaSymbol('@'); },
  '&': function(){ return new NonSymbolaSymbol('\\&', '&'); },
  '%': function(){ return new NonSymbolaSymbol('\\%', '%'); },
  '*': function(){ return new BinaryOperator('\\cdot ', '&middot;'); },
    //semantically should be &sdot;, but &middot; looks better in both Symbola and Times New Roman
  '=': function(){ return new BinaryOperator('=', '='); },
  '<': function(){ return new BinaryOperator('<', '&lt;'); },
  '>': function(){ return new BinaryOperator('>', '&gt;'); },
  '+': function(){ return new PlusMinus('+'); },
  '-': function(){ return new PlusMinus('-', '&minus;'); },
  //Commands and Operators:
  '^': function(replacedBlock){ return new SupSub('^', '<sup></sup>', replacedBlock); },
  '_': function(replacedBlock){ return new SupSub('_', '<sub></sub>', replacedBlock); },
  '/': function(replacedBlock){ return new LiveFraction(replacedBlock); },
  '(': function(replacedBlock){ return new Paren('(', ')', replacedBlock); },
  '[': function(replacedBlock){ return new Paren('[', ']', replacedBlock); },
  '{': function(replacedBlock){ return new Bracket('{','}','\\{','\\}',replacedBlock); },
  ')': function(replacedBlock){ return new CloseParen('(', ')', replacedBlock); },
  ']': function(replacedBlock){ return new CloseParen('[', ']', replacedBlock); },
  '}': function(replacedBlock){ return new CloseBracket('{','}','\\{','\\}',replacedBlock); },
  '|': function(replacedBlock){ return new Pipes(replacedBlock); },
  '$': function(replacedBlock){ return new TextBlock(replacedBlock); },
  '\\': function(replacedBlock, replacedFragment){
    return new LatexCommandInput(replacedBlock, replacedFragment);
  }
};
function createLatexCommand(latex, replacedBlock)
{
  if(latex.match(/^(a|arc)?(sin|cos|tan|sec|cosec|csc|cotan|cot)h?$/))
    return new NonItalicizedFunction(latex);

  switch(latex)
  {
  //"real" commands
  case 'subscript':
    return new SupSub('_', '<sub></sub>', replacedBlock);
  case 'supscript':
  case 'superscript':
    return new SupSub('^', '<sup></sup>', replacedBlock);
  case 'sqrt':
    return new SquareRoot(replacedBlock);
  case 'frac':
    return new Fraction(replacedBlock);
  case 'text':
    return new TextBlock(replacedBlock);
  case 'langle':
    return new Bracket('<','>','\\langle ','\\rangle ',replacedBlock);
  case 'rangle':
    return new CloseBracket('<','>','\\langle ','\\rangle ',replacedBlock);
  case 'binom':
  case 'binomial':
    return new Binomial(replacedBlock);
  case 'choose':
    return Choose(new Binomial(replacedBlock));
  case 'vector':
    return new Vector(replacedBlock);

  //non-italicized functions
  case 'ln':
  case 'lg':
  case 'log':
  case 'span':
  case 'proj':
  case 'det':
  case 'dim':
  case 'min':
  case 'max':
  case 'mod':
  case 'lcm':
  case 'gcd':
  case 'lim':
    return new NonItalicizedFunction(latex);

  /*** Symbols and Special Characters ***/

  //the following are all greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html

  //lowercase greek letter variables
  case 'alpha':
  case 'beta':
  case 'gamma':
  case 'delta':
  case 'zeta':
  case 'eta':
  case 'theta':
  case 'iota':
  case 'kappa':
  case 'mu':
  case 'nu':
  case 'xi':
  case 'rho':
  case 'sigma':
  case 'tau':
  case 'upsilon':
  case 'chi':
  case 'psi':
  case 'omega':
    return new Variable('\\'+latex+' ','&'+latex+';');

  //why can't anybody FUCKING agree on these
  case 'phi': //W3C or Unicode?
    return new Variable('\\phi ','&#981;');
  case 'phiv': //Elsevier and 9573-13
  case 'varphi': //AMS and LaTeX
    return new Variable('\\varphi ','&phi;');
  case 'epsilon': //W3C or Unicode?
    return new Variable('\\epsilon ','&#1013;');
  case 'epsiv': //Elsevier and 9573-13
  case 'varepsilon': //AMS and LaTeX
    return new Variable('\\varepsilon ','&epsilon;');
  case 'sigmaf': //W3C/Unicode
  case 'sigmav': //Elsevier
  case 'varsigma': //LaTeX
    return new Variable('\\varsigma ','&sigmaf;');

  //these aren't even mentioned in the HTML character entity references
  case 'gammad': //Elsevier
  case 'Gammad': //9573-13 -- WTF, right? I dunno if this was a typo in the reference (see above)
  case 'digamma': //LaTeX
    return new Variable('\\digamma ','&#989;');
  case 'kappav': //Elsevier
  case 'varkappa': //AMS and LaTeX
    return new Variable('\\varkappa ','&#1008;');
  case 'piv': //Elsevier and 9573-13
  case 'varpi': //AMS and LaTeX
    return new Variable('\\varpi ','&#982;');
  case 'rhov': //Elsevier and 9573-13
  case 'varrho': //AMS and LaTeX
    return new Variable('\\varrho ','&#1009;');
  case 'thetav': //Elsevier and 9573-13
  case 'vartheta': //AMS and LaTeX
    return new Variable('\\vartheta ','&#977;');

  //greek constants, look best in un-italicised Times New Roman
  case 'pi':
  case 'lambda':
    return new NonSymbolaSymbol('\\'+latex+' ','&'+latex+';');

  //uppercase greek letters
  case 'Gamma':
  case 'Delta':
  case 'Theta':
  case 'Lambda':
  case 'Xi':
  case 'Pi':
  case 'Sigma':
  case 'Upsilon':
  case 'Phi':
  case 'Psi':
  case 'Omega':

  //other symbols with the same LaTeX command and HTML character entity reference
  case 'perp':
  case 'nabla':
  case 'forall':
    return new VanillaSymbol('\\'+latex+' ','&'+latex+';');
  case 'perpendicular':
    return new VanillaSymbol('\\perp ','&perp;');
  case 'del':
    return new VanillaSymbol('\\nabla ','&nabla;');

  //sum, product, coproduct, integral
  case 'sum':
  case 'summation':
    return new BigSymbol('\\sum ','&sum;');
  case 'prod':
  case 'product':
    return new BigSymbol('\\prod ','&prod;');
  case 'coprod':
  case 'coproduct':
    return new BigSymbol('\\coprod ','&#8720;');
  case 'int':
  case 'integral':
    return new BigSymbol('\\int ','&int;');

  //the canonical sets of numbers
  case 'N':
  case 'naturals':
  case 'Naturals':
    return new VanillaSymbol('\\mathbb{N}','&#8469;');
  case 'P':
  case 'primes':
  case 'Primes':
  case 'projective':
  case 'Projective':
  case 'probability':
  case 'Probability':
    return new VanillaSymbol('\\mathbb{P}','&#8473;');
  case 'Z':
  case 'integers':
  case 'Integers':
    return new VanillaSymbol('\\mathbb{Z}','&#8484;');
  case 'Q':
  case 'rationals':
  case 'Rationals':
    return new VanillaSymbol('\\mathbb{Q}','&#8474;');
  case 'R':
  case 'reals':
  case 'Reals':
    return new VanillaSymbol('\\mathbb{R}','&#8477;');
  case 'C':
  case 'complex':
  case 'Complex':
  case 'complexes':
  case 'Complexes':
  case 'complexplane':
  case 'Complexplane':
  case 'ComplexPlane':
    return new VanillaSymbol('\\mathbb{C}','&#8450;');
  case 'H':
  case 'Hamiltonian':
  case 'quaternions':
  case 'Quaternions':
    return new VanillaSymbol('\\mathbb{H}','&#8461;');

  //spacing
  case 'quad':
  case 'emsp':
    return new VanillaSymbol('\\quad ','&nbsp;&nbsp;&nbsp;&nbsp;');
  case 'qquad':
    return new VanillaSymbol('\\qquad ','&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
  /* spacing special characters, gonna have to implement this in LatexCommandInput.prototype.keypress somehow
  case ',':
    return new VanillaSymbol('\\, ','&nbsp;');
  case':':
    return new VanillaSymbol('\\: ','&nbsp;&nbsp;');
  case ';':
    return new VanillaSymbol('\\; ','&nbsp;&nbsp;&nbsp;');
  case '!':
    return new Symbol('\\! ','<span style="margin-right:-.2em"></span>');
  */

  //various symbols
  case 'caret':
    return new VanillaSymbol('\\caret ','^');
  case 'underscore':
    return new VanillaSymbol('\\underscore ','_');
  case 'backslash':
    return new VanillaSymbol('\\backslash ','\\');
  case 'AA':
  case 'Angstrom':
  case 'angstrom':
    return new VanillaSymbol('\\text\\AA ','&#8491;');
  case 'ring':
  case 'circ':
  case 'circle':
    return new VanillaSymbol('\\circ ','&#8728;');
  case 'bull':
  case 'bullet':
    return new VanillaSymbol('\\bullet ','&bull;');
  case 'setminus':
  case 'smallsetminus':
    return new VanillaSymbol('\\setminus ','&#8726;');
  case 'not':
    //return new Symbol('\\not ','<span class="not">/</span>');
  case 'neg':
    return new VanillaSymbol('\\neg ','&not;');
  case 'dots':
  case 'ellip':
  case 'hellip':
  case 'ellipsis':
  case 'hellipsis':
    return new VanillaSymbol('\\dots ','&hellip;');
  case 'converges':
  case 'darr':
  case 'dnarr':
  case 'dnarrow':
  case 'downarrow':
    return new VanillaSymbol('\\downarrow ','&darr;');
  case 'dArr':
  case 'dnArr':
  case 'dnArrow':
  case 'Downarrow':
    return new VanillaSymbol('\\Downarrow ','&dArr;');
  case 'diverges':
  case 'uarr':
  case 'uparrow':
    return new VanillaSymbol('\\uparrow ','&uarr;');
  case 'uArr':
  case 'Uparrow':
    return new VanillaSymbol('\\Uparrow ','&uArr;');
  case 'to':
    return new BinaryOperator('\\to ','&rarr;');
  case 'rarr':
  case 'rightarrow':
    return new VanillaSymbol('\\rightarrow ','&rarr;');
  case 'implies':
    return new BinaryOperator('\\Rightarrow ','&rArr;');
  case 'rArr':
  case 'Rightarrow':
    return new VanillaSymbol('\\Rightarrow ','&rArr;');
  case 'gets':
    return new BinaryOperator('\\gets ','&larr;');
  case 'larr':
  case 'leftarrow':
    return new VanillaSymbol('\\leftarrow ','&larr;');
  case 'impliedby':
    return new BinaryOperator('\\Leftarrow ','&lArr;');
  case 'lArr':
  case 'Leftarrow':
    return new VanillaSymbol('\\Leftarrow ','&lArr;');
  case 'harr':
  case 'lrarr':
  case 'leftrightarrow':
    return new VanillaSymbol('\\leftrightarrow ','&harr;');
  case 'iff':
    return new BinaryOperator('\\Leftrightarrow ','&hArr;');
  case 'hArr':
  case 'lrArr':
  case '\Leftrightarrow':
    return new VanillaSymbol('\\Leftrightarrow ','&hArr;');
  case 'Re':
  case 'Real':
  case 'real':
    return new VanillaSymbol('\\Re ','&real;');
  case 'Im':
  case 'imag':
  case 'image':
  case 'imagin':
  case 'imaginary':
  case 'Imaginary':
    return new VanillaSymbol('\\Im ','&image;');
  case 'part':
  case 'partial':
    return new VanillaSymbol('\\partial ','&part;');
  case 'inf':
  case 'infin':
  case 'infty':
  case 'infinity':
    return new VanillaSymbol('\\infty ','&infin;');
  case 'alef':
  case 'alefsym':
  case 'aleph':
  case 'alephsym':
    return new VanillaSymbol('\\aleph ','&alefsym;');
  case 'xist': //LOL
  case 'xists':
  case 'exist':
  case 'exists':
    return new VanillaSymbol('\\exists ','&exist;');
  case 'and':
  case 'land':
  case 'wedge':
    return new VanillaSymbol('\\wedge ','&and;');
  case 'or':
  case 'lor':
  case 'vee':
    return new VanillaSymbol('\\vee ','&or;');
  case 'o':
  case 'O':
  case 'empty':
  case 'emptyset':
  case 'oslash':
  case 'Oslash':
  case 'nothing':
  case 'varnothing':
    return new BinaryOperator('\\varnothing ','&empty;');
  case 'cup':
  case 'union':
    return new VanillaSymbol('\\cup ','&cup;');
  case 'cap':
  case 'intersect':
  case 'intersection':
    return new VanillaSymbol('\\cap ','&cap;');
  case 'deg':
  case 'degree':
    return new VanillaSymbol('^\\circ ','&deg;');
  case 'ang':
  case 'angle':
    return new VanillaSymbol('\\angle ','&ang;');
  case 'prime':
    return new VanillaSymbol('\'','&prime;');
  case 'sdot':
  case 'cdot':
    return new VanillaSymbol('\\cdot ', '&sdot;');

  //Binary Operators
  case 'notin':
  case 'sim':
  case 'equiv':
  case 'times':
  case 'oplus':
  case 'otimes':
    return new BinaryOperator('\\'+latex+' ','&'+latex+';');
  case 'pm':
  case 'plusmn':
  case 'plusminus':
    return new PlusMinus('\\pm ','&plusmn;');
  case 'mp':
  case 'mnplus':
  case 'minusplus':
    return new PlusMinus('\\mp ','&#8723;');
  case 'div':
  case 'divide':
  case 'divides':
    return new BinaryOperator('\\div ','&divide;');
  case 'ne':
  case 'neq':
    return new BinaryOperator('\\'+latex+' ','&ne;');
  case 'ast':
  case 'star':
  case 'loast':
  case 'lowast':
    return new BinaryOperator('\\ast ','&lowast;');
  //case 'there4': // a special exception for this one, perhaps?
  case 'therefor':
  case 'therefore':
    return new BinaryOperator('\\therefore ','&there4;');
  case 'cuz': // l33t
  case 'because':
    return new BinaryOperator('\\because ','&#8757;');
  case 'prop':
  case 'propto':
    return new BinaryOperator('\\propto ','&prop;');
  case 'asymp':
  case 'approx':
    return new BinaryOperator('\\approx ','&asymp;');
  case 'lt':
    return new BinaryOperator('<','&lt;');
  case 'gt':
    return new BinaryOperator('<','&gt;');
  case 'le':
  case 'leq':
    return new BinaryOperator('\\'+latex+' ','&le;');
  case 'ge':
  case 'geq':
    return new BinaryOperator('\\'+latex+' ','&ge;');
  case 'in':
  case 'isin':
    return new BinaryOperator('\\in ','&isin;');
  case 'ni':
  case 'contains':
    return new BinaryOperator('\\ni ','&ni;');
  case 'notni':
  case 'niton':
  case 'notcontains':
  case 'doesnotcontain':
    return new BinaryOperator('\\not\\ni ','&#8716;');
  case 'sub':
  case 'subset':
    return new BinaryOperator('\\subset ','&sub;');
  case 'sup':
  case 'supset':
  case 'superset':
    return new BinaryOperator('\\supset ','&sup;');
  case 'nsub':
  case 'notsub':
  case 'nsubset':
  case 'notsubset':
    return new BinaryOperator('\\not\\subset ','&#8836;');
  case 'nsup':
  case 'notsup':
  case 'nsupset':
  case 'notsupset':
  case 'nsuperset':
  case 'notsuperset':
    return new BinaryOperator('\\not\\supset ','&#8837;');
  case 'sube':
  case 'subeq':
  case 'subsete':
  case 'subseteq':
    return new BinaryOperator('\\subseteq ','&sube;');
  case 'supe':
  case 'supeq':
  case 'supsete':
  case 'supseteq':
  case 'supersete':
  case 'superseteq':
    return new BinaryOperator('\\supseteq ','&supe;');
  case 'nsube':
  case 'nsubeq':
  case 'notsube':
  case 'notsubeq':
  case 'nsubsete':
  case 'nsubseteq':
  case 'notsubsete':
  case 'notsubseteq':
    return new BinaryOperator('\\not\\subseteq ','&#8840;');
  case 'nsupe':
  case 'nsupeq':
  case 'notsupe':
  case 'notsupeq':
  case 'nsupsete':
  case 'nsupseteq':
  case 'notsupsete':
  case 'notsupseteq':
  case 'nsupersete':
  case 'nsuperseteq':
  case 'notsupersete':
  case 'notsuperseteq':
    return new BinaryOperator('\\not\\supseteq ','&#8841;');
  default:
    return new TextBlock(latex);
  }
}

/**********************************************************************
 * Front-end code: Event-handling, HTML DOM manipulation (via jQuery)
 *********************************************************************/

//A fake cursor in the fake textbox that the math is rendered in.
function Cursor(root)
{
  //API for the blinking cursor
  var intervalId;
  this.show = function()
  {
    this.jQ = this._jQ.removeClass('blink');
    if(intervalId)
      clearInterval(intervalId);
    else
      if(this.next)
        if(this.selection && this.selection.prev === this.prev)
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this.next.jQ);
      else
        this.jQ.appendTo(this.parent.jQ);
    var cursor = this;
    intervalId = setInterval(function(){
      cursor.jQ.toggleClass('blink');
    }, 500);
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

  this.jQ = this._jQ = $('<span class="cursor"></span>');
  this.appendTo(root);
}
Cursor.prototype = {
  prev: null,
  next: null,
  parent: null,
  insertBefore: function(el)
  {
    this.parent.setEmpty();
    this.next = el;
    this.prev = el.prev;
    this.parent = el.parent;
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first());
    return this;
  },
  insertAfter: function(el)
  {
    this.parent.setEmpty();
    this.prev = el;
    this.next = el.next
    this.parent = el.parent;
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  },
  prependTo: function(el)
  {
    this.parent.setEmpty();
    this.next = el.firstChild;
    this.prev = null;
    this.parent = el;
    this.parent.removeEmpty();
    if(el.parent)
      this.jQ.prependTo(el.jQ);
    else
      this.jQ.insertAfter(el.jQ[0].firstChild);
    return this;
  },
  appendTo: function(el)
  {
    if(this.parent)
      this.parent.setEmpty();
    this.prev = el.lastChild;
    this.next = null;
    this.parent = el;
    this.parent.removeEmpty();
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
    return this.show().jQ.change();
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
    return this.show().jQ.change();
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
      this.prev = this.selection.prev;
      this.next = this.selection.next;
    }

    var cmd;
    if(ch.match(/[a-eg-z]/i)) //exclude f because want florin in SingleCharacterCommands
      cmd = new Variable(ch);
    else if(cmd = SingleCharacterCommands[ch])
      if(this.selection)
        cmd = cmd(this.selection.blockify(), this.selection);
      else
        cmd = cmd();
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
    var gramp = this.parent.parent, greatgramp = gramp.parent, cursor = this, prev = gramp.prev;
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
    prev.next = gramp.next;
    if(prev.next)
      prev.next.prev = prev;
    else
      greatgramp.lastChild = prev;

    if(!this.prev)
      if(this.next)
        this.prev = this.next.prev;
      else
        while(!this.prev)
          if(this.parent = this.parent.prev)
            this.prev = this.parent.lastChild;
          else
          {
            this.prev = gramp.prev;
            break;
          }
    if(this.prev)
      this.insertAfter(this.prev);
    else
      this.insertBefore(greatgramp.firstChild);

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
      this.jQ.insertBefore(this.selection.jQ);
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
    this.jQ.children().unwrap();
    this.jQinit(this.parent.parent.jQ);

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
    var selectedJQ = this.jQ.children();
    this.jQ.replaceWith(selectedJQ);
    this.jQ = selectedJQ;
    return MathFragment.prototype.blockify.call(this);
  }
});

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
            cmd = createLatexCommand(token.slice(1));
            cursor.insertNew(cmd);
          }
          else
          {
            cursor.write(token);
            cmd = cursor.prev || cursor.parent.parent;
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
    switch(e.originalEvent.keyIdentifier || e.which)
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
  MathCommand.call(this, '$', undefined, new RootMathBlock);
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
RootMathCommand.prototype = new MathCommand;
RootMathCommand.prototype.html_template = ['<span class="mathquill-rendered-math"></span>'];

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

//The actual, publicly exposed method of jQuery.prototype, available
//(and meant to be called) on jQuery-wrapped HTML DOM elements.
function mathquill()
{
  if(arguments[0] === 'html')
    return this.html().replace(/<span class="?cursor( blink)?"?><\/span>|<span class="?textarea"?><textarea><\/textarea><\/span>/ig,'');

  if(arguments[0] === 'latex')
  {
    if(arguments.length > 1)
    {
      var latex = arguments[1];
      return this.each(function()
      {
        var mathObj = $(this).data('[[mathquill internal data]]');
        if(mathObj && mathObj.block && mathObj.block.renderLatex)
          mathObj.block.renderLatex(latex);
      });
    }
    var mathObj = this.data('[[mathquill internal data]]');
    if(mathObj && mathObj.block)
      return mathObj.block.latex();
    return;
  }

  if(arguments[0] === 'revert')
    return this.each(function()
    {
      var mathObj = $(this).data('[[mathquill internal data]]');
      if(mathObj && mathObj.revert)
        mathObj.revert();
    });

  if(arguments[0] === 'redraw')
    return this.find('*').change().end();

  var textbox = arguments[0] === 'textbox', editable = textbox || arguments[0] === 'editable';
  this.each(function()
  {
    var jQ = $(this), children = jQ.wrapInner('<span>').children().detach(), root = new (textbox?RootTextBlock:RootMathBlock);
    if(!textbox)
      jQ.addClass('mathquill-rendered-math');
    root.jQ = jQ.data('[[mathquill internal data]]', {
      block: root,
      revert: function()
      {
        children.appendTo(jQ.empty().unbind('.mathquill')
          .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox'))
        .children().unwrap();
      }
    });

    var cursor = root.cursor = new Cursor(root);

    root.renderLatex(children.text());

    if(!editable)
      return;

    var textarea = $('<span class="textarea"><textarea></textarea></span>')
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
    jQ.bind('focus.mathquill blur.mathquill',function(e)
    {
      textarea.trigger(e);
    }
    ).bind('click.mathquill',function(e)
    {
      var clicked = $(e.target);
      if(clicked.hasClass('empty'))
      {
        cursor.clearSelection().prependTo(clicked.data('[[mathquill internal data]]').block).jQ.change();
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
    ).bind('keydown.mathquill',function(e) //see Wiki page "Keyboard Events"
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
    ).blur();
  });

  return this;
};

//on document ready, transmogrify all <tag class="mathquill-editable"></tag> and
//  <tag class="mathquill-embedded-latex"></tag> elements to mathquill elements.
$(function()
{
  $('.mathquill-embedded-latex').mathquill();
  $('.mathquill-editable').mathquill('editable');
  $('.mathquill-textbox').mathquill('textbox');
});

return mathquill;
}(jQuery));
