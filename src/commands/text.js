/*************************************************
 * Abstract classes of text blocks
 ************************************************/

/**
 * Blocks of plain text, with one or two TextPiece's as children.
 * Represents flat strings of typically serif-font Roman characters, as
 * opposed to hierchical, nested, tree-structured math.
 * Wraps a single HTMLSpanElement.
 */
class TextBlock extends Node {
  static _todoMoveIntoConstructor =
    TextBlock.prototype.ctrlSeq = '\\text';
  static _todoMoveIntoConstructor =
    TextBlock.prototype.ariaLabel = 'Text';

  replaces (replacedText) {
    if (replacedText instanceof Fragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  };

  jQadd (jQ) {
    super.jQadd(jQ);
    if (this.ends[L]) this.ends[L].jQadd(this.jQ[0].firstChild);
  };

  createLeftOf (cursor) {
    var textBlock = this;
    super.createLeftOf(cursor);

    cursor.insAtRightEnd(textBlock);

    if (textBlock.replacedText)
      for (var i = 0; i < textBlock.replacedText.length; i += 1)
        textBlock.write(cursor, textBlock.replacedText.charAt(i));

    if (textBlock[R].siblingCreated) textBlock[R].siblingCreated(cursor.options, L);
    if (textBlock[L].siblingCreated) textBlock[L].siblingCreated(cursor.options, R);
    textBlock.bubble(function (node) { node.reflow(); });
  };

  parser () {
    var textBlock = this;

    // TODO: correctly parse text mode
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{')).then(regex(/^[^}]*/)).skip(string('}'))
      .map(function(text) {
        if (text.length === 0) return new Fragment();

        new TextPiece(text).adopt(textBlock, 0, 0);
        return textBlock;
      })
    ;
  };

  textContents () {
    return this.foldChildren('', function(text, child) {
      return text + child.text;
    });
  };
  text () { return '"' + this.textContents() + '"'; };
  latex () {
    var contents = this.textContents();
    if (contents.length === 0) return '';
    return this.ctrlSeq + '{' + contents.replace(/\\/g, '\\backslash ').replace(/[{}]/g, '\\$&') + '}';
  };
  html () {
    return (
        '<span class="mq-text-mode" mathquill-command-id='+this.id+'>'
      +   this.textContents()
      + '</span>'
    );
  };

  static _todoMoveIntoConstructor =
    TextBlock.prototype.mathspeakTemplate =
      ['Start'+TextBlock.prototype.ariaLabel, 'End'+TextBlock.prototype.ariaLabel];
  mathspeak (opts) {
    if (opts && opts.ignoreShorthand) {
      return this.mathspeakTemplate[0]+', '+this.textContents() +', '+this.mathspeakTemplate[1]
    } else {
      return this.textContents();
    }
  };
  isTextBlock () {
    return true;
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  moveTowards (dir, cursor) {
    cursor.insAtDirEnd(-dir, this);
    aria.queueDirEndOf(-dir).queue(cursor.parent, true);
  };
  moveOutOf (dir, cursor) {
    cursor.insDirOf(dir, this);
    aria.queueDirOf(dir).queue(this);
  };
  unselectInto (dir,cursor) {
    this.moveTowards(dir, cursor);
  }

  // TODO: make these methods part of a shared mixin or something.
  selectTowards (dir, cursor) {
    MathCommand.prototype.selectTowards.call(this, dir, cursor);
  }
  deleteTowards (dir, cursor) {
    MathCommand.prototype.deleteTowards.call(this, dir, cursor);
  }

  selectOutOf (dir, cursor) {
    cursor.insDirOf(dir, this);
  };
  deleteOutOf (dir, cursor) {
    // backspace and delete at ends of block don't unwrap
    if (this.isEmpty()) cursor.insRightOf(this);
  };
  write (cursor, ch) {
    cursor.show().deleteSelection();

    if (ch !== '$') {
      if (!cursor[L]) new TextPiece(ch).createLeftOf(cursor);
      else cursor[L].appendText(ch);
    }
    else if (this.isEmpty()) {
      cursor.insRightOf(this);
      new VanillaSymbol('\\$','$').createLeftOf(cursor);
    }
    else if (!cursor[R]) cursor.insRightOf(this);
    else if (!cursor[L]) cursor.insLeftOf(this);
    else { // split apart
      var leftBlock = new TextBlock();
      var leftPc = this.ends[L];
      leftPc.disown().jQ.detach();
      leftPc.adopt(leftBlock, 0, 0);

      cursor.insLeftOf(this);
      super.createLeftOf.call(leftBlock, cursor); // micro-optimization, not for correctness
    }
    this.bubble(function (node) { node.reflow(); });
    // TODO needs tests
    aria.alert(ch);
  };
  writeLatex (cursor, latex) {
    if (!cursor[L]) new TextPiece(latex).createLeftOf(cursor);
    else cursor[L].appendText(latex);
    this.bubble(function (node) { node.reflow(); });
  };

  seek (pageX, cursor) {
    cursor.hide();
    var textPc = TextBlockFuseChildren(this);

    // insert cursor at approx position in DOMTextNode
    var avgChWidth = this.jQ.width()/this.text.length;
    var approxPosition = Math.round((pageX - this.jQ.offset().left)/avgChWidth);
    if (approxPosition <= 0) cursor.insAtLeftEnd(this);
    else if (approxPosition >= textPc.text.length) cursor.insAtRightEnd(this);
    else cursor.insLeftOf(textPc.splitRight(approxPosition));

    // move towards mousedown (pageX)
    var displ = pageX - cursor.show().offset().left; // displacement
    var dir = displ && displ < 0 ? L : R;
    var prevDispl = dir;
    // displ * prevDispl > 0 iff displacement direction === previous direction
    while (cursor[dir] && displ * prevDispl > 0) {
      cursor[dir].moveTowards(dir, cursor);
      prevDispl = displ;
      displ = pageX - cursor.offset().left;
    }
    if (dir*displ < -dir*prevDispl) cursor[-dir].moveTowards(-dir, cursor);

    if (!cursor.anticursor) {
      // about to start mouse-selecting, the anticursor is gonna get put here
      this.anticursorPosition = cursor[L] && cursor[L].text.length;
      // ^ get it? 'cos if there's no cursor[L], it's 0... I'm a terrible person.
    }
    else if (cursor.anticursor.parent === this) {
      // mouse-selecting within this TextBlock, re-insert the anticursor
      var cursorPosition = cursor[L] && cursor[L].text.length;;
      if (this.anticursorPosition === cursorPosition) {
        cursor.anticursor = Point.copy(cursor);
      }
      else {
        if (this.anticursorPosition < cursorPosition) {
          var newTextPc = cursor[L].splitRight(this.anticursorPosition);
          cursor[L] = newTextPc;
        }
        else {
          var newTextPc = cursor[R].splitRight(this.anticursorPosition - cursorPosition);
        }
        cursor.anticursor = new Point(this, newTextPc[L], newTextPc);
      }
    }
  };

  blur (cursor) {
    MathBlock.prototype.blur.call(this);
    if (!cursor) return;
    if (this.textContents() === '') {
      this.remove();
      if (cursor[L] === this) cursor[L] = this[L];
      else if (cursor[R] === this) cursor[R] = this[R];
    }
    else TextBlockFuseChildren(this);
  };

  focus () {
    MathBlock.prototype.focus.call(this);
  }
};

function TextBlockFuseChildren(self) {
  self.jQ[0].normalize();

  var textPcDom = self.jQ[0].firstChild;
  if (!textPcDom) return;
  pray('only node in TextBlock span is Text node', textPcDom.nodeType === 3);
  // nodeType === 3 has meant a Text node since ancient times:
  //   http://reference.sitepoint.com/javascript/Node/nodeType

  var textPc = new TextPiece(textPcDom.data);
  textPc.jQadd(textPcDom);

  self.children().disown();
  return textPc.adopt(self, 0, 0);
}

/**
 * Piece of plain text, with a TextBlock as a parent and no children.
 * Wraps a single DOMTextNode.
 * For convenience, has a .text property that's just a JavaScript string
 * mirroring the text contents of the DOMTextNode.
 * Text contents must always be nonempty.
 */
class TextPiece extends Node {
  constructor (text) {
    super();
    this.text = text;
  };
  jQadd (dom) { this.dom = dom; this.jQ = $(dom); };
  jQize () {
    return this.jQadd(document.createTextNode(this.text));
  };
  appendText (text) {
    this.text += text;
    this.dom.appendData(text);
  };
  prependText (text) {
    this.text = text + this.text;
    this.dom.insertData(0, text);
  };
  insTextAtDirEnd (text, dir) {
    prayDirection(dir);
    if (dir === R) this.appendText(text);
    else this.prependText(text);
  };
  splitRight (i) {
    var newPc = new TextPiece(this.text.slice(i)).adopt(this.parent, this, this[R]);
    newPc.jQadd(this.dom.splitText(i));
    this.text = this.text.slice(0, i);
    return newPc;
  };

  endChar(dir, text) {
    return text.charAt(dir === L ? 0 : -1 + text.length);
  }

  moveTowards (dir, cursor) {
    prayDirection(dir);

    var ch = this.endChar(-dir, this.text)

    var from = this[-dir];
    if (from) from.insTextAtDirEnd(ch, dir);
    else new TextPiece(ch).createDir(-dir, cursor);
    return this.deleteTowards(dir, cursor);
  };

  mathspeak () { return this.text; };
  latex () { return this.text; };

  deleteTowards (dir, cursor) {
    if (this.text.length > 1) {
      var deletedChar;
      if (dir === R) {
        this.dom.deleteData(0, 1);
        deletedChar = this.text[0];
        this.text = this.text.slice(1);
      }
      else {
        // note that the order of these 2 lines is annoyingly important
        // (the second line mutates this.text.length)
        this.dom.deleteData(-1 + this.text.length, 1);
        deletedChar = this.text[this.text.length - 1];
        this.text = this.text.slice(0, -1);
      }
      aria.queue(deletedChar);
    }
    else {
      this.remove();
      this.jQ.remove();
      cursor[dir] = this[dir];
      aria.queue(this.text);
    }
  };

  selectTowards (dir, cursor) {
    prayDirection(dir);
    var anticursor = cursor.anticursor;

    var ch = this.endChar(-dir, this.text)

    if (anticursor[dir] === this) {
      var newPc = new TextPiece(ch).createDir(dir, cursor);
      anticursor[dir] = newPc;
      cursor.insDirOf(dir, newPc);
    }
    else {
      var from = this[-dir];
      if (from) from.insTextAtDirEnd(ch, dir);
      else {
        var newPc = new TextPiece(ch).createDir(-dir, cursor);
        newPc.jQ.insDirOf(-dir, cursor.selection.jQ);
      }

      if (this.text.length === 1 && anticursor[-dir] === this) {
        anticursor[-dir] = this[-dir]; // `this` will be removed in deleteTowards
      }
    }

    return this.deleteTowards(dir, cursor);
  };
};

LatexCmds.text =
LatexCmds.textnormal =
LatexCmds.textrm =
LatexCmds.textup =
LatexCmds.textmd = TextBlock;

function makeTextBlock(latex, ariaLabel, tagName, attrs) {
  var klass = class extends TextBlock {
    html () {
      var cmdId = 'mathquill-command-id=' + this.id;
      return '<'+tagName+' '+attrs+' '+cmdId+'>'+this.textContents()+'</'+tagName+'>';
    }
  };
  
  klass.prototype.ctrlSeq = latex;
  klass.prototype.ariaLabel = ariaLabel;
  klass.prototype.mathspeakTemplate = ['Start'+ariaLabel, 'End'+ariaLabel];

  return klass;
}

LatexCmds.em = LatexCmds.italic = LatexCmds.italics =
LatexCmds.emph = LatexCmds.textit = LatexCmds.textsl =
  makeTextBlock('\\textit', 'Italic', 'i', 'class="mq-text-mode"');
LatexCmds.strong = LatexCmds.bold = LatexCmds.textbf =
  makeTextBlock('\\textbf', 'Bold', 'b', 'class="mq-text-mode"');
LatexCmds.sf = LatexCmds.textsf =
  makeTextBlock('\\textsf', 'Sans serif font', 'span', 'class="mq-sans-serif mq-text-mode"');
LatexCmds.tt = LatexCmds.texttt =
  makeTextBlock('\\texttt', 'Mono space font', 'span', 'class="mq-monospace mq-text-mode"');
LatexCmds.textsc =
  makeTextBlock('\\textsc', 'Variable font', 'span', 'style="font-variant:small-caps" class="mq-text-mode"');
LatexCmds.uppercase =
  makeTextBlock('\\uppercase', 'Uppercase', 'span', 'style="text-transform:uppercase" class="mq-text-mode"');
LatexCmds.lowercase =
  makeTextBlock('\\lowercase', 'Lowercase', 'span', 'style="text-transform:lowercase" class="mq-text-mode"');


class RootMathCommand extends MathCommand {
  constructor (cursor) {
    super('$');
    this.cursor = cursor;
  };
  static _todoMoveIntoConstructor =
    RootMathCommand.prototype.htmlTemplate = '<span class="mq-math-mode">&0</span>';
  createBlocks () {
    super.createBlocks()

    this.ends[L].cursor = this.cursor;
    this.ends[L].write = function(cursor, ch) {
      if (ch !== '$')
        MathBlock.prototype.write.call(this, cursor, ch);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent);
        this.parent.deleteTowards(dir, cursor);
        new VanillaSymbol('\\$','$').createLeftOf(cursor.show());
      }
      else if (!cursor[R])
        cursor.insRightOf(this.parent);
      else if (!cursor[L])
        cursor.insLeftOf(this.parent);
      else
        MathBlock.prototype.write.call(this, cursor, ch);
    };
  };
  latex () {
    return '$' + this.ends[L].latex() + '$';
  };
};

class RootTextBlock extends RootMathBlock {
  keystroke (key) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return super.keystroke.apply(this, arguments);
  };
  write (cursor, ch) {
    cursor.show().deleteSelection();
    if (ch === '$')
      RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      new VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  };
};
API.TextField = function(APIClasses) {
  return class extends APIClasses.EditableField {
    static RootBlock = RootTextBlock;
    __mathquillify () {
      return super.__mathquillify('mq-editable-field mq-text-mode');
    };
    latex = function(latex) {
      if (arguments.length > 0) {
        this.__controller.renderLatexText(latex);
        if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
        return this;
      }
      return this.__controller.exportLatex();
    };
  };
};
