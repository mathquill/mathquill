/***************************
 * Commands and Operators.
 **************************/
var SVG_SYMBOLS = {
  'sqrt': {
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 32 54">' +
        '<path d="M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33" />' +
      '</svg>'
  },
  '|': {
    width: '.4em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
        '<path d="M4.4 0 L4.4 54 L5.6 54 L5.6 0" />' +
      '</svg>'
  },
  '[': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 11 24">' +
        '<path d="M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1" />' +
      '</svg>'
  },
  ']': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 11 24">' +
        '<path d="M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1" />' +
      '</svg>'
  },
  '(': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="3 0 106 186">' +
        '<path d="M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0" />' +
      '</svg>'
  },
  ')': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="3 0 106 186">' +
        '<path d="M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0" />' +
      '</svg>'
  },
  '{': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="10 0 210 350">' +
        '<path d="M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0" />' +
      '</svg>'
  },
  '}': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="10 0 210 350">' +
        '<path d="M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0" />' +
      '</svg>'
  },
  '&#8741;': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
        '<path d="M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0" />' +
      '</svg>'
  },
  '&lang;': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
        '<path d="M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0" />' +
      '</svg>'
  },
  '&rang;': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
        '<path d="M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0" />' +
      '</svg>'
  }
};

class Style extends MathCommand {
  constructor (ctrlSeq, tagName, attrs, ariaLabel, opts) {
    super(ctrlSeq, '<'+tagName+' '+attrs+'>&0</'+tagName+'>');
    this.ariaLabel = ariaLabel || ctrlSeq.replace(/^\\/, '');
    this.mathspeakTemplate = ['Start' + this.ariaLabel + ',', 'End' + this.ariaLabel];
    // In most cases, mathspeak should announce the start and end of style blocks.
    // There is one exception currently (mathrm).
    this.shouldNotSpeakDelimiters = opts && opts.shouldNotSpeakDelimiters;
  };
  mathspeak (opts) {
    if (
      !this.shouldNotSpeakDelimiters ||
      (opts && opts.ignoreShorthand)
    ) {
      return super.mathspeak();
    }
    return this.foldChildren('', function(speech, block) {
      return speech + ' ' + block.mathspeak(opts);
    }).trim();
  };
};

//fonts
LatexCmds.mathrm = class extends Style {
  constructor () {
    super('\\mathrm', 'span', 'class="mq-roman mq-font"', 'Roman Font', { shouldNotSpeakDelimiters: true });
  };
  isTextBlock () {
    return true;
  };
};
LatexCmds.mathit = () => new Style('\\mathit', 'i', 'class="mq-font"', 'Italic Font');
LatexCmds.mathbf = () => new Style('\\mathbf', 'b', 'class="mq-font"', 'Bold Font');
LatexCmds.mathsf = () => new Style('\\mathsf', 'span', 'class="mq-sans-serif mq-font"', 'Serif Font');
LatexCmds.mathtt = () => new Style('\\mathtt', 'span', 'class="mq-monospace mq-font"', 'Math Text');
//text-decoration
LatexCmds.underline = () => new Style('\\underline', 'span', 'class="mq-non-leaf mq-underline"', 'Underline');
LatexCmds.overline = LatexCmds.bar = () => new Style('\\overline', 'span', 'class="mq-non-leaf mq-overline"', 'Overline');
LatexCmds.overrightarrow = () => new Style('\\overrightarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-right"', 'Over Right Arrow');
LatexCmds.overleftarrow = () => new Style('\\overleftarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-left"', 'Over Left Arrow');
LatexCmds.overleftrightarrow = () => new Style('\\overleftrightarrow ', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-leftright"', 'Over Left and Right Arrow');
LatexCmds.overarc = () => new Style('\\overarc', 'span', 'class="mq-non-leaf mq-overarc"', 'Over Arc');
LatexCmds.dot = () => {
  return new MathCommand('\\dot', '<span class="mq-non-leaf"><span class="mq-dot-recurring-inner">'
            + '<span class="mq-dot-recurring">&#x2d9;</span>'
            + '<span class="mq-empty-box">&0</span>'
            + '</span></span>'
        );
};


// `\textcolor{color}{math}` will apply a color to the given math content, where
// `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
// [Mozilla docs][], or [W3C spec][]).
//
// [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
// [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
// [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
LatexCmds.textcolor = class extends MathCommand {
  setColor (color) {
    this.color = color;
    this.htmlTemplate =
      '<span class="mq-textcolor" style="color:' + color + '">&0</span>';
    this.ariaLabel = color.replace(/^\\/, '');
    this.mathspeakTemplate = ['Start ' + this.ariaLabel + ',', 'End ' + this.ariaLabel];
  };
  latex () {
    return '\\textcolor{' + this.color + '}{' + this.blocks[0].latex() + '}';
  };
  parser () {
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;
    var regex = Parser.regex;

    return optWhitespace
      .then(string('{'))
      .then(regex(/^[#\w\s.,()%-]*/))
      .skip(string('}'))
      .then((color) => {
        this.setColor(color);
        return super.parser();
      })
    ;
  };
  isStyleBlock () {
    return true;
  };
};

// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = LatexCmds['class'] = class extends MathCommand {
  parser () {
    var string = Parser.string, regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then((cls) => {
        this.cls = cls || '';
        this.htmlTemplate = '<span class="mq-class '+cls+'">&0</span>';
        this.ariaLabel = cls + ' class';
        this.mathspeakTemplate = ['Start ' + this.ariaLabel + ',', 'End ' + this.ariaLabel];
        return super.parser();
      })
    ;
  };
  latex () {
    return '\\class{' + this.cls + '}{' + this.blocks[0].latex() + '}';
  };
  isStyleBlock () {
    return true;
  };
};

// This test is used to determine whether an item may be treated as a whole number
// for shortening the verbalized (mathspeak) forms of some fractions and superscripts.
var intRgx = /^[\+\-]?[\d]+$/;

// Traverses the top level of the passed block's children and returns the concatenation of their ctrlSeq properties.
// Used in shortened mathspeak computations as a block's .text() method can be potentially expensive.
//
function getCtrlSeqsFromBlock(block) {
  if (
    typeof(block) !== 'object' ||
    typeof(block.children) !== 'function'
  )
    return block;
  var children = block.children();
  if (!children || !children.ends[L]) return block;
  var chars = '';
  for (var sibling = children.ends[L]; sibling[R] !== undefined; sibling = sibling[R]) {
    if (sibling.ctrlSeq !== undefined) chars += sibling.ctrlSeq;
  }
  return chars;
}

Options.prototype.charsThatBreakOutOfSupSub = '';

class SupSub extends MathCommand {
  ctrlSeq = '_{...}^{...}';

  createLeftOf (cursor) {
    if (!this.replacedFragment && !cursor[L] && cursor.options.supSubsRequireOperand) return;
    return super.createLeftOf.apply(this, arguments);
  };
  contactWeld (cursor) {
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
            var pt = new Point(dest, children.ends[R], dest.ends[L]);
            if (dir === L) children.adopt(dest, dest.ends[R], 0);
            else children.adopt(dest, 0, dest.ends[L]);
          }
          else var pt = new Point(dest, 0, dest.ends[L]);
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
  finalizeTree () {
    this.ends[L].write = function(cursor, ch) {
      if (cursor.options.autoSubscriptNumerals && this === this.parent.sub) {
        if (ch === '_') return;
        var cmd = this.chToCmd(ch, cursor.options);
        if (cmd instanceof MQSymbol) cursor.deleteSelection();
        else cursor.clearSelection().insRightOf(this.parent);
        cmd.createLeftOf(cursor.show());
        aria.queue('Baseline').alert(cmd.mathspeak({ createdLeftOf: cursor }));
        return;
      }
      if (cursor[L] && !cursor[R] && !cursor.selection
          && cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1) {
        cursor.insRightOf(this.parent);
        aria.queue('Baseline');
      }
      MathBlock.prototype.write.apply(this, arguments);
    };
  };
  moveTowards (dir, cursor, updown) {
    if (cursor.options.autoSubscriptNumerals && !this.sup) {
      cursor.insDirOf(dir, this);
    }
    else super.moveTowards.apply(this, arguments);
  };
  deleteTowards (dir, cursor) {
    if (cursor.options.autoSubscriptNumerals && this.sub) {
      var cmd = this.sub.ends[-dir];
      if (cmd instanceof MQSymbol) cmd.remove();
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
    else super.deleteTowards.apply(this, arguments);
  };
  latex () {
    function latex(prefix, block) {
      var l = block && block.latex();
      return block ? prefix + '{' + (l || ' ') + '}' : '';
    }
    return latex('_', this.sub) + latex('^', this.sup);
  };
  text () {
    function text(prefix, block) {
      var l = block && block.text();
      return block ? prefix + (l.length === 1 ? l : '(' + (l || ' ') + ')') : '';
    }
    return text('_', this.sub) + text('^', this.sup);
  };
  addBlock (block) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = this.sub.upOutOf = block;
      block.adopt(this, this.sub, 0).downOutOf = this.sub;
      block.jQ = $('<span class="mq-sup"/>').append(block.jQ.children()).prependTo(this.jQ);
      NodeBase.linkElementByBlockNode(block.jQ[0], block);
    }
    else {
      this.sub = this.downInto = this.sup.downOutOf = block;
      block.adopt(this, 0, this.sup).upOutOf = this.sup;
      block.jQ = $('<span class="mq-sub"></span>').append(block.jQ.children())
        .appendTo(this.jQ.removeClass('mq-sup-only'));
      NodeBase.linkElementByBlockNode(block.jQ[0], block);
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
};

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
LatexCmds._ = class SubscriptCommand extends SupSub {
  supsub = 'sub';
  
  htmlTemplate =
      '<span class="mq-supsub mq-non-leaf">'
    +   '<span class="mq-sub">&0</span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  
  textTemplate = [ '_' ];
  
  mathspeakTemplate = [ 'Subscript,', ', Baseline'];
  
  ariaLabel = 'subscript';
  
  finalizeTree () {
    this.downInto = this.sub = this.ends[L];
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
    super.finalizeTree()
  };
};

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = class SuperscriptCommand extends SupSub {
  supsub = 'sup';

  htmlTemplate =
      '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +   '<span class="mq-sup">&0</span>'
    + '</span>'
  ;
  textTemplate = ['^(', ')'];
  mathspeak (opts) {
    // Simplify basic exponent speech for common whole numbers.
    var child = this.upInto;
    if (child !== undefined) {
      // Calculate this item's inner text to determine whether to shorten the returned speech.
      // Do not calculate its inner mathspeak now until we know that the speech is to be truncated.
      // Since the mathspeak computation is recursive, we want to call it only once in this function to avoid performance bottlenecks.
      var innerText = getCtrlSeqsFromBlock(child);
      // If the superscript is a whole number, shorten the speech that is returned.
      if (
        (!opts || !opts.ignoreShorthand) &&
        intRgx.test(innerText)
      ) {
        // Simple cases
        if (innerText === '0') {
          return 'to the 0 power';
        } else if (innerText === '2') {
          return 'squared';
        } else if (innerText === '3') {
          return 'cubed';
        }

        // More complex cases.
        var suffix = '';
        // Limit suffix addition to exponents < 1000.
        if (/^[+-]?\d{1,3}$/.test(innerText)) {
          if (/(11|12|13|4|5|6|7|8|9|0)$/.test(innerText)) {
            suffix = 'th';
          } else if (/1$/.test(innerText)) {
            suffix = 'st';
          } else if (/2$/.test(innerText)) {
            suffix = 'nd';
          } else if (/3$/.test(innerText)) {
            suffix = 'rd';
          }
        }
        var innerMathspeak = typeof(child) === 'object'
          ? child.mathspeak()
          : innerText;
        return 'to the ' + innerMathspeak + suffix + ' power';
      }
    }
    return super.mathspeak();
  };

  ariaLabel = 'superscript';
  mathspeakTemplate = [ 'Superscript,', ', Baseline'];
  finalizeTree () {
    this.upInto = this.sup = this.ends[R];
    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
    super.finalizeTree();
  };
};

class SummationNotation extends MathCommand {
  constructor (ch, html, ariaLabel) {
    this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
    var htmlTemplate =
      '<span class="mq-large-operator mq-non-leaf">'
    +   '<span class="mq-to"><span>&1</span></span>'
    +   '<big>'+html+'</big>'
    +   '<span class="mq-from"><span>&0</span></span>'
    + '</span>'
    ;

    super();
    MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(this, ch, htmlTemplate);
  };
  createLeftOf (cursor) {
    super.createLeftOf.apply(this, arguments);
    if (cursor.options.sumStartsWithNEquals) {
      new Letter('n').createLeftOf(cursor);
      new Equality().createLeftOf(cursor);
    }
  };
  latex () {
    function simplify(latex) {
      return '{' + (latex || ' ') + '}';
    }
    return this.ctrlSeq + '_' + simplify(this.ends[L].latex()) +
      '^' + simplify(this.ends[R].latex());
  };
  mathspeak () {
    return 'Start ' + this.ariaLabel + ' from ' + this.ends[L].mathspeak() +
      ' to ' + this.ends[R].mathspeak() + ', end ' + this.ariaLabel + ', ';
  };
  parser () {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    var blocks = self.blocks = [ new MathBlock(), new MathBlock() ];
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
  finalizeTree () {
    this.ends[L].ariaLabel = 'lower bound';
    this.ends[R].ariaLabel = 'upper bound';
    this.downInto = this.ends[L];
    this.upInto = this.ends[R];
    this.ends[L].upOutOf = this.ends[R];
    this.ends[R].downOutOf = this.ends[L];
  };
};

LatexCmds['∑'] =
LatexCmds.sum =
LatexCmds.summation = () => new SummationNotation('\\sum ','&sum;', 'sum');

LatexCmds['∏'] =
LatexCmds.prod =
LatexCmds.product = () => new SummationNotation('\\prod ','&prod;', 'product');

LatexCmds.coprod =
LatexCmds.coproduct = () => new SummationNotation('\\coprod ','&#8720;', 'co product');

LatexCmds['∫'] =
LatexCmds['int'] =
LatexCmds.integral = class extends SummationNotation {
  constructor () {
    this.ariaLabel = 'integral';
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

    super('\\int ', '', 'integral');

    this.htmlTemplate = htmlTemplate;
  };
  
  createLeftOf (cursor) {
    // FIXME: refactor rather than overriding
    MathCommand.prototype.createLeftOf.call(this, cursor);
  }
};
var Fraction =
LatexCmds.frac =
LatexCmds.dfrac =
LatexCmds.cfrac =
LatexCmds.fraction = class FracNode extends MathCommand {
  ctrlSeq = '\\frac';
  htmlTemplate =
      '<span class="mq-fraction mq-non-leaf">'
    +   '<span class="mq-numerator">&0</span>'
    +   '<span class="mq-denominator">&1</span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  ;
  textTemplate = ['(', ')/(', ')'];
  finalizeTree () {
    this.upInto = this.ends[R].upOutOf = this.ends[L];
    this.downInto = this.ends[L].downOutOf = this.ends[R];
    this.ends[L].ariaLabel = 'numerator';
    this.ends[R].ariaLabel = 'denominator';
    if(this.getFracDepth() > 1) {
      this.mathspeakTemplate = ['StartNestedFraction,', 'NestedOver', ', EndNestedFraction'];
    } else {
      this.mathspeakTemplate = ['StartFraction,', 'Over', ', EndFraction'];
    }
  };

  mathspeak (opts) {
    if (opts && opts.createdLeftOf) {
      var cursor = opts.createdLeftOf;
      return cursor.parent.mathspeak();
    }

    var numText = getCtrlSeqsFromBlock(this.ends[L]);
    var denText = getCtrlSeqsFromBlock(this.ends[R]);

    // Shorten mathspeak value for whole number fractions whose denominator is less than 10.
    if (
      (!opts || !opts.ignoreShorthand) &&
      intRgx.test(numText) && intRgx.test(denText)
    ) {
      var isSingular = numText === '1' || numText === '-1';
      var newDenSpeech = '';
      if (denText === '2') {
        newDenSpeech = isSingular
          ? 'half'
          : 'halves';
      } else if (denText === '3') {
        newDenSpeech = isSingular
          ? 'third'
          : 'thirds';
      } else if (denText === '4') {
        newDenSpeech = isSingular
          ? 'quarter'
          : 'quarters';
      } else if (denText === '5') {
        newDenSpeech = isSingular
          ? 'fifth'
          : 'fifths';
      } else if (denText === '6') {
        newDenSpeech = isSingular
          ? 'sixth'
          : 'sixths';
      } else if (denText === '7') {
        newDenSpeech = isSingular
          ? 'seventh'
          : 'sevenths';
      } else if (denText === '8') {
        newDenSpeech = isSingular
          ? 'eighth'
          : 'eighths';
      } else if (denText === '9') {
        newDenSpeech = isSingular
          ? 'ninth'
          : 'ninths';
      }
      if (newDenSpeech !== '') {
        var output = '';
        // Handle the case of an integer followed by a simplified fraction such as 1\frac{1}{2}.
        // Such combinations should be spoken aloud as "1 and 1 half."
        // Start at the left sibling of the fraction and continue leftward until something other than a digit or whitespace is found.
        var precededByInteger = false;
        for (var sibling = this[L]; sibling[L] !== undefined; sibling = sibling[L]) {
          // Ignore whitespace
          if (sibling.ctrlSeq === '\\ ') {
            continue;
          } else if (intRgx.test(sibling.ctrlSeq)) {
            precededByInteger = true;
          } else {
            precededByInteger = false;
            break;
          }
        }
        if (precededByInteger) {
          output += 'and ';
        }
        output += this.ends[L].mathspeak() + ' ' + newDenSpeech;
        return output;
      }
    }

    return super.mathspeak.apply(this, arguments);
  };

  getFracDepth () {
    var level = 0;
    var walkUp = function(item, level) {
      if(item instanceof MQNode && item.ctrlSeq && item.ctrlSeq.toLowerCase().search('frac') >= 0) level += 1;
      if(item.parent) return walkUp(item.parent, level);
      else return level;
    };
    return walkUp(this, level);
  };
};

var LiveFraction =
LatexCmds.over =
CharCmds['/'] = class extends Fraction {
  createLeftOf (cursor) {
    if (!this.replacedFragment) {
      var leftward = cursor[L];

      if (!cursor.options.typingSlashCreatesNewFraction) {
        while (leftward &&
          !(
            leftward instanceof BinaryOperator ||
            leftward instanceof (LatexCmds.text || noop) ||
            leftward instanceof SummationNotation ||
            leftward.ctrlSeq === '\\ ' ||
            /^[,;:]$/.test(leftward.ctrlSeq)
          ) //lookbehind for operator
        ) leftward = leftward[L];
      }
      if (leftward instanceof SummationNotation && leftward[R] instanceof SupSub) {
        leftward = leftward[R];
        if (leftward[R] instanceof SupSub && leftward[R].ctrlSeq != leftward.ctrlSeq)
          leftward = leftward[R];
      }

      if (leftward !== cursor[L] && !cursor.isTooDeep(1)) {
        this.replaces(new Fragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
        cursor[L] = leftward;
      }
    }
    super.createLeftOf(cursor);
  };
};

LatexCmds.ans = () => new MQSymbol(
      '\\operatorname{ans}',
      '<span class="mq-ans">ans</span>',
      'ans'
    );

LatexCmds.percent =
LatexCmds.percentof = () => new MQSymbol(
      '\\%\\operatorname{of}',
      '<span class="mq-nonSymbola mq-operator-name">% of </span>',
      'percent of'
    )

class SquareRoot extends MathCommand {
  ctrlSeq = '\\sqrt';
  htmlTemplate =
      '<span class="mq-non-leaf mq-sqrt-container">'
    +   '<span class="mq-scaled mq-sqrt-prefix">'
    +     SVG_SYMBOLS.sqrt.html
    +   '</span>'
    +   '<span class="mq-non-leaf mq-sqrt-stem">&0</span>'
    + '</span>'
  ;
  textTemplate = ['sqrt(', ')'];
  mathspeakTemplate = ['StartRoot,', ', EndRoot'];
  ariaLabel = 'root';
  parser () {
    return latexMathParser.optBlock.then(function(optBlock) {
      return latexMathParser.block.map(function(block) {
        var nthroot = new NthRoot();
        nthroot.blocks = [ optBlock, block ];
        optBlock.adopt(nthroot, 0, 0);
        block.adopt(nthroot, optBlock, 0);
        return nthroot;
      });
    }).or(super.parser());
  };
};
LatexCmds.sqrt = SquareRoot;

LatexCmds.hat = class Hat extends MathCommand {
  ctrlSeq = '\\hat';
  htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-hat-prefix">^</span>'
    +   '<span class="mq-hat-stem">&0</span>'
    + '</span>'
  ;
  textTemplate = ['hat(', ')'];
};

class NthRoot extends SquareRoot {
  htmlTemplate =
      '<span class="mq-nthroot-container mq-non-leaf">'
    +   '<sup class="mq-nthroot mq-non-leaf">&0</sup>'
    +   '<span class="mq-scaled mq-sqrt-container">'
    +     '<span class="mq-sqrt-prefix mq-scaled">'
    +       SVG_SYMBOLS.sqrt.html
    +     '</span>'
    +     '<span class="mq-sqrt-stem mq-non-leaf">&1</span>'
    +   '</span>'
    + '</span>'
  ;
  textTemplate = ['sqrt[', '](', ')'];
  latex () {
    return '\\sqrt['+this.ends[L].latex()+']{'+this.ends[R].latex()+'}';
  };
  mathspeak () {
    var indexMathspeak = this.ends[L].mathspeak();
    var radicandMathspeak = this.ends[R].mathspeak();
    this.ends[L].ariaLabel = 'Index';
    this.ends[R].ariaLabel = 'Radicand';
    if (indexMathspeak === '3') { // cube root
      return 'Start Cube Root, '+radicandMathspeak+', End Cube Root';
    } else {
      return 'Root Index '+indexMathspeak+', Start Root, '+radicandMathspeak+', End Root';
    }
  };
};
LatexCmds.nthroot = NthRoot;

LatexCmds.cbrt = class extends NthRoot {
  createLeftOf (cursor) {
    super.createLeftOf.apply(this, arguments);
    new Digit('3').createLeftOf(cursor);
    cursor.controller.moveRight();
  };
};

class DiacriticAbove extends MathCommand {
  constructor (ctrlSeq, symbol, textTemplate) {
    var htmlTemplate =
      '<span class="mq-non-leaf">'
      +   '<span class="mq-diacritic-above">'+symbol+'</span>'
      +   '<span class="mq-diacritic-stem">&0</span>'
      + '</span>'
    ;

    super(ctrlSeq, htmlTemplate, textTemplate);
  };
};
LatexCmds.vec = () => new DiacriticAbove('\\vec', '&rarr;', ['vec(', ')']);
LatexCmds.tilde = () => new DiacriticAbove('\\tilde', '~', ['tilde(', ')']);

class DelimsNode extends MathCommand {
  jQadd (el) {
    super.jQadd(el);
    this.delimjQs = this.jQ.children(':first').add(this.jQ.children(':last'));
    this.contentjQ = this.jQ.children(':eq(1)');
  };
}

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
class Bracket extends DelimsNode {
  constructor (side, open, close, ctrlSeq, end) {
    super('\\left'+ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {};
    this.sides[L] = { ch: open, ctrlSeq: ctrlSeq };
    this.sides[R] = { ch: close, ctrlSeq: end };
  };
  numBlocks () { return 1; };
  html () {
    var leftSymbol = this.getSymbol(L);
    var rightSymbol = this.getSymbol(R);

                        // wait until now so that .side may
    this.htmlTemplate = // be set by createLeftOf or parser
        '<span class="mq-non-leaf mq-bracket-container">'
      +   '<span style="width:'+ leftSymbol.width +'" class="mq-scaled mq-bracket-l mq-paren'+(this.side === R ? ' mq-ghost' : '')+'">'
      +     leftSymbol.html
      +   '</span>'
      +   '<span style="margin-left:'+ leftSymbol.width +';margin-right:'+ rightSymbol.width +'" class="mq-bracket-middle mq-non-leaf">&0</span>'
      +   '<span style="width:'+ rightSymbol.width +'" class="mq-scaled mq-bracket-r mq-paren'+(this.side === L ? ' mq-ghost' : '')+'">'
      +     rightSymbol.html
      +   '</span>'
      + '</span>'
    ;
    return super.html();
  };
  getSymbol (side) {
    return SVG_SYMBOLS[this.sides[side || R].ch] || {width: '0', html: ''};
  };
  latex () {
    return '\\left'+this.sides[L].ctrlSeq+this.ends[L].latex()+'\\right'+this.sides[R].ctrlSeq;
  };
  mathspeak (opts) {
    var open = this.sides[L].ch, close = this.sides[R].ch;
    if (open === '|' && close === '|') {
      this.mathspeakTemplate = ['StartAbsoluteValue,', ', EndAbsoluteValue'];
      this.ariaLabel = 'absolute value';
    }
    else if (opts && opts.createdLeftOf && this.side) {
      var ch = '';
      if (this.side === L) ch = this.textTemplate[0];
      else if (this.side === R) ch = this.textTemplate[1];
      return (this.side === L ? 'left ' : 'right ') + BRACKET_NAMES[ch];
    }
    else {
      this.mathspeakTemplate = ['left ' + BRACKET_NAMES[open]+',', ', right ' + BRACKET_NAMES[close]];
      this.ariaLabel = BRACKET_NAMES[open]+' block';
    }
    return super.mathspeak();
  };
  matchBrack (opts, expectedSide, node) {
    // return node iff it's a matching 1-sided bracket of expected side (if any)
    return node instanceof Bracket && node.side && node.side !== -expectedSide
      && (!opts.restrictMismatchedBrackets
        || OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch
        || { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) && node;
  };
  closeOpposing (brack) {
    brack.side = 0;
    brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
    var $brack = brack.delimjQs.eq(this.side === L ? 0 : 1) // mismatched, like [a, b))
      .removeClass('mq-ghost');
    this.replaceBracket($brack, this.side);
  };
  createLeftOf (cursor) {
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
        new Fragment(cursor[side], cursor.parent.ends[side], -side) // me and ghost outside
          .disown().withDirAdopt(-side, brack.parent, brack, brack[side])
          .jQ.insDirOf(side, brack.jQ);
      }
      brack.bubble(function (node) { node.reflow(); });
    }
    else {
      brack = this, side = brack.side;
      if (brack.replacedFragment) brack.side = 0; // wrapping seln, don't be one-sided
      else if (cursor[-side]) { // elsewise, auto-expand so ghost is at far end
        brack.replaces(new Fragment(cursor[-side], cursor.parent.ends[-side], side));
        cursor[-side] = 0;
      }
      super.createLeftOf(cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.ends[L]);
    else cursor.insRightOf(brack);
  };
  placeCursor () {};
  unwrap () {
    this.ends[L].children().disown().adopt(this.parent, this, this[R])
      .jQ.insertAfter(this.jQ);
    this.remove();
  };
  deleteSide (side, outward, cursor) {
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
        var $brack = this.delimjQs.removeClass('mq-ghost')
          .eq(side === L ? 0 : 1).addClass('mq-ghost');
        this.replaceBracket($brack, side);
      }
      if (sib) { // auto-expand so ghost is at far end
        var origEnd = this.ends[L].ends[side];
        new Fragment(sib, farEnd, -side).disown()
          .withDirAdopt(-side, this.ends[L], origEnd, 0)
          .jQ.insAtDirEnd(side, this.ends[L].jQ.removeClass('mq-empty'));
        if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side, sib);
      } // didn't auto-expand, cursor goes just outside or just inside parens
      else (outward ? cursor.insDirOf(side, this)
                    : cursor.insAtDirEnd(side, this.ends[L]));
    }
  };
  replaceBracket ($brack, side) {
    var symbol = this.getSymbol(side);
    $brack.html(symbol.html).css('width', symbol.width);

    if (side === L) {
      $brack.next().css('margin-left', symbol.width);
    } else {
      $brack.prev().css('margin-right', symbol.width);
    }
  };
  deleteTowards (dir, cursor) {
    this.deleteSide(-dir, false, cursor);
  };
  finalizeTree () {
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
  siblingCreated (opts, dir) { // if something typed between ghost and far
    if (dir === -this.side) this.finalizeTree(); // end of its block, solidify
  };
};

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

var BRACKET_NAMES = {
  '&lang;': 'angle-bracket',
  '&rang;': 'angle-bracket',
  '|': 'pipe'
};

function bindCharBracketPair(open, ctrlSeq, name) {
  var ctrlSeq = ctrlSeq || open, close = OPP_BRACKS[open], end = OPP_BRACKS[ctrlSeq];
  CharCmds[open] = () => new Bracket(L, open, close, ctrlSeq, end);
  CharCmds[close] = () => new Bracket(R, open, close, ctrlSeq, end);
  BRACKET_NAMES[open] = BRACKET_NAMES[close] = name;
}
bindCharBracketPair('(', null, 'parenthesis');
bindCharBracketPair('[', null, 'bracket');
bindCharBracketPair('{', '\\{', 'brace');
LatexCmds.langle = () => new Bracket(L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = () => new Bracket(R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = () => new Bracket(L, '|', '|', '|', '|');
LatexCmds.lVert = () => new Bracket(L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.rVert = () => new Bracket( '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');


LatexCmds.left = class extends MathCommand {
  parser () {
    var regex = Parser.regex;
    var string = Parser.string;
    var succeed = Parser.succeed;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{|\\langle(?![a-zA-Z])|\\lVert(?![a-zA-Z]))/))
      .then(function(ctrlSeq) {
        var open = ctrlSeq.replace(/^\\/, '');
	if (ctrlSeq=="\\langle") { open = '&lang;'; ctrlSeq = ctrlSeq + ' '; }
	if (ctrlSeq=="\\lVert") { open = '&#8741;'; ctrlSeq = ctrlSeq + ' '; }
        return latexMathParser.then(function (block) {
          return string('\\right').skip(optWhitespace)
            .then(regex(/^(?:[\])|]|\\\}|\\rangle(?![a-zA-Z])|\\rVert(?![a-zA-Z]))/)).map(function(end) {
              var close = end.replace(/^\\/, '');
	      if (end=="\\rangle") { close = '&rang;'; end = end + ' '; }
	      if (end=="\\rVert") { close = '&#8741;'; end = end + ' '; }
              var cmd = new Bracket(0, open, close, ctrlSeq, end);
              cmd.blocks = [ block ];
              block.adopt(cmd, 0, 0);
              return cmd;
            })
          ;
        });
      })
    ;
  };
};

LatexCmds.right = class extends MathCommand {
  parser () {
    return Parser.fail('unmatched \\right');
  };
};

var leftBinomialSymbol = SVG_SYMBOLS['('];
var rightBinomialSymbol = SVG_SYMBOLS[')'];
class Binomial extends DelimsNode {

  ctrlSeq = '\\binom';
  htmlTemplate =
      '<span class="mq-non-leaf mq-bracket-container">'
    +   '<span style="width:'+ leftBinomialSymbol.width +'" class="mq-paren mq-bracket-l mq-scaled">'
    +     leftBinomialSymbol.html
    +   '</span>'
    +   '<span style="margin-left:'+ leftBinomialSymbol.width +'; margin-right:'+ rightBinomialSymbol.width +';" class="mq-non-leaf mq-bracket-middle">'
    +     '<span class="mq-array mq-non-leaf">'
    +       '<span>&0</span>'
    +       '<span>&1</span>'
    +     '</span>'
    +   '</span>'
    +   '<span style="width:'+ rightBinomialSymbol.width +'" class="mq-paren mq-bracket-r mq-scaled">'
    +     rightBinomialSymbol.html
    +   '</span>'
    + '</span>'
  ;
  textTemplate = ['choose(',',',')'];
  mathspeakTemplate = ['StartBinomial,', 'Choose', ', EndBinomial'];
  ariaLabel = 'binomial';
};

LatexCmds.binom =
LatexCmds.binomial = Binomial;

LatexCmds.choose = class extends Binomial {
  createLeftOf (cursor) {
    LiveFraction.prototype.createLeftOf.call(this, cursor);
  }
};

LatexCmds.editable = // backcompat with before cfd3620 on #233
LatexCmds.MathQuillMathField = class MathFieldNode extends MathCommand {
  ctrlSeq = '\\MathQuillMathField';
  htmlTemplate =
      '<span class="mq-editable-field">'
    +   '<span class="mq-root-block">&0</span>'
    + '</span>'
  ;
  parser () {
    var self = this,
      string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
    return string('[').then(regex(/^[a-z][a-z0-9]*/i)).skip(string(']'))
      .map(function(name) { self.name = name; }).or(succeed())
      .then(super.parser());
  };
  finalizeTree (options) {
    var ctrlr = new Controller(this.ends[L], this.jQ, options);
    ctrlr.KIND_OF_MQ = 'MathField';
    ctrlr.editable = true;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(ctrlr.root);
    RootBlockMixin(ctrlr.root);
  };
  registerInnerField (innerFields, MathField) {
    innerFields.push(innerFields[this.name] = new MathField(this.ends[L].controller));
  };
  latex (){ return this.ends[L].latex(); };
  text (){ return this.ends[L].text(); };
};

// Embed arbitrary things
// Probably the closest DOM analogue would be an iframe?
// From MathQuill's perspective, it's a MQSymbol, it can be
// anywhere and the cursor can go around it but never in it.
// Create by calling public API method .dropEmbedded(),
// or by calling the global public API method .registerEmbed()
// and rendering LaTeX like \embed{registeredName} (see test).
LatexCmds.embed = class extends MQSymbol {
  setOptions (options) {
    function noop () { return ""; }
    this.text = options.text || noop;
    this.htmlTemplate = options.htmlString || "";
    this.latex = options.latex || noop;
    return this;
  };
  parser () {
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
};
