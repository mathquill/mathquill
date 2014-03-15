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

// `\textcolor{color}{math}` will apply a color to the given math content, where
// `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
// [Mozilla docs][], or [W3C spec][]).
//
// [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
// [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
// [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
var TextColor = LatexCmds.textcolor = P(MathCommand, function(_, _super) {
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
        return _super.parser.call(self);
      })
    ;
  };
});

// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = LatexCmds['class'] = P(MathCommand, function(_, _super) {
  _.parser = function() {
    var self = this, string = Parser.string, regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then(function(cls) {
        self.htmlTemplate = '<span class="mq-class '+cls+'">&0</span>';
        return _super.parser.call(self);
      })
    ;
  };
});

var SupSub = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '_{...}^{...}';
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
    this.respace();
  };
  _.latex = function() {
    function latex(prefix, block) {
      var l = block && block.latex();
      return block ? prefix + (l.length === 1 ? l : '{' + (l || ' ') + '}') : '';
    }
    return latex('_', this.sub) + latex('^', this.sup);
  };
  _.respace = _.siblingCreated = _.siblingDeleted = function(dir) {
    if (dir === R) return; // note .contactWeld() calls .respace() w/o dir argument

    if (this[L].ctrlSeq === '\\int ') {
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
    return this;
  };
  _.addBlock = function(block) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = this.sub.upOutOf = block;
      block.adopt(this, this.sub, 0).downOutOf = this.sub;
      block.jQ = $('<span class="sup"/>').append(block.jQ.children())
        .attr(mqBlockId, block.id).prependTo(this.jQ);
    }
    else {
      this.sub = this.downInto = this.sup.downOutOf = block;
      block.adopt(this, 0, this.sup).upOutOf = this.sup;
      block.jQ = $('<span class="sub"></span>').append(block.jQ.children())
        .attr(mqBlockId, block.id).appendTo(this.jQ.removeClass('sup-only'));
      this.jQ.append('<span style="display:inline-block;width:0">&nbsp;</span>');
    }
    // like 'sub sup'.split(' ').forEach(function(supsub) { ... });
    for (var i = 0; i < 2; i += 1) (function(cmd, supsub, oppositeSupsub, updown) {
      cmd[supsub].deleteOutOf = function(dir, cursor) {
        if (this.isEmpty()) {
          cmd.supsub = oppositeSupsub;
          delete cmd[supsub];
          delete cmd[updown+'Into'];
          cmd[oppositeSupsub][updown+'OutOf'] = insLeftOfMeUnlessAtEnd;
          delete cmd[oppositeSupsub].deleteOutOf;
          if (supsub === 'sub') $(cmd.jQ.addClass('sup-only')[0].lastChild).remove();
          this.moveOutOf(dir, cursor);
          this.remove();
        }
        else {
          cursor.insAtDirEnd(-dir, this);
          cursor.startSelection();
          cursor.insAtDirEnd(dir, this);
          cursor.select();
        }
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
LatexCmds._ = P(SupSub, function(_, _super) {
  _.supsub = 'sub';
  _.htmlTemplate =
      '<span class="supsub non-leaf">'
    +   '<span class="sub">&0</span>'
    +   '<span style="display:inline-block;width:0">&nbsp;</span>'
    + '</span>'
  ;
  _.textTemplate = [ '_' ];
  _.finalizeTree = function() {
    this.downInto = this.sub = this.ends[L];
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
  };
});

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = P(SupSub, function(_, _super) {
  _.supsub = 'sup';
  _.htmlTemplate =
      '<span class="supsub non-leaf sup-only">'
    +   '<span class="sup">&0</span>'
    + '</span>'
  ;
  _.textTemplate = [ '**' ];
  _.finalizeTree = function() {
    this.upInto = this.sup = this.ends[R];
    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
  };
});

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
    this.upInto = this.ends[R].upOutOf = this.ends[L];
    this.downInto = this.ends[L].downOutOf = this.ends[R];
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
      ) leftward = leftward[L];

      if (leftward instanceof BigSymbol && leftward[R] instanceof SupSub) {
        leftward = leftward[R];
        if (leftward[R] instanceof SupSub && leftward[R].ctrlSeq != leftward.ctrlSeq)
          leftward = leftward[R];
      }

      if (leftward !== cursor[L]) {
        this.replaces(Fragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
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
  _.edited = function() {
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
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
var Bracket = P(MathCommand, function(_, _super) {
  _.init = function(side, open, close, ctrlSeq, end) {
    _super.init.call(this, '\\left'+ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {};
    this.sides[L] = { ch: open, ctrlSeq: ctrlSeq };
    this.sides[R] = { ch: close, ctrlSeq: end };
  };
  _.numBlocks = function() { return 1; };
  _.html = function() { // wait until now so that .side may
    this.htmlTemplate = // be set by createLeftOf or parser
        '<span class="non-leaf">'
      +   '<span class="scaled paren'+(this.side === R ? ' ghost' : '')+'">'
      +     this.sides[L].ch
      +   '</span>'
      +   '<span class="non-leaf">&0</span>'
      +   '<span class="scaled paren'+(this.side === L ? ' ghost' : '')+'">'
      +     this.sides[R].ch
      +   '</span>'
      + '</span>'
    ;
    return _super.html.call(this);
  };
  _.jQadd = function() {
    _super.jQadd.apply(this, arguments);
    var jQ = this.jQ;
    this.bracketjQs = jQ.children(':first').add(jQ.children(':last'));
  };
  _.latex = function() {
    return '\\left'+this.sides[L].ctrlSeq+this.ends[L].latex()+'\\right'+this.sides[R].ctrlSeq;
  };
  _.edited = function() {
    var blockjQ = this.ends[L].jQ;

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    scale(this.bracketjQs, min(1 + .2*(height - 1), 1.2), 1.05*height);
  };
  _.oppBrack = function(node) {
    return node instanceof Bracket && node.side === -this.side && node;
  };
  _.closeOpposing = function(brack) {
    brack.side = 0;
    brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
    brack.bracketjQs.eq(this.side === L ? 0 : 1) // mis-matched, like [a, b))
      .removeClass('ghost').html(this.sides[this.side].ch);
  };
  _.createLeftOf = function(cursor) {
    var side = this.side; // unless wrapping seln in brackets, check if next to
    if (!this.replacedFragment) { // or inside an opposing one-sided bracket
      var brack = this.oppBrack(cursor[-side]) || this.oppBrack(cursor.parent.parent);
    }
    if (brack) {
      this.closeOpposing(brack);
      if (brack === cursor.parent.parent && cursor[side]) { // move the stuff between
        Fragment(cursor[side], cursor.parent.ends[side], -side) // me and ghost outside
          .disown().withDirAdopt(-side, brack.parent, brack, brack[side])
          .jQ.insDirOf(side, brack.jQ);
        brack.bubble('edited');
      }
    }
    else {
      brack = this;
      if (brack.replacedFragment) brack.side = 0; // wrapping seln, don't be one-sided
      else if (cursor[-side]) { // elsewise, auto-expand so ghost is at far end
        brack.replaces(Fragment(cursor[-side], cursor.parent.ends[-side], side));
        cursor[-side] = 0;
      }
      _super.createLeftOf.call(brack, cursor);
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

    this.side = -side;
    // check if like deleting outer close-brace of [(1+2)+3} where inner open-
    if (this.oppBrack(this.ends[L].ends[this.side])) { // paren is ghost, if
      this.closeOpposing(this.ends[L].ends[this.side]); // so become [1+2)+3
      var origEnd = this.ends[L].ends[side];
      this.unwrap();
      if (origEnd.siblingCreated) origEnd.siblingCreated(side);
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
    }
    else { // check if like deleting inner close-brace of ([1+2}+3) where
      if (this.oppBrack(this.parent.parent)) { // outer open-paren is ghost,
        this.parent.parent.closeOpposing(this); // if so become [1+2+3)
        this.parent.parent.unwrap();
      }
      else { // deleting one of a pair of brackets, become one-sided
        this.sides[side] = { ch: OPP_BRACKS[this.sides[this.side].ch],
                             ctrlSeq: OPP_BRACKS[this.sides[this.side].ctrlSeq] };
        this.bracketjQs.removeClass('ghost')
          .eq(side === L ? 0 : 1).addClass('ghost').html(this.sides[side].ch);
      }
      if (sib) { // auto-expand so ghost is at far end
        var origEnd = this.ends[L].ends[side];
        Fragment(sib, farEnd, -side).disown()
          .withDirAdopt(-side, this.ends[L], origEnd, 0)
          .jQ.insAtDirEnd(side, this.ends[L].jQ);
        if (origEnd.siblingCreated) origEnd.siblingCreated(side);
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
  };
  _.siblingCreated = function(dir) {
    if (dir === -this.side) { // that ghost no longer at far end of its block
      this.side = 0;
      this.bracketjQs.eq(dir === L ? 0 : 1).removeClass('ghost');
    }
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
  '|': '|'
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
    this.ends[L].write = function(cursor, ch, replacedFragment) {
      if (replacedFragment) replacedFragment.remove();

      if (ch.match(/[a-z]/i)) VanillaSymbol(ch).createLeftOf(cursor);
      else {
        this.parent.renderCommand();
        if (ch !== '\\' || !this.isEmpty()) this.parent.parent.write(cursor, ch);
      }
    };
    this.ends[L].keystroke = function(key, e, ctrlr) {
      if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
        this.parent.renderCommand(ctrlr.cursor);
        e.preventDefault();
        return;
      }
      return _super.keystroke.apply(this, arguments);
    };
  };
  _.createLeftOf = function(cursor) {
    _super.createLeftOf.call(this, cursor);

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
    return '\\' + this.ends[L].latex() + ' ';
  };
  _.renderCommand = function(cursor) {
    this.jQ = this.jQ.last();
    this.remove();
    if (this[R]) {
      cursor.insLeftOf(this[R]);
    } else {
      cursor.insAtRightEnd(this.parent);
    }

    var latex = this.ends[L].latex();
    if (!latex) latex = 'backslash';
    cursor.insertCmd(latex, this._replacedFragment);
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
  _.edited = function() {
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

var InnerMathField = P(MathQuill.MathField, function(_) {
  _.init = function(root, container) {
    RootBlockMixin(root);
    var ctrlr = this.controller = root.controller = Controller(root, container);
    ctrlr.API = this;
    ctrlr.editable = true;
    root.cursor = ctrlr.cursor.insAtRightEnd(root);
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
  };
});
LatexCmds.MathQuillMathField = P(MathCommand, function(_, _super) {
  _.ctrlSeq = '\\MathQuillMathField';
  _.htmlTemplate =
      '<span class="mathquill-editable">'
    +   '<span class="mathquill-root-block">&0</span>'
    + '</span>'
  ;
  _.finalizeTree = function() { InnerMathField(this.ends[L], this.jQ); };
  _.latex = function(){ return this.ends[L].latex(); };
  _.text = function(){ return this.ends[L].text(); };
});
