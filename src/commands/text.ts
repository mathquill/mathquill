/*************************************************
 * Abstract classes of text blocks
 ************************************************/

/**
 * Blocks of plain text, with one or two TextPiece's as children.
 * Represents flat strings of typically serif-font Roman characters, as
 * opposed to hierchical, nested, tree-structured math.
 * Wraps a single HTMLSpanElement.
 */
class TextBlock extends MQNode {
  ctrlSeq = '\\text';
  ariaLabel = 'Text';
  replacedText?: string;
  anticursorPosition?: number;

  replaces(replacedText: Fragment | string) {
    if (replacedText instanceof Fragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string') this.replacedText = replacedText;
  }

  jQadd(jQ: $) {
    super.jQadd(jQ);
    const endsL = this.ends[L];
    if (endsL) {
      const child = this.jQ[0].firstChild;
      if (child) {
        endsL.jQadd(child);
      }
    }
    return this.jQ;
  }

  createLeftOf(cursor: Cursor) {
    var textBlock = this;
    super.createLeftOf(cursor);

    cursor.insAtRightEnd(textBlock);

    if (textBlock.replacedText)
      for (var i = 0; i < textBlock.replacedText.length; i += 1)
        textBlock.write(cursor, textBlock.replacedText.charAt(i));

    const textBlockR = textBlock[R];
    if (textBlockR) textBlockR.siblingCreated(cursor.options, L);
    const textBlockL = textBlock[L];
    if (textBlockL) textBlockL.siblingCreated(cursor.options, R);
    textBlock.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  parser() {
    var textBlock = this;

    // TODO: correctly parse text mode
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{'))
      .then(regex(/^[^}]*/))
      .skip(string('}'))
      .map(function (text) {
        if (text.length === 0) return new Fragment();

        new TextPiece(text).adopt(textBlock, 0, 0);
        return textBlock;
      }) as ParserAny;
  }

  textContents() {
    return this.foldChildren('', function (text, child) {
      return text + (child as TextPiece).textStr;
    });
  }
  text() {
    return '"' + this.textContents() + '"';
  }
  latex() {
    var contents = this.textContents();
    if (contents.length === 0) return '';
    return (
      this.ctrlSeq +
      '{' +
      contents.replace(/\\/g, '\\backslash ').replace(/[{}]/g, '\\$&') +
      '}'
    );
  }
  html() {
    return (
      '<span class="mq-text-mode" mathquill-command-id=' +
      this.id +
      '>' +
      this.textContents() +
      '</span>'
    );
  }

  mathspeakTemplate = ['StartText', 'EndText'];
  mathspeak(opts?: MathspeakOptions) {
    if (opts && opts.ignoreShorthand) {
      return (
        this.mathspeakTemplate[0] +
        ', ' +
        this.textContents() +
        ', ' +
        this.mathspeakTemplate[1]
      );
    } else {
      return this.textContents();
    }
  }
  isTextBlock() {
    return true;
  }

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  moveTowards(dir: Direction, cursor: Cursor) {
    cursor.insAtDirEnd(-dir as Direction, this);
    cursor.controller.aria
      .queueDirEndOf(-dir as Direction)
      .queue(cursor.parent, true);
  }
  moveOutOf(dir: Direction, cursor: Cursor) {
    cursor.insDirOf(dir, this);
    cursor.controller.aria.queueDirOf(dir).queue(this);
  }
  unselectInto(dir: Direction, cursor: Cursor) {
    this.moveTowards(dir, cursor);
  }

  // TODO: make these methods part of a shared mixin or something.
  selectTowards(dir: Direction, cursor: Cursor) {
    MathCommand.prototype.selectTowards.call(this, dir, cursor);
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    MathCommand.prototype.deleteTowards.call(this, dir, cursor);
  }

  selectOutOf(dir: Direction, cursor: Cursor) {
    cursor.insDirOf(dir, this);
  }
  deleteOutOf(_dir: Direction, cursor: Cursor) {
    // backspace and delete at ends of block don't unwrap
    if (this.isEmpty()) cursor.insRightOf(this);
  }
  write(cursor: Cursor, ch: string) {
    cursor.show().deleteSelection();

    if (ch !== '$') {
      let cursorL = cursor[L];
      if (!cursorL) new TextPiece(ch).createLeftOf(cursor);
      else if (cursorL instanceof TextPiece) cursorL.appendText(ch);
    } else if (this.isEmpty()) {
      cursor.insRightOf(this);
      new VanillaSymbol('\\$', '$').createLeftOf(cursor);
    } else if (!cursor[R]) cursor.insRightOf(this);
    else if (!cursor[L]) cursor.insLeftOf(this);
    else {
      // split apart
      var leftBlock = new TextBlock();
      var leftPc = this.ends[L];
      if (leftPc) {
        leftPc.disown().jQ.detach();
        leftPc.adopt(leftBlock, 0, 0);
      }

      cursor.insLeftOf(this);
      super.createLeftOf.call(leftBlock, cursor); // micro-optimization, not for correctness
    }
    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
    // TODO needs tests
    cursor.controller.aria.alert(ch);
  }
  writeLatex(cursor: Cursor, latex: string) {
    const cursorL = cursor[L];
    if (!cursorL) new TextPiece(latex).createLeftOf(cursor);
    else if (cursorL instanceof TextPiece) cursorL.appendText(latex);
    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  seek(pageX: number, cursor: Cursor) {
    cursor.hide();
    var textPc = TextBlockFuseChildren(this);
    if (!textPc) return;

    // insert cursor at approx position in DOMTextNode
    var avgChWidth = this.jQ.width() / this.text.length;
    var approxPosition = Math.round(
      (pageX - this.jQ.offset().left) / avgChWidth
    );
    if (approxPosition <= 0) cursor.insAtLeftEnd(this);
    else if (approxPosition >= textPc.textStr.length)
      cursor.insAtRightEnd(this);
    else cursor.insLeftOf(textPc.splitRight(approxPosition));

    // move towards mousedown (pageX)
    var displ = pageX - cursor.show().offset().left; // displacement
    var dir = displ && displ < 0 ? L : R;
    var prevDispl = dir as number;
    // displ * prevDispl > 0 iff displacement direction === previous direction
    while (cursor[dir] && displ * prevDispl > 0) {
      (cursor[dir] as MQNode).moveTowards(dir, cursor);
      prevDispl = displ;
      displ = pageX - cursor.offset().left;
    }
    if (dir * displ < -dir * prevDispl)
      (cursor[-dir as Direction] as MQNode).moveTowards(
        -dir as Direction,
        cursor
      );

    if (!cursor.anticursor) {
      // about to start mouse-selecting, the anticursor is gonna get put here
      const cursorL = cursor[L];
      this.anticursorPosition =
        cursorL && (cursorL as TextPiece).textStr.length;
      // ^ get it? 'cos if there's no cursor[L], it's 0... I'm a terrible person.
    } else if (cursor.anticursor.parent === this) {
      // mouse-selecting within this TextBlock, re-insert the anticursor
      const cursorL = cursor[L];
      var cursorPosition = cursorL && (cursorL as TextPiece).textStr.length;
      if (this.anticursorPosition === cursorPosition) {
        cursor.anticursor = Anticursor.fromCursor(cursor);
      } else {
        if (this.anticursorPosition! < cursorPosition!) {
          var newTextPc = (cursorL as any as TextPiece).splitRight(
            this.anticursorPosition!
          );
          cursor[L] = newTextPc;
        } else {
          const cursorR = cursor[R] as any as TextPiece;
          var newTextPc = cursorR.splitRight(
            this.anticursorPosition! - cursorPosition!
          );
        }
        cursor.anticursor = new Anticursor(this, newTextPc[L], newTextPc);
      }
    }
  }

  blur(cursor: Cursor) {
    MathBlock.prototype.blur.call(this, cursor);
    if (!cursor) return;
    if (this.textContents() === '') {
      this.remove();
      if (cursor[L] === this) cursor[L] = this[L];
      else if (cursor[R] === this) cursor[R] = this[R];
    } else TextBlockFuseChildren(this);
  }

  focus() {
    MathBlock.prototype.focus.call(this);
  }
}

function TextBlockFuseChildren(self: TextBlock) {
  self.jQ[0].normalize();

  var textPcDom = self.jQ[0].firstChild as Text;
  if (!textPcDom) return;
  pray('only node in TextBlock span is Text node', textPcDom.nodeType === 3);
  // nodeType === 3 has meant a Text node since ancient times:
  //   http://reference.sitepoint.com/javascript/Node/nodeType

  var textPc = new TextPiece(textPcDom.data);
  textPc.jQadd(textPcDom);

  self.children().disown();
  textPc.adopt(self, 0, 0);
  return textPc;
}

/**
 * Piece of plain text, with a TextBlock as a parent and no children.
 * Wraps a single DOMTextNode.
 * For convenience, has a .textStr property that's just a JavaScript string
 * mirroring the text contents of the DOMTextNode.
 * Text contents must always be nonempty.
 */
class TextPiece extends MQNode {
  textStr: string;
  dom: Text;

  constructor(text: string) {
    super();
    this.textStr = text;
  }
  jQadd(dom: Text) {
    this.dom = dom;
    this.jQ = $(dom);
    return this.jQ;
  }
  jQize() {
    return this.jQadd(document.createTextNode(this.textStr));
  }
  appendText(text: string) {
    this.textStr += text;
    this.dom.appendData(text);
  }
  prependText(text: string) {
    this.textStr = text + this.textStr;
    this.dom.insertData(0, text);
  }
  insTextAtDirEnd(text: string, dir: Direction) {
    prayDirection(dir);
    if (dir === R) this.appendText(text);
    else this.prependText(text);
  }
  splitRight(i: number) {
    var newPc = new TextPiece(this.textStr.slice(i)).adopt(
      this.parent,
      this,
      this[R]
    );
    newPc.jQadd(this.dom.splitText(i));
    this.textStr = this.textStr.slice(0, i);
    return newPc;
  }

  endChar(dir: Direction, text: string) {
    return text.charAt(dir === L ? 0 : -1 + text.length);
  }

  moveTowards(dir: Direction, cursor: Cursor) {
    prayDirection(dir);

    var ch = this.endChar(-dir as Direction, this.textStr);

    var from = this[-dir as Direction];
    if (from instanceof TextPiece) from.insTextAtDirEnd(ch, dir);
    else new TextPiece(ch).createDir(-dir as Direction, cursor);
    return this.deleteTowards(dir, cursor);
  }

  mathspeak() {
    return this.textStr;
  }
  latex() {
    return this.textStr;
  }

  deleteTowards(dir: Direction, cursor: Cursor) {
    if (this.textStr.length > 1) {
      var deletedChar;
      if (dir === R) {
        this.dom.deleteData(0, 1);
        deletedChar = this.textStr[0];
        this.textStr = this.textStr.slice(1);
      } else {
        // note that the order of these 2 lines is annoyingly important
        // (the second line mutates this.textStr.length)
        this.dom.deleteData(-1 + this.textStr.length, 1);
        deletedChar = this.textStr[this.textStr.length - 1];
        this.textStr = this.textStr.slice(0, -1);
      }
      cursor.controller.aria.queue(deletedChar);
    } else {
      this.remove();
      this.jQ.remove();
      cursor[dir] = this[dir];
      cursor.controller.aria.queue(this.textStr);
    }
  }

  selectTowards(dir: Direction, cursor: Cursor) {
    prayDirection(dir);
    var anticursor = cursor.anticursor;
    if (!anticursor) return;

    var ch = this.endChar(-dir as Direction, this.textStr);

    if (anticursor[dir] === this) {
      var newPc = new TextPiece(ch).createDir(dir, cursor);
      anticursor[dir] = newPc;
      cursor.insDirOf(dir, newPc);
    } else {
      var from = this[-dir as Direction];
      if (from instanceof TextPiece) from.insTextAtDirEnd(ch, dir);
      else {
        var newPc = new TextPiece(ch).createDir(-dir as Direction, cursor);
        var selection = cursor.selection;
        if (selection) {
          newPc.jQ.insDirOf(-dir as Direction, selection.jQ);
        }
      }

      if (this.textStr.length === 1 && anticursor[-dir as Direction] === this) {
        anticursor[-dir as Direction] = this[-dir as Direction]; // `this` will be removed in deleteTowards
      }
    }

    return this.deleteTowards(dir, cursor);
  }
}

LatexCmds.text =
  LatexCmds.textnormal =
  LatexCmds.textrm =
  LatexCmds.textup =
  LatexCmds.textmd =
    TextBlock;

function makeTextBlock(
  latex: string,
  ariaLabel: string,
  tagName: string,
  attrs: string
) {
  return class extends TextBlock {
    ctrlSeq = latex;
    mathspeakTemplate = ['Start' + ariaLabel, 'End' + ariaLabel];
    ariaLabel = ariaLabel;

    html() {
      var cmdId = 'mathquill-command-id=' + this.id;
      return (
        '<' +
        tagName +
        ' ' +
        attrs +
        ' ' +
        cmdId +
        '>' +
        this.textContents() +
        '</' +
        tagName +
        '>'
      );
    }
  };
}

LatexCmds.em =
  LatexCmds.italic =
  LatexCmds.italics =
  LatexCmds.emph =
  LatexCmds.textit =
  LatexCmds.textsl =
    makeTextBlock('\\textit', 'Italic', 'i', 'class="mq-text-mode"');
LatexCmds.strong =
  LatexCmds.bold =
  LatexCmds.textbf =
    makeTextBlock('\\textbf', 'Bold', 'b', 'class="mq-text-mode"');
LatexCmds.sf = LatexCmds.textsf = makeTextBlock(
  '\\textsf',
  'Sans serif font',
  'span',
  'class="mq-sans-serif mq-text-mode"'
);
LatexCmds.tt = LatexCmds.texttt = makeTextBlock(
  '\\texttt',
  'Mono space font',
  'span',
  'class="mq-monospace mq-text-mode"'
);
LatexCmds.textsc = makeTextBlock(
  '\\textsc',
  'Variable font',
  'span',
  'style="font-variant:small-caps" class="mq-text-mode"'
);
LatexCmds.uppercase = makeTextBlock(
  '\\uppercase',
  'Uppercase',
  'span',
  'style="text-transform:uppercase" class="mq-text-mode"'
);
LatexCmds.lowercase = makeTextBlock(
  '\\lowercase',
  'Lowercase',
  'span',
  'style="text-transform:lowercase" class="mq-text-mode"'
);

class RootMathCommand extends MathCommand {
  cursor: Cursor;
  constructor(cursor: Cursor) {
    super('$');
    this.cursor = cursor;
  }
  htmlTemplate = '<span class="mq-math-mode">&0</span>';
  createBlocks() {
    super.createBlocks();
    const endsL = this.ends[L] as RootMathCommand; // TODO - how do we know this is a RootMathCommand?
    endsL.cursor = this.cursor;
    endsL.write = function (cursor: Cursor, ch: string) {
      if (ch !== '$') MathBlock.prototype.write.call(this, cursor, ch);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent);
        this.parent.deleteTowards(undefined!, cursor);
        new VanillaSymbol('\\$', '$').createLeftOf(cursor.show());
      } else if (!cursor[R]) cursor.insRightOf(this.parent);
      else if (!cursor[L]) cursor.insLeftOf(this.parent);
      else MathBlock.prototype.write.call(this, cursor, ch);
    };
  }
  latex() {
    return '$' + (this.ends[L] as MQNode).latex() + '$';
  }
}

class RootTextBlock extends RootMathBlock {
  keystroke(key: string, e: KeyboardEvent, ctrlr: Controller) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return super.keystroke(key, e, ctrlr);
  }
  write(cursor: Cursor, ch: string) {
    cursor.show().deleteSelection();
    if (ch === '$') new RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      new VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  }
}
API.TextField = function (APIClasses: APIClasses) {
  return class extends APIClasses.EditableField {
    static RootBlock = RootTextBlock;
    __mathquillify() {
      return super.__mathquillify('mq-editable-field mq-text-mode');
    }
    latex(latex: string) {
      if (arguments.length > 0) {
        this.__controller.renderLatexText(latex);
        if (this.__controller.blurred)
          this.__controller.cursor.hide().parent.blur();
        return this;
      }
      return this.__controller.exportLatex();
    }
  };
};
