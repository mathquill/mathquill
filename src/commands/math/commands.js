/***************************
 * Commands and Operators.
 **************************/

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
    if (!jQ.hasClass('mq-matrixed-container')) {
      jQ.addClass('mq-matrixed-container')
      .wrapInner('<span class="mq-matrixed"></span>');
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

var Style = P(MathCommand, function(_, super_) {
  _.init = function(ctrlSeq, tagName, attrs) {
    super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'>&0</'+tagName+'>');
  };
});

//fonts
LatexCmds.mathrm = bind(Style, '\\mathrm', 'span', 'class="mq-roman mq-font"');
LatexCmds.mathit = bind(Style, '\\mathit', 'i', 'class="mq-font"');
LatexCmds.mathbf = bind(Style, '\\mathbf', 'b', 'class="mq-font"');
LatexCmds.mathsf = bind(Style, '\\mathsf', 'span', 'class="mq-sans-serif mq-font"');
LatexCmds.mathtt = bind(Style, '\\mathtt', 'span', 'class="mq-monospace mq-font"');
//text-decoration
LatexCmds.underline = bind(Style, '\\underline', 'span', 'class="mq-non-leaf mq-underline"');
LatexCmds.overline = LatexCmds.bar = bind(Style, '\\overline', 'span', 'class="mq-non-leaf mq-overline"');
LatexCmds.overrightarrow = bind(Style, '\\overrightarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-right"');
LatexCmds.overleftarrow = bind(Style, '\\overleftarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-left"');
LatexCmds.overleftrightarrow = bind(Style, '\\overleftrightarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-both"');
LatexCmds.overarc = bind(Style, '\\overarc', 'span', 'class="mq-non-leaf mq-overarc"');
LatexCmds.dot = P(MathCommand, function(_, super_) {
    _.init = function() {
        super_.init.call(this, '\\dot', '<span class="mq-non-leaf"><span class="mq-dot-recurring-inner">'
            + '<span class="mq-dot-recurring">&#x2d9;</span>'
            + '<span class="mq-empty-box">&0</span>'
            + '</span></span>'
        );
    };
});

// `\textcolor{color}{math}` will apply a color to the given math content, where
// `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
// [Mozilla docs][], or [W3C spec][]).
//
// [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
// [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
// [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
var TextColor = LatexCmds.textcolor = P(MathCommand, function(_, super_) {
  _.setColor = function(color) {
    this.color = color;
    this.htmlTemplate =
      '<span class="mq-textcolor" style="color:' + color + '">&0</span>';
  };
  _.latex = function() {
    return '\\textcolor{' + this.color + '}{' + this.blocks[0].latex() + '}';
  };
  _.parser = function() {
    var self = this;
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;
    var regex = Parser.regex;

    return optWhitespace
      .then(string('{'))
      .then(regex(/^[#\w\s.,()%-]*/))
      .skip(string('}'))
      .then(function(color) {
        self.setColor(color);
        return super_.parser.call(self);
      })
    ;
  };
  _.isStyleBlock = function() {
    return true;
  };
});

// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = LatexCmds['class'] = P(MathCommand, function(_, super_) {
  _.parser = function() {
    var self = this, string = Parser.string, regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then(function(cls) {
        self.cls = cls || '';
        self.htmlTemplate = '<span class="mq-class '+cls+'">&0</span>';
        return super_.parser.call(self);
      })
    ;
  };
  _.latex = function() {
    return '\\class{' + this.cls + '}{' + this.blocks[0].latex() + '}';
  };
  _.isStyleBlock = function() {
    return true;
  };
});

var SupSub = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '_{...}^{...}';
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment && !cursor[L] && cursor.options.supSubsRequireOperand) return;
    return super_.createLeftOf.apply(this, arguments);
  };
  _.contactWeld = function(cursor) {
    // Look on either side for a SupSub, if one is found compare my
    // .sub, .sup with its .sub, .sup. If I have one that it doesn't,
    // then call .addBlock() on it with my block; if I have one that
    // it also has, then insert my block's children into its block,
    // unless my block has none, in which case insert the cursor into
    // its block (and not mine, I'm about to remove myself) in the case
    // I was just typed.
    // TODO: simplify

    // equiv. to [L, R].forEach(function(dir) { ... });
    for (var dir = L; dir; dir = (dir === L ? R : false)) {
      if (this[dir] instanceof SupSub) {
        // equiv. to 'sub sup'.split(' ').forEach(function(supsub) { ... });
        for (var supsub = 'sub'; supsub; supsub = (supsub === 'sub' ? 'sup' : false)) {
          var src = this[supsub], dest = this[dir][supsub];
          if (!src) continue;
          if (!dest) this[dir].addBlock(src.disown());
          else if (!src.isEmpty()) { // ins src children at -dir end of dest
            src.jQ.children().insAtDirEnd(-dir, dest.jQ);
            var children = src.children().disown();
            var pt = Point(dest, children.ends[R], dest.ends[L]);
            if (dir === L) children.adopt(dest, dest.ends[R], 0);
            else children.adopt(dest, 0, dest.ends[L]);
          }
          else var pt = Point(dest, 0, dest.ends[L]);
          this.placeCursor = (function(dest, src) { // TODO: don't monkey-patch
            return function(cursor) { cursor.insAtDirEnd(-dir, dest || src); };
          }(dest, src));
        }
        this.remove();
        if (cursor && cursor[L] === this) {
          if (dir === R && pt) {
            pt[L] ? cursor.insRightOf(pt[L]) : cursor.insAtLeftEnd(pt.parent);
          }
          else cursor.insRightOf(this[dir]);
        }
        break;
      }
    }
  };
  Options.p.charsThatBreakOutOfSupSub = '';
  _.finalizeTree = function() {
    this.ends[L].write = function(cursor, ch) {
      if (cursor.options.autoSubscriptNumerals && this === this.parent.sub) {
        if (ch === '_') return;
        var cmd = this.chToCmd(ch, cursor.options);
        if (cmd instanceof Symbol) cursor.deleteSelection();
        else cursor.clearSelection().insRightOf(this.parent);
        return cmd.createLeftOf(cursor.show());
      }
      if (cursor[L] && !cursor[R] && !cursor.selection
          && cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1) {
        cursor.insRightOf(this.parent);
      }
      MathBlock.p.write.apply(this, arguments);
    };
  };
  _.moveTowards = function(dir, cursor, updown) {
    if (cursor.options.autoSubscriptNumerals && !this.sup) {
      cursor.insDirOf(dir, this);
    }
    else super_.moveTowards.apply(this, arguments);
  };
  _.deleteTowards = function(dir, cursor) {
    if (cursor.options.autoSubscriptNumerals && this.sub) {
      var cmd = this.sub.ends[-dir];
      if (cmd instanceof Symbol) cmd.remove();
      else if (cmd) cmd.deleteTowards(dir, cursor.insAtDirEnd(-dir, this.sub));

      // TODO: factor out a .removeBlock() or something
      if (this.sub.isEmpty()) {
        this.sub.deleteOutOf(L, cursor.insAtLeftEnd(this.sub));
        if (this.sup) cursor.insDirOf(-dir, this);
        // Note `-dir` because in e.g. x_1^2| want backspacing (leftward)
        // to delete the 1 but to end up rightward of x^2; with non-negated
        // `dir` (try it), the cursor appears to have gone "through" the ^2.
      }
    }
    else super_.deleteTowards.apply(this, arguments);
  };
  _.latex = function() {
    function latex(prefix, block) {
      var l = block && block.latex();
      return block ? prefix + (l.length === 1 ? l : '{' + (l || ' ') + '}') : '';
    }
    return latex('_', this.sub) + latex('^', this.sup);
  };
  _.addBlock = function(block) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = this.sub.upOutOf = block;
      block.adopt(this, this.sub, 0).downOutOf = this.sub;
      block.jQ = $('<span class="mq-sup"/>').append(block.jQ.children())
        .attr(mqBlockId, block.id).prependTo(this.jQ);
    }
    else {
      this.sub = this.downInto = this.sup.downOutOf = block;
      block.adopt(this, 0, this.sup).upOutOf = this.sup;
      block.jQ = $('<span class="mq-sub"></span>').append(block.jQ.children())
        .attr(mqBlockId, block.id).appendTo(this.jQ.removeClass('mq-sup-only'));
      this.jQ.append('<span style="display:inline-block;width:0">&#8203;</span>');
    }
    // like 'sub sup'.split(' ').forEach(function(supsub) { ... });
    for (var i = 0; i < 2; i += 1) (function(cmd, supsub, oppositeSupsub, updown) {
      cmd[supsub].deleteOutOf = function(dir, cursor) {
        cursor.insDirOf((this[dir] ? -dir : dir), this.parent);
        if (!this.isEmpty()) {
          var end = this.ends[dir];
          this.children().disown()
            .withDirAdopt(dir, cursor.parent, cursor[dir], cursor[-dir])
            .jQ.insDirOf(-dir, cursor.jQ);
          cursor[-dir] = end;
        }
        cmd.supsub = oppositeSupsub;
        delete cmd[supsub];
        delete cmd[updown+'Into'];
        cmd[oppositeSupsub][updown+'OutOf'] = insLeftOfMeUnlessAtEnd;
        delete cmd[oppositeSupsub].deleteOutOf;
        if (supsub === 'sub') $(cmd.jQ.addClass('mq-sup-only')[0].lastChild).remove();
        this.remove();
      };
    }(this, 'sub sup'.split(' ')[i], 'sup sub'.split(' ')[i], 'down up'.split(' ')[i]));
  };
});

function insLeftOfMeUnlessAtEnd(cursor) {
  // cursor.insLeftOf(cmd), unless cursor at the end of block, and every
  // ancestor cmd is at the end of every ancestor block
  var cmd = this.parent, ancestorCmd = cursor;
  do {
    if (ancestorCmd[R]) return cursor.insLeftOf(cmd);
    ancestorCmd = ancestorCmd.parent.parent;
  } while (ancestorCmd !== cmd);
  cursor.insRightOf(cmd);
}

LatexCmds.subscript =
LatexCmds._ = P(SupSub, function(_, super_) {
  _.supsub = 'sub';
  _.htmlTemplate =
      '<span class="mq-supsub mq-non-leaf">'
    +   '<span class="mq-sub">&0</span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  ;
  _.textTemplate = [ '_' ];
  _.finalizeTree = function() {
    this.downInto = this.sub = this.ends[L];
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
    super_.finalizeTree.call(this);
  };
});

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = P(SupSub, function(_, super_) {
  _.supsub = 'sup';
  _.htmlTemplate =
      '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +   '<span class="mq-sup">&0</span>'
    + '</span>'
  ;
  _.textTemplate = [ '^' ];
  _.finalizeTree = function() {
    this.upInto = this.sup = this.ends[R];
    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
    super_.finalizeTree.call(this);
  };
  _.reflow = function() {
     var $block = this.jQ;//mq-supsub

     var h = $block.prev().innerHeight() ;
     h *= 0.6 ;

     $block.css( 'vertical-align',  h + 'px' ) ;

  } ;
});

var SummationNotation = P(MathCommand, function(_, super_) {
  _.init = function(ch, html) {
    var htmlTemplate =
      '<span class="mq-large-operator mq-non-leaf">'
    +   '<span class="mq-to"><span>&1</span></span>'
    +   '<big>'+html+'</big>'
    +   '<span class="mq-from"><span>&0</span></span>'
    + '</span>'
    ;
    Symbol.prototype.init.call(this, ch, htmlTemplate);
  };
  _.createLeftOf = function(cursor) {
    super_.createLeftOf.apply(this, arguments);
    if (cursor.options.sumStartsWithNEquals) {
      Letter('n').createLeftOf(cursor);
      Equality().createLeftOf(cursor);
    }
  };
  _.latex = function() {
    function simplify(latex) {
      return latex.length === 1 ? latex : '{' + (latex || ' ') + '}';
    }
    return this.ctrlSeq + '_' + simplify(this.ends[L].latex()) +
      '^' + simplify(this.ends[R].latex());
  };
  _.parser = function() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    var blocks = self.blocks = [ MathBlock(), MathBlock() ];
    for (var i = 0; i < blocks.length; i += 1) {
      blocks[i].adopt(self, self.ends[R], 0);
    }

    return optWhitespace.then(string('_').or(string('^'))).then(function(supOrSub) {
      var child = blocks[supOrSub === '_' ? 0 : 1];
      return block.then(function(block) {
        block.children().adopt(child, child.ends[R], 0);
        return succeed(self);
      });
    }).many().result(self);
  };
  _.finalizeTree = function() {
    this.downInto = this.ends[L];
    this.upInto = this.ends[R];
    this.ends[L].upOutOf = this.ends[R];
    this.ends[R].downOutOf = this.ends[L];
  };
});

LatexCmds['∑'] =
LatexCmds.sum =
LatexCmds.summation = bind(SummationNotation,'\\sum ','&sum;');

LatexCmds['∏'] =
LatexCmds.prod =
LatexCmds.product = bind(SummationNotation,'\\prod ','&prod;');

LatexCmds.coprod =
LatexCmds.coproduct = bind(SummationNotation,'\\coprod ','&#8720;');

LatexCmds['∫'] =
LatexCmds['int'] =
LatexCmds.integral = P(SummationNotation, function(_, super_) {
  _.init = function() {
    var htmlTemplate =
      '<span class="mq-int mq-non-leaf">'
    +   '<big>&int;</big>'
    +   '<span class="mq-supsub mq-non-leaf">'
    +     '<span class="mq-sup"><span class="mq-sup-inner">&1</span></span>'
    +     '<span class="mq-sub">&0</span>'
    +     '<span style="display:inline-block;width:0">&#8203</span>'
    +   '</span>'
    + '</span>'
    ;
    Symbol.prototype.init.call(this, '\\int ', htmlTemplate);
  };
  // FIXME: refactor rather than overriding
  _.createLeftOf = MathCommand.p.createLeftOf;
});

var Fraction =
LatexCmds.frac =
LatexCmds.dfrac =
LatexCmds.cfrac =
LatexCmds.fraction = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\frac';
  _.htmlTemplate =
      '<span class="mq-fraction mq-non-leaf">'
    +   '<span class="mq-numerator">&0</span>'
    +   '<span class="mq-denominator">&1</span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  ;
  _.textTemplate = ['(', ')/(', ')'];
  _.finalizeTree = function() {
    this.upInto = this.ends[R].upOutOf = this.ends[L];
    this.downInto = this.ends[L].downOutOf = this.ends[R];
  };
});

var LiveFraction =
LatexCmds.over =
CharCmds['/'] = P(Fraction, function(_, super_) {
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment) {
      var leftward = cursor[L];
      while (leftward &&
        !(
          leftward instanceof BinaryOperator ||
          leftward instanceof (LatexCmds.text || noop) ||
          leftward instanceof SummationNotation ||
          leftward.ctrlSeq === '\\ ' ||
          /^[,;:]$/.test(leftward.ctrlSeq)
        ) //lookbehind for operator
      ) leftward = leftward[L];

      if (leftward instanceof SummationNotation && leftward[R] instanceof SupSub) {
        leftward = leftward[R];
        if (leftward[R] instanceof SupSub && leftward[R].ctrlSeq != leftward.ctrlSeq)
          leftward = leftward[R];
      }

      if (leftward !== cursor[L]) {
        this.replaces(Fragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
        cursor[L] = leftward;
      }
    }
    super_.createLeftOf.call(this, cursor);
  };
});

var SquareRoot =
LatexCmds.sqrt =
LatexCmds['√'] = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\sqrt';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-scaled mq-sqrt-prefix">&radic;</span>'
    +   '<span class="mq-non-leaf mq-sqrt-stem">&0</span>'
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
    }).or(super_.parser.call(this));
  };
  _.reflow = function() {
    var block = this.ends[R].jQ;
    scale(block.prev(), 1, block.innerHeight()/+block.css('fontSize').slice(0,-2) - .1);
  };
});

var Hat = LatexCmds.hat = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\hat';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-hat-prefix">^</span>'
    +   '<span class="mq-hat-stem">&0</span>'
    + '</span>'
  ;
  _.textTemplate = ['hat(', ')'];
});

var NthRoot =
LatexCmds.nthroot = P(SquareRoot, function(_, super_) {
  _.htmlTemplate =
      '<sup class="mq-nthroot mq-non-leaf">&0</sup>'
    + '<span class="mq-scaled">'
    +   '<span class="mq-sqrt-prefix mq-scaled">&radic;</span>'
    +   '<span class="mq-sqrt-stem mq-non-leaf">&1</span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt[', '](', ')'];
  _.latex = function() {
    return '\\sqrt['+this.ends[L].latex()+']{'+this.ends[R].latex()+'}';
  };
});

var DiacriticAbove = P(MathCommand, function(_, super_) {
  _.init = function(ctrlSeq, symbol, textTemplate) {
    var htmlTemplate =
      '<span class="mq-non-leaf">'
      +   '<span class="mq-diacritic-above">'+symbol+'</span>'
      +   '<span class="mq-diacritic-stem">&0</span>'
      + '</span>'
    ;

    super_.init.call(this, ctrlSeq, htmlTemplate, textTemplate);
  };
});
LatexCmds.vec = bind(DiacriticAbove, '\\vec', '&rarr;', ['vec(', ')']);
LatexCmds.tilde = bind(DiacriticAbove, '\\tilde', '~', ['tilde(', ')']);

function DelimsMixin(_, super_) {
  _.jQadd = function() {
    super_.jQadd.apply(this, arguments);
    this.delimjQs = this.jQ.children(':first').add(this.jQ.children(':last'));
    this.contentjQ = this.jQ.children(':eq(1)');
  };
  _.reflow = function() {
    var height = this.contentjQ.outerHeight()
                 / parseFloat(this.contentjQ.css('fontSize'));
    scale(this.delimjQs, min(1 + .2*(height - 1), 1.2), 1.2*height);
  };
}

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
var Bracket = P(P(MathCommand, DelimsMixin), function(_, super_) {
  _.init = function(side, open, close, ctrlSeq, end) {
    super_.init.call(this, '\\left'+ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {};
    this.sides[L] = { ch: open, ctrlSeq: ctrlSeq };
    this.sides[R] = { ch: close, ctrlSeq: end };
  };
  _.numBlocks = function() { return 1; };
  _.html = function() { // wait until now so that .side may
    this.htmlTemplate = // be set by createLeftOf or parser
        '<span class="mq-non-leaf">'
      +   '<span class="mq-scaled mq-paren'+(this.side === R ? ' mq-ghost' : '')+'">'
      +     this.sides[L].ch
      +   '</span>'
      +   '<span class="mq-non-leaf">&0</span>'
      +   '<span class="mq-scaled mq-paren'+(this.side === L ? ' mq-ghost' : '')+'">'
      +     this.sides[R].ch
      +   '</span>'
      + '</span>'
    ;
    return super_.html.call(this);
  };
  _.latex = function() {
    return '\\left'+this.sides[L].ctrlSeq+this.ends[L].latex()+'\\right'+this.sides[R].ctrlSeq;
  };
  _.matchBrack = function(opts, expectedSide, node) {
    // return node iff it's a matching 1-sided bracket of expected side (if any)
    return node instanceof Bracket && node.side && node.side !== -expectedSide
      && (!opts.restrictMismatchedBrackets
        || OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch
        || { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) && node;
  };
  _.closeOpposing = function(brack) {
    brack.side = 0;
    brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
    brack.delimjQs.eq(this.side === L ? 0 : 1) // mismatched, like [a, b))
      .removeClass('mq-ghost').html(this.sides[this.side].ch);
  };
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment) { // unless wrapping seln in brackets,
        // check if next to or inside an opposing one-sided bracket
      var opts = cursor.options;
      if (this.sides[L].ch === '|') { // check both sides if I'm a pipe
        var brack = this.matchBrack(opts, R, cursor[R])
                 || this.matchBrack(opts, L, cursor[L])
                 || this.matchBrack(opts, 0, cursor.parent.parent);
      }
      else {
        var brack = this.matchBrack(opts, -this.side, cursor[-this.side])
                 || this.matchBrack(opts, -this.side, cursor.parent.parent);
      }
    }
    if (brack) {
      var side = this.side = -brack.side; // may be pipe with .side not yet set
      this.closeOpposing(brack);
      if (brack === cursor.parent.parent && cursor[side]) { // move the stuff between
        Fragment(cursor[side], cursor.parent.ends[side], -side) // me and ghost outside
          .disown().withDirAdopt(-side, brack.parent, brack, brack[side])
          .jQ.insDirOf(side, brack.jQ);
      }
      brack.bubble('reflow');
    }
    else {
      brack = this, side = brack.side;
      if (brack.replacedFragment) brack.side = 0; // wrapping seln, don't be one-sided
      else if (cursor[-side]) { // elsewise, auto-expand so ghost is at far end
        brack.replaces(Fragment(cursor[-side], cursor.parent.ends[-side], side));
        cursor[-side] = 0;
      }
      super_.createLeftOf.call(brack, cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.ends[L]);
    else cursor.insRightOf(brack);
  };
  _.placeCursor = noop;
  _.unwrap = function() {
    this.ends[L].children().disown().adopt(this.parent, this, this[R])
      .jQ.insertAfter(this.jQ);
    this.remove();
  };
  _.deleteSide = function(side, outward, cursor) {
    var parent = this.parent, sib = this[side], farEnd = parent.ends[side];

    if (side === this.side) { // deleting non-ghost of one-sided bracket, unwrap
      this.unwrap();
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
      return;
    }

    var opts = cursor.options, wasSolid = !this.side;
    this.side = -side;
    // if deleting like, outer close-brace of [(1+2)+3} where inner open-paren
    if (this.matchBrack(opts, side, this.ends[L].ends[this.side])) { // is ghost,
      this.closeOpposing(this.ends[L].ends[this.side]); // then become [1+2)+3
      var origEnd = this.ends[L].ends[side];
      this.unwrap();
      if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
    }
    else { // if deleting like, inner close-brace of ([1+2}+3) where outer
      if (this.matchBrack(opts, side, this.parent.parent)) { // open-paren is
        this.parent.parent.closeOpposing(this); // ghost, then become [1+2+3)
        this.parent.parent.unwrap();
      } // else if deleting outward from a solid pair, unwrap
      else if (outward && wasSolid) {
        this.unwrap();
        sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
        return;
      }
      else { // else deleting just one of a pair of brackets, become one-sided
        this.sides[side] = { ch: OPP_BRACKS[this.sides[this.side].ch],
                             ctrlSeq: OPP_BRACKS[this.sides[this.side].ctrlSeq] };
        this.delimjQs.removeClass('mq-ghost')
          .eq(side === L ? 0 : 1).addClass('mq-ghost').html(this.sides[side].ch);
      }
      if (sib) { // auto-expand so ghost is at far end
        var origEnd = this.ends[L].ends[side];
        Fragment(sib, farEnd, -side).disown()
          .withDirAdopt(-side, this.ends[L], origEnd, 0)
          .jQ.insAtDirEnd(side, this.ends[L].jQ.removeClass('mq-empty'));
        if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side, sib);
      } // didn't auto-expand, cursor goes just outside or just inside parens
      else (outward ? cursor.insDirOf(side, this)
                    : cursor.insAtDirEnd(side, this.ends[L]));
    }
  };
  _.deleteTowards = function(dir, cursor) {
    this.deleteSide(-dir, false, cursor);
  };
  _.finalizeTree = function() {
    this.ends[L].deleteOutOf = function(dir, cursor) {
      this.parent.deleteSide(dir, true, cursor);
    };
    // FIXME HACK: after initial creation/insertion, finalizeTree would only be
    // called if the paren is selected and replaced, e.g. by LiveFraction
    this.finalizeTree = this.intentionalBlur = function() {
      this.delimjQs.eq(this.side === L ? 1 : 0).removeClass('mq-ghost');
      this.side = 0;
    };
  };
  _.siblingCreated = function(opts, dir) { // if something typed between ghost and far
    if (dir === -this.side) this.finalizeTree(); // end of its block, solidify
  };
});

var OPP_BRACKS = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '\\{': '\\}',
  '\\}': '\\{',
  '&lang;': '&rang;',
  '&rang;': '&lang;',
  '\\langle ': '\\rangle ',
  '\\rangle ': '\\langle ',
  '|': '|',
  '\\lVert ' : '\\rVert ',
  '\\rVert ' : '\\lVert ',
};

function bindCharBracketPair(open, ctrlSeq) {
  var ctrlSeq = ctrlSeq || open, close = OPP_BRACKS[open], end = OPP_BRACKS[ctrlSeq];
  CharCmds[open] = bind(Bracket, L, open, close, ctrlSeq, end);
  CharCmds[close] = bind(Bracket, R, open, close, ctrlSeq, end);
}
bindCharBracketPair('(');
bindCharBracketPair('[');
bindCharBracketPair('{', '\\{');
LatexCmds.langle = bind(Bracket, L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = bind(Bracket, R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = bind(Bracket, L, '|', '|', '|', '|');
LatexCmds.lVert = bind(Bracket, L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.rVert = bind(Bracket, R, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');

LatexCmds.left = P(MathCommand, function(_) {
  _.parser = function() {
    var regex = Parser.regex;
    var string = Parser.string;
    var succeed = Parser.succeed;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{|\\langle\b|\\lVert\b)/))
      .then(function(ctrlSeq) {
        var open = (ctrlSeq.charAt(0) === '\\' ? ctrlSeq.slice(1) : ctrlSeq);
	if (ctrlSeq=="\\langle") { open = '&lang;'; ctrlSeq = ctrlSeq + ' '; }
	if (ctrlSeq=="\\lVert") { open = '&#8741;'; ctrlSeq = ctrlSeq + ' '; }
        return latexMathParser.then(function (block) {
          return string('\\right').skip(optWhitespace)
            .then(regex(/^(?:[\])|]|\\\}|\\rangle\b|\\rVert\b)/)).map(function(end) {
              var close = (end.charAt(0) === '\\' ? end.slice(1) : end);
	      if (end=="\\rangle") { close = '&rang;'; end = end + ' '; }
	      if (end=="\\rVert") { close = '&#8741;'; end = end + ' '; }
              var cmd = Bracket(0, open, close, ctrlSeq, end);
              cmd.blocks = [ block ];
              block.adopt(cmd, 0, 0);
              return cmd;
            })
          ;
        });
      })
    ;
  };
});

LatexCmds.right = P(MathCommand, function(_) {
  _.parser = function() {
    return Parser.fail('unmatched \\right');
  };
});

var Binomial =
LatexCmds.binom =
LatexCmds.binomial = P(P(MathCommand, DelimsMixin), function(_, super_) {
  _.ctrlSeq = '\\binom';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-paren mq-scaled">(</span>'
    +   '<span class="mq-non-leaf">'
    +     '<span class="mq-array mq-non-leaf">'
    +       '<span>&0</span>'
    +       '<span>&1</span>'
    +     '</span>'
    +   '</span>'
    +   '<span class="mq-paren mq-scaled">)</span>'
    + '</span>'
  ;
  _.textTemplate = ['choose(',',',')'];
});

var Choose =
LatexCmds.choose = P(Binomial, function(_) {
  _.createLeftOf = LiveFraction.prototype.createLeftOf;
});

LatexCmds.editable = // backcompat with before cfd3620 on #233
LatexCmds.MathQuillMathField = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\MathQuillMathField';
  _.htmlTemplate =
      '<span class="mq-editable-field">'
    +   '<span class="mq-root-block">&0</span>'
    + '</span>'
  ;
  _.parser = function() {
    var self = this,
      string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
    return string('[').then(regex(/^[a-z][a-z0-9]*/i)).skip(string(']'))
      .map(function(name) { self.name = name; }).or(succeed())
      .then(super_.parser.call(self));
  };
  _.finalizeTree = function(options) {
    var ctrlr = Controller(this.ends[L], this.jQ, options);
    ctrlr.KIND_OF_MQ = 'MathField';
    ctrlr.editable = true;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(ctrlr.root);
    RootBlockMixin(ctrlr.root);
  };
  _.registerInnerField = function(innerFields, MathField) {
    innerFields.push(innerFields[this.name] = MathField(this.ends[L].controller));
  };
  _.latex = function(){ return this.ends[L].latex(); };
  _.text = function(){ return this.ends[L].text(); };
});

// Embed arbitrary things
// Probably the closest DOM analogue would be an iframe?
// From MathQuill's perspective, it's a Symbol, it can be
// anywhere and the cursor can go around it but never in it.
// Create by calling public API method .dropEmbedded(),
// or by calling the global public API method .registerEmbed()
// and rendering LaTeX like \embed{registeredName} (see test).
var Embed = LatexCmds.embed = P(Symbol, function(_, super_) {
  _.setOptions = function(options) {
    function noop () { return ""; }
    this.text = options.text || noop;
    this.htmlTemplate = options.htmlString || "";
    this.latex = options.latex || noop;
    return this;
  };
  _.parser = function() {
    var self = this,
      string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
    return string('{').then(regex(/^[a-z][a-z0-9]*/i)).skip(string('}'))
      .then(function(name) {
        // the chars allowed in the optional data block are arbitrary other than
        // excluding curly braces and square brackets (which'd be too confusing)
        return string('[').then(regex(/^[-\w\s]*/)).skip(string(']'))
          .or(succeed()).map(function(data) {
            return self.setOptions(EMBEDS[name](data));
          })
        ;
      })
    ;
  };
});

// LaTeX environments
// Environments are delimited by an opening \begin{} and a closing
// \end{}. Everything inside those tags will be formatted in a
// special manner depending on the environment type.
var Environments = {};

LatexCmds.begin = P(MathCommand, function(_, super_) {
  _.parser = function() {
    var string = Parser.string;
    var regex = Parser.regex;
    return string('{')
      .then(regex(/^[a-z]+/i))
      .skip(string('}'))
      .then(function (env) {
          return (Environments[env] ?
            Environments[env]().parser() :
            Parser.fail('unknown environment type: '+env)
          ).skip(string('\\end{'+env+'}'));
      })
    ;
  };
});

var Environment = P(MathCommand, function(_, super_) {
  _.template = [['\\begin{', '}'], ['\\end{', '}']];
  _.wrappers = function () {
    return [
      _.template[0].join(this.environment),
      _.template[1].join(this.environment)
    ];
  };
});

var Matrix =
Environments.matrix = P(Environment, function(_, super_) {

  var delimiters = {
    column: '&',
    row: '\\\\'
  };
  _.parentheses = {
    left: null,
    right: null
  };
  _.environment = 'matrix';

  _.reflow = function() {
    var blockjQ = this.jQ.children('table');

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    var parens = this.jQ.children('.mq-paren');
    if (parens.length) {
      scale(parens, min(1 + .2*(height - 1), 1.2), 1.05*height);
    }
  };
  _.latex = function() {
    var latex = '';
    var row;

    this.eachChild(function (cell) {
      if (typeof row !== 'undefined') {
        latex += (row !== cell.row) ?
          delimiters.row :
          delimiters.column;
      }
      row = cell.row;
      latex += cell.latex();
    });

    return this.wrappers().join(latex);
  };
  _.html = function() {
    var cells = [], trs = '', i=0, row;

    function parenHtml(paren) {
      return (paren) ?
          '<span class="mq-scaled mq-paren">'
        +   paren
        + '</span>' : '';
    }

    // Build <tr><td>.. structure from cells
    this.eachChild(function (cell) {
      if (row !== cell.row) {
        row = cell.row;
        trs += '<tr>$tds</tr>';
        cells[row] = [];
      }
      cells[row].push('<td>&'+(i++)+'</td>');
    });

    this.htmlTemplate =
        '<span class="mq-matrix mq-non-leaf">'
      +   parenHtml(this.parentheses.left)
      +   '<table class="mq-non-leaf">'
      +     trs.replace(/\$tds/g, function () {
              return cells.shift().join('');
            })
      +   '</table>'
      +   parenHtml(this.parentheses.right)
      + '</span>'
    ;

    return super_.html.call(this);
  };
  // Create default 4-cell matrix
  _.createBlocks = function() {
    this.blocks = [
      MatrixCell(0, this),
      MatrixCell(0, this),
      MatrixCell(1, this),
      MatrixCell(1, this)
    ];
  };
  _.parser = function() {
    var self = this;
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;

    return optWhitespace
    .then(string(delimiters.column)
      .or(string(delimiters.row))
      .or(latexMathParser.block))
    .many()
    .skip(optWhitespace)
    .then(function(items) {
      var blocks = [];
      var row = 0;
      self.blocks = [];

      function addCell() {
        self.blocks.push(MatrixCell(row, self, blocks));
        blocks = [];
      }

      for (var i=0; i<items.length; i+=1) {
        if (items[i] instanceof MathBlock) {
          blocks.push(items[i]);
        } else {
          addCell();
          if (items[i] === delimiters.row) row+=1;
        }
      }
      addCell();
      self.autocorrect();
      return Parser.succeed(self);
    });
  };
  // Relink all the cells after parsing
  _.finalizeTree = function() {
    var table = this.jQ.find('table');
    table.toggleClass('mq-rows-1', table.find('tr').length === 1);
    this.relink();
  };
  // Enter the matrix at the top or bottom row if updown is configured.
  _.getEntryPoint = function(dir, cursor, updown) {
    if (updown === 'up') {
      if (dir === L) {
        return this.blocks[this.rowSize - 1];
      } else {
        return this.blocks[0];
      }
    } else { // updown === 'down'
      if (dir === L) {
        return this.blocks[this.blocks.length - 1];
      } else {
        return this.blocks[this.blocks.length - this.rowSize];
      }
    }
  };
  // Exit the matrix at the first and last columns if updown is configured.
  _.atExitPoint = function(dir, cursor) {
      // Which block are we in?
      var i = this.blocks.indexOf(cursor.parent);
      if (dir === L) {
        // If we're on the left edge and moving left, we should exit.
        return i % this.rowSize === 0;
      } else {
        // If we're on the right edge and moving right, we should exit.
        return (i + 1) % this.rowSize === 0;
      }
  };
  _.moveTowards = function(dir, cursor, updown) {
    var entryPoint = updown && this.getEntryPoint(dir, cursor, updown);
    cursor.insAtDirEnd(-dir, entryPoint || this.ends[-dir]);
  };

  // Set up directional pointers between cells
  _.relink = function() {
    var blocks = this.blocks;
    var rows = [];
    var row, column, cell;

    // The row size will be used by other functions down the track.
    // Begin by assuming we're a one-row matrix, and we'll overwrite this if we find another row.
    this.rowSize = blocks.length;

    // Use a for loop rather than eachChild
    // as we're still making sure children()
    // is set up properly
    for (var i=0; i<blocks.length; i+=1) {
      cell = blocks[i];
      if (row !== cell.row) {
        if (cell.row === 1) {
          // We've just finished iterating the first row.
          this.rowSize = column;
        }
        row = cell.row;
        rows[row] = [];
        column = 0;
      }
      rows[row][column] = cell;

      // Set up horizontal linkage
      cell[R] = blocks[i+1];
      cell[L] = blocks[i-1];

      // Set up vertical linkage
      if (rows[row-1] && rows[row-1][column]) {
        cell.upOutOf = rows[row-1][column];
        rows[row-1][column].downOutOf = cell;
      }

      column+=1;
    }

    // set start and end blocks of matrix
    this.ends[L] = blocks[0];
    this.ends[R] = blocks[blocks.length-1];
  };
  // Ensure consistent row lengths
  _.autocorrect = function(rows) {
    var lengths = [], rows = [];
    var blocks = this.blocks;
    var maxLength, shortfall, position, row, i;

    for (i=0; i<blocks.length; i+=1) {
      row = blocks[i].row;
      rows[row] = rows[row] || [];
      rows[row].push(blocks[i]);
      lengths[row] = rows[row].length;
    }

    maxLength = Math.max.apply(null, lengths);
    if (maxLength !== Math.min.apply(null, lengths)) {
      // Pad shorter rows to correct length
      for (i=0; i<rows.length; i+=1) {
        shortfall = maxLength - rows[i].length;
        while (shortfall) {
          position = maxLength*i + rows[i].length;
          blocks.splice(position, 0, MatrixCell(i, this));
          shortfall-=1;
        }
      }
      this.relink();
    }
  };
  // Deleting a cell will also delete the current row and
  // column if they are empty, and relink the matrix.
  _.deleteCell = function(currentCell) {
    var rows = [], columns = [], myRow = [], myColumn = [];
    var blocks = this.blocks, row, column;

    // Create arrays for cells in the current row / column
    this.eachChild(function (cell) {
      if (row !== cell.row) {
        row = cell.row;
        rows[row] = [];
        column = 0;
      }
      columns[column] = columns[column] || [];
      columns[column].push(cell);
      rows[row].push(cell);

      if (cell === currentCell) {
        myRow = rows[row];
        myColumn = columns[column];
      }

      column+=1;
    });

    function isEmpty(cells) {
      var empties = [];
      for (var i=0; i<cells.length; i+=1) {
        if (cells[i].isEmpty()) empties.push(cells[i]);
      }
      return empties.length === cells.length;
    }

    function remove(cells) {
      for (var i=0; i<cells.length; i+=1) {
        if (blocks.indexOf(cells[i]) > -1) {
          cells[i].remove();
          blocks.splice(blocks.indexOf(cells[i]), 1);
        }
      }
    }

    if (isEmpty(myRow) && myColumn.length > 1) {
      row = rows.indexOf(myRow);
      // Decrease all following row numbers
      this.eachChild(function (cell) {
        if (cell.row > row) cell.row-=1;
      });
      // Dispose of cells and remove <tr>
      remove(myRow);
      this.jQ.find('tr').eq(row).remove();
    }
    if (isEmpty(myColumn) && myRow.length > 1) {
      remove(myColumn);
    }
    this.finalizeTree();
  };
  _.addRow = function(afterCell) {
    var previous = [], newCells = [], next = [];
    var newRow = $('<tr></tr>'), row = afterCell.row;
    var columns = 0, block, column;

    this.eachChild(function (cell) {
      // Cache previous rows
      if (cell.row <= row) {
        previous.push(cell);
      }
      // Work out how many columns
      if (cell.row === row) {
        if (cell === afterCell) column = columns;
        columns+=1;
      }
      // Cache cells after new row
      if (cell.row > row) {
        cell.row+=1;
        next.push(cell);
      }
    });

    // Add new cells, one for each column
    for (var i=0; i<columns; i+=1) {
      block = MatrixCell(row+1);
      block.parent = this;
      newCells.push(block);

      // Create cell <td>s and add to new row
      block.jQ = $('<td class="mq-empty">')
        .attr(mqBlockId, block.id)
        .appendTo(newRow);
    }

    // Insert the new row
    this.jQ.find('tr').eq(row).after(newRow);
    this.blocks = previous.concat(newCells, next);
    return newCells[column];
  };
  _.addColumn = function(afterCell) {
    var rows = [], newCells = [];
    var column, block;

    // Build rows array and find new column index
    this.eachChild(function (cell) {
      rows[cell.row] = rows[cell.row] || [];
      rows[cell.row].push(cell);
      if (cell === afterCell) column = rows[cell.row].length;
    });

    // Add new cells, one for each row
    for (var i=0; i<rows.length; i+=1) {
      block = MatrixCell(i);
      block.parent = this;
      newCells.push(block);
      rows[i].splice(column, 0, block);

      block.jQ = $('<td class="mq-empty">')
        .attr(mqBlockId, block.id);
    }

    // Add cell <td> elements in correct positions
    this.jQ.find('tr').each(function (i) {
      $(this).find('td').eq(column-1).after(rows[i][column].jQ);
    });

    // Flatten the rows array-of-arrays
    this.blocks = [].concat.apply([], rows);
    return newCells[afterCell.row];
  };
  _.insert = function(method, afterCell) {
    var cellToFocus = this[method](afterCell);
    this.cursor = this.cursor || this.parent.cursor;
    this.finalizeTree();
    this.bubble('reflow').cursor.insAtRightEnd(cellToFocus);
  };
  _.backspace = function(cell, dir, cursor, finalDeleteCallback) {
    var dirwards = cell[dir];
    if (cell.isEmpty()) {
      this.deleteCell(cell);
      while (dirwards &&
        dirwards[dir] &&
        this.blocks.indexOf(dirwards) === -1) {
          dirwards = dirwards[dir];
      }
      if (dirwards) {
        cursor.insAtDirEnd(-dir, dirwards);
      }
      if (this.blocks.length === 1 && this.blocks[0].isEmpty()) {
        finalDeleteCallback();
        this.finalizeTree();
      }
      this.bubble('edited');
    }
  };
});

Environments.pmatrix = P(Matrix, function(_, super_) {
  _.environment = 'pmatrix';
  _.parentheses = {
    left: '(',
    right: ')'
  };
});

Environments.bmatrix = P(Matrix, function(_, super_) {
  _.environment = 'bmatrix';
  _.parentheses = {
    left: '[',
    right: ']'
  };
});

Environments.Bmatrix = P(Matrix, function(_, super_) {
  _.environment = 'Bmatrix';
  _.parentheses = {
    left: '{',
    right: '}'
  };
});

Environments.vmatrix = P(Matrix, function(_, super_) {
  _.environment = 'vmatrix';
  _.parentheses = {
    left: '|',
    right: '|'
  };
});

Environments.Vmatrix = P(Matrix, function(_, super_) {
  _.environment = 'Vmatrix';
  _.parentheses = {
    left: '&#8214;',
    right: '&#8214;'
  };
});

// Replacement for mathblocks inside matrix cells
// Adds matrix-specific keyboard commands
var MatrixCell = P(MathBlock, function(_, super_) {
  _.init = function(row, parent, replaces) {
    super_.init.call(this);
    this.row = row;
    if (parent) {
      this.adopt(parent, parent.ends[R], 0);
    }
    if (replaces) {
      for (var i=0; i<replaces.length; i++) {
        replaces[i].children().adopt(this, this.ends[R], 0);
      }
    }
  };
  _.keystroke = function(key, e, ctrlr) {
    switch (key) {
    case 'Shift-Spacebar':
      e.preventDefault();
      return this.parent.insert('addColumn', this);
      break;
    case 'Shift-Enter':
    return this.parent.insert('addRow', this);
      break;
    }
    return super_.keystroke.apply(this, arguments);
  };
  _.deleteOutOf = function(dir, cursor) {
    var self = this, args = arguments;
    this.parent.backspace(this, dir, cursor, function () {
      // called when last cell gets deleted
      return super_.deleteOutOf.apply(self, args);
    });
  };
  _.moveOutOf = function(dir, cursor, updown) {
    var atExitPoint = updown && this.parent.atExitPoint(dir, cursor);
    // Step out of the matrix if we've moved past an edge column
    if (!atExitPoint && this[dir]) cursor.insAtDirEnd(-dir, this[dir]);
    else cursor.insDirOf(dir, this.parent);
  };
});
