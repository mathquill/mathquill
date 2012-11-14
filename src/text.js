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
  _.selectTowards = MathCommand.prototype.selectTowards;
  _.selectOutOf = function(dir, cursor) {
    var cmd = this;
    cursor.hide().insertAdjacent(dir, cmd)
    .selection = Selection(cmd);
  };
  _.deleteTowards = _.selectTowards;
  _.deleteOutOf = function(dir, cursor) {
    // backspace and delete at ends of block don't unwrap
    if (this.isEmpty()) cursor.insertAfter(this);
  };
  _.write = function(cursor, ch, replacedFragment) {
    if (replacedFragment) replacedFragment.remove();

    if (ch !== '$') {
      if (!cursor[L]) TextPiece(ch).createBefore(cursor);
      else cursor[L].appendCh(ch);
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

  _.blur = function() {
    MathBlock.prototype.blur.call(this);
    this.consolidateChildren();
  };

  _.consolidateChildren = function() {
    var firstChild = this.ch[L];
    var next;

    while (next = firstChild[R]) {
      next.remove();
      firstChild.appendCh(next.text);
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
  // jQize is for when the user types \text, and we need to set everything
  // up from scratch.
  _.jQize = function() {
    this.dom = document.createTextNode(this.text);
    return this.jQ = $(this.dom);
  };
  // finalizeTree is for when we've parsed \text{abc}, created the dom,
  // and need to link everything up
  _.finalizeTree = function() {
    var parentJQ = this.parent.jQ;
    this.dom = parentJQ[0].childNodes[0];

    // TODO: is this the correct behavior when parsing
    // the latex \text{} ?  This violates the requirement that
    // the text contents are always nonempty.  Should we just
    // disown the parent node instead?
    if (!this.dom) {
      this.dom = document.createTextNode('');
      parentJQ.append(this.dom);
    }

    this.text = this.dom.data;
    return this.jQ = $(this.dom);
  };
  _.appendCh = function(ch) {
    this.text += ch;
    this.dom.appendData(ch);
  };
  _.prependCh = function(ch) {
    this.text = ch + this.text;
    this.dom.insertData(0, ch);
  };
  _.appendChInDir = function(ch, dir) {
    prayDirection(dir);
    if (dir === R) this.appendCh(ch);
    else this.prependCh(ch);
  };

  _.moveTowards = function(dir, cursor) {
    prayDirection(dir);

    var ch = this.text.charAt(dir === R ? 0 : -1 + this.text.length);

    var from = this[-dir];
    if (from) from.appendChInDir(ch, dir);
    else TextPiece(ch).createDir(-dir, cursor);

    return this.deleteTowards(dir, cursor);
  };

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
