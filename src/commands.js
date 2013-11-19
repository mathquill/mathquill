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

  forceIERedraw = noop,
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
    jQ.css('fontSize', y + 'em');
    if (!jQ.hasClass('matrixed-container')) {
      jQ.addClass('matrixed-container')
      .wrapInner('<span class="matrixed"></span>');
    }
    var innerjQ = jQ.children()
    .css('filter', 'progid:DXImageTransform.Microsoft'
        + '.Matrix(M11=' + x + ",SizingMethod='auto expand')"
    );
    function calculateMarginRight() {
      jQ.css('marginRight', (innerjQ.width()-1)*(x-1)/x + 'px');
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

var Style = P(MathCommand, function(_, _super) {
  _.init = function(ctrlSeq, tagName, attrs) {
    _super.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'>&0</'+tagName+'>');
  };
});

//fonts
LatexCmds.mathrm = bind(Style, '\\mathrm', 'span', 'class="roman font"');
LatexCmds.mathit = bind(Style, '\\mathit', 'i', 'class="font"');
LatexCmds.mathbf = bind(Style, '\\mathbf', 'b', 'class="font"');
LatexCmds.mathsf = bind(Style, '\\mathsf', 'span', 'class="sans-serif font"');
LatexCmds.mathtt = bind(Style, '\\mathtt', 'span', 'class="monospace font"');
//text-decoration
LatexCmds.underline = bind(Style, '\\underline', 'span', 'class="non-leaf underline"');
LatexCmds.overline = LatexCmds.bar = bind(Style, '\\overline', 'span', 'class="non-leaf overline"');

var SupSub = P(MathCommand, function(_, _super) {
  _.init = function(ctrlSeq, tag, text) {
    _super.init.call(this, ctrlSeq, '<'+tag+' class="non-leaf">&0</'+tag+'>', [ text ]);
  };
  _.finalizeTree = function() {
    //TODO: use inheritance
    pray('SupSub is only _ and ^',
      this.ctrlSeq === '^' || this.ctrlSeq === '_'
    );

    if (this.ctrlSeq === '_') {
      this.down = this.ends[L];
      this.ends[L].up = insLeftOfMeUnlessAtEnd;
    }
    else {
      this.up = this.ends[L];
      this.ends[L].down = insLeftOfMeUnlessAtEnd;
    }
    function insLeftOfMeUnlessAtEnd(cursor) {
      // cursor.insLeftOf(cmd), unless cursor at the end of block, and every
      // ancestor cmd is at the end of every ancestor block
      var cmd = this.parent, ancestorCmd = cursor;
      do {
        if (ancestorCmd[R]) {
          cursor.insLeftOf(cmd);
          return false;
        }
        ancestorCmd = ancestorCmd.parent.parent;
      } while (ancestorCmd !== cmd);
      cursor.insRightOf(cmd);
      return false;
    }
  };
  _.latex = function() {
    var latex = this.ends[L].latex();
    if (latex.length === 1)
      return this.ctrlSeq + latex;
    else
      return this.ctrlSeq + '{' + (latex || ' ') + '}';
  };
  _.redraw = function() {
    if (this[L])
      this[L].respace();
    //SupSub::respace recursively calls respace on all the following SupSubs
    //so if leftward is a SupSub, no need to call respace on this or following nodes
    if (!(this[L] instanceof SupSub)) {
      this.respace();
      //and if rightward is a SupSub, then this.respace() will have already called
      //this[R].respace()
      if (this[R] && !(this[R] instanceof SupSub))
        this[R].respace();
    }
  };
  _.respace = function() {
    if (
      this[L].ctrlSeq === '\\int ' || (
        this[L] instanceof SupSub && this[L].ctrlSeq != this.ctrlSeq
        && this[L][L] && this[L][L].ctrlSeq === '\\int '
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

    this.respaced = this[L] instanceof SupSub && this[L].ctrlSeq != this.ctrlSeq && !this[L].respaced;
    if (this.respaced) {
      var fontSize = +this.jQ.css('fontSize').slice(0,-2),
        leftWidth = this[L].jQ.outerWidth(),
        thisWidth = this.jQ.outerWidth();
      this.jQ.css({
        left: (this.limit && this.ctrlSeq === '_' ? -.25 : 0) - leftWidth/fontSize + 'em',
        marginRight: .1 - min(thisWidth, leftWidth)/fontSize + 'em'
          //1px extra so it doesn't wrap in retarded browsers (Firefox 2, I think)
      });
    }
    else if (this.limit && this.ctrlSeq === '_') {
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

    if (this[R] instanceof SupSub)
      this[R].respace();

    return this;
  };
});

LatexCmds.subscript =
LatexCmds._ = bind(SupSub, '_', 'sub', '_');

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = bind(SupSub, '^', 'sup', '**');

var Fraction =
LatexCmds.frac =
LatexCmds.dfrac =
LatexCmds.cfrac =
LatexCmds.fraction = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\frac';
  _.htmlTemplate =
      '<span class="fraction non-leaf">'
    +   '<span class="numerator">&0</span>'
    +   '<span class="denominator">&1</span>'
    +   '<span style="display:inline-block;width:0">&nbsp;</span>'
    + '</span>'
  ;
  _.textTemplate = ['(', '/', ')'];
  _.finalizeTree = function() {
    this.up = this.ends[R].up = this.ends[L];
    this.down = this.ends[L].down = this.ends[R];
  };
});

var LiveFraction =
LatexCmds.over =
CharCmds['/'] = P(Fraction, function(_, _super) {
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment) {
      var leftward = cursor[L];
      while (leftward &&
        !(
          leftward instanceof BinaryOperator ||
          leftward instanceof TextBlock ||
          leftward instanceof BigSymbol ||
          /^[,;:]$/.test(leftward.ctrlSeq)
        ) //lookbehind for operator
      )
        leftward = leftward[L];

      if (leftward instanceof BigSymbol && leftward[R] instanceof SupSub) {
        leftward = leftward[R];
        if (leftward[R] instanceof SupSub && leftward[R].ctrlSeq != leftward.ctrlSeq)
          leftward = leftward[R];
      }

      if (leftward !== cursor[L]) {
        this.replaces(MathFragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
        cursor[L] = leftward;
      }
    }
    _super.createLeftOf.call(this, cursor);
  };
});

var SquareRoot =
LatexCmds.sqrt =
LatexCmds['√'] = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\sqrt';
  _.htmlTemplate =
      '<span class="non-leaf">'
    +   '<span class="scaled sqrt-prefix">&radic;</span>'
    +   '<span class="non-leaf sqrt-stem">&0</span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt(', ')'];
  _.parser = function() {
    return latexMathParser.optBlock.then(function(optBlock) {
      return latexMathParser.block.map(function(block) {
        var nthroot = NthRoot();
        nthroot.blocks = [ optBlock, block ];
        optBlock.adopt(nthroot, 0, 0);
        block.adopt(nthroot, optBlock, 0);
        return nthroot;
      });
    }).or(_super.parser.call(this));
  };
  _.redraw = function() {
    var block = this.ends[R].jQ;
    scale(block.prev(), 1, block.innerHeight()/+block.css('fontSize').slice(0,-2) - .1);
  };
});

var Vec = LatexCmds.vec = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\vec';
  _.htmlTemplate =
      '<span class="non-leaf">'
    +   '<span class="vector-prefix">&rarr;</span>'
    +   '<span class="vector-stem">&0</span>'
    + '</span>'
  ;
  _.textTemplate = ['vec(', ')'];
});

var NthRoot =
LatexCmds.nthroot = P(SquareRoot, function(_, _super) {
  _.htmlTemplate =
      '<sup class="nthroot non-leaf">&0</sup>'
    + '<span class="scaled">'
    +   '<span class="sqrt-prefix scaled">&radic;</span>'
    +   '<span class="sqrt-stem non-leaf">&1</span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt[', '](', ')'];
  _.latex = function() {
    return '\\sqrt['+this.ends[L].latex()+']{'+this.ends[R].latex()+'}';
  };
});

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
var Bracket = P(MathCommand, function(_, _super) {
  _.init = function(open, close, ctrlSeq, end) {
    _super.init.call(this, '\\left'+ctrlSeq,
        '<span class="non-leaf">'
      +   '<span class="scaled paren">'+open+'</span>'
      +   '<span class="non-leaf">&0</span>'
      +   '<span class="scaled paren">'+close+'</span>'
      + '</span>',
      [open, close]);
    this.end = '\\right'+end;
  };
  _.jQadd = function() {
    _super.jQadd.apply(this, arguments);
    var jQ = this.jQ;
    this.bracketjQs = jQ.children(':first').add(jQ.children(':last'));
  };
  _.latex = function() {
    return this.ctrlSeq + this.ends[L].latex() + this.end;
  };
  _.redraw = function() {
    var blockjQ = this.ends[L].jQ;

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    scale(this.bracketjQs, min(1 + .2*(height - 1), 1.2), 1.05*height);
  };
});

LatexCmds.left = P(MathCommand, function(_) {
  _.parser = function() {
    var regex = Parser.regex;
    var string = Parser.string;
    var succeed = Parser.succeed;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{)/))
      .then(function(open) {
        if (open.charAt(0) === '\\') open = open.slice(1);

        var cmd = CharCmds[open]();

        return latexMathParser
          .map(function (block) {
            cmd.blocks = [ block ];
            block.adopt(cmd, 0, 0);
          })
          .then(string('\\right'))
          .skip(optWhitespace)
          .then(regex(/^(?:[\])|]|\\\})/))
          .then(function(close) {
            if (close.slice(-1) !== cmd.end.slice(-1)) {
              return Parser.fail('open doesn\'t match close');
            }

            return succeed(cmd);
          })
        ;
      })
    ;
  };
});

LatexCmds.right = P(MathCommand, function(_) {
  _.parser = function() {
    return Parser.fail('unmatched \\right');
  };
});

LatexCmds.lbrace =
CharCmds['{'] = bind(Bracket, '{', '}', '\\{', '\\}');
LatexCmds.langle =
LatexCmds.lang = bind(Bracket, '&lang;','&rang;','\\langle ','\\rangle ');

// Closing bracket matching opening bracket above
var CloseBracket = P(Bracket, function(_, _super) {
  _.createLeftOf = function(cursor) {
    // if I'm at the end of my parent who is a matching open-paren,
    // and I am not replacing a selection fragment, don't create me,
    // just put cursor after my parent
    if (!cursor[R] && cursor.parent.parent && cursor.parent.parent.end === this.end && !this.replacedFragment)
      cursor.insRightOf(cursor.parent.parent);
    else
      _super.createLeftOf.call(this, cursor);
  };
  _.placeCursor = function(cursor) {
    this.ends[L].blur();
    cursor.insRightOf(this);
  };
});

LatexCmds.rbrace =
CharCmds['}'] = bind(CloseBracket, '{','}','\\{','\\}');
LatexCmds.rangle =
LatexCmds.rang = bind(CloseBracket, '&lang;','&rang;','\\langle ','\\rangle ');

var parenMixin = function(_, _super) {
  _.init = function(open, close) {
    _super.init.call(this, open, close, open, close);
  };
};

var Paren = P(Bracket, parenMixin);

LatexCmds.lparen =
CharCmds['('] = bind(Paren, '(', ')');
LatexCmds.lbrack =
LatexCmds.lbracket =
CharCmds['['] = bind(Paren, '[', ']');

var CloseParen = P(CloseBracket, parenMixin);

LatexCmds.rparen =
CharCmds[')'] = bind(CloseParen, '(', ')');
LatexCmds.rbrack =
LatexCmds.rbracket =
CharCmds[']'] = bind(CloseParen, '[', ']');

var Pipes =
LatexCmds.lpipe =
LatexCmds.rpipe =
CharCmds['|'] = P(Paren, function(_, _super) {
  _.init = function() {
    _super.init.call(this, '|', '|');
  };

  _.createLeftOf = CloseBracket.prototype.createLeftOf;
});

var TextBlock =
CharCmds.$ =
LatexCmds.text =
LatexCmds.textnormal =
LatexCmds.textrm =
LatexCmds.textup =
LatexCmds.textmd = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\text';
  _.htmlTemplate = '<span class="text">&0</span>';
  _.replaces = function(replacedText) {
    if (replacedText instanceof MathFragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  };
  _.textTemplate = ['"', '"'];
  _.parser = function() {
    var self = this;

    // TODO: correctly parse text mode
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{')).then(regex(/^[^}]*/)).skip(string('}'))
      .map(function(text) {
        self.createBlocks();
        var block = self.ends[L];
        for (var i = 0; i < text.length; i += 1) {
          var ch = VanillaSymbol(text.charAt(i));
          ch.adopt(block, block.ends[R], 0);
        }
        return self;
      })
    ;
  };
  _.createBlocks = function() {
    //FIXME: another possible Law of Demeter violation, but this seems much cleaner, like it was supposed to be done this way
    this.ends[L] =
    this.ends[R] =
      InnerTextBlock();

    this.blocks = [ this.ends[L] ];

    this.ends[L].parent = this;
  };
  _.finalizeInsert = function() {
    //FIXME HACK blur removes the TextBlock
    this.ends[L].blur = function() { delete this.blur; return this; };
    _super.finalizeInsert.call(this);
  };
  _.createLeftOf = function(cursor) {
    _super.createLeftOf.call(this, this.cursor = cursor);

    if (this.replacedText)
      for (var i = 0; i < this.replacedText.length; i += 1)
        this.ends[L].write(cursor, this.replacedText.charAt(i));
  };
});

var InnerTextBlock = P(MathBlock, function(_, _super) {
  _.onKey = function(key, e) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return false;
  };
  // backspace and delete at ends of block don't unwrap
  _.deleteOutOf = function(dir, cursor) {
    if (this.isEmpty()) cursor.insRightOf(this.parent);
  };
  _.write = function(cursor, ch, replacedFragment) {
    if (replacedFragment) replacedFragment.remove();

    if (ch !== '$') {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      VanillaSymbol(ch, html).createLeftOf(cursor);
    }
    else if (this.isEmpty()) {
      cursor.insRightOf(this.parent).backspace();
      VanillaSymbol('\\$','$').createLeftOf(cursor);
    }
    else if (!cursor[R])
      cursor.insRightOf(this.parent);
    else if (!cursor[L])
      cursor.insLeftOf(this.parent);
    else { //split apart
      var rightward = TextBlock();
      rightward.replaces(MathFragment(cursor[R], this.ends[R]));

      cursor.insRightOf(this.parent);

      // FIXME HACK: pretend no prev so they don't get merged when
      // .createLeftOf() calls blur on the InnerTextBlock
      rightward.adopt = function() {
        delete this.adopt;
        this.adopt.apply(this, arguments);
        this[L] = 0;
      };
      rightward.createLeftOf(cursor);
      rightward[L] = this.parent;

      cursor.insLeftOf(rightward);
    }
    return false;
  };
  _.blur = function() {
    this.jQ.removeClass('hasCursor');
    if (this.isEmpty()) {
      var textblock = this.parent, cursor = textblock.cursor;
      if (cursor.parent === this)
        this.jQ.addClass('empty');
      else {
        cursor.hide();
        textblock.remove();
        if (cursor[R] === textblock)
          cursor[R] = textblock[R];
        else if (cursor[L] === textblock)
          cursor[L] = textblock[L];

        cursor.show().parent.bubble('redraw');
      }
    }
    return this;
  };
  _.focus = function() {
    _super.focus.call(this);

    var textblock = this.parent;
    if (textblock[R].ctrlSeq === textblock.ctrlSeq) { //TODO: seems like there should be a better way to move MathElements around
      var innerblock = this,
        cursor = textblock.cursor,
        rightward = textblock[R].ends[L];

      rightward.eachChild(function(child){
        child.parent = innerblock;
        child.jQ.appendTo(innerblock.jQ);
      });

      if (this.ends[R])
        this.ends[R][R] = rightward.ends[L];
      else
        this.ends[L] = rightward.ends[L];

      rightward.ends[L][L] = this.ends[R];
      this.ends[R] = rightward.ends[R];

      rightward.parent.remove();

      if (cursor[L])
        cursor.insRightOf(cursor[L]);
      else
        cursor.insAtLeftEnd(this);

      cursor.parent.bubble('redraw');
    }
    else if (textblock[L].ctrlSeq === textblock.ctrlSeq) {
      var cursor = textblock.cursor;
      if (cursor[L])
        textblock[L].ends[L].focus();
      else
        cursor.insAtRightEnd(textblock[L].ends[L]);
    }
    return this;
  };
});


function makeTextBlock(latex, tagName, attrs) {
  return P(TextBlock, {
    ctrlSeq: latex,
    htmlTemplate: '<'+tagName+' '+attrs+'>&0</'+tagName+'>'
  });
}

LatexCmds.em = LatexCmds.italic = LatexCmds.italics =
LatexCmds.emph = LatexCmds.textit = LatexCmds.textsl =
  makeTextBlock('\\textit', 'i', 'class="text"');
LatexCmds.strong = LatexCmds.bold = LatexCmds.textbf =
  makeTextBlock('\\textbf', 'b', 'class="text"');
LatexCmds.sf = LatexCmds.textsf =
  makeTextBlock('\\textsf', 'span', 'class="sans-serif text"');
LatexCmds.tt = LatexCmds.texttt =
  makeTextBlock('\\texttt', 'span', 'class="monospace text"');
LatexCmds.textsc =
  makeTextBlock('\\textsc', 'span', 'style="font-variant:small-caps" class="text"');
LatexCmds.uppercase =
  makeTextBlock('\\uppercase', 'span', 'style="text-transform:uppercase" class="text"');
LatexCmds.lowercase =
  makeTextBlock('\\lowercase', 'span', 'style="text-transform:lowercase" class="text"');

// input box to type a variety of LaTeX commands beginning with a backslash
var LatexCommandInput =
CharCmds['\\'] = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\';
  _.replaces = function(replacedFragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function() { return false; };
  };
  _.htmlTemplate = '<span class="latex-command-input non-leaf">\\<span>&0</span></span>';
  _.textTemplate = ['\\'];
  _.createBlocks = function() {
    _super.createBlocks.call(this);
    this.ends[L].focus = function() {
      this.parent.jQ.addClass('hasCursor');
      if (this.isEmpty())
        this.parent.jQ.removeClass('empty');

      return this;
    };
    this.ends[L].blur = function() {
      this.parent.jQ.removeClass('hasCursor');
      if (this.isEmpty())
        this.parent.jQ.addClass('empty');

      return this;
    };
  };
  _.createLeftOf = function(cursor) {
    _super.createLeftOf.call(this, cursor);

    this.cursor = cursor.insAtRightEnd(this.ends[L]);
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

    this.ends[L].write = function(cursor, ch, replacedFragment) {
      if (replacedFragment) replacedFragment.remove();

      if (ch.match(/[a-z]/i)) VanillaSymbol(ch).createLeftOf(cursor);
      else {
        this.parent.renderCommand();
        if (ch !== '\\' || !this.isEmpty()) this.parent.parent.write(cursor, ch);
      }
    };
  };
  _.latex = function() {
    return '\\' + this.ends[L].latex() + ' ';
  };
  _.onKey = function(key, e) {
    if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
      this.renderCommand();
      e.preventDefault();
      return false;
    }
  };
  _.renderCommand = function() {
    this.jQ = this.jQ.last();
    this.remove();
    if (this[R]) {
      this.cursor.insLeftOf(this[R]);
    } else {
      this.cursor.insAtRightEnd(this.parent);
    }

    var latex = this.ends[L].latex(), cmd;
    if (!latex) latex = 'backslash';
    this.cursor.insertCmd(latex, this._replacedFragment);
  };
});

var Binomial =
LatexCmds.binom =
LatexCmds.binomial = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\binom';
  _.htmlTemplate =
      '<span class="paren scaled">(</span>'
    + '<span class="non-leaf">'
    +   '<span class="array non-leaf">'
    +     '<span>&0</span>'
    +     '<span>&1</span>'
    +   '</span>'
    + '</span>'
    + '<span class="paren scaled">)</span>'
  ;
  _.textTemplate = ['choose(',',',')'];
  _.redraw = function() {
    var blockjQ = this.jQ.eq(1);

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    var parens = this.jQ.filter('.paren');
    scale(parens, min(1 + .2*(height - 1), 1.2), 1.05*height);
  };
});

var Choose =
LatexCmds.choose = P(Binomial, function(_) {
  _.createLeftOf = LiveFraction.prototype.createLeftOf;
});

var Vector =
LatexCmds.vector = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\vector';
  _.htmlTemplate = '<span class="array"><span>&0</span></span>';
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
  };
  _.createLeftOf = function(cursor) {
    _super.createLeftOf.call(this, this.cursor = cursor);
  };
  _.onKey = function(key, e) {
    var currentBlock = this.cursor.parent;

    if (currentBlock.parent === this) {
      if (key === 'Enter') { //enter
        var newBlock = MathBlock();
        newBlock.parent = this;
        newBlock.jQ = $('<span></span>')
          .attr(mqBlockId, newBlock.id)
          .insertAfter(currentBlock.jQ);
        if (currentBlock[R])
          currentBlock[R][L] = newBlock;
        else
          this.ends[R] = newBlock;

        newBlock[R] = currentBlock[R];
        currentBlock[R] = newBlock;
        newBlock[L] = currentBlock;
        this.bubble('redraw').cursor.insAtRightEnd(newBlock);

        e.preventDefault();
        return false;
      }
      else if (key === 'Tab' && !currentBlock[R]) {
        if (currentBlock.isEmpty()) {
          if (currentBlock[L]) {
            this.cursor.insRightOf(this);
            delete currentBlock[L][R];
            this.ends[R] = currentBlock[L];
            currentBlock.jQ.remove();
            this.bubble('redraw');

            e.preventDefault();
            return false;
          }
          else
            return;
        }

        var newBlock = MathBlock();
        newBlock.parent = this;
        newBlock.jQ = $('<span></span>').attr(mqBlockId, newBlock.id).appendTo(this.jQ);
        this.ends[R] = newBlock;
        currentBlock[R] = newBlock;
        newBlock[L] = currentBlock;
        this.bubble('redraw').cursor.insAtRightEnd(newBlock);

        e.preventDefault();
        return false;
      }
      else if (e.which === 8) { //backspace
        if (currentBlock.isEmpty()) {
          if (currentBlock[L]) {
            this.cursor.insAtRightEnd(currentBlock[L])
            currentBlock[L][R] = currentBlock[R];
          }
          else {
            this.cursor.insLeftOf(this);
            this.ends[L] = currentBlock[R];
          }

          if (currentBlock[R])
            currentBlock[R][L] = currentBlock[L];
          else
            this.ends[R] = currentBlock[L];

          currentBlock.jQ.remove();
          if (this.isEmpty())
            this.cursor.deleteForward();
          else
            this.bubble('redraw');

          e.preventDefault();
          return false;
        }
        else if (!this.cursor[L]) {
          e.preventDefault();
          return false;
        }
      }
    }
  };
});

LatexCmds.editable = P(RootMathCommand, function(_, _super) {
  _.init = function() {
    MathCommand.prototype.init.call(this, '\\editable');
  };

  _.jQadd = function() {
    var self = this;
    // FIXME: this entire method is a giant hack to get around
    // having to call createBlocks, and createRoot expecting to
    // render the contents' LaTeX. Both need to be refactored.
    _super.jQadd.apply(self, arguments);
    var block = self.ends[L].disown();
    var blockjQ = self.jQ.children().detach();

    self.ends[L] =
    self.ends[R] =
      RootMathBlock();

    self.blocks = [ self.ends[L] ];

    self.ends[L].parent = self;

    createRoot(self.jQ, self.ends[L], false, true);
    self.cursor = self.ends[L].cursor;

    block.children().adopt(self.ends[L], 0, 0);
    blockjQ.appendTo(self.ends[L].jQ);

    self.ends[L].cursor.insAtRightEnd(self.ends[L]);
  };

  _.latex = function(){ return this.ends[L].latex(); };
  _.text = function(){ return this.ends[L].text(); };
});
