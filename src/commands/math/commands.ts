/***************************
 * Commands and Operators.
 **************************/
var SVG_SYMBOLS = {
  sqrt: {
    width: '',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 32 54' }, [
        h('path', {
          d: 'M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33',
        }),
      ]),
  },
  '|': {
    width: '.4em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M4.4 0 L4.4 54 L5.6 54 L5.6 0' }),
      ]),
  },
  '[': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
        h('path', { d: 'M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1' }),
      ]),
  },
  ']': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
        h('path', { d: 'M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1' }),
      ]),
  },
  '(': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
        h('path', {
          d: 'M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0',
        }),
      ]),
  },
  ')': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
        h('path', {
          d: 'M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0',
        }),
      ]),
  },
  '{': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
        h('path', {
          d: 'M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0',
        }),
      ]),
  },
  '}': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
        h('path', {
          d: 'M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0',
        }),
      ]),
  },
  '&#8741;': {
    width: '.7em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0' }),
      ]),
  },
  '&lang;': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0' }),
      ]),
  },
  '&rang;': {
    width: '.55em',
    html: () =>
      h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
        h('path', { d: 'M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0' }),
      ]),
  },
};

class Style extends MathCommand {
  shouldNotSpeakDelimiters: boolean | undefined;

  constructor(
    ctrlSeq: string,
    tagName: HTMLTagName,
    attrs: { class: string },
    ariaLabel?: string,
    opts?: { shouldNotSpeakDelimiters: boolean }
  ) {
    super(
      ctrlSeq,
      new DOMView(1, (blocks) => h.block(tagName, attrs, blocks[0]))
    );
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
    super('\\mathrm', 'span', { class: 'mq-roman mq-font' }, 'Roman Font', {
      shouldNotSpeakDelimiters: true,
    });
  }
  isTextBlock() {
    return true;
  }
};
LatexCmds.mathit = () =>
  new Style('\\mathit', 'i', { class: 'mq-font' }, 'Italic Font');
LatexCmds.mathbf = () =>
  new Style('\\mathbf', 'b', { class: 'mq-font' }, 'Bold Font');
LatexCmds.mathsf = () =>
  new Style(
    '\\mathsf',
    'span',
    { class: 'mq-sans-serif mq-font' },
    'Serif Font'
  );
LatexCmds.mathtt = () =>
  new Style('\\mathtt', 'span', { class: 'mq-monospace mq-font' }, 'Math Text');
//text-decoration
LatexCmds.underline = () =>
  new Style(
    '\\underline',
    'span',
    { class: 'mq-non-leaf mq-underline' },
    'Underline'
  );
LatexCmds.overline = LatexCmds.bar = () =>
  new Style(
    '\\overline',
    'span',
    { class: 'mq-non-leaf mq-overline' },
    'Overline'
  );
LatexCmds.overrightarrow = () =>
  new Style(
    '\\overrightarrow',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-right' },
    'Over Right Arrow'
  );
LatexCmds.overleftarrow = () =>
  new Style(
    '\\overleftarrow',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-left' },
    'Over Left Arrow'
  );
LatexCmds.overleftrightarrow = () =>
  new Style(
    '\\overleftrightarrow ',
    'span',
    { class: 'mq-non-leaf mq-overarrow mq-arrow-leftright' },
    'Over Left and Right Arrow'
  );
LatexCmds.overarc = () =>
  new Style(
    '\\overarc',
    'span',
    { class: 'mq-non-leaf mq-overarc' },
    'Over Arc'
  );
LatexCmds.dot = () => {
  return new MathCommand(
    '\\dot',
    new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-dot-recurring-inner' }, [
          h('span', { class: 'mq-dot-recurring' }, [h.text(U_DOT_ABOVE)]),
          h.block('span', { class: 'mq-empty-box' }, blocks[0]),
        ]),
      ])
    )
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
    this.domView = new DOMView(1, (blocks) =>
      h.block(
        'span',
        { class: 'mq-textcolor', style: "color:' + color + '" },
        blocks[0]
      )
    );
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
        this.domView = new DOMView(1, (blocks) =>
          h.block('span', { class: `mq-class ${cls}` }, blocks[0])
        );
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
  if (!children || !children.getEnd(L)) return '';

  var chars = '';
  for (
    var sibling: NodeRef | undefined = children.getEnd(L);
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

  protected ends: Ends<MathBlock>;

  setEnds(ends: Ends<MathBlock>) {
    pray(
      'SupSub ends must be MathBlocks',
      ends[L] instanceof MathBlock && ends[R] instanceof MathBlock
    );
    this.ends = ends;
  }

  getEnd(dir: Direction): MathBlock {
    return this.ends[dir];
  }

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
            src
              .domFrag()
              .children()
              .insAtDirEnd(-dir as Direction, dest.domFrag().oneElement());
            var children = src.children().disown();
            pt = new Point(dest, children.getEnd(R), dest.getEnd(L));
            if (dir === L) children.adopt(dest, dest.getEnd(R), 0);
            else children.adopt(dest, 0, dest.getEnd(L));
          } else {
            pt = new Point(dest, 0, dest.getEnd(L));
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
    var endsL = this.getEnd(L);
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
      var cmd = this.sub.getEnd(-dir as Direction);
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
      block.setDOMFrag(
        domFrag(h('span', { class: 'mq-sup' }))
          .append(block.domFrag().children())
          .prependTo(this.domFrag().oneElement())
      );
      NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
    } else {
      this.sub = this.downInto = (this.sup as MQNode).downOutOf = block;
      block.adopt(this, 0, this.sup as MQNode).upOutOf = this.sup;
      this.domFrag().removeClass('mq-sup-only');
      block.setDOMFrag(
        domFrag(h('span', { class: 'mq-sub' }))
          .append(block.domFrag().children())
          .appendTo(this.domFrag().oneElement())
      );
      NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
      this.domFrag().append(
        domFrag(
          h('span', { style: 'display:inline-block;width:0' }, [
            h.text(U_ZERO_WIDTH_SPACE),
          ])
        )
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
            var end = this.getEnd(dir);
            this.children()
              .disown()
              .withDirAdopt(
                dir,
                cursor.parent,
                cursor[dir],
                cursor[-dir as Direction]
              )
              .domFrag()
              .insDirOf(-dir as Direction, cursor.domFrag());
            cursor[-dir as Direction] = end;
          }
          cmd.supsub = oppositeSupsub;
          delete cmd[supsub];
          delete cmd[`${updown}Into`];
          const cmdOppositeSupsub = cmd[oppositeSupsub]!;
          cmdOppositeSupsub[`${updown}OutOf`] = insLeftOfMeUnlessAtEnd;
          delete (cmdOppositeSupsub as any).deleteOutOf; // TODO - refactor so this method can be optional
          if (supsub === 'sub') {
            cmd.domFrag().addClass('mq-sup-only').children().last().remove();
          }
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

  domView = new DOMView(1, (blocks) =>
    h('span', { class: 'mq-supsub mq-non-leaf' }, [
      h.block('span', { class: 'mq-sub' }, blocks[0]),
      h('span', { style: 'display:inline-block;width:0' }, [
        h.text(U_ZERO_WIDTH_SPACE),
      ]),
    ])
  );

  textTemplate = ['_'];

  mathspeakTemplate = ['Subscript,', ', Baseline'];

  ariaLabel = 'subscript';

  finalizeTree() {
    this.downInto = this.sub = this.getEnd(L);
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

      domView = new DOMView(1, (blocks) =>
        h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
          h.block('span', { class: 'mq-sup' }, blocks[0]),
        ])
      );

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
        this.upInto = this.sup = this.getEnd(R);
        this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
        super.finalizeTree();
      }
    };

class SummationNotation extends MathCommand {
  constructor(ch: string, symbol: string, ariaLabel?: string) {
    super();

    this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
    var domView = new DOMView(2, (blocks) =>
      h('span', { class: 'mq-large-operator mq-non-leaf' }, [
        h('span', { class: 'mq-to' }, [h.block('span', {}, blocks[1])]),
        h('big', {}, [h.text(symbol)]),
        h('span', { class: 'mq-from' }, [h.block('span', {}, blocks[0])]),
      ])
    );

    MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(this, ch, domView);
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
      simplify(this.getEnd(L).latex()) +
      '^' +
      simplify(this.getEnd(R).latex())
    );
  }
  mathspeak() {
    return (
      'Start ' +
      this.ariaLabel +
      ' from ' +
      this.getEnd(L).mathspeak() +
      ' to ' +
      this.getEnd(R).mathspeak() +
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
      blocks[i].adopt(self, self.getEnd(R), 0);
    }

    return optWhitespace
      .then(string('_').or(string('^')))
      .then(function (supOrSub) {
        var child = blocks[supOrSub === '_' ? 0 : 1];
        return block.then(function (block) {
          block.children().adopt(child, child.getEnd(R), 0);
          return succeed(self);
        });
      })
      .many()
      .result(self);
  }
  finalizeTree() {
    var endsL = this.getEnd(L);
    var endsR = this.getEnd(R);

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
    () => new SummationNotation('\\sum ', U_NARY_SUMMATION, 'sum');

LatexCmds['∏'] =
  LatexCmds.prod =
  LatexCmds.product =
    () => new SummationNotation('\\prod ', U_NARY_PRODUCT, 'product');

LatexCmds.coprod = LatexCmds.coproduct = () =>
  new SummationNotation('\\coprod ', U_NARY_COPRODUCT, 'co product');

LatexCmds['∫'] =
  LatexCmds['int'] =
  LatexCmds.integral =
    class extends SummationNotation {
      constructor() {
        super('\\int ', '', 'integral');

        this.ariaLabel = 'integral';
        this.domView = new DOMView(2, (blocks) =>
          h('span', { class: 'mq-int mq-non-leaf' }, [
            h('big', {}, [h.text(U_INTEGRAL)]),
            h('span', { class: 'mq-supsub mq-non-leaf' }, [
              h('span', { class: 'mq-sup' }, [
                h.block('span', { class: 'mq-sup-inner' }, blocks[1]),
              ]),
              h.block('span', { class: 'mq-sub' }, blocks[0]),
              h('span', { style: 'display:inline-block;width:0' }, [
                h.text(U_ZERO_WIDTH_SPACE),
              ]),
            ]),
          ])
        );
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
      domView = new DOMView(2, (blocks) =>
        h('span', { class: 'mq-fraction mq-non-leaf' }, [
          h.block('span', { class: 'mq-numerator' }, blocks[0]),
          h.block('span', { class: 'mq-denominator' }, blocks[1]),
          h('span', { style: 'display:inline-block;width:0' }, [
            h.text(U_ZERO_WIDTH_SPACE),
          ]),
        ])
      );
      textTemplate = ['(', ')/(', ')'];
      finalizeTree() {
        const endsL = this.getEnd(L);
        const endsR = this.getEnd(R);
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

        var numText = getCtrlSeqsFromBlock(this.getEnd(L));
        var denText = getCtrlSeqsFromBlock(this.getEnd(R));

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
            output += this.getEnd(L).mathspeak() + ' ' + newDenSpeech;
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
              new Fragment(leftwardR || cursor.parent.getEnd(L), cursorL)
            );
            cursor[L] = leftward;
          }
        }
        super.createLeftOf(cursor);
      }
    });

const AnsBuilder = () =>
  new MQSymbol(
    '\\operatorname{ans}',
    h('span', { class: 'mq-ans' }, [h.text('ans')]),
    'ans'
  );
LatexCmds.ans = AnsBuilder;

const PercentOfBuilder = () =>
  new MQSymbol(
    '\\%\\operatorname{of}',
    h('span', { class: 'mq-nonSymbola mq-operator-name' }, [h.text('% of ')]),
    'percent of'
  );
LatexCmds.percent = LatexCmds.percentof = PercentOfBuilder;

class SquareRoot extends MathCommand {
  ctrlSeq = '\\sqrt';
  domView = new DOMView(1, (blocks) =>
    h('span', { class: 'mq-non-leaf mq-sqrt-container' }, [
      h('span', { class: 'mq-scaled mq-sqrt-prefix' }, [
        SVG_SYMBOLS.sqrt.html(),
      ]),
      h.block('span', { class: 'mq-non-leaf mq-sqrt-stem' }, blocks[0]),
    ])
  );
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
  domView = new DOMView(1, (blocks) =>
    h('span', { class: 'mq-non-leaf' }, [
      h('span', { class: 'mq-hat-prefix' }, [h.text('^')]),
      h.block('span', { class: 'mq-hat-stem' }, blocks[0]),
    ])
  );

  textTemplate = ['hat(', ')'];
};

class NthRoot extends SquareRoot {
  domView = new DOMView(2, (blocks) =>
    h('span', { class: 'mq-nthroot-container mq-non-leaf' }, [
      h.block('sup', { class: 'mq-nthroot mq-non-leaf' }, blocks[0]),
      h('span', { class: 'mq-scaled mq-sqrt-container' }, [
        h('span', { class: 'mq-sqrt-prefix mq-scaled' }, [
          SVG_SYMBOLS.sqrt.html(),
        ]),
        h.block('span', { class: 'mq-sqrt-stem mq-non-leaf' }, blocks[1]),
      ]),
    ])
  );

  textTemplate = ['sqrt[', '](', ')'];
  latex() {
    return (
      '\\sqrt[' + this.getEnd(L).latex() + ']{' + this.getEnd(R).latex() + '}'
    );
  }
  mathspeak() {
    var indexMathspeak = this.getEnd(L).mathspeak();
    var radicandMathspeak = this.getEnd(R).mathspeak();
    this.getEnd(L).ariaLabel = 'Index';
    this.getEnd(R).ariaLabel = 'Radicand';
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
    var domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-diacritic-above' }, [h.text(symbol)]),
        h.block('span', { class: 'mq-diacritic-stem' }, blocks[0]),
      ])
    );
    super(ctrlSeq, domView, textTemplate);
  }
}
LatexCmds.vec = () => new DiacriticAbove('\\vec', '&rarr;', ['vec(', ')']);
LatexCmds.tilde = () => new DiacriticAbove('\\tilde', '~', ['tilde(', ')']);

class DelimsNode extends MathCommand {
  delimFrags: Ends<DOMFragment>;

  setDOMFrag(frag: DOMFragment) {
    super.setDOMFrag(frag);
    const children = this.domFrag().children();
    if (!children.isEmpty()) {
      this.delimFrags = {
        [L]: children.first(),
        [R]: children.last(),
      };
    }
    return this;
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
    return 1 as const;
  }
  html() {
    var leftSymbol = this.getSymbol(L);
    var rightSymbol = this.getSymbol(R);

    // wait until now so that .side may
    this.domView = new DOMView(1, (blocks) =>
      h(
        // be set by createLeftOf or parser
        'span',
        { class: 'mq-non-leaf mq-bracket-container' },
        [
          h(
            'span',
            {
              style: 'width:' + leftSymbol.width,
              class:
                'mq-scaled mq-bracket-l mq-paren' +
                (this.side === R ? ' mq-ghost' : ''),
            },
            [leftSymbol.html()]
          ),
          h.block(
            'span',
            {
              style:
                'margin-left:' +
                leftSymbol.width +
                ';margin-right:' +
                rightSymbol.width,
              class: 'mq-bracket-middle mq-non-leaf',
            },
            blocks[0]
          ),
          h(
            'span',
            {
              style: 'width:' + rightSymbol.width,
              class:
                'mq-scaled mq-bracket-r mq-paren' +
                (this.side === L ? ' mq-ghost' : ''),
            },
            [rightSymbol.html()]
          ),
        ]
      )
    );
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
      this.getEnd(L).latex() +
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
    var $brack = brack.delimFrags[this.side === L ? L : R] // mismatched, like [a, b))
      .removeClass('mq-ghost')
      .toJQ();
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
          cursor[side as Direction],
          cursor.parent.getEnd(side as Direction),
          -side as Direction
        ) // me and ghost outside
          .disown()
          .withDirAdopt(
            -side as Direction,
            brack.parent,
            brack,
            brack[side as Direction]
          )
          .domFrag()
          .insDirOf(side as Direction, brack.domFrag());
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
            cursor[-side as Direction],
            cursor.parent.getEnd(-side as Direction),
            side as Direction
          )
        );
        cursor[-side as Direction] = 0;
      }
      super.createLeftOf(cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.getEnd(L));
    else cursor.insRightOf(brack);
  }
  placeCursor() {}
  unwrap() {
    this.getEnd(L)
      .children()
      .disown()
      .adopt(this.parent, this, this[R])
      .domFrag()
      .insertAfter(this.domFrag());
    this.remove();
  }
  deleteSide(side: Direction, outward: boolean, cursor: Cursor) {
    var parent = this.parent,
      sib = this[side],
      farEnd = parent.getEnd(side);

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
    if (this.matchBrack(opts, side, this.getEnd(L).getEnd(this.side))) {
      // is ghost,
      this.closeOpposing(
        this.getEnd(L).getEnd(this.side as Direction) as Bracket
      ); // then become [1+2)+3
      var origEnd = this.getEnd(L).getEnd(side);
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
        this.delimFrags[L].removeClass('mq-ghost');
        this.delimFrags[R].removeClass('mq-ghost');
        var $brack = this.delimFrags[side].addClass('mq-ghost').toJQ();
        this.replaceBracket($brack, side);
      }
      if (sib) {
        // auto-expand so ghost is at far end
        const leftEnd = this.getEnd(L);
        var origEnd = leftEnd.getEnd(side);
        leftEnd.domFrag().removeClass('mq-empty');
        new Fragment(sib, farEnd, -side as Direction)
          .disown()
          .withDirAdopt(-side as Direction, leftEnd, origEnd, 0)
          .domFrag()
          .insAtDirEnd(side, leftEnd.domFrag().oneElement());
        if (origEnd) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side as Direction, sib);
      } // didn't auto-expand, cursor goes just outside or just inside parens
      else
        outward
          ? cursor.insDirOf(side, this)
          : cursor.insAtDirEnd(side, this.getEnd(L));
    }
  }
  replaceBracket($brack: $, side: BracketSide) {
    var symbol = this.getSymbol(side);
    jQToDOMFragment($brack).children().replaceWith(domFrag(symbol.html()));
    $brack.css('width', symbol.width);

    if (side === L) {
      jQToDOMFragment($brack).next().toJQ().css('margin-left', symbol.width);
    } else {
      jQToDOMFragment($brack).prev().toJQ().css('margin-right', symbol.width);
    }
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    this.deleteSide(-dir as Direction, false, cursor);
  }
  finalizeTree() {
    this.getEnd(L).deleteOutOf = function (dir: Direction, cursor: Cursor) {
      (this.parent as Bracket).deleteSide(dir, true, cursor);
    };
    // FIXME HACK: after initial creation/insertion, finalizeTree would only be
    // called if the paren is selected and replaced, e.g. by LiveFraction
    this.finalizeTree = this.intentionalBlur = function () {
      this.delimFrags[this.side === L ? R : L].removeClass('mq-ghost');
      this.side = 0;
    };
  }
  siblingCreated(_opts: CursorOptions, dir: Direction) {
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
  domView = new DOMView(2, (blocks) =>
    h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftBinomialSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftBinomialSymbol.html()]
      ),
      h(
        'span',
        {
          style:
            'margin-left:' +
            leftBinomialSymbol.width +
            '; margin-right:' +
            rightBinomialSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [
          h('span', { class: 'mq-array mq-non-leaf' }, [
            h.block('span', {}, blocks[0]),
            h.block('span', {}, blocks[1]),
          ]),
        ]
      ),
      h(
        'span',
        {
          style: 'width:' + rightBinomialSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightBinomialSymbol.html()]
      ),
    ])
  );

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
  domView = new DOMView(1, (blocks) => {
    return h('span', { class: 'mq-editable-field' }, [
      h.block(
        'span',
        { class: 'mq-root-block', 'aria-hidden': 'true' },
        blocks[0]
      ),
    ]);
  });
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
      this.getEnd(L) as ControllerRoot,
      this.domFrag(),
      options
    );
    ctrlr.KIND_OF_MQ = 'MathField';
    ctrlr.editable = true;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(ctrlr.root);
    RootBlockMixin(ctrlr.root);

    // MathQuill applies aria-hidden to .mq-root-block containers
    // because these contain math notation that screen readers can't
    // interpret directly. MathQuill use an aria-live region as a
    // sibling of these block containers to provide an alternative
    // representation for screen readers
    //
    // MathFieldNodes have their own focusable text aria and aria live
    // region, so it is incorrect for any parent of the editable field
    // to have an aria-hidden property
    //
    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden
    //
    // Handle this by recursively walking the parents of this element
    // until we hit a root block, and if we hit any parent with
    // aria-hidden="true", removing the property from the parent and
    // pushing it down to each of the parents children. This should
    // result in no parent of this node having aria-hidden="true", but
    // should keep as much of what was previously hidden hidden as
    // possible while obeying this constraint
    function pushDownAriaHidden(node: ParentNode) {
      if (node.parentNode && !domFrag(node).hasClass('mq-root-block')) {
        pushDownAriaHidden(node.parentNode);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          domFrag(node)
            .children()
            .eachElement((child) => {
              child.setAttribute('aria-hidden', 'true');
            });
        }
      }
    }

    pushDownAriaHidden(this.domFrag().parent().oneElement());
    this.domFrag().oneElement().removeAttribute('aria-hidden');
  }
  registerInnerField(innerFields: InnerFields, MathField: InnerMathField) {
    const controller = (this.getEnd(L) as RootMathBlock).controller;
    const newField = new MathField(controller);
    innerFields[this.name] = newField;
    innerFields.push(newField);
  }
  latex() {
    return this.getEnd(L).latex();
  }
  text() {
    return this.getEnd(L).text();
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
    this.domView = new DOMView(0, () => parseHTML(options.htmlString || ''));
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
