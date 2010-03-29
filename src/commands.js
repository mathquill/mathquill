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
  MathCommand.call(this, cmd, 1, html);
}
SupSub.prototype = $.extend(new MathCommand, {
  initBlocks: function()
  {
    this.jQ.data('latexlive').block = this.firstChild = this.lastChild = new MathBlock;
    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ;
    var me = this;
    this.jQ.change(function()
    {
      me.respace();
      if(me.next)
        me.next.respace();
      if(me.prev)
        me.prev.respace();
    });
  },
  respace: function()
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
  }
});

var SingleCharacterCommands = {
  '=': function(){ return new BinaryOperator('=', '='); },
  '<': function(){ return new BinaryOperator('<', '&lt;'); },
  '>': function(){ return new BinaryOperator('>', '&gt;'); },
  '+': function(){ return new PlusMinus('+'); },
  '-': function(){ return new PlusMinus('-', '&minus;'); },
  '*': function(){ return new VanillaSymbol('\\cdot ', '&sdot;'); },
  "'": function(){ return new VanillaSymbol("'", '&prime;');},
  '^': function(){ return new SupSub('^', '<sup></sup>'); },
  '_': function(){ return new SupSub('_', '<sub></sub>'); },
};
