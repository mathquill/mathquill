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
      newBlock.jQ = this.firstChild.jQ.empty().removeClass('empty').append(newBlock.jQ).data('[[mathquill internal data]]', { block: newBlock });
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
    this.firstChild.setEmpty();
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
    if(this.prev instanceof TextBlock)
      cursor.appendTo(this.remove().prev.firstChild);
    else if(this.next instanceof TextBlock)
      cursor.prependTo(this.remove().next.firstChild);
    else
    {
      this.cursor = cursor.prependTo(this.firstChild);
      if(this.replacedText)
        for(var i = 0; i < this.replacedText.length; i += 1)
          this.write(this.replacedText.charAt(i));
    }
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
  this.firstChild.setEmpty = this.setEmpty;
  if(replacedBlock)
  {
    replacedBlock.jQ.detach();
    this.replacedBlock = replacedBlock;
    this.replacedFragment = replacedFragment;
    this.isEmpty = function(){ return false; };
  }
}
LatexCommandInput.prototype = $.extend(new MathCommand, {
  setEmpty: function()
  {
    this.jQ.removeClass('hasCursor');
    if(this.isEmpty())
      this.jQ.html('&nbsp;');
    return this;
  },
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

