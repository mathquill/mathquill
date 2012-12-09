/*************************************************
 * Abstract classes of text blocks
 ************************************************/

/**
 * Blocks of plain text, with one or two TextPiece's as children.
 * Represents flat strings of typically serif-font Roman characters, as
 * opposed to hierchical, nested, tree-structured math.
 * Wraps a single HTMLSpanElement.
 */
var TextBlock = P(Node, function(_, _super) {
  _.ctrlSeq = '\\text';

  _.replaces = function(replacedText) {
    if (replacedText instanceof Fragment)
      this.replacedText = replacedText.remove().jQ.text();
    else if (typeof replacedText === 'string')
      this.replacedText = replacedText;
  };

  _.jQadd = function(jQ) {
    _super.jQadd.call(this, jQ);
    this.ch[L].jQize(this.jQ[0].firstChild);
  };

  _.createBefore = function(cursor) {
    var textBlock = this;
    _super.createBefore.call(this, cursor);

    if (textBlock[R].respace) textBlock[R].respace();
    if (textBlock[L].respace) textBlock[L].respace();

    textBlock.bubble('redraw');

    cursor.appendTo(textBlock);

    if (textBlock.replacedText)
      for (var i = 0; i < textBlock.replacedText.length; i += 1)
        textBlock.ch[L].write(cursor, textBlock.replacedText.charAt(i));
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
        '<span class="text" mathquill-command-id='+this.id+'>'
      +   this.textContents()
      + '</span>'
    );
  };

  _.onKey = function(key, e) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return false;
  };
  _.moveTowards = function(dir, cursor) { cursor.appendDir(-dir, this); };
  _.moveOutOf = function(dir, cursor) { cursor.insertAdjacent(dir, this); };

  // TODO: make these methods part of a shared mixin or something.
  _.createSelection = MathCommand.prototype.createSelection;
  _.expandSelection = MathCommand.prototype.expandSelection;
  _.clearSelection = MathCommand.prototype.clearSelection;
  _.retractSelection = MathCommand.prototype.retractSelection;

  _.selectOutOf = function(dir, cursor) {
    var cmd = this;
    cursor.clearSelection().hide().insertAdjacent(dir, cmd)
    .selection = Selection(cmd);
  };
  _.deleteTowards = _.createSelection;
  _.deleteOutOf = function(dir, cursor) {
    // backspace and delete at ends of block don't unwrap
    if (this.isEmpty()) cursor.insertAfter(this);
  };
  _.write = function(cursor, ch, replacedFragment) {
    if (replacedFragment) replacedFragment.remove();

    if (ch !== '$') {
      if (!cursor[L]) TextPiece(ch).createBefore(cursor);
      else cursor[L].appendText(ch);
    }
    else if (this.isEmpty()) {
      cursor.insertAfter(this);
      VanillaSymbol('\\$','$').createBefore(cursor);
    }
    else if (!cursor[R]) cursor.insertAfter(this);
    else if (!cursor[L]) cursor.insertBefore(this);
    else { // split apart
      var prevBlock = TextBlock();
      var prevPc = this.ch[L];
      prevPc.disown();
      prevPc.adopt(prevBlock, 0, 0);

      cursor.insertBefore(this);
      _super.createBefore.call(prevBlock, cursor);
    }
    return false;
  };

  _.seek = function() {
    consolidateChildren(this);
    MathBlock.prototype.seek.apply(this, arguments);
  };

  _.blur = function() {
    MathBlock.prototype.blur.call(this);
    consolidateChildren(this);
  };

  function consolidateChildren(self) {
    var firstChild = self.ch[L];

    while (firstChild[R]) {
      firstChild.combineDir(R);
    }
  }

  _.focus = MathBlock.prototype.focus;
  _.isEmpty = MathBlock.prototype.isEmpty;
});

/**
 * Piece of plain text, with a TextBlock as a parent and no children.
 * Wraps a single DOMTextNode.
 * For convenience, has a .text property that's just a JavaScript string
 * mirroring the text contents of the DOMTextNode.
 * Text contents must always be nonempty.
 */
var TextPiece = P(Node, function(_, _super) {
  _.init = function(text) {
    _super.init.call(this);
    this.text = text;
  };
  // overriding .jQize because neither jQuery nor our html parsing
  // format like text nodes.
  _.jQize = function(dom) {
    if (!dom) dom = document.createTextNode(this.text);
    this.dom = dom;
    return this.jQ = $(this.dom);
  };
  _.appendText = function(text) {
    this.text += text;
    this.dom.appendData(text);
  };
  _.prependText = function(text) {
    this.text = text + this.text;
    this.dom.insertData(0, text);
  };
  _.appendTextInDir = function(text, dir) {
    prayDirection(dir);
    if (dir === R) this.appendText(text);
    else this.prependText(text);
  };

  function endChar(dir, text) {
    return text.charAt(dir === L ? 0 : -1 + text.length);
  }

  _.moveTowards = function(dir, cursor) {
    prayDirection(dir);

    var ch = endChar(-dir, this.text)

    var from = this[-dir];
    if (from) from.appendTextInDir(ch, dir);
    else TextPiece(ch).createDir(-dir, cursor);

    return this.deleteTowards(dir, cursor);
  };

  _.combineDir = function(dir) {
    var toCombine = this[dir];

    this.appendTextInDir(toCombine.text, dir);
    toCombine.remove();
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
      cursor[dir] = 0;
    }
  };

  // -*- selection methods -*- //

  // there's gotta be a better way to move the cursor...
  function insertCursorAdjacent(dir, cursor, el) {
    cursor[-dir] = el;
    cursor[dir] = el[dir];
    cursor.hide().show();
  }

  _.createSelection = function(dir, cursor) {
    var selectedPiece = TextPiece(endChar(-dir, this.text));
    this.deleteTowards(dir, cursor);
    selectedPiece.createDir(dir, cursor);

    cursor.selection = Selection(selectedPiece);

    insertCursorAdjacent(dir, cursor, selectedPiece);
  }

  _.clearSelection = function(dir, cursor) {
    // cursor calls our clearSelection every time because the selection
    // only every contains one Node.
    if (this.text.length > 1) return this.retractSelection(dir, cursor);

    var cursorSibling = this;

    if (this[-dir]) {
      cursorSibling = this[-dir];
      cursorSibling.combineDir(dir);
    }

    insertCursorAdjacent(dir, cursor, cursorSibling);

    cursor.clearSelection();
  };

  _.expandSelection = function(dir, cursor) {
    var selectedPiece = cursor.selection.ends[L];
    var selectChar = endChar(-dir, this.text);
    selectedPiece.appendTextInDir(selectChar, dir);
    this.deleteTowards(dir, cursor);
  };

  _.retractSelection = function(dir, cursor) {
    var deselectChar = endChar(-dir, this.text);

    if (this[-dir]) {
      this[-dir].appendTextInDir(deselectChar, dir);
    }
    else {
      TextPiece(deselectChar).createDir(-dir, cursor);
    }

    this.deleteTowards(dir, cursor);
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
