/********************************************
 * All the symbols, operators and commands.
 *******************************************/

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
  if($.browser.mozilla && +$.browser.version.slice(0,3) < 1.9) //Firefox 2 and below
    this.jQ.css('display','-moz-groupbox');
}
Fraction.prototype = new MathCommand;
Fraction.prototype.html_template = ['<span class="fraction"></span>', '<span class="numerator"></span>', '<span class="denominator"></span>'];

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
SquareRoot.prototype.html_template = ['<span><span class="sqrt-prefix">&radic;</span></span>','<span class="sqrt-stem"></span>'];

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
  this.firstChild.jQ = this.firstChild.jQ ? this.jQ.children(':eq(1)').append(this.firstChild.jQ) : this.jQ.children(':eq(1)');
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
    if(this.prev instanceof TextBlock)
      cursor.appendTo(this.remove().prev.firstChild);
    else if(this.next instanceof TextBlock)
      cursor.prependTo(this.remove().next.firstChild);
    else
    {
      this.cursor = cursor.appendTo(this.firstChild);
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

LatexCmds.text = CharCmds.$ = TextBlock;

// input box to type a variety of LaTeX commands beginning with a backslash
function LatexCommandInput(replacedFragment)
{
  MathCommand.call(this, '\\');
  this.firstChild.setEmpty = this.setEmpty;
  if(replacedFragment)
  {
    this.replacedFragment = replacedFragment.detach();
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
    return this.parent.keypress(e);
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
        this.cursor.insertNew(new cmd(this.replacedFragment, latex));
      else
        this.cursor.insertNew(cmd = new TextBlock(latex)).insertAfter(cmd);
    else
      this.cursor.insertNew(new VanillaSymbol('\\backslash ','\\'));
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
Binomial.prototype.html_template = ['<span></span>', '<span></span>', '<span></span>'];

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

/********** Symbols and Special Characters **********/

function bind(cons) //shorthand for binding arguments to constructor
{
  var args = []; //arguments after cons
  for(var i = 1; i < arguments.length; ++i)
    args.push(arguments[i]);

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
LatexCmds.quad = LatexCmds.emsp = bind(VanillaSymbol,'\\quad ','&nbsp;&nbsp;&nbsp;&nbsp;');
LatexCmds.qquad = bind(VanillaSymbol,'\\qquad ','&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
/* spacing special characters, gonna have to implement this in LatexCommandInput.prototype.keypress somehow
case ',':
  return new VanillaSymbol('\\, ','&nbsp;');
case ':':
  return new VanillaSymbol('\\: ','&nbsp;&nbsp;');
case ';':
  return new VanillaSymbol('\\; ','&nbsp;&nbsp;&nbsp;');
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
  this.jQ[0].className = (this.next instanceof SupSub) ? '' : 'non-italicized-function';
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
