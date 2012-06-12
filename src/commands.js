/***************************
 * Commands and Operators.
 **************************/

var CharCmds = {}, LatexCmds = {}; //single character commands, LaTeX commands

var scale, // = function(jQ, x, y) { ... }
//will use a CSS 2D transform to scale the jQuery-wrapped HTML elements,
//or the filter matrix transform fallback for IE 5.5-8, or gracefully degrade to
//increasing the fontSize to match the vertical Y scaling factor.

//ideas from http://github.com/louisremi/jquery.transform.js
//see also http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx

  forceIERedraw = $.noop,
  div = document.createElement('div'),
  div_style = div.style,
  transformPropNames = {
    transform:1,
    WebkitTransform:1,
    MozTransform:1,
    OTransform:1,
    msTransform:1
  },
  transformPropName;

for (var prop in transformPropNames) {
  if (prop in div_style) {
    transformPropName = prop;
    break;
  }
}

if (transformPropName) {
  scale = function(jQ, x, y) {
    jQ.css(transformPropName, 'scale('+x+','+y+')');
  };
}
else if ('filter' in div_style) { //IE 6, 7, & 8 fallback, see https://github.com/laughinghan/mathquill/wiki/Transforms
  forceIERedraw = function(el){ el.className = el.className; };
  scale = function(jQ, x, y) { //NOTE: assumes y > x
    x /= (1+(y-1)/2);
    jQ.addClass('matrixed').css({
      fontSize: y + 'em',
      marginTop: '-.1em',
      filter: 'progid:DXImageTransform.Microsoft'
        + '.Matrix(M11=' + x + ",SizingMethod='auto expand')"
    });
    function calculateMarginRight() {
      jQ.css('marginRight', (1+jQ.width())*(x-1)/x + 'px');
    }
    calculateMarginRight();
    var intervalId = setInterval(calculateMarginRight);
    $(window).load(function() {
      clearTimeout(intervalId);
      calculateMarginRight();
    });
  };
}
else {
  scale = function(jQ, x, y) {
    jQ.css('fontSize', y + 'em');
  };
}

function proto(parent, child) { //shorthand for prototyping
  child.prototype = parent.prototype;
  return child;
}

function bind(cons) { //shorthand for binding arguments to constructor
  var args = Array.prototype.slice.call(arguments, 1);

  return proto(cons, function() {
    cons.apply(this, Array.prototype.concat.apply(args, arguments));
  });
}

function Style(cmd, html_template) {
  MathCommand.call(this, cmd, [ html_template ]);
}
proto(MathCommand, Style);
//fonts
LatexCmds.mathrm = bind(Style, '\\mathrm', '<span class="roman font"></span>');
LatexCmds.mathit = bind(Style, '\\mathit', '<i class="font"></i>');
LatexCmds.mathbf = bind(Style, '\\mathbf', '<b class="font"></b>');
LatexCmds.mathsf = bind(Style, '\\mathsf', '<span class="sans-serif font"></span>');
LatexCmds.mathtt = bind(Style, '\\mathtt', '<span class="monospace font"></span>');
//text-decoration
LatexCmds.underline = bind(Style, '\\underline', '<span class="non-leaf underline"></span>');
LatexCmds.overline = LatexCmds.bar = bind(Style, '\\overline', '<span class="non-leaf overline"></span>');

var SupSub = _class(new MathCommand, function(cmd, html, text) {
  MathCommand.call(this, cmd, [ html ], [ text ]);
});
_.latex = function() {
  var latex = this.firstChild.latex();
  if (latex.length === 1)
    return this.cmd + latex;
  else
    return this.cmd + '{' + (latex || ' ') + '}';
};
_.redraw = function() {
  if (this.prev)
    this.prev.respace();
  //SupSub::respace recursively calls respace on all the following SupSubs
  //so if prev is a SupSub, no need to call respace on this or following nodes
  if (!(this.prev instanceof SupSub)) {
    this.respace();
    //and if next is a SupSub, then this.respace() will have already called
    //this.next.respace()
    if (this.next && !(this.next instanceof SupSub))
      this.next.respace();
  }
};
_.respace = function() {
  if (
    this.prev.cmd === '\\int ' || (
      this.prev instanceof SupSub && this.prev.cmd != this.cmd
      && this.prev.prev && this.prev.prev.cmd === '\\int '
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

  this.respaced = this.prev instanceof SupSub && this.prev.cmd != this.cmd && !this.prev.respaced;
  if (this.respaced) {
    var fontSize = +this.jQ.css('fontSize').slice(0,-2),
      prevWidth = this.prev.jQ.outerWidth()
      thisWidth = this.jQ.outerWidth();
    this.jQ.css({
      left: (this.limit && this.cmd === '_' ? -.25 : 0) - prevWidth/fontSize + 'em',
      marginRight: .1 - min(thisWidth, prevWidth)/fontSize + 'em'
        //1px extra so it doesn't wrap in retarded browsers (Firefox 2, I think)
    });
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

  if (this.next instanceof SupSub)
    this.next.respace();

  return this;
};

LatexCmds.subscript = LatexCmds._ = proto(SupSub, function() {
  SupSub.call(this, '_', '<sub class="non-leaf"></sub>', '_');
});

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = proto(SupSub, function() {
  SupSub.call(this, '^', '<sup class="non-leaf"></sup>', '**');
});

var Fraction = _class(new MathCommand);
_.cmd = '\\frac';
_.html_template = [
  '<span class="fraction non-leaf"></span>',
  '<span class="numerator"></span>',
  '<span class="denominator"></span>'
];
_.createBlocks = function() {
  this._createBlocks();
  this.jQ.append('<span style="display:inline-block;width:0">&nbsp;</span>');
};
_.text_template = ['(', '/', ')'];

LatexCmds.frac = LatexCmds.dfrac = LatexCmds.cfrac = LatexCmds.fraction = Fraction;

var LiveFraction = _subclass(Fraction);
_.createBefore = function(cursor) {
  if (!this.replacedFragment) {
    var prev = cursor.prev;
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

    if (prev !== cursor.prev) {
      this.replaces(new MathFragment(prev.next || cursor.parent.firstChild, cursor.prev).detach());
      cursor.prev = prev;
    }
  }
  this._createBefore(cursor);
};

LatexCmds.over = CharCmds['/'] = LiveFraction;

var SquareRoot = _class(new MathCommand);
_.cmd = '\\sqrt';
_.html_template = [
  '<span class="sqrt"><span class="non-leaf sqrt-prefix">&radic;</span></span>',
  '<span class="sqrt-stem"></span>'
];
_.text_template = ['sqrt(', ')'];
_.redraw = function() {
  var block = this.lastChild.jQ;
  scale(block.prev(), 1, block.innerHeight()/+block.css('fontSize').slice(0,-2) - .1);
};

LatexCmds.sqrt = LatexCmds['√'] = SquareRoot;

function NthRoot(replacedFragment) {
  SquareRoot.call(this, replacedFragment);
}
_ = NthRoot.prototype = new SquareRoot;
_.createBlocks = function() {
  MathCommand.prototype.createBlocks.call(this);
  this.jQ = this.firstChild.jQ.detach().add(this.jQ);
};
_.html_template = [
  '<span class="non-leaf"><span class="sqrt-prefix non-leaf">&radic;</span></span>',
  '<sup class="nthroot non-leaf"></sup>',
  '<span class="sqrt-stem non-leaf"></span>'
];
_.text_template = ['sqrt[', '](', ')'];
_.latex = function() {
  return '\\sqrt['+this.firstChild.latex()+']{'+this.lastChild.latex()+'}';
};

LatexCmds.nthroot = NthRoot;

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
var Bracket = _class(new MathCommand, function(open, close, cmd, end) {
  MathCommand.call(this, '\\left'+cmd,
    ['<span class="non-leaf"><span class="non-leaf paren">'+open+'</span><span class="non-leaf"></span><span class="non-leaf paren">'+close+'</span></span>'],
    [open, close]);
  this.end = '\\right'+end;
});
_.createBlocks = function() { //FIXME: possible Law of Demeter violation, hardcore MathCommand::createBlocks knowledge needed here
  this.firstChild = this.lastChild =
    (this.replacedFragment && this.replacedFragment.blockify()) || new MathBlock;
  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ.children(':eq(1)')
    .data(jQueryDataKey, {block: this.firstChild})
    .append(this.firstChild.jQ);

  var block = this.blockjQ = this.firstChild.jQ;
  this.bracketjQs = block.prev().add(block.next());
};
_.latex = function() {
  return this.cmd + this.firstChild.latex() + this.end;
};
_.redraw = function() {
  var height = this.blockjQ.outerHeight()/+this.blockjQ.css('fontSize').slice(0,-2);
  scale(this.bracketjQs, min(1 + .2*(height - 1), 1.2), 1.05*height);
};

LatexCmds.lbrace = CharCmds['{'] = proto(Bracket, function() {
  Bracket.call(this, '{', '}', '\\{', '\\}');
});
LatexCmds.langle = LatexCmds.lang = proto(Bracket, function() {
  Bracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ');
});

// Closing bracket matching opening bracket above
var CloseBracket = _subclass(Bracket);
_.createBefore = function(cursor) {
  //if I'm at the end of my parent who is a matching open-paren, and I am not
  //replacing a selection fragment, don't create me, just put cursor after my parent
  if (!cursor.next && cursor.parent.parent && cursor.parent.parent.end === this.end && !this.replacedFragment)
    cursor.insertAfter(cursor.parent.parent);
  else
    this._createBefore(cursor);
};
_.placeCursor = function(cursor) {
  this.firstChild.blur();
  cursor.insertAfter(this);
};

LatexCmds.rbrace = CharCmds['}'] = proto(CloseBracket, function() {
  CloseBracket.call(this, '{','}','\\{','\\}');
});
LatexCmds.rangle = LatexCmds.rang = proto(CloseBracket, function() {
  CloseBracket.call(this,'&lang;','&rang;','\\langle ','\\rangle ');
});

var Paren = proto(Bracket, function(open, close) {
  Bracket.call(this, open, close, open, close);
});

LatexCmds.lparen = CharCmds['('] = proto(Paren, function() {
  Paren.call(this, '(', ')');
});
LatexCmds.lbrack = LatexCmds.lbracket = CharCmds['['] = proto(Paren, function() {
  Paren.call(this, '[', ']');
});

var CloseParen = proto(CloseBracket, function(open, close) {
  Bracket.call(this, open, close, open, close);
});

LatexCmds.rparen = CharCmds[')'] = proto(CloseParen, function() {
  CloseParen.call(this, '(', ')');
});
LatexCmds.rbrack = LatexCmds.rbracket = CharCmds[']'] = proto(CloseParen, function() {
  CloseParen.call(this, '[', ']');
});

var Pipes = _class(new Paren, function() {
  Paren.call(this, '|', '|');
});
_.createBefore = CloseBracket.prototype.createBefore;

LatexCmds.lpipe = LatexCmds.rpipe = CharCmds['|'] = Pipes;

var TextBlock = _class(new MathCommand);
_.cmd = '\\text';
_.html_template = ['<span class="text"></span>'];
_.replaces = function(replacedText) {
  if (replacedText instanceof MathFragment)
    this.replacedText = replacedText.remove().jQ.text();
  else if (typeof replacedText === 'string')
    this.replacedText = replacedText;
};
_.text_template = ['"', '"'];
_.createBlocks = function() { //FIXME: another possible Law of Demeter violation, but this seems much cleaner, like it was supposed to be done this way
  this.firstChild =
  this.lastChild =
  this.jQ.data(jQueryDataKey).block = new InnerTextBlock;

  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ.append(this.firstChild.jQ);
};
_.createBefore = function(cursor) {
  this._createBefore(this.cursor = cursor);

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
    e.preventDefault();
    return false;
  }
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
    var next = new TextBlock(new MathFragment(this.cursor.next, this.firstChild.lastChild));
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
  return false;
};
var InnerTextBlock = _class(new MathBlock);
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

      cursor.show().parent.bubble('redraw');
    }
  }
  return this;
};
_.focus = function() {
  MathBlock.prototype.focus.call(this);

  var textblock = this.parent;
  if (textblock.next.cmd === textblock.cmd) { //TODO: seems like there should be a better way to move MathElements around
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

    cursor.parent.bubble('redraw');
  }
  else if (textblock.prev.cmd === textblock.cmd) {
    var cursor = textblock.cursor;
    if (cursor.prev)
      textblock.prev.firstChild.focus();
    else
      cursor.appendTo(textblock.prev.firstChild);
  }
  return this;
};

CharCmds.$ =
LatexCmds.text =
LatexCmds.textnormal =
LatexCmds.textrm =
LatexCmds.textup =
LatexCmds.textmd =
  TextBlock;

function makeTextBlock(latex, html) {
  var SomeTextBlock = _subclass(TextBlock);
  _.cmd = latex;
  _.html_template = [ html ];
  return SomeTextBlock;
}

LatexCmds.em = LatexCmds.italic = LatexCmds.italics =
LatexCmds.emph = LatexCmds.textit = LatexCmds.textsl =
  makeTextBlock('\\textit', '<i class="text"></i>');
LatexCmds.strong = LatexCmds.bold = LatexCmds.textbf =
  makeTextBlock('\\textbf', '<b class="text"></b>');
LatexCmds.sf = LatexCmds.textsf =
  makeTextBlock('\\textsf', '<span class="sans-serif text"></span>');
LatexCmds.tt = LatexCmds.texttt =
  makeTextBlock('\\texttt', '<span class="monospace text"></span>');
LatexCmds.textsc =
  makeTextBlock('\\textsc', '<span style="font-variant:small-caps" class="text"></span>');
LatexCmds.uppercase =
  makeTextBlock('\\uppercase', '<span style="text-transform:uppercase" class="text"></span>');
LatexCmds.lowercase =
  makeTextBlock('\\lowercase', '<span style="text-transform:lowercase" class="text"></span>');

// input box to type a variety of LaTeX commands beginning with a backslash
var LatexCommandInput = _class(new MathCommand);
_.cmd = '\\';
_.replaces = function(replacedFragment) {
  this._replacedFragment = replacedFragment.detach();
  this.isEmpty = function(){ return false; };
};
_.html_template = ['<span class="latex-command-input">\\</span>'];
_.text_template = ['\\'];
_.createBefore = function(cursor) {
  this._createBefore(cursor);
  this.cursor = cursor.appendTo(this.firstChild);
  if (this._replacedFragment) {
    var el = this.jQ[0];
    this.jQ =
      this._replacedFragment.jQ.addClass('blur').bind(
        'mousedown mousemove', //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
        function(e) {
          $(e.target = el).trigger(e);
          return false;
        }
      ).insertBefore(this.jQ).add(this.jQ);
  }
};
_.latex = function() {
  return '\\' + this.firstChild.latex() + ' ';
};
_.keydown = function(e) {
  if (e.which === 9 || e.which === 13) { //tab or enter
    this.renderCommand();
    e.preventDefault();
    return false;
  }
};
_.textInput = function(ch) {
  if (ch.match(/[a-z]/i)) {
    this.cursor.deleteSelection();
    this.cursor.insertNew(new VanillaSymbol(ch));
    return false;
  }
  this.renderCommand();
  if (ch === ' ' || (ch === '\\' && this.firstChild.isEmpty()))
    return false;
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
      cmd = new cmd(latex);
    else {
      cmd = new TextBlock;
      cmd.replaces(latex);
      cmd.firstChild.focus = function(){ delete this.focus; return this; };
      this.cursor.insertNew(cmd).insertAfter(cmd);
      if (this._replacedFragment)
        this._replacedFragment.remove();

      return;
    }
  }
  else
    cmd = new VanillaSymbol('\\backslash ','\\');

  if (this._replacedFragment)
    cmd.replaces(this._replacedFragment);
  this.cursor.insertNew(cmd);
};

CharCmds['\\'] = LatexCommandInput;
  
var Binomial = _class(new MathCommand);
_.cmd = '\\binom';
_.html_template =
  ['<span class="non-leaf"></span>', '<span></span>', '<span></span>'];
_.createBlocks = function() {
  this._createBlocks();
  this.jQ.wrapInner('<span class="array non-leaf"></span>');
  this.blockjQ = this.jQ.children();
  this.bracketjQs =
    $('<span class="paren non-leaf">(</span>').prependTo(this.jQ)
    .add( $('<span class="paren non-leaf">)</span>').appendTo(this.jQ) );
};
_.text_template = ['choose(',',',')'];
_.redraw = Bracket.prototype.redraw;
LatexCmds.binom = LatexCmds.binomial = Binomial;

var Choose = _subclass(Binomial);
_.createBefore = LiveFraction.prototype.createBefore;

LatexCmds.choose = Choose;

var Vector = _class(new MathCommand);
_.cmd = '\\vector';
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
_.createBefore = function(cursor) {
  this._createBefore(this.cursor = cursor);
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
      this.bubble('redraw').cursor.appendTo(newBlock);

      e.preventDefault();
      return false;
    }
    else if (e.which === 9 && !e.shiftKey && !currentBlock.next) { //tab
      if (currentBlock.isEmpty()) {
        if (currentBlock.prev) {
          this.cursor.insertAfter(this);
          delete currentBlock.prev.next;
          this.lastChild = currentBlock.prev;
          currentBlock.jQ.remove();
          this.bubble('redraw');

          e.preventDefault();
          return false;
        }
        else
          return;
      }

      var newBlock = new MathBlock;
      newBlock.parent = this;
      newBlock.jQ = $('<span></span>').data(jQueryDataKey, {block: newBlock}).appendTo(this.jQ);
      this.lastChild = newBlock;
      currentBlock.next = newBlock;
      newBlock.prev = currentBlock;
      this.bubble('redraw').cursor.appendTo(newBlock);

      e.preventDefault();
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
          this.bubble('redraw');

        e.preventDefault();
        return false;
      }
      else if (!this.cursor.prev) {
        e.preventDefault();
        return false;
      }
    }
  }
};

LatexCmds.vector = Vector;

LatexCmds.editable = proto(RootMathCommand, function() {
  MathCommand.call(this, '\\editable');
  var cursor;
  this.createBefore = function(c){ this._createBefore(cursor = c); };
  this.createBlocks = function() {
    RootMathCommand.prototype.createBlocks.call(this);
    createRoot(this.jQ, this.firstChild, false, true);
    this.firstChild.blur = function() {
      if (cursor.prev !== this.parent) return; //when cursor is inserted after editable, append own cursor FIXME HACK
      delete this.blur;
      this.cursor.appendTo(this);
      MathBlock.prototype.blur.call(this);
    };
    this.latex = function(){ return this.firstChild.latex(); };
    this.text = function(){ return this.firstChild.text(); };
  };
});

