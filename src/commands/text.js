/*************************************************
 * Abstract classes of text blocks
 ************************************************/

/**
 * Blocks of plain text, with one or two TextPiece's as children.
 * Represents flat strings of typically serif-font Roman characters, as
 * opposed to hierchical, nested, tree-structured math.
 * Wraps a single HTMLSpanElement.
 */
var TextBlock = P(Node, function(_, super_) {
  _.ctrlSeq = '\\text';

  _.replaces = function(replacedText) {
    if (replacedText instanceof Fragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  };

  _.jQadd = function(jQ) {
    super_.jQadd.call(this, jQ);
    if (this.ends[L]) this.ends[L].jQadd(this.jQ[0].firstChild);
  };

  _.createLeftOf = function(cursor) {
    var textBlock = this;
    super_.createLeftOf.call(this, cursor);

    if (textBlock[R].siblingCreated) textBlock[R].siblingCreated(cursor.options, L);
    if (textBlock[L].siblingCreated) textBlock[L].siblingCreated(cursor.options, R);
    textBlock.bubble('reflow');

    cursor.insAtRightEnd(textBlock);

    if (textBlock.replacedText)
      for (var i = 0; i < textBlock.replacedText.length; i += 1)
        textBlock.write(cursor, textBlock.replacedText.charAt(i));
  };

  _.parser = function() {
    var textBlock = this;

    // TODO: correctly parse text mode
    var string = Parser.string;
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    return optWhitespace
      .then(string('{')).then(regex(/^[^}]*/)).skip(string('}'))
      .map(function(text) {
        // TODO: is this the correct behavior when parsing
        // the latex \text{} ?  This violates the requirement that
        // the text contents are always nonempty.  Should we just
        // disown the parent node instead?
        TextPiece(text).adopt(textBlock, 0, 0);
        return textBlock;
      })
    ;
  };

  _.textContents = function() {
    return this.foldChildren('', function(text, child) {
      return text + child.text;
    });
  };
  _.text = function() { return '"' + this.textContents() + '"'; };
  _.latex = function() { return '\\text{' + this.textContents() + '}'; };
  _.html = function() {
    return (
        '<span class="mq-text-mode" mathquill-command-id='+this.id+'>'
      +   this.textContents()
      + '</span>'
    );
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  _.moveTowards = function(dir, cursor) { cursor.insAtDirEnd(-dir, this); };
  _.moveOutOf = function(dir, cursor) { cursor.insDirOf(dir, this); };
  _.unselectInto = _.moveTowards;

  // TODO: make these methods part of a shared mixin or something.
  _.selectTowards = MathCommand.prototype.selectTowards;
  _.deleteTowards = MathCommand.prototype.deleteTowards;

  _.selectOutOf = function(dir, cursor) {
    cursor.insDirOf(dir, this);
  };
  _.deleteOutOf = function(dir, cursor) {
    // backspace and delete at ends of block don't unwrap
    if (this.isEmpty()) cursor.insRightOf(this);
  };
  _.write = function(cursor, ch) {
    cursor.show().deleteSelection();

    if (ch !== '$') {
      if (!cursor[L]) TextPiece(ch).createLeftOf(cursor);
      else cursor[L].appendText(ch);
    }
    else if (this.isEmpty()) {
      cursor.insRightOf(this);
      VanillaSymbol('\\$','$').createLeftOf(cursor);
    }
    else if (!cursor[R]) cursor.insRightOf(this);
    else if (!cursor[L]) cursor.insLeftOf(this);
    else { // split apart
      var leftBlock = TextBlock();
      var leftPc = this.ends[L];
      leftPc.disown();
      leftPc.adopt(leftBlock, 0, 0);

      cursor.insLeftOf(this);
      super_.createLeftOf.call(leftBlock, cursor);
    }
  };

  _.seek = function(pageX, cursor) {
    cursor.hide();
    var textPc = fuseChildren(this);

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
        cursor.anticursor = Point(this, newTextPc[L], newTextPc);
      }
    }
  };

  _.blur = function() {
    MathBlock.prototype.blur.call(this);
    fuseChildren(this);
  };

  function fuseChildren(self) {
    self.jQ[0].normalize();

    var textPcDom = self.jQ[0].firstChild;
    var textPc = TextPiece(textPcDom.data);
    textPc.jQadd(textPcDom);

    self.children().disown();
    return textPc.adopt(self, 0, 0);
  }

  _.focus = MathBlock.prototype.focus;
});

/**
 * Piece of plain text, with a TextBlock as a parent and no children.
 * Wraps a single DOMTextNode.
 * For convenience, has a .text property that's just a JavaScript string
 * mirroring the text contents of the DOMTextNode.
 * Text contents must always be nonempty.
 */
var TextPiece = P(Node, function(_, super_) {
  _.init = function(text) {
    super_.init.call(this);
    this.text = text;
  };
  _.jQadd = function(dom) { this.dom = dom; this.jQ = $(dom); };
  _.jQize = function() {
    return this.jQadd(document.createTextNode(this.text));
  };
  _.appendText = function(text) {
    this.text += text;
    this.dom.appendData(text);
  };
  _.prependText = function(text) {
    this.text = text + this.text;
    this.dom.insertData(0, text);
  };
  _.insTextAtDirEnd = function(text, dir) {
    prayDirection(dir);
    if (dir === R) this.appendText(text);
    else this.prependText(text);
  };
  _.splitRight = function(i) {
    var newPc = TextPiece(this.text.slice(i)).adopt(this.parent, this, this[R]);
    newPc.jQadd(this.dom.splitText(i));
    this.text = this.text.slice(0, i);
    return newPc;
  };

  function endChar(dir, text) {
    return text.charAt(dir === L ? 0 : -1 + text.length);
  }

  _.moveTowards = function(dir, cursor) {
    prayDirection(dir);

    var ch = endChar(-dir, this.text)

    var from = this[-dir];
    if (from) from.insTextAtDirEnd(ch, dir);
    else TextPiece(ch).createDir(-dir, cursor);

    return this.deleteTowards(dir, cursor);
  };

  _.latex = function() { return this.text; };

  _.deleteTowards = function(dir, cursor) {
    if (this.text.length > 1) {
      if (dir === R) {
        this.dom.deleteData(0, 1);
        this.text = this.text.slice(1);
      }
      else {
        // note that the order of these 2 lines is annoyingly important
        // (the second line mutates this.text.length)
        this.dom.deleteData(-1 + this.text.length, 1);
        this.text = this.text.slice(0, -1);
      }
    }
    else {
      this.remove();
      this.jQ.remove();
      cursor[dir] = this[dir];
    }
  };

  _.selectTowards = function(dir, cursor) {
    prayDirection(dir);
    var anticursor = cursor.anticursor;

    var ch = endChar(-dir, this.text)

    if (anticursor[dir] === this) {
      var newPc = TextPiece(ch).createDir(dir, cursor);
      anticursor[dir] = newPc;
      cursor.insDirOf(dir, newPc);
    }
    else {
      var from = this[-dir];
      if (from) from.insTextAtDirEnd(ch, dir);
      else {
        var newPc = TextPiece(ch).createDir(-dir, cursor);
        newPc.jQ.insDirOf(-dir, cursor.selection.jQ);
      }

      if (this.text.length === 1 && anticursor[-dir] === this) {
        anticursor[-dir] = this[-dir]; // `this` will be removed in deleteTowards
      }
    }

    return this.deleteTowards(dir, cursor);
  };
});

CharCmds.$ =
LatexCmds.text =
LatexCmds.textnormal =
LatexCmds.textrm =
LatexCmds.textup =
LatexCmds.textmd = TextBlock;

function makeTextBlock(latex, tagName, attrs) {
  return P(TextBlock, {
    ctrlSeq: latex,
    htmlTemplate: '<'+tagName+' '+attrs+'>&0</'+tagName+'>'
  });
}

LatexCmds.em = LatexCmds.italic = LatexCmds.italics =
LatexCmds.emph = LatexCmds.textit = LatexCmds.textsl =
  makeTextBlock('\\textit', 'i', 'class="mq-text-mode"');
LatexCmds.strong = LatexCmds.bold = LatexCmds.textbf =
  makeTextBlock('\\textbf', 'b', 'class="mq-text-mode"');
LatexCmds.sf = LatexCmds.textsf =
  makeTextBlock('\\textsf', 'span', 'class="mq-sans-serif mq-text-mode"');
LatexCmds.tt = LatexCmds.texttt =
  makeTextBlock('\\texttt', 'span', 'class="mq-monospace mq-text-mode"');
LatexCmds.textsc =
  makeTextBlock('\\textsc', 'span', 'style="font-variant:small-caps" class="mq-text-mode"');
LatexCmds.uppercase =
  makeTextBlock('\\uppercase', 'span', 'style="text-transform:uppercase" class="mq-text-mode"');
LatexCmds.lowercase =
  makeTextBlock('\\lowercase', 'span', 'style="text-transform:lowercase" class="mq-text-mode"');


var RootMathCommand = P(MathCommand, function(_, super_) {
  _.init = function(cursor) {
    super_.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = '<span class="mq-math-mode">&0</span>';
  _.createBlocks = function() {
    super_.createBlocks.call(this);

    this.ends[L].cursor = this.cursor;
    this.ends[L].write = function(cursor, ch) {
      if (ch !== '$')
        MathBlock.prototype.write.call(this, cursor, ch);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent);
        this.parent.deleteTowards(dir, cursor);
        VanillaSymbol('\\$','$').createLeftOf(cursor.show());
      }
      else if (!cursor[R])
        cursor.insRightOf(this.parent);
      else if (!cursor[L])
        cursor.insLeftOf(this.parent);
      else
        MathBlock.prototype.write.call(this, cursor, ch);
    };
  };
  _.latex = function() {
    return '$' + this.ends[L].latex() + '$';
  };
});

var RootTextBlock = P(RootMathBlock, function(_, super_) {
  _.keystroke = function(key) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return super_.keystroke.apply(this, arguments);
  };
  _.write = function(cursor, ch) {
    cursor.show().deleteSelection();
    if (ch === '$')
      RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  };
});
API.TextField = function(APIClasses) {
  return P(APIClasses.EditableField, function(_, super_) {
    this.RootBlock = RootTextBlock;
    _.__mathquillify = function() {
      return super_.__mathquillify.call(this, 'mq-editable-field mq-text-mode');
    };
    _.latex = function(latex) {
      if (arguments.length > 0) {
        this.__controller.renderLatexText(latex);
        if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
        return this;
      }
      return this.__controller.exportLatex();
    };
  });
};
