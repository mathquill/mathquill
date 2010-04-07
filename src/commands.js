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
  initBlocks: function(replacedFragment){
    this.firstChild = this.lastChild = replacedFragment ? replacedFragment.blockify() : new MathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.firstChild.jQ ? this.jQ.children().eq(1).prepend(this.firstChild.jQ) : this.jQ.children().eq(1);
  },
  latex: function(){
    return this.cmd + this.firstChild.latex() + this.end;
  },
});

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedFragment)
{
  MathCommand.call(this, '\\');
  var commandInput = this, skipKeypress;
  this.jQ.keydown(function(e)
  {
    skipKeypress = false;
    if(e.ctrlKey || e.metaKey || $.inArray(e.which, [8, 27, 35, 36, 37, 38, 39, 40, 46]) >= 0)
      return skipKeypress = true;
    if(e.which === 9 || e.which === 13) //tab or enter
    {
      commandInput.renderCommand(); //delay until after tab or whatever has happened
      return false;
    }
  }).keypress(function(e)
  {
    if(skipKeypress)
      return;
    var char = String.fromCharCode(e.which);
    if(char.match(/[a-z]/i))
      return;
    commandInput.renderCommand();
    if(char === ' ')
      return false;
  });
  if(replacedFragment)
  {
    this.replacedFragment = replacedFragment.detach();
    this.isEmpty = function(){ return false; };
  }
}
LatexCommandInput.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="latex-command-input" tabindex=0></span>'],
  placeCursor: function(cursor)
  {
    this.cursor = cursor.prependTo(this.firstChild);
    if(this.replacedFragment)
      this.jQ.add(this.replacedFragment.jQ.insertAfter(this.jQ).addClass('blur'));
  },
  latex: function()
  {
    return '\\' + this.firstChild.latex() + ' ';
  },
  focus: function()
  {
    this.jQ.focus();
    return this;
  },
  renderCommand: function()
  {
    this.jQ = this.jQ.first();
    this.remove();
    if(this.prev)
      this.cursor.insertAfter(this.prev);
    else
      this.cursor.prependTo(this.parent);
    this.cursor.write(createLatexCommand(this.firstChild.latex(), this.replacedFragment));
  },
});

function SquareRoot(replacedFragment)
{
  MathCommand.call(this, '\\sqrt ', undefined, replacedFragment);
  this.firstChild.jQ.change(function(){
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
  ' ': function(replacedFragment){ return new VanillaSymbol('\\,', '&nbsp;', replacedFragment); },
  '*': function(replacedFragment){ return new VanillaSymbol('\\cdot ', '&sdot;', replacedFragment); },
  "'": function(replacedFragment){ return new VanillaSymbol("'", '&prime;', replacedFragment);},
  '=': function(replacedFragment){ return new BinaryOperator('=', '=', replacedFragment); },
  '<': function(replacedFragment){ return new BinaryOperator('<', '&lt;', replacedFragment); },
  '>': function(replacedFragment){ return new BinaryOperator('>', '&gt;', replacedFragment); },
  '+': function(replacedFragment){ return new PlusMinus('+', replacedFragment); },
  '-': function(replacedFragment){ return new PlusMinus('-', '&minus;', replacedFragment); },
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
