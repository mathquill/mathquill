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
        self.htmlTemplate = '<span class="mq-class '+cls+'">&0</span>';
        return super_.parser.call(self);
      })
    ;
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
        var cmd = this.chToCmd(ch);
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
  _.oppBrack = function(opts, node, expectedSide) {
    // return node iff it's a 1-sided bracket of expected side (if any, may be
    // undefined), and of opposite side from me if I'm not a pipe
    return node instanceof Bracket && node.side && node.side !== -expectedSide
      && (this.sides[this.side].ch === '|' || node.side === -this.side)
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
        // (must check both sides 'cos I might be a pipe)
      var opts = cursor.options;
      var brack = this.oppBrack(opts, cursor[L], L)
                  || this.oppBrack(opts, cursor[R], R)
                  || this.oppBrack(opts, cursor.parent.parent);
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
    if (this.oppBrack(opts, this.ends[L].ends[this.side], side)) { // is ghost,
      this.closeOpposing(this.ends[L].ends[this.side]); // then become [1+2)+3
      var origEnd = this.ends[L].ends[side];
      this.unwrap();
      if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
    }
    else { // if deleting like, inner close-brace of ([1+2}+3) where outer
      if (this.oppBrack(opts, this.parent.parent, side)) { // open-paren is
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

// Associative table of open -> close delimiters and close -> open delimiters
var OPP_BRACKS = {};

function bindSimpleDelimiter(open, close) {
  pray("simple delimiter not a character", open.length === 1);
  CharCmds[open] = bind(Bracket, L, open, close, open, close);
  CharCmds[close] = bind(Bracket, R, open, close, open, close);
  OPP_BRACKS[open] = close;
  OPP_BRACKS[close] = open;
}

function bindDelimiter(open, close, openReplaceChar, closeReplaceChar, openCommand, closeCommand) {
  openCommand = openCommand ? openCommand : '\\' + open;
  closeCommand = closeCommand ? closeCommand : '\\' + close;
  if (open.length === 1) {
    CharCmds[open] = bind(Bracket, L, openReplaceChar, closeReplaceChar, openCommand, closeCommand);
    CharCmds[close] = bind(Bracket, R, openReplaceChar, closeReplaceChar, openCommand, closeCommand);      
  } else {
    LatexCmds[open] = bind(Bracket, L, openReplaceChar, closeReplaceChar, openCommand, closeCommand);
    LatexCmds[close] = bind(Bracket, R, openReplaceChar, closeReplaceChar, openCommand, closeCommand);
  }
  OPP_BRACKS[open] = close;
  OPP_BRACKS[close] = open;
  OPP_BRACKS[openCommand] = closeCommand;
  OPP_BRACKS[closeCommand] = openCommand;
}

function bindNonpairedDelimiter(delimiter, replaceChar, command) {
    command = command ? command : '\\' + delimiter;
    replaceChar = replaceChar ? replaceChar : delimiter;
    if (delimiter.length === 1)
    {
        CharCmds[delimiter] = bind(Bracket, L, replaceChar, replaceChar, command, command);
    } else {
        LatexCmds[delimiter] = bind(Bracket, L, replaceChar, replaceChar, command, command);
    }
  OPP_BRACKS[delimiter] = delimiter;
  OPP_BRACKS[command] = command;
}

bindSimpleDelimiter('(', ')');
bindSimpleDelimiter('[', ']');
bindDelimiter('{', '}', '{', '}', '\\{', '\\}');

/*
// bindSimpleDelimiter('&lang;', '&rang;');
bindDelimiter('\\{', '\\}', '{', '}', '\\{', '\\}');
bindDelimiter('\\opencurlybrace', '\\closecurlybrace', '{', '}', '\\{', '\\}'); // Mathquill specific

// Large delimiters
bindDelimiter('lmoustache', 'rmoustache', '&#x23b0;', '&#x23b1;');
bindDelimiter('lgroup', 'rgroup', '&#x27ee;', '&#x27ef;');

// AMS Delimiters
bindDelimiter('lbrace', 'rbrace', '&#x007b;', '&#x007d;');
bindDelimiter('lbrack', 'rbrack', '&#x005b;', '&#x005d;');
bindDelimiter('ulcorner', 'urcorner', '&#x250c;', '&#x2510;');
bindDelimiter('llcorner', 'lrcorner', '&#x2514;', '&#x2518;');
bindDelimiter('lfloor', 'rfloor', '&#x230a;', '&#x230b;');
bindDelimiter('lceil', 'rceil', '&#x2308;', '&#x2309;');
bindDelimiter('langle', 'rangle', '&#x27e8;', '&#x27e9;');
bindDelimiter('lvert', 'rvert', '&#x2223;', '&#x2223;');
bindDelimiter('lVert', 'rVert', '&#x2225;', '&#x2225;');
*/

// bindNonpairedDelimiter('vert', '&#x2223;');
// bindNonpairedDelimiter('Vert', '&#x2225;');
// bindNonpairedDelimiter('|', '|', '|');
LatexCmds.langle = bind(Bracket, L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = bind(Bracket, R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
OPP_BRACKS['\\langle'] = '\\rangle';
OPP_BRACKS['&lang;'] = '&rang;';
OPP_BRACKS['\\rangle'] = '\\langle';
OPP_BRACKS['&rang;'] = '&lang;';
CharCmds['|'] = bind(Bracket, L, '|', '|', '|', '|');
OPP_BRACKS['|'] = '|';

// ---
LatexCmds.lmoustache = bind(VanillaSymbol, '\\lmoustache ', '&#x23b0;');
LatexCmds.rmoustache = bind(VanillaSymbol, '\\rmoustache ', '&#x23b1;');
LatexCmds.lgroup = bind(VanillaSymbol, '\\lgroup ', '&#x27ee;');
LatexCmds.rgroup = bind(VanillaSymbol, '\\rgroup ', '&#x27ef;');
LatexCmds.opencurlybrace = LatexCmds.lbrace = bind(VanillaSymbol, '\\lbrace ', '&#x007b;');
LatexCmds.closecurlybrace = LatexCmds.rbrace = bind(VanillaSymbol, '\\rbrace ', '&#x007d;');
LatexCmds.lbrack = bind(VanillaSymbol, '[', '&#x005b;');
LatexCmds.rbrack = bind(VanillaSymbol, ']', '&#x005d;');
LatexCmds.ulcorner = bind(VanillaSymbol, '\\ulcorner ', '&#x250c;');
LatexCmds.urcorner = bind(VanillaSymbol, '\\urcorner ', '&#x2510;');
LatexCmds.llcorner = bind(VanillaSymbol, '\\llcorner ', '&#x2514;');
LatexCmds.lrcorner = bind(VanillaSymbol, '\\lrcorner ', '&#x2518;');
LatexCmds.lfloor = bind(VanillaSymbol, '\\lfloor ', '&#x230a;');
LatexCmds.rfloor = bind(VanillaSymbol, '\\rfloor ', '&#x230b;');
LatexCmds.lceil = bind(VanillaSymbol, '\\lceil ', '&#x2308;');
LatexCmds.rceil = bind(VanillaSymbol, '\\rceil ', '&#x2309;');
LatexCmds.langle = bind(VanillaSymbol, '\\langle ', '&#x27e8;');
LatexCmds.rangle = bind(VanillaSymbol, '\\rangle ', '&#x27e9;');
LatexCmds.lvert = bind(VanillaSymbol, '\\lvert ', '&#x2223;');
LatexCmds.rvert = bind(VanillaSymbol, '\\rvert ', '&#x2223;');
LatexCmds.lVert = bind(VanillaSymbol, '\\lVert ', '&#x2225;');
LatexCmds.rVert = bind(VanillaSymbol, '\\rVert ', '&#x2225;');

// ---

LatexCmds.left = P(MathCommand, function(_) {
  _.parser = function() {
    var regex = Parser.regex;
    var string = Parser.string;
    var succeed = Parser.succeed;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{)/))
      .then(function(ctrlSeq) { // TODO: \langle, \rangle
        var open = (ctrlSeq.charAt(0) === '\\' ? ctrlSeq.slice(1) : ctrlSeq);
        return latexMathParser.then(function (block) {
          return string('\\right').skip(optWhitespace)
            .then(regex(/^(?:[\])|]|\\\})/)).map(function(end) {
              var close = (end.charAt(0) === '\\' ? end.slice(1) : end);
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
  _.finalizeTree = function() {
    var ctrlr = Controller(this.ends[L], this.jQ, Options());
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
    var self = this;
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

var CUMULATIVE_OPERATORS = [
'prod:prod', 'sum:sum', 'coprod:#8720', 
];

for (i = 0; i < CUMULATIVE_OPERATORS.length; i++) {
    m = CUMULATIVE_OPERATORS[i].match(/([a-zA-Z]+):(.+)/);
    LatexCmds[m[1]] = bind(SummationNotation, '\\' + m[1] + ' ', '&' + m[2] +';');
}

LatexCmds.int = P(SummationNotation, function(_, super_) {
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

// TODO: These CUMULATIVE_OPERATORS_EXTENDED should probably be merged with
// CUMULATIVE_OPERATORS at some point. For now, keep them separate so we 
// can keep them as Symbol for backward compatibility
var CUMULATIVE_OPERATORS_EXTENDED = [
'intop:int', 'iint:#x222c', 'iiint:#x222d',
'oint:#x222e',
'bigvee:#x22c1', 'bigwedge:#x22c0', 'biguplus:#x2a04',
'bigcap:#x22c2', 'bigcup:#x22c3',
'bigotimes:#x2a02', 'bigoplus:#x2a01', 'bigodot:#x2a00',
'bigsqcup:#x2a06',
];
for (i = 0; i < CUMULATIVE_OPERATORS_EXTENDED.length; i++) {
    m = CUMULATIVE_OPERATORS_EXTENDED[i].match(/([a-zA-Z]+):(.+)/);
    LatexCmds[m[1]] = bind(Symbol, '\\' + m[1] + ' ', '<big>&' + m[2] +';</big>');
}




// MathQuill synonyms
LatexCmds['∑'] = LatexCmds.summation = LatexCmds.sum;
LatexCmds['∏'] = LatexCmds.product = LatexCmds.prod
LatexCmds.coproduct = LatexCmds.coprod;
LatexCmds['∫'] = LatexCmds.integral = LatexCmds.int ;