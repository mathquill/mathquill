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
  Symbol.call(this, cmd, '<span class="operator">'+html+'</span>');
}
BinaryOperator.prototype = new Symbol; //so instanceof will work

function PlusMinus(cmd, html)
{
  VanillaSymbol.apply(this, arguments);
}
PlusMinus.prototype = new BinaryOperator; //so instanceof will work
PlusMinus.prototype.respace = function()
{
  if(!this.prev || this.prev instanceof BinaryOperator)
    this.jQ.removeClass('operator');
  else
    this.jQ.addClass('operator');
  return this;
};

function SupSub(cmd, html)
{
  MathCommand.call(this, cmd, [ html ]);
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

function Fraction()
{
  MathCommand.call(this, '\\frac ');
}
Fraction.prototype = new MathCommand;
Fraction.prototype.html_template = ['<span class="fraction"></span>', '<span class="numerator"></span>', '<span class="denominator"></span></span>'];
function LiveFraction()
{
  Fraction.call(this);
}
LiveFraction.prototype = new Fraction;
LiveFraction.prototype.placeCursor = function(cursor)
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
  cursor.prependTo(this.lastChild);
};

// Parens/Brackets/Braces etc
function Parens(open, close)
{
  MathCommand.call(this, open,
    ['<span class="open-paren">'+open+'</span><span></span><span class="close-paren">'+close+'</span>']);
  this.end = close;
  this.firstChild.jQ.change(function()
  {
    var block = $(this), height = block.height();
    block.prev().add(block.next()).css('fontSize', block.height()).css('top', -2-height/12);
  });
}
Parens.prototype = $.extend(new MathCommand, {
  initBlocks: function(){
    this.firstChild = this.lastChild = new MathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ.eq(1);
  },
  latex: function(){
    return this.cmd + this.firstChild.latex() + this.end;
  },
});

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput()
{
  MathCommand.call(this, '\\');
  var commandInput = this;
  this.jQ.keydown(function(e)
  {
    if(e.ctrlKey || e.metaKey)
      return;
    if(e.which === 9 || e.which === 13) //tab or enter
      commandInput.renderCommand(); //delay until after tab or whatever has happened
  }).keypress(function(e)
  {
    if(e.ctrlKey || e.metaKey)
      return;
    var char = String.fromCharCode(e.which);
    if(char.match(/[a-z]/i))
      return;
    commandInput.renderCommand();
    if(char === ' ')
      return false;
  });
  setTimeout(function(){ commandInput.jQ.focus(); }, 0);
}
LatexCommandInput.prototype = $.extend(new MathCommand, {
  html_template: ['<span class="latex-command-input" tabindex=0></span>'],
  placeCursor: function(cursor)
  {
    this.cursor = cursor.prependTo(this.firstChild);
  },
  latex: function()
  {
    return '\\' + this.firstChild.latex() + ' ';
  },
  focus: function()
  {
    this.jQ.focus();
  },
  renderCommand: function()
  {
    var newCmd = chooseLatexCommand(this.firstChild.latex());
    this.remove();
    if(this.prev)
      this.cursor.insertAfter(this.prev).newBefore(newCmd);
    else
      this.cursor.prependTo(this.parent).newBefore(newCmd);
    this.cursor.parent.focus();
  },
});

var SingleCharacterCommands = {
  ' ': function(){ return new VanillaSymbol('\\,', '&nbsp;'); },
  '*': function(){ return new VanillaSymbol('\\cdot ', '&sdot;'); },
  "'": function(){ return new VanillaSymbol("'", '&prime;');},
  '=': function(){ return new BinaryOperator('=', '='); },
  '<': function(){ return new BinaryOperator('<', '&lt;'); },
  '>': function(){ return new BinaryOperator('>', '&gt;'); },
  '+': function(){ return new PlusMinus('+'); },
  '-': function(){ return new PlusMinus('-', '&minus;'); },
  '^': function(){ return new SupSub('^', '<sup></sup>'); },
  '_': function(){ return new SupSub('_', '<sub></sub>'); },
  '/': function(){ return new LiveFraction(); },
  '(': function(){ return new Parens('(', ')'); },
  '[': function(){ return new Parens('[', ']'); },
  '{': function(){ return new Parens('{', '}'); },
  '|': function(){ return new Parens('|', '|'); },
  '\\': function(){ return new LatexCommandInput(); },
};

function SquareRoot()
{
    MathCommand.call(this, '\\sqrt ');
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

function chooseLatexCommand(latex)
{
  switch(latex)
  {
  case 'sqrt':
    return new SquareRoot();
  default:
    return new VanillaSymbol(latex.slice, '&'+latex+';');
  }
}
