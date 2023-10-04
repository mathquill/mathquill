/***************************
 * Commands and Operators.
 **************************/
var SVG_SYMBOLS = {
  sqrt: {
    width: '',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 32 54">' +
      '<path d="M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33" />' +
      '</svg>',
  },
  '|': {
    width: '.4em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
      '<path d="M4.4 0 L4.4 54 L5.6 54 L5.6 0" />' +
      '</svg>',
  },
  '[': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 11 24">' +
      '<path d="M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1" />' +
      '</svg>',
  },
  ']': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 11 24">' +
      '<path d="M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1" />' +
      '</svg>',
  },
  '(': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="3 0 106 186">' +
      '<path d="M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0" />' +
      '</svg>',
  },
  ')': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="3 0 106 186">' +
      '<path d="M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0" />' +
      '</svg>',
  },
  '{': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="10 0 210 350">' +
      '<path d="M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0" />' +
      '</svg>',
  },
  '}': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="10 0 210 350">' +
      '<path d="M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0" />' +
      '</svg>',
  },
  '&#8741;': {
    width: '.7em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
      '<path d="M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0" />' +
      '</svg>',
  },
  '&lang;': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
      '<path d="M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0" />' +
      '</svg>',
  },
  '&rang;': {
    width: '.55em',
    html:
      '<svg preserveAspectRatio="none" viewBox="0 0 10 54">' +
      '<path d="M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0" />' +
      '</svg>',
  },
};

class Style extends MathCommand {
  shouldNotSpeakDelimiters: boolean | undefined;

  constructor(
    ctrlSeq: string,
    tagName: string,
    attrs: string,
    ariaLabel?: string,
    opts?: { shouldNotSpeakDelimiters: boolean }
  ) {
    super(ctrlSeq, '<' + tagName + ' ' + attrs + '>&0</' + tagName + '>');
    this.ariaLabel = ariaLabel || ctrlSeq.replace(/^\\/, '');
    this.mathspeakTemplate = [
      'Start' + this.ariaLabel + ',',
      'End' + this.ariaLabel,
    ];
    // In most cases, mathspeak should announce the start and end of style blocks.
    // There is one exception currently (mathrm).
    this.shouldNotSpeakDelimiters = opts && opts.shouldNotSpeakDelimiters;
  }
  mathspeak(opts?: MathspeakOptions) {
    if (!this.shouldNotSpeakDelimiters || (opts && opts.ignoreShorthand)) {
      return super.mathspeak();
    }
    return this.foldChildren('', function (speech, block) {
      return speech + ' ' + block.mathspeak(opts);
    }).trim();
  }
}

//fonts
LatexCmds.mathrm = class extends Style {
  constructor() {
    super('\\mathrm', 'span', 'class="mq-roman mq-font"', 'Roman Font', {
      shouldNotSpeakDelimiters: true,
    });
  }
  isTextBlock() {
    return true;
  }
};
LatexCmds.mathit = () =>
  new Style('\\mathit', 'i', 'class="mq-font"', 'Italic Font');
LatexCmds.mathbf = () =>
  new Style('\\mathbf', 'b', 'class="mq-font"', 'Bold Font');
LatexCmds.mathsf = () =>
  new Style('\\mathsf', 'span', 'class="mq-sans-serif mq-font"', 'Serif Font');
LatexCmds.mathtt = () =>
  new Style('\\mathtt', 'span', 'class="mq-monospace mq-font"', 'Math Text');
//text-decoration
LatexCmds.underline = () =>
  new Style(
    '\\underline',
    'span',
    'class="mq-non-leaf mq-underline"',
    'Underline'
  );
LatexCmds.overline = LatexCmds.bar = () =>
  new Style(
    '\\overline',
    'span',
    'class="mq-non-leaf mq-overline"',
    'Overline'
  );
LatexCmds.overrightarrow = () =>
  new Style(
    '\\overrightarrow',
    'span',
    'class="mq-non-leaf mq-overarrow mq-arrow-right"',
    'Over Right Arrow'
  );
LatexCmds.overleftarrow = () =>
  new Style(
    '\\overleftarrow',
    'span',
    'class="mq-non-leaf mq-overarrow mq-arrow-left"',
    'Over Left Arrow'
  );
LatexCmds.overleftrightarrow = () =>
  new Style(
    '\\overleftrightarrow ',
    'span',
    'class="mq-non-leaf mq-overarrow mq-arrow-leftright"',
    'Over Left and Right Arrow'
  );
LatexCmds.overarc = () =>
  new Style('\\overarc', 'span', 'class="mq-non-leaf mq-overarc"', 'Over Arc');
LatexCmds.dot = () => {
  return new MathCommand(
    '\\dot',
    '<span class="mq-non-leaf"><span class="mq-dot-recurring-inner">' +
      '<span class="mq-dot-recurring">&#x2d9;</span>' +
      '<span class="mq-empty-box">&0</span>' +
      '</span></span>'
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
  color: string | undefined;

  setColor(color: string) {
    this.color = color;
    this.htmlTemplate =
      '<span class="mq-textcolor" style="color:' + color + '">&0</span>';
    this.ariaLabel = color.replace(/^\\/, '');
    this.mathspeakTemplate = [
      'Start ' + this.ariaLabel + ',',
      'End ' + this.ariaLabel,
    ];
  }
  latex() {
    var blocks0 = this.blocks![0];
    return '\\textcolor{' + this.color + '}{' + blocks0.latex() + '}';
  }
  parser() {
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
      });
  }
  isStyleBlock() {
    return true;
  }
};

// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = (LatexCmds['class'] = class extends MathCommand {
  cls: string | undefined;

  parser() {
    var string = Parser.string,
      regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then((cls) => {
        this.cls = cls || '';
        this.htmlTemplate = '<span class="mq-class ' + cls + '">&0</span>';
        this.ariaLabel = cls + ' class';
        this.mathspeakTemplate = [
          'Start ' + this.ariaLabel + ',',
          'End ' + this.ariaLabel,
        ];
        return super.parser();
      });
  }
  latex() {
    var blocks0 = this.blocks![0];
    return '\\class{' + this.cls + '}{' + blocks0.latex() + '}';
  }
  isStyleBlock() {
    return true;
  }
});

// This test is used to determine whether an item may be treated as a whole number
// for shortening the verbalized (mathspeak) forms of some fractions and superscripts.
var intRgx = /^[\+\-]?[\d]+$/;

// Traverses the top level of the passed block's children and returns the concatenation of their ctrlSeq properties.
// Used in shortened mathspeak computations as a block's .text() method can be potentially expensive.
//
function getCtrlSeqsFromBlock(block: NodeRef): string {
  if (!block) return '';

  var children = block.children();
  if (!children || !children.ends[L]) return '';

  var chars = '';
  for (
    var sibling: NodeRef | undefined = children.ends[L];
    sibling && sibling[R] !== undefined;
    sibling = sibling[R]
  ) {
    if (sibling.ctrlSeq !== undefined) chars += sibling.ctrlSeq;
  }
  return chars;
}

Options.prototype.charsThatBreakOutOfSupSub = '';

class SupSub extends MathCommand {
  ctrlSeq = '_{...}^{...}';
  sub?: MathBlock;
  sup?: MathBlock;
  supsub: 'sup' | 'sub';

  createLeftOf(cursor: Cursor) {
    if (
      !this.replacedFragment &&
      !cursor[L] &&
      cursor.options.supSubsRequireOperand
    )
      return;
    return super.createLeftOf(cursor);
  }
  contactWeld(cursor: Cursor) {
    // Look on either side for a SupSub, if one is found compare my
    // .sub, .sup with its .sub, .sup. If I have one that it doesn't,
    // then call .addBlock() on it with my block; if I have one that
    // it also has, then insert my block's children into its block,
    // unless my block has none, in which case insert the cursor into
    // its block (and not mine, I'm about to remove myself) in the case
    // I was just typed.
    // TODO: simplify

    // equiv. to [L, R].forEach(function(dir) { ... });
    for (var dir: L | R | false = L; dir; dir = dir === L ? R : false) {
      const thisDir = this[dir];
      let pt;
      if (thisDir instanceof SupSub) {
        // equiv. to 'sub sup'.split(' ').forEach(function(supsub) { ... });
        for (
          var supsub: 'sub' | 'sup' | false = 'sub';
          supsub;
          supsub = supsub === 'sub' ? 'sup' : false
        ) {
          var src = this[supsub],
            dest = thisDir[supsub];
          if (!src) continue;
          if (!dest) thisDir.addBlock(src.disown());
          else if (!src.isEmpty()) {
            // ins src children at -dir end of dest
            src.jQ.children().insAtDirEnd(-dir as Direction, dest.jQ);
            var children = src.children().disown();
            pt = new Point(dest, children.ends[R], dest.ends[L]);
            if (dir === L) children.adopt(dest, dest.ends[R], 0);
            else children.adopt(dest, 0, dest.ends[L]);
          } else {
            pt = new Point(dest, 0, dest.ends[L]);
          }
          this.placeCursor = (function (dest, src) {
            // TODO: don't monkey-patch
            return function (cursor: Cursor) {
              cursor.insAtDirEnd(-dir as Direction, dest || src);
            };
          })(dest, src);
        }
        this.remove();
        if (cursor && cursor[L] === this) {
          if (dir === R && pt) {
            if (pt[L]) {
              cursor.insRightOf(pt[L] as MQNode);
            } else {
              cursor.insAtLeftEnd(pt.parent);
            }
          } else cursor.insRightOf(thisDir);
        }
        break;
      }
    }
  }
  finalizeTree() {
    var endsL = this.ends[L] as MQNode;
    endsL.write = function (cursor: Cursor, ch: string) {
      if (
        cursor.options.autoSubscriptNumerals &&
        this === (this.parent as SupSub).sub
      ) {
        if (ch === '_') return;
        var cmd = this.chToCmd(ch, cursor.options);
        if (cmd instanceof MQSymbol) cursor.deleteSelection();
        else cursor.clearSelection().insRightOf(this.parent);
        cmd.createLeftOf(cursor.show());
        cursor.controller.aria
          .queue('Baseline')
          .alert(cmd.mathspeak({ createdLeftOf: cursor }));
        return;
      }
      if (
        cursor[L] &&
        !cursor[R] &&
        !cursor.selection &&
        cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1
      ) {
        cursor.insRightOf(this.parent);
        cursor.controller.aria.queue('Baseline');
      }
      MathBlock.prototype.write.call(this, cursor, ch);
    };
  }
  moveTowards(dir: Direction, cursor: Cursor, updown?: 'up' | 'down') {
    if (cursor.options.autoSubscriptNumerals && !this.sup) {
      cursor.insDirOf(dir, this);
    } else super.moveTowards(dir, cursor, updown);
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    if (cursor.options.autoSubscriptNumerals && this.sub) {
      var cmd = this.sub.ends[-dir as Direction];
      if (cmd instanceof MQSymbol) cmd.remove();
      else if (cmd)
        cmd.deleteTowards(dir, cursor.insAtDirEnd(-dir as Direction, this.sub));

      // TODO: factor out a .removeBlock() or something
      if (this.sub.isEmpty()) {
        this.sub.deleteOutOf(L, cursor.insAtLeftEnd(this.sub));
        if (this.sup) cursor.insDirOf(-dir as Direction, this);
        // Note `-dir` because in e.g. x_1^2| want backspacing (leftward)
        // to delete the 1 but to end up rightward of x^2; with non-negated
        // `dir` (try it), the cursor appears to have gone "through" the ^2.
      }
    } else super.deleteTowards(dir, cursor);
  }
  latex() {
    function latex(prefix: string, block: NodeRef | undefined) {
      var l = block && block.latex();
      return block ? prefix + '{' + (l || ' ') + '}' : '';
    }
    return latex('_', this.sub) + latex('^', this.sup);
  }
  text() {
    function text(prefix: string, block: NodeRef | undefined) {
      var l = (block && block.text()) || '';
      return block
        ? prefix + (l.length === 1 ? l : '(' + (l || ' ') + ')')
        : '';
    }
    return text('_', this.sub) + text('^', this.sup);
  }
  addBlock(block: MathBlock) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = (this.sub as MQNode).upOutOf = block;
      block.adopt(this, this.sub as MQNode, 0).downOutOf = this.sub;
      block.jQ = $('<span class="mq-sup"/>')
        .append(block.jQ.children())
        .prependTo(this.jQ);
      NodeBase.linkElementByBlockNode(block.jQ[0], block);
    } else {
      this.sub = this.downInto = (this.sup as MQNode).downOutOf = block;
      block.adopt(this, 0, this.sup as MQNode).upOutOf = this.sup;
      block.jQ = $('<span class="mq-sub"></span>')
        .append(block.jQ.children())
        .appendTo(this.jQ.removeClass('mq-sup-only'));
      NodeBase.linkElementByBlockNode(block.jQ[0], block);
      this.jQ.append(
        '<span style="display:inline-block;width:0">&#8203;</span>'
      );
    }

    // like 'sub sup'.split(' ').forEach(function(supsub) { ... });
    for (var i = 0; i < 2; i += 1)
      (function (
        cmd: SupSub,
        supsub: 'sup' | 'sub',
        oppositeSupsub: 'sup' | 'sub',
        updown: 'up' | 'down'
      ) {
        const cmdSubSub = cmd[supsub]!;
        cmdSubSub.deleteOutOf = function (dir: Direction, cursor: Cursor) {
          cursor.insDirOf(this[dir] ? (-dir as Direction) : dir, this.parent);
          if (!this.isEmpty()) {
            var end = this.ends[dir];
            this.children()
              .disown()
              .withDirAdopt(
                dir,
                cursor.parent,
                cursor[dir] as MQNode,
                cursor[-dir as Direction] as NodeRef
              )
              .jQ.insDirOf(-dir as Direction, cursor.jQ);
            cursor[-dir as Direction] = end;
          }
          cmd.supsub = oppositeSupsub;
          delete cmd[supsub];
          delete cmd[`${updown}Into`];
          const cmdOppositeSupsub = cmd[oppositeSupsub]!;
          cmdOppositeSupsub[`${updown}OutOf`] = insLeftOfMeUnlessAtEnd;
          delete (cmdOppositeSupsub as any).deleteOutOf; // TODO - refactor so this method can be optional
          if (supsub === 'sub')
            $(cmd.jQ.addClass('mq-sup-only')[0].lastChild).remove();
          this.remove();
        };
      })(
        this,
        'sub sup'.split(' ')[i] as 'sup' | 'sup',
        'sup sub'.split(' ')[i] as 'sup' | 'sup',
        'down up'.split(' ')[i] as 'up' | 'down'
      );
  }
}

function insLeftOfMeUnlessAtEnd(this: MQNode, cursor: Cursor) {
  // cursor.insLeftOf(cmd), unless cursor at the end of block, and every
  // ancestor cmd is at the end of every ancestor block
  var cmd = this.parent;
  var ancestorCmd: MQNode | Anticursor | Cursor = cursor;
  do {
    if (ancestorCmd[R]) return cursor.insLeftOf(cmd);
    ancestorCmd = ancestorCmd.parent.parent;
  } while (ancestorCmd !== cmd);
  cursor.insRightOf(cmd);
  return undefined;
}

class SubscriptCommand extends SupSub {
  supsub = 'sub' as const;

  htmlTemplate =
    '<span class="mq-supsub mq-non-leaf">' +
    '<span class="mq-sub">&0</span>' +
    '<span style="display:inline-block;width:0">&#8203;</span>' +
    '</span>';

  textTemplate = ['_'];

  mathspeakTemplate = ['Subscript,', ', Baseline'];

  ariaLabel = 'subscript';

  finalizeTree() {
    this.downInto = this.sub = this.ends[L] as MathBlock;
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
    super.finalizeTree();
  }
}
LatexCmds.subscript = LatexCmds._ = SubscriptCommand;

LatexCmds.superscript =
  LatexCmds.supscript =
  LatexCmds['^'] =
    class SuperscriptCommand extends SupSub {
      supsub = 'sup' as const;

      htmlTemplate =
        '<span class="mq-supsub mq-non-leaf mq-sup-only">' +
        '<span class="mq-sup">&0</span>' +
        '</span>';
      textTemplate = ['^(', ')'];
      mathspeak(opts?: MathspeakOptions) {
        // Simplify basic exponent speech for common whole numbers.
        var child = this.upInto;
        if (child !== undefined) {
          // Calculate this item's inner text to determine whether to shorten the returned speech.
          // Do not calculate its inner mathspeak now until we know that the speech is to be truncated.
          // Since the mathspeak computation is recursive, we want to call it only once in this function to avoid performance bottlenecks.
          var innerText = getCtrlSeqsFromBlock(child);
          // If the superscript is a whole number, shorten the speech that is returned.
          if ((!opts || !opts.ignoreShorthand) && intRgx.test(innerText)) {
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
            var innerMathspeak =
              typeof child === 'object' ? child.mathspeak() : innerText;
            return 'to the ' + innerMathspeak + suffix + ' power';
          }
        }
        return super.mathspeak();
      }

      ariaLabel = 'superscript';
      mathspeakTemplate = ['Superscript,', ', Baseline'];
      finalizeTree() {
        this.upInto = this.sup = this.ends[R] as MathBlock;
        this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
        super.finalizeTree();
      }
    };

class SummationNotation extends MathCommand {
  constructor(ch: string, html: string, ariaLabel?: string) {
    super();

    this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
    var htmlTemplate =
      '<span class="mq-large-operator mq-non-leaf">' +
      '<span class="mq-to"><span>&1</span></span>' +
      '<big>' +
      html +
      '</big>' +
      '<span class="mq-from"><span>&0</span></span>' +
      '</span>';
    MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(
      this,
      ch,
      htmlTemplate
    );
  }
  createLeftOf(cursor: Cursor) {
    super.createLeftOf(cursor);
    if (cursor.options.sumStartsWithNEquals) {
      new Letter('n').createLeftOf(cursor);
      new Equality().createLeftOf(cursor);
    }
  }
  latex() {
    function simplify(latex: string) {
      return '{' + (latex || ' ') + '}';
    }
    return (
      this.ctrlSeq +
      '_' +
      simplify((this.ends[L] as MQNode).latex()) +
      '^' +
      simplify((this.ends[R] as MQNode).latex())
    );
  }
  mathspeak() {
    return (
      'Start ' +
      this.ariaLabel +
      ' from ' +
      (this.ends[L] as MQNode).mathspeak() +
      ' to ' +
      (this.ends[R] as MQNode).mathspeak() +
      ', end ' +
      this.ariaLabel +
      ', '
    );
  }
  parser() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    var blocks = (self.blocks = [new MathBlock(), new MathBlock()]);
    for (var i = 0; i < blocks.length; i += 1) {
      blocks[i].adopt(self, self.ends[R], 0);
    }

    return optWhitespace
      .then(string('_').or(string('^')))
      .then(function (supOrSub) {
        var child = blocks[supOrSub === '_' ? 0 : 1];
        return block.then(function (block) {
          block.children().adopt(child, child.ends[R], 0);
          return succeed(self);
        });
      })
      .many()
      .result(self);
  }
  finalizeTree() {
    var endsL = this.ends[L] as MQNode;
    var endsR = this.ends[R] as MQNode;

    endsL.ariaLabel = 'lower bound';
    endsR.ariaLabel = 'upper bound';
    this.downInto = endsL;
    this.upInto = endsR;
    endsL.upOutOf = endsR;
    endsR.downOutOf = endsL;
  }
}

LatexCmds['∑'] =
  LatexCmds.sum =
  LatexCmds.summation =
    () => new SummationNotation('\\sum ', '&sum;', 'sum');

LatexCmds['∏'] =
  LatexCmds.prod =
  LatexCmds.product =
    () => new SummationNotation('\\prod ', '&prod;', 'product');

LatexCmds.coprod = LatexCmds.coproduct = () =>
  new SummationNotation('\\coprod ', '&#8720;', 'co product');

LatexCmds['∫'] =
  LatexCmds['int'] =
  LatexCmds.integral =
    class extends SummationNotation {
      constructor() {
        var htmlTemplate =
          '<span class="mq-int mq-non-leaf">' +
          '<big>&int;</big>' +
          '<span class="mq-supsub mq-non-leaf">' +
          '<span class="mq-sup"><span class="mq-sup-inner">&1</span></span>' +
          '<span class="mq-sub">&0</span>' +
          '<span style="display:inline-block;width:0">&#8203</span>' +
          '</span>' +
          '</span>';
        super('\\int ', '', 'integral');

        this.ariaLabel = 'integral';
        this.htmlTemplate = htmlTemplate;
      }

      createLeftOf(cursor: Cursor) {
        // FIXME: refactor rather than overriding
        MathCommand.prototype.createLeftOf.call(this, cursor);
      }
    };
var Fraction =
  (LatexCmds.frac =
  LatexCmds.dfrac =
  LatexCmds.cfrac =
  LatexCmds.fraction =
    class FracNode extends MathCommand {
      ctrlSeq = '\\frac';
      htmlTemplate =
        '<span class="mq-fraction mq-non-leaf">' +
        '<span class="mq-numerator">&0</span>' +
        '<span class="mq-denominator">&1</span>' +
        '<span style="display:inline-block;width:0">&#8203;</span>' +
        '</span>';
      textTemplate = ['(', ')/(', ')'];
      finalizeTree() {
        const endsL = this.ends[L] as MQNode;
        const endsR = this.ends[R] as MQNode;
        this.upInto = endsR.upOutOf = endsL;
        this.downInto = endsL.downOutOf = endsR;
        endsL.ariaLabel = 'numerator';
        endsR.ariaLabel = 'denominator';
        if (this.getFracDepth() > 1) {
          this.mathspeakTemplate = [
            'StartNestedFraction,',
            'NestedOver',
            ', EndNestedFraction',
          ];
        } else {
          this.mathspeakTemplate = ['StartFraction,', 'Over', ', EndFraction'];
        }
      }

      mathspeak(opts?: MathspeakOptions) {
        if (opts && opts.createdLeftOf) {
          var cursor = opts.createdLeftOf;
          return cursor.parent.mathspeak();
        }

        var numText = getCtrlSeqsFromBlock(this.ends[L]);
        var denText = getCtrlSeqsFromBlock(this.ends[R]);

        // Shorten mathspeak value for whole number fractions whose denominator is less than 10.
        if (
          (!opts || !opts.ignoreShorthand) &&
          intRgx.test(numText) &&
          intRgx.test(denText)
        ) {
          var isSingular = numText === '1' || numText === '-1';
          var newDenSpeech = '';
          if (denText === '2') {
            newDenSpeech = isSingular ? 'half' : 'halves';
          } else if (denText === '3') {
            newDenSpeech = isSingular ? 'third' : 'thirds';
          } else if (denText === '4') {
            newDenSpeech = isSingular ? 'quarter' : 'quarters';
          } else if (denText === '5') {
            newDenSpeech = isSingular ? 'fifth' : 'fifths';
          } else if (denText === '6') {
            newDenSpeech = isSingular ? 'sixth' : 'sixths';
          } else if (denText === '7') {
            newDenSpeech = isSingular ? 'seventh' : 'sevenths';
          } else if (denText === '8') {
            newDenSpeech = isSingular ? 'eighth' : 'eighths';
          } else if (denText === '9') {
            newDenSpeech = isSingular ? 'ninth' : 'ninths';
          }
          if (newDenSpeech !== '') {
            var output = '';
            // Handle the case of an integer followed by a simplified fraction such as 1\frac{1}{2}.
            // Such combinations should be spoken aloud as "1 and 1 half."
            // Start at the left sibling of the fraction and continue leftward until something other than a digit or whitespace is found.
            var precededByInteger = false;
            for (
              var sibling: NodeRef | undefined = this[L];
              sibling && sibling[L] !== undefined;
              sibling = sibling[L]
            ) {
              // Ignore whitespace
              if (sibling.ctrlSeq === '\\ ') {
                continue;
              } else if (intRgx.test(sibling.ctrlSeq || '')) {
                precededByInteger = true;
              } else {
                precededByInteger = false;
                break;
              }
            }
            if (precededByInteger) {
              output += 'and ';
            }
            output += (this.ends[L] as MQNode).mathspeak() + ' ' + newDenSpeech;
            return output;
          }
        }

        return super.mathspeak();
      }

      getFracDepth() {
        var level = 0;
        var walkUp = function (item: NodeRef, level: number): number {
          if (
            item instanceof MQNode &&
            item.ctrlSeq &&
            item.ctrlSeq.toLowerCase().search('frac') >= 0
          )
            level += 1;
          if (item && item.parent) return walkUp(item.parent, level);
          else return level;
        };
        return walkUp(this, level);
      }
    });

var LiveFraction =
  (LatexCmds.over =
  CharCmds['/'] =
    class extends Fraction {
      createLeftOf(cursor: Cursor) {
        if (!this.replacedFragment) {
          var leftward = cursor[L];

          if (!cursor.options.typingSlashCreatesNewFraction) {
            while (
              leftward &&
              !(
                leftward instanceof BinaryOperator ||
                leftward instanceof (LatexCmds.text || noop) ||
                leftward instanceof SummationNotation ||
                leftward.ctrlSeq === '\\ ' ||
                /^[,;:]$/.test(leftward.ctrlSeq as string)
              ) //lookbehind for operator
            )
              leftward = leftward[L];
          }
          if (
            leftward instanceof SummationNotation &&
            leftward[R] instanceof SupSub
          ) {
            leftward = leftward[R] as MQNode;
            let leftwardR = leftward[R];
            if (
              leftwardR instanceof SupSub &&
              leftwardR.ctrlSeq != leftward.ctrlSeq
            )
              leftward = leftward[R];
          }

          if (leftward !== cursor[L] && !cursor.isTooDeep(1)) {
            let leftwardR = (leftward as MQNode)[R] as MQNode;
            let cursorL = cursor[L] as MQNode;

            this.replaces(
              new Fragment(leftwardR || cursor.parent.ends[L], cursorL)
            );
            cursor[L] = leftward;
          }
        }
        super.createLeftOf(cursor);
      }
    });

const AnsBuilder = () =>
  new MQSymbol('\\operatorname{ans}', '<span class="mq-ans">ans</span>', 'ans');
LatexCmds.ans = AnsBuilder;

const PercentOfBuilder = () =>
  new MQSymbol(
    '\\%\\operatorname{of}',
    '<span class="mq-nonSymbola mq-operator-name">% of </span>',
    'percent of'
  );
LatexCmds.percent = LatexCmds.percentof = PercentOfBuilder;

class SquareRoot extends MathCommand {
  ctrlSeq = '\\sqrt';
  htmlTemplate =
    '<span class="mq-non-leaf mq-sqrt-container">' +
    '<span class="mq-scaled mq-sqrt-prefix">' +
    SVG_SYMBOLS.sqrt.html +
    '</span>' +
    '<span class="mq-non-leaf mq-sqrt-stem">&0</span>' +
    '</span>';
  textTemplate = ['sqrt(', ')'];
  mathspeakTemplate = ['StartRoot,', ', EndRoot'];
  ariaLabel = 'root';
  parser() {
    return latexMathParser.optBlock
      .then(function (optBlock) {
        return latexMathParser.block.map(function (block) {
          var nthroot = new NthRoot();
          nthroot.blocks = [optBlock, block];
          optBlock.adopt(nthroot, 0, 0);
          block.adopt(nthroot, optBlock, 0);
          return nthroot;
        });
      })
      .or(super.parser());
  }
}
LatexCmds.sqrt = SquareRoot;

LatexCmds.hat = class Hat extends MathCommand {
  ctrlSeq = '\\hat';
  htmlTemplate =
    '<span class="mq-non-leaf">' +
    '<span class="mq-hat-prefix">^</span>' +
    '<span class="mq-hat-stem">&0</span>' +
    '</span>';
  textTemplate = ['hat(', ')'];
};

class NthRoot extends SquareRoot {
  htmlTemplate =
    '<span class="mq-nthroot-container mq-non-leaf">' +
    '<sup class="mq-nthroot mq-non-leaf">&0</sup>' +
    '<span class="mq-scaled mq-sqrt-container">' +
    '<span class="mq-sqrt-prefix mq-scaled">' +
    SVG_SYMBOLS.sqrt.html +
    '</span>' +
    '<span class="mq-sqrt-stem mq-non-leaf">&1</span>' +
    '</span>' +
    '</span>';
  textTemplate = ['sqrt[', '](', ')'];
  latex() {
    return (
      '\\sqrt[' +
      (this.ends[L] as MQNode).latex() +
      ']{' +
      (this.ends[R] as MQNode).latex() +
      '}'
    );
  }
  mathspeak() {
    var indexMathspeak = (this.ends[L] as MQNode).mathspeak();
    var radicandMathspeak = (this.ends[R] as MQNode).mathspeak();
    (this.ends[L] as MQNode).ariaLabel = 'Index';
    (this.ends[R] as MQNode).ariaLabel = 'Radicand';
    if (indexMathspeak === '3') {
      // cube root
      return 'Start Cube Root, ' + radicandMathspeak + ', End Cube Root';
    } else {
      return (
        'Root Index ' +
        indexMathspeak +
        ', Start Root, ' +
        radicandMathspeak +
        ', End Root'
      );
    }
  }
}
LatexCmds.nthroot = NthRoot;

LatexCmds.cbrt = class extends NthRoot {
  createLeftOf(cursor: Cursor) {
    super.createLeftOf(cursor);
    new Digit('3').createLeftOf(cursor);
    cursor.controller.moveRight();
  }
};

class DiacriticAbove extends MathCommand {
  constructor(ctrlSeq: string, symbol: string, textTemplate?: string[]) {
    var htmlTemplate =
      '<span class="mq-non-leaf">' +
      '<span class="mq-diacritic-above">' +
      symbol +
      '</span>' +
      '<span class="mq-diacritic-stem">&0</span>' +
      '</span>';
    super(ctrlSeq, htmlTemplate, textTemplate);
  }
}
LatexCmds.vec = () => new DiacriticAbove('\\vec', '&rarr;', ['vec(', ')']);
LatexCmds.tilde = () => new DiacriticAbove('\\tilde', '~', ['tilde(', ')']);

class DelimsNode extends MathCommand {
  delimjQs: $;
  contentjQ: $;

  jQadd(el: $) {
    super.jQadd(el);
    this.delimjQs = this.jQ.children(':first').add(this.jQ.children(':last'));
    this.contentjQ = this.jQ.children(':eq(1)');
    return this.jQ;
  }
}

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
class Bracket extends DelimsNode {
  side: BracketSide;
  sides: {
    [L]: { ch: string; ctrlSeq: string };
    [R]: { ch: string; ctrlSeq: string };
  };
  constructor(
    side: BracketSide,
    open: string,
    close: string,
    ctrlSeq: string,
    end: string
  ) {
    super('\\left' + ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {
      [L]: { ch: open, ctrlSeq: ctrlSeq },
      [R]: { ch: close, ctrlSeq: end },
    };
  }
  numBlocks() {
    return 1;
  }
  html() {
    var leftSymbol = this.getSymbol(L);
    var rightSymbol = this.getSymbol(R);

    // wait until now so that .side may
    this.htmlTemplate = // be set by createLeftOf or parser
      '<span class="mq-non-leaf mq-bracket-container">' +
      '<span style="width:' +
      leftSymbol.width +
      '" class="mq-scaled mq-bracket-l mq-paren' +
      (this.side === R ? ' mq-ghost' : '') +
      '">' +
      leftSymbol.html +
      '</span>' +
      '<span style="margin-left:' +
      leftSymbol.width +
      ';margin-right:' +
      rightSymbol.width +
      '" class="mq-bracket-middle mq-non-leaf">&0</span>' +
      '<span style="width:' +
      rightSymbol.width +
      '" class="mq-scaled mq-bracket-r mq-paren' +
      (this.side === L ? ' mq-ghost' : '') +
      '">' +
      rightSymbol.html +
      '</span>' +
      '</span>';
    return super.html();
  }
  getSymbol(side: BracketSide) {
    var ch = this.sides[side || R].ch as keyof typeof SVG_SYMBOLS;
    return SVG_SYMBOLS[ch] || { width: '0', html: '' };
  }
  latex() {
    return (
      '\\left' +
      this.sides[L].ctrlSeq +
      (this.ends[L] as MQNode).latex() +
      '\\right' +
      this.sides[R].ctrlSeq
    );
  }
  mathspeak(opts?: MathspeakOptions) {
    var open = this.sides[L].ch,
      close = this.sides[R].ch;
    if (open === '|' && close === '|') {
      this.mathspeakTemplate = ['StartAbsoluteValue,', ', EndAbsoluteValue'];
      this.ariaLabel = 'absolute value';
    } else if (opts && opts.createdLeftOf && this.side) {
      var ch = '';
      if (this.side === L) ch = this.textTemplate[0];
      else if (this.side === R) ch = this.textTemplate[1];
      return (
        (this.side === L ? 'left ' : 'right ') +
        BRACKET_NAMES[ch as keyof typeof BRACKET_NAMES]
      );
    } else {
      this.mathspeakTemplate = [
        'left ' + BRACKET_NAMES[open as keyof typeof BRACKET_NAMES] + ',',
        ', right ' + BRACKET_NAMES[close as keyof typeof BRACKET_NAMES],
      ];
      this.ariaLabel =
        BRACKET_NAMES[open as keyof typeof BRACKET_NAMES] + ' block';
    }
    return super.mathspeak();
  }
  matchBrack(
    opts: CursorOptions,
    expectedSide: BracketSide,
    node: NodeRef | undefined
  ) {
    // return node iff it's a matching 1-sided bracket of expected side (if any)
    return (
      node instanceof Bracket &&
      node.side &&
      node.side !== -expectedSide &&
      (!opts.restrictMismatchedBrackets ||
        OPP_BRACKS[
          this.sides[this.side as Direction].ch as keyof typeof BRACKET_NAMES
        ] === node.sides[node.side].ch ||
        { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) &&
      node
    );
  }
  closeOpposing(brack: Bracket) {
    brack.side = 0;
    brack.sides[this.side as Direction] = this.sides[this.side as Direction]; // copy over my info (may be
    var $brack = brack.delimjQs
      .eq(this.side === L ? 0 : 1) // mismatched, like [a, b))
      .removeClass('mq-ghost');
    this.replaceBracket($brack, this.side);
  }
  createLeftOf(cursor: Cursor) {
    var brack;
    if (!this.replacedFragment) {
      // unless wrapping seln in brackets,
      // check if next to or inside an opposing one-sided bracket
      var opts = cursor.options;
      if (this.sides[L].ch === '|') {
        // check both sides if I'm a pipe
        brack =
          this.matchBrack(opts, R, cursor[R]) ||
          this.matchBrack(opts, L, cursor[L]) ||
          this.matchBrack(opts, 0, cursor.parent.parent);
      } else {
        brack =
          this.matchBrack(
            opts,
            -this.side as BracketSide,
            cursor[-this.side as Direction]
          ) ||
          this.matchBrack(
            opts,
            -this.side as BracketSide,
            cursor.parent.parent
          );
      }
    }
    if (brack) {
      var side = (this.side = -brack.side as BracketSide); // may be pipe with .side not yet set
      this.closeOpposing(brack);
      if (brack === cursor.parent.parent && cursor[side as Direction]) {
        // move the stuff between
        new Fragment(
          cursor[side as Direction] as MQNode,
          cursor.parent.ends[side as Direction] as MQNode,
          -side as Direction
        ) // me and ghost outside
          .disown()
          .withDirAdopt(
            -side as Direction,
            brack.parent,
            brack,
            brack[side as Direction] as MQNode
          )
          .jQ.insDirOf(side as Direction, brack.jQ);
      }
      brack.bubble(function (node) {
        node.reflow();
        return undefined;
      });
    } else {
      (brack = this), (side = brack.side);
      if (brack.replacedFragment) brack.side = 0;
      // wrapping seln, don't be one-sided
      else if (cursor[-side as Direction]) {
        // elsewise, auto-expand so ghost is at far end
        brack.replaces(
          new Fragment(
            cursor[-side as Direction] as MQNode,
            cursor.parent.ends[-side as Direction] as MQNode,
            side as Direction
          )
        );
        cursor[-side as Direction] = 0;
      }
      super.createLeftOf(cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.ends[L] as MQNode);
    else cursor.insRightOf(brack);
  }
  placeCursor() {}
  unwrap() {
    (this.ends[L] as MQNode)
      .children()
      .disown()
      .adopt(this.parent, this, this[R])
      .jQ.insertAfter(this.jQ);
    this.remove();
  }
  deleteSide(side: Direction, outward: boolean, cursor: Cursor) {
    var parent = this.parent,
      sib = this[side],
      farEnd = parent.ends[side];

    if (side === this.side) {
      // deleting non-ghost of one-sided bracket, unwrap
      this.unwrap();
      sib
        ? cursor.insDirOf(-side as Direction, sib)
        : cursor.insAtDirEnd(side, parent);
      return;
    }

    var opts = cursor.options,
      wasSolid = !this.side;
    this.side = -side as Direction;
    // if deleting like, outer close-brace of [(1+2)+3} where inner open-paren
    if (this.matchBrack(opts, side, (this.ends[L] as MQNode).ends[this.side])) {
      // is ghost,
      this.closeOpposing(
        (this.ends[L] as MQNode).ends[this.side as Direction] as Bracket
      ); // then become [1+2)+3
      var origEnd = (this.ends[L] as MQNode).ends[side];
      this.unwrap();
      if (origEnd) origEnd.siblingCreated(cursor.options, side);
      if (sib) {
        cursor.insDirOf(-side as Direction, sib);
      } else {
        cursor.insAtDirEnd(side, parent);
      }
    } else {
      // if deleting like, inner close-brace of ([1+2}+3) where outer

      if (this.matchBrack(opts, side, this.parent.parent)) {
        // open-paren is

        (this.parent.parent as Bracket).closeOpposing(this); // ghost, then become [1+2+3)
        (this.parent.parent as Bracket).unwrap();
      } // else if deleting outward from a solid pair, unwrap
      else if (outward && wasSolid) {
        this.unwrap();
        sib
          ? cursor.insDirOf(-side as Direction, sib)
          : cursor.insAtDirEnd(side, parent);
        return;
      } else {
        // else deleting just one of a pair of brackets, become one-sided
        this.sides[side] = getOppBracketSide(this);
        var $brack = this.delimjQs
          .removeClass('mq-ghost')
          .eq(side === L ? 0 : 1)
          .addClass('mq-ghost');
        this.replaceBracket($brack, side);
      }
      if (sib) {
        // auto-expand so ghost is at far end
        var origEnd = (this.ends[L] as MQNode).ends[side];
        new Fragment(sib, farEnd as MQNode, -side as Direction)
          .disown()
          .withDirAdopt(
            -side as Direction,
            this.ends[L] as MQNode,
            origEnd as MQNode,
            0
          )
          .jQ.insAtDirEnd(
            side,
            (this.ends[L] as MQNode).jQ.removeClass('mq-empty')
          );
        if (origEnd) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side as Direction, sib);
      } // didn't auto-expand, cursor goes just outside or just inside parens
      else
        outward
          ? cursor.insDirOf(side, this)
          : cursor.insAtDirEnd(side, this.ends[L] as MQNode);
    }
  }
  replaceBracket($brack: $, side: BracketSide) {
    var symbol = this.getSymbol(side);
    $brack.html(symbol.html).css('width', symbol.width);

    if (side === L) {
      $brack.next().css('margin-left', symbol.width);
    } else {
      $brack.prev().css('margin-right', symbol.width);
    }
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    this.deleteSide(-dir as Direction, false, cursor);
  }
  finalizeTree() {
    (this.ends[L] as MQNode).deleteOutOf = function (
      dir: Direction,
      cursor: Cursor
    ) {
      (this.parent as Bracket).deleteSide(dir, true, cursor);
    };
    // FIXME HACK: after initial creation/insertion, finalizeTree would only be
    // called if the paren is selected and replaced, e.g. by LiveFraction
    this.finalizeTree = this.intentionalBlur = function () {
      this.delimjQs.eq(this.side === L ? 1 : 0).removeClass('mq-ghost');
      this.side = 0;
    };
  }
  siblingCreated(_opts: Options, dir: Direction) {
    // if something typed between ghost and far
    if (dir === -this.side) this.finalizeTree(); // end of its block, solidify
  }
}

function getOppBracketSide(bracket: Bracket) {
  var side = bracket.side as Direction;
  var data = bracket.sides[side];
  return {
    ch: OPP_BRACKS[data.ch as keyof typeof OPP_BRACKS],
    ctrlSeq: OPP_BRACKS[data.ctrlSeq as keyof typeof OPP_BRACKS],
  };
}

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
  '\\lVert ': '\\rVert ',
  '\\rVert ': '\\lVert ',
};

var BRACKET_NAMES = {
  '&lang;': 'angle-bracket',
  '&rang;': 'angle-bracket',
  '|': 'pipe',
};

function bindCharBracketPair(
  open: keyof typeof OPP_BRACKS,
  ctrlSeq: string,
  name: string
) {
  var ctrlSeq = ctrlSeq || open;
  var close = OPP_BRACKS[open];
  var end = OPP_BRACKS[ctrlSeq as keyof typeof OPP_BRACKS];
  CharCmds[open] = () => new Bracket(L, open, close, ctrlSeq, end);
  CharCmds[close] = () => new Bracket(R, open, close, ctrlSeq, end);
  BRACKET_NAMES[open as keyof typeof BRACKET_NAMES] = BRACKET_NAMES[
    close as keyof typeof BRACKET_NAMES
  ] = name;
}
bindCharBracketPair('(', '', 'parenthesis');
bindCharBracketPair('[', '', 'bracket');
bindCharBracketPair('{', '\\{', 'brace');
LatexCmds.langle = () =>
  new Bracket(L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = () =>
  new Bracket(R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = () => new Bracket(L, '|', '|', '|', '|');
LatexCmds.lVert = () =>
  new Bracket(L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.rVert = () =>
  new Bracket(R, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');

LatexCmds.left = class extends MathCommand {
  parser() {
    var regex = Parser.regex;
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace
      .then(regex(/^(?:[([|]|\\\{|\\langle(?![a-zA-Z])|\\lVert(?![a-zA-Z]))/))
      .then(function (ctrlSeq) {
        var open = ctrlSeq.replace(/^\\/, '');
        if (ctrlSeq == '\\langle') {
          open = '&lang;';
          ctrlSeq = ctrlSeq + ' ';
        }
        if (ctrlSeq == '\\lVert') {
          open = '&#8741;';
          ctrlSeq = ctrlSeq + ' ';
        }
        return latexMathParser.then(function (block) {
          return string('\\right')
            .skip(optWhitespace)
            .then(
              regex(/^(?:[\])|]|\\\}|\\rangle(?![a-zA-Z])|\\rVert(?![a-zA-Z]))/)
            )
            .map(function (end) {
              var close = end.replace(/^\\/, '');
              if (end == '\\rangle') {
                close = '&rang;';
                end = end + ' ';
              }
              if (end == '\\rVert') {
                close = '&#8741;';
                end = end + ' ';
              }
              var cmd = new Bracket(0, open, close, ctrlSeq, end);
              cmd.blocks = [block];
              block.adopt(cmd, 0, 0);
              return cmd;
            });
        });
      });
  }
};

LatexCmds.right = class extends MathCommand {
  parser() {
    return Parser.fail('unmatched \\right');
  }
};

var leftBinomialSymbol = SVG_SYMBOLS['('];
var rightBinomialSymbol = SVG_SYMBOLS[')'];
class Binomial extends DelimsNode {
  ctrlSeq = '\\binom';
  htmlTemplate =
    '<span class="mq-non-leaf mq-bracket-container">' +
    '<span style="width:' +
    leftBinomialSymbol.width +
    '" class="mq-paren mq-bracket-l mq-scaled">' +
    leftBinomialSymbol.html +
    '</span>' +
    '<span style="margin-left:' +
    leftBinomialSymbol.width +
    '; margin-right:' +
    rightBinomialSymbol.width +
    ';" class="mq-non-leaf mq-bracket-middle">' +
    '<span class="mq-array mq-non-leaf">' +
    '<span>&0</span>' +
    '<span>&1</span>' +
    '</span>' +
    '</span>' +
    '<span style="width:' +
    rightBinomialSymbol.width +
    '" class="mq-paren mq-bracket-r mq-scaled">' +
    rightBinomialSymbol.html +
    '</span>' +
    '</span>';
  textTemplate = ['choose(', ',', ')'];
  mathspeakTemplate = ['StartBinomial,', 'Choose', ', EndBinomial'];
  ariaLabel = 'binomial';
}

LatexCmds.binom = LatexCmds.binomial = Binomial;

LatexCmds.choose = class extends Binomial {
  createLeftOf(cursor: Cursor) {
    LiveFraction.prototype.createLeftOf(cursor);
  }
};

class MathFieldNode extends MathCommand {
  name: string;
  ctrlSeq = '\\MathQuillMathField';
  htmlTemplate =
    '<span class="mq-editable-field">' +
    '<span class="mq-root-block">&0</span>' +
    '</span>';
  parser() {
    var self = this,
      string = Parser.string,
      regex = Parser.regex,
      succeed = Parser.succeed;
    return string('[')
      .then(regex(/^[a-z][a-z0-9]*/i))
      .skip(string(']'))
      .map(function (name) {
        self.name = name;
      })
      .or(succeed(undefined))
      .then(super.parser());
  }
  finalizeTree(options: CursorOptions) {
    var ctrlr = new Controller(
      this.ends[L] as ControllerRoot,
      this.jQ,
      options
    );
    ctrlr.KIND_OF_MQ = 'MathField';
    ctrlr.editable = true;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(ctrlr.root);
    RootBlockMixin(ctrlr.root);
  }
  registerInnerField(innerFields: InnerFields, MathField: InnerMathField) {
    const controller = (this.ends[L] as RootMathBlock).controller;
    const newField = new MathField(controller);
    innerFields[this.name] = newField;
    innerFields.push(newField);
  }
  latex() {
    return (this.ends[L] as MQNode).latex();
  }
  text() {
    return (this.ends[L] as MQNode).text();
  }
}
LatexCmds.editable = LatexCmds.MathQuillMathField = MathFieldNode; // backcompat with before cfd3620 on #233

// Embed arbitrary things
// Probably the closest DOM analogue would be an iframe?
// From MathQuill's perspective, it's a MQSymbol, it can be
// anywhere and the cursor can go around it but never in it.
// Create by calling public API method .dropEmbedded(),
// or by calling the global public API method .registerEmbed()
// and rendering LaTeX like \embed{registeredName} (see test).
class EmbedNode extends MQSymbol {
  setOptions(options: EmbedOptions) {
    function noop() {
      return '';
    }
    this.text = options.text || noop;
    this.htmlTemplate = options.htmlString || '';
    this.latex = options.latex || noop;
    return this;
  }
  parser() {
    var self = this,
      string = Parser.string,
      regex = Parser.regex,
      succeed = Parser.succeed;
    return string('{')
      .then(regex(/^[a-z][a-z0-9]*/i))
      .skip(string('}'))
      .then(function (name) {
        // the chars allowed in the optional data block are arbitrary other than
        // excluding curly braces and square brackets (which'd be too confusing)
        return string('[')
          .then(regex(/^[-\w\s]*/))
          .skip(string(']'))
          .or(succeed(undefined))
          .map(function (data) {
            return self.setOptions(EMBEDS[name](data));
          });
      });
  }
}
LatexCmds.embed = EmbedNode;
