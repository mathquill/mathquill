/**
* Usage:
* $(thing).mathquill();
* turns thing into a live editable thingy.
* AMAZORZ.
*
* Note: doesn't actually work.
*
*/

jQuery.fn.mathquill = (function($){ //takes in the jQuery function as an argument

$(document.head).prepend('<link rel="stylesheet" type="text/css" href="http://laughinghan.github.com/mathquill/mathquill.css">');

var noop = function(){ return this; }, todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };
/**
 * Back-end code: Core abstract classes and architecture.
 */

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
  },
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
      this.firstChild = this.lastChild = this.jQ.data('[[mathquill internal data]]').block =
        replacedFragment ? replacedFragment.blockify() : new MathBlock;
      this.firstChild.parent = this;
      this.firstChild.jQ = this.jQ.prepend(this.firstChild.jQ);
      return;
    }
    //otherwise, the succeeding elements of html_template should be child blocks
    var newBlock, prev, num_blocks = this.html_template.length;
    this.firstChild = newBlock = prev = replacedFragment ? replacedFragment.blockify() : new MathBlock;
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
  },
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
  isEmpty: function(){ return true; },
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
    if(this.isEmpty())
    {
      this.jQ.addClass('empty');
      if(this.parent)
        this.jQ.html('[ ]');
    }
    return this;
  },
  removeEmpty:function()
  {
    if(this.jQ.hasClass('empty'))
      this.jQ.html('').removeClass('empty');
    return this;
  },
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

  this.jQinit(this.reduce(function(initVal){ return initVal.add(this.jQ); }, $()));
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
  },
  detach: function()
  {
    MathFragment.prototype.blockify.call(this);
    this.jQ.detach();
    return this;
  },
};
/**
 * All the symbols, operators and commands.
 */

function VanillaSymbol(ch, html) 
{
  Symbol.call(this, ch, '<span>'+(html || ch)+'</span>');
}
VanillaSymbol.prototype = Symbol.prototype;

function Variable(ch)
{
  Symbol.call(this, ch, '<i>'+ch+'</i>');
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
SupSub.prototype.respace = function()
{
  if(this.respaced = this.prev instanceof SupSub && this.prev.cmd != this.cmd && !this.prev.respaced)
    this.jQ.css({
      left: -this.prev.jQ.innerWidth(),
      marginRight: 1-Math.min(this.jQ.innerWidth(), this.prev.jQ.innerWidth()) //1px adjustment very important!
    });
  else
    this.jQ.css({
      left: 0,
      marginRight: 0
    });
  return this;
};

function Fraction(replacedFragment)
{
  MathCommand.call(this, '\\frac ', undefined, replacedFragment);
  this.jQ.append('<span style="width:0;color:transparent">/</span>');
}
Fraction.prototype = new MathCommand;
Fraction.prototype.html_template = ['<span class="fraction"></span>', '<span class="numerator"></span>', '<span class="denominator"></span></span>'];
function LiveFraction(replacedFragment)
{
  Fraction.apply(this, arguments);
}
LiveFraction.prototype = new Fraction;
LiveFraction.prototype.placeCursor = function(cursor)
{
  if(this.firstChild.isEmpty())
  {
    var prev = this.prev;
    while(prev && !(prev instanceof BinaryOperator)) //lookbehind for operator
      prev = prev.prev;
    if(prev !== this.prev)
    {
      var newBlock = new MathFragment(this.parent, prev, this).blockify();
      newBlock.jQ = this.firstChild.removeEmpty().jQ.prepend(newBlock.jQ);
      newBlock.next = this.lastChild;
      newBlock.parent = this;
      this.firstChild = this.lastChild.prev = newBlock;
    }
  }
  cursor.appendTo(this.lastChild);
};

// Parens/Brackets/Braces etc
function Paren(open, close, replacedFragment)
{
  MathCommand.call(this, open,
    ['<span><span class="paren">'+open+'</span><span></span><span class="paren">'+close+'</span></span>'],
    replacedFragment);
  this.end = close;
  this.firstChild.jQ.change(function()
  {
    var block = $(this);
    block.prev().add(block.next()).css('fontSize', block.height()/(+block.css('fontSize').slice(0,-2)+1)+'em');
  });
}
Paren.prototype = $.extend(new MathCommand, {
  initBlocks: function(replacedFragment)
  {
    this.firstChild = this.lastChild = replacedFragment ? replacedFragment.blockify() : new MathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.firstChild.jQ ? this.jQ.children().eq(1).prepend(this.firstChild.jQ) : this.jQ.children().eq(1);
  },
  latex: function()
  {
    return this.cmd + this.firstChild.latex() + this.end;
  },
});

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedFragment)
{
  MathCommand.call(this, '\\');
  this.firstChild.setEmpty = function()
  {
    if(this.isEmpty())
    {
      this.jQ.addClass('empty');
      if(this.parent)
        this.jQ.html('<span>&nbsp;</span>');
    }
    return this;
  };
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
    if(!char.match(/[a-z]/i))
    {
      this.renderCommand();
      if(char === ' ')
        return false;
    }
    return this.parent.keypress(e);
  },
  renderCommand: function()
  {
    this.jQ = this.jQ.first();
    this.remove();
    if(this.prev)
      this.cursor.insertAfter(this.prev);
    else
      this.cursor.prependTo(this.parent);
    this.cursor.insertNew(createLatexCommand(this.firstChild.latex(), this.replacedFragment));
  },
});

function SquareRoot(replacedFragment)
{
  MathCommand.call(this, '\\sqrt ', undefined, replacedFragment);
  this.firstChild.jQ.change(function()
  {
    var block = $(this), height = block.height();
    block.css({
      borderTopWidth: height/30+1, // NOTE: Formula will need to be redetermined if we change our font from Times New Roman
    }).prev().css({
      fontSize: height,
      top: height/10+2,
      left: height/30+1,
    });
  });
}
SquareRoot.prototype = new MathCommand;
SquareRoot.prototype.html_template = ['<span><span class="sqrt-prefix">&radic;</span></span>','<span class="sqrt-stem"></span>'];

function NonItalicizedFunction(cmd, text)
{
  text = text || cmd;
  Symbol.call(this, '\\'+cmd+' ', '<span class="non-italicized-function">'+text+'</span>');
}
NonItalicizedFunction.prototype = Symbol.prototype;

var SingleCharacterCommands = {
  //Symbols:
  ' ': function(replacedFragment){ return new VanillaSymbol('\\,', '&nbsp;'); },
  '*': function(replacedFragment){ return new VanillaSymbol('\\cdot ', '&sdot;'); },
  "'": function(replacedFragment){ return new VanillaSymbol("'", '&prime;');},
  '=': function(replacedFragment){ return new BinaryOperator('=', '='); },
  '<': function(replacedFragment){ return new BinaryOperator('<', '&lt;'); },
  '>': function(replacedFragment){ return new BinaryOperator('>', '&gt;'); },
  '+': function(replacedFragment){ return new PlusMinus('+'); },
  '-': function(replacedFragment){ return new PlusMinus('-', '&minus;'); },
  //Commands and Operators:
  '^': function(replacedFragment){ return new SupSub('^', '<sup></sup>', replacedFragment); },
  '_': function(replacedFragment){ return new SupSub('_', '<sub></sub>', replacedFragment); },
  '/': function(replacedFragment){ return new LiveFraction(replacedFragment); },
  '(': function(replacedFragment){ return new Paren('(', ')', replacedFragment); },
  '[': function(replacedFragment){ return new Paren('[', ']', replacedFragment); },
  '{': function(replacedFragment){ return new Paren('{', '}', replacedFragment); },
  '|': function(replacedFragment){ return new Paren('|', '|', replacedFragment); },
  '\\': function(replacedFragment){ return new LatexCommandInput(replacedFragment); },
};

function createLatexCommand(latex, replacedFragment)
{
  switch(latex)
  {
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
    case 'sqrt':
      return new SquareRoot(replacedFragment);
    case 'frac':
      return new Fraction(replacedFragment);
    default:
      return new VanillaSymbol(latex.slice, '&'+latex+';');
  }
}
/**
 * Front-end code: Event-handling, HTML DOM manipulation (via jQuery)
 */

//A fake cursor in the fake textbox that the math is rendered in.
function Cursor(block)
{
  //API for the blinking cursor
  var intervalId;
  this.show = function()
  {
    if(intervalId)
      clearInterval(intervalId);
    this.jQ.removeClass('blink');
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
    this.jQ.addClass('blink');
    return this;
  };

  this.jQ = $('<span class="cursor"></span>');
  if(block)
    this.prependTo(block);
}
Cursor.prototype = {
  prev: null,
  next: null,
  parent: null,
  setParentEmpty: function()
  {
    if(this.parent)
      this.parent.setEmpty().jQ.removeClass('hasCursor').change();
    return this;
  },
  detach: function()
  {
    this.setParentEmpty();
    this.prev = this.next = this.parent = null;
    this.jQ.detach();
    return this;
  },
  insertBefore: function(el)
  {
    this.setParentEmpty();
    this.next = el;
    this.prev = el.prev;
    this.parent = el.parent;
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first()); 
    return this;
  },
  insertAfter: function(el)
  {
    this.setParentEmpty();
    this.prev = el;
    this.next = el.next
    this.parent = el.parent;
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  }, 
  prependTo: function(el)
  {
    this.setParentEmpty();
    this.next = el.firstChild;
    this.prev = null;
    this.parent = el;
    this.parent.removeEmpty().jQ.addClass('hasCursor');
    this.jQ.prependTo(el.jQ);
    return this;
  },
  appendTo: function(el)
  {
    this.setParentEmpty();
    this.prev = el.lastChild;
    this.next = null;
    this.parent = el;
    this.parent.removeEmpty().jQ.addClass('hasCursor');
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
  write: function(cmd)
  {
    if(this.selection)
    {
      this.prev = this.selection.prev;
      this.next = this.selection.next;
    }

    if(cmd.match(/[a-z]/i))
      cmd = new Variable(cmd);
    else if(cmd.match(/\d/))
      cmd = new VanillaSymbol(cmd);
    else if(cmd = SingleCharacterCommands[cmd])
      cmd = cmd(this.selection);
    else
    {
      todo();
      return {show: $.noop};
    }

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
          this.hopLeft(); //we want to insertBefore(prev.jQ) before we do prependTo so this.jQ will be outside selection.jQ
          this.next.jQ.prependTo(this.selection.jQ);
          this.selection.prev = this.prev;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertBefore(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at right edge of selection, retract left
      {
        this.prev.jQ.insertAfter(this.selection.jQ);
        this.hopLeft();
        this.selection.next = this.next;
        if(this.selection.prev === this.prev)
          this.deleteSelection();
      }
    else
      if(this.prev)
        this.hopLeft().hide().selection = new Selection(this.parent, this.prev, this.next.next);
      else //end of a block
        if(this.parent.parent)
          this.insertBefore(this.parent.parent).hide().selection = new Selection(this.parent, this.prev, this.next.next);
  },
  selectRight: function()
  {
    if(this.selection)
      if(this.selection.next === this.next) //if cursor is at right edge of selection,
      {
        if(this.next) //then extend right if possible
        {
          this.hopRight();
          this.prev.jQ.appendTo(this.selection.jQ);
          this.selection.next = this.next;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertAfter(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at left edge of selection, retract right
      {
        this.next.jQ.insertBefore(this.selection.jQ);
        this.hopRight();
        this.selection.prev = this.prev;
        if(this.selection.next === this.next)
          this.deleteSelection();
      }
    else
      if(this.next)
        this.hopRight().hide().selection = new Selection(this.parent, this.prev.prev, this.next);
      else //end of a block
        if(this.parent.parent)
          this.insertAfter(this.parent.parent).hide().selection = new Selection(this.parent, this.prev.prev, this.next);
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
  },
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
  },
});

function RootMathBlock(){}
RootMathBlock.prototype = $.extend(new MathBlock, {
  keydown: function(e)
  {
    e.ctrlKey = e.ctrlKey || e.metaKey;
    switch(e.which)
    {
    case 8: //backspace
      if(e.ctrlKey)
        while(this.cursor.prev)
          this.cursor.backspace();
      else
        this.cursor.backspace();
      return false;
    case 27: //esc does something weird in keypress, may as well be the same as tab
             //  until we figure out what to do with it
    case 9: //tab
      if(e.ctrlKey)
        return true;
      var parent = this.cursor.parent, gramp = parent.parent;
      if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
      {
        if(!gramp) //cursor is in the root, continue default
          return true;
        else if(parent.prev) //go one block left
          this.cursor.appendTo(parent.prev);
        else //get out of the block
          this.cursor.insertBefore(gramp);
      }
      else //plain Tab = go one block right if it exists, else escape right.
      {
        if(!gramp) //cursor is in the root, continue default
          return true;
        else if(parent.next) //go one block right
          this.cursor.prependTo(parent.next);
        else //get out of the block
          this.cursor.insertAfter(gramp);
      }
      this.cursor.clearSelection();
      return false;
    case 13: //enter
      return e.ctrlKey; //ignore unless Ctrl
    case 35: //end
      //move to the end of the root block or the current block.
      this.cursor.clearSelection().appendTo(e.ctrlKey ? root : this.cursor.parent);
      return false;
    case 36: //home
      //move to the start of the root block or the current block.
      this.cursor.clearSelection().prependTo(e.ctrlKey ? root : this.cursor.parent);
      return false;
    case 37: //left
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        this.cursor.selectLeft();
      else
        this.cursor.moveLeft();
      return false;
    case 38: //up
      if(e.ctrlKey)
        return true;
      if(this.cursor.parent.prev)
        this.cursor.appendTo(this.cursor.parent.prev);
      else
        this.cursor.prependTo(this.cursor.parent);
      return false;
    case 39: //right
      if(e.ctrlKey)
        return true;
      if(e.shiftKey)
        this.cursor.selectRight();
      else
        this.cursor.moveRight();
      return false;
    case 40: //down
      if(e.ctrlKey)
        return true;
      if(this.cursor.parent.next)
        this.cursor.prependTo(this.cursor.parent.next);
      else
        this.cursor.appendTo(this.cursor.parent);
      return false;
    case 46: //delete
      if(e.ctrlKey)
        while(this.cursor.next)
          this.cursor.deleteForward();
      else
        this.cursor.deleteForward();
      return false;
    default:
      return true;
    }
  },
  keypress: function(e)
  {
    if(e.ctrlKey || e.metaKey)
      return true;
    this.cursor.write(String.fromCharCode(e.which)).show();
    return false;
  },
});

//The actual, publically exposed method of jQuery.prototype, available
//(and meant to be called) on jQuery-wrapped HTML DOM elements.
function mathquill(tabindex)
{
  if(!(typeof tabindex === 'function'))
    var i = tabindex || 0, tabindex = function(){ return i; };

  return this.each(function()
  {
    var root = new RootMathBlock;
    root.jQ = $('<span class="mathquill-editable-math mathquill-rendered-math" tabindex="'+tabindex.apply(this,arguments)+'"></span>').data('[[mathquill internal data]]', {block: root}).replaceAll(this);

    var cursor = root.cursor = new Cursor(root);

    var lastKeydnEvt; //see Wiki page "Keyboard Events"
    root.jQ.focus(function()
    {
      if(cursor.parent)
      {
        if(cursor.parent.isEmpty())
          cursor.jQ.appendTo(cursor.parent.removeEmpty().jQ).change();
      }
      else
        cursor.appendTo(root);
      cursor.parent.jQ.addClass('hasCursor');
      if(cursor.selection)
        cursor.selection.jQ.removeClass('blur');
      else
        cursor.show();
    }
    ).blur(function(e){
      cursor.setParentEmpty().hide();
      if(cursor.selection)
        cursor.selection.jQ.addClass('blur');
    }
    ).click(function(e)
    {
      var clicked = $(e.target);
      if(clicked.hasClass('empty'))
      {
        cursor.prependTo(clicked.data('[[mathquill internal data]]').block).jQ.change();
        return false;
      }
      var cmd = clicked.data('[[mathquill internal data]]');
      //all clickables not MathCommands are either LatexBlocks or like sqrt radicals or parens,
      //both of whose immediate parents are LatexCommands
      if(!(cmd && (cmd = cmd.cmd)) && !((cmd = (clicked = clicked.parent()).data('[[mathquill internal data]]')) && (cmd = cmd.cmd)))
        return;
      cursor.clearSelection();
      if((e.pageX - clicked.offset().left)*2 < clicked.outerWidth())
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);
      return false;
    }
    ).keydown(function(e) //see Wiki page "Keyboard Events"
    {
      lastKeydnEvt = e;
      e.happened = true;
      return e.returnValue = cursor.parent.keydown(e);
    }
    ).keypress(function(e)
    {
      //on auto-repeated key events, keypress may get triggered but not keydown
      //  (see Wiki page "Keyboard Events")
      if(lastKeydnEvt.happened)
        lastKeydnEvt.happened = false;
      else
        lastKeydnEvt.returnValue = cursor.parent.keydown(lastKeydnEvt);
      //only call keypress if keydown returned true
      return lastKeydnEvt.returnValue && cursor.parent.keypress(e);
    }
    ).focus();
  });
};
//on document ready, replace the contents of all <tag class="mathquill-embedded-math"></tag> elements
//with root MathBlock's.
$(function(){
  $('.mathquill-embedded-math').mathquill();
});

return mathquill;
}(jQuery));