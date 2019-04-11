// Parser MathBlock
var latexMathParser = (function() {
  function commandToBlock(cmd) { // can also take in a Fragment
    var block = MathBlock();
    cmd.adopt(block, 0, 0);
    return block;
  }
  function joinBlocks(blocks) {
    var firstBlock = blocks[0] || MathBlock();

    for (var i = 1; i < blocks.length; i += 1) {
      blocks[i].children().adopt(firstBlock, firstBlock.ends[R], 0);
    }

    return firstBlock;
  }

  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var digit = Parser.digit;
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var succeed = Parser.succeed;
  var fail = Parser.fail;

  // Parsers yielding either MathCommands, or Fragments of MathCommands
  //   (either way, something that can be adopted by a MathBlock)
  var variable = letter.map(function(c) { return Letter(c); });
  var number = digit.map(function (c) { return Digit(c); });
  var symbol = regex(/^[^${}\\_^]/).map(function(c) { return VanillaSymbol(c); });

  var controlSequence =
    regex(/^[^\\a-eg-zA-Z]/) // hotfix #164; match MathBlock::write
    .or(string('\\').then(
      regex(/^[a-z]+/i)
      .or(regex(/^\s+/).result(' '))
      .or(any)
    )).then(function(ctrlSeq) {
      var cmdKlass = LatexCmds[ctrlSeq];

      if (cmdKlass) {
        return cmdKlass(ctrlSeq).parser();
      }
      else {
        return fail('unknown command: \\'+ctrlSeq);
      }
    })
  ;

  var command =
    controlSequence
    .or(variable)
    .or(number)
    .or(symbol)
  ;

  // Parsers yielding MathBlocks
  var mathGroup = string('{').then(function() { return mathSequence; }).skip(string('}'));
  var mathBlock = optWhitespace.then(mathGroup.or(command.map(commandToBlock)));
  var mathSequence = mathBlock.many().map(joinBlocks).skip(optWhitespace);

  var optMathBlock =
    string('[').then(
      mathBlock.then(function(block) {
        return block.join('latex') !== ']' ? succeed(block) : fail();
      })
      .many().map(joinBlocks).skip(optWhitespace)
    ).skip(string(']'))
  ;

  var latexMath = mathSequence;

  latexMath.block = mathBlock;
  latexMath.optBlock = optMathBlock;
  return latexMath;
})();

Controller.open(function(_, super_) {
  _.cleanLatex = function (latex) {
    //prune unnecessary spaces
    return latex.replace(/(\\[a-z]+) (?![a-z])/ig,'$1')
  }
  _.exportLatex = function() {
    return this.cleanLatex(this.root.latex());
  };
  _.writeLatex = function(latex) {
    var cursor = this.notify('edit').cursor;

    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    if (block && !block.isEmpty()) {
      block.children().adopt(cursor.parent, cursor[L], cursor[R]);
      var jQ = block.jQize();
      jQ.insertBefore(cursor.jQ);
      cursor[L] = block.ends[R];
      block.finalizeInsert(cursor.options, cursor);
      if (block.ends[R][R].siblingCreated) block.ends[R][R].siblingCreated(cursor.options, L);
      if (block.ends[L][L].siblingCreated) block.ends[L][L].siblingCreated(cursor.options, R);
      cursor.parent.bubble(function (node) { node.reflow(); });
    }

    return this;
  };
  _.classifyLatexForEfficientUpdate = function (latex) {
    if (typeof latex !== 'string') return;

    var matches = latex.match(/-?[0-9.]+$/g);
    if (matches && matches.length === 1) {
      return {
        latex: latex,
        prefix: latex.substr(0, latex.length - matches[0].length),
        digits: matches[0]
      };
    }
  };
  _.renderLatexMathEfficiently = function (latex) {
    var oldLatex, oldClassification;
    var classification = this.classifyLatexForEfficientUpdate(latex);
    if (classification) {
      oldLatex = this.exportLatex();
      oldClassification = this.classifyLatexForEfficientUpdate(oldLatex);
      if (!oldClassification || oldClassification.prefix !== classification.prefix) {
        return false;
      }
    } else {
      return false;
    }

    var root = this.root;

    // check if minus sign is changing
    var oldDigits = oldClassification.digits;
    var newDigits = classification.digits;
    var oldMinusSign = false;
    var newMinusSign = false;
    if (oldDigits[0] === '-') {
      oldMinusSign = true;
      oldDigits = oldDigits.substr(1);
    }
    if (newDigits[0] === '-') {
      newMinusSign = true;
      newDigits = newDigits.substr(1);
    }

    // start at the very end
    var charNode = this.root.ends[R];
    var oldCharNodes = [];
    for (var i= oldDigits.length - 1; i >= 0; i--) {
      // the tree does not match what we expect
      if (charNode.ctrlSeq !== oldDigits[i]) {
        return false;
      }

      // the trailing digits are not just under the root. We require the root
      // to be the parent so that we can be sure we do not need a reflow to
      // grow parens.
      if (charNode.parent !== root) {
        return false;
      }

      // push to the start. We're traversing backwards
      oldCharNodes.unshift(charNode);

      // move left one character
      charNode = charNode[L];
    }

    // remove the minus sign
    if (oldMinusSign && !newMinusSign) {
      var oldMinusNode = charNode;
      if (oldMinusNode.ctrlSeq !== '-') return false;
      if (oldMinusNode[R] !== oldCharNodes[0]) return false;
      if (oldMinusNode.parent !== root) return false;
      if (oldMinusNode[L] && oldMinusNode[L].parent !== root) return false;

      oldCharNodes[0][L] = oldMinusNode[L];

      if (root.ends[L] === oldMinusNode) root.ends[L] = oldCharNodes[0];
      if (oldMinusNode[L]) oldMinusNode[L][R] = oldCharNodes[0];

      oldMinusNode.jQ.remove();
    }

    // add a minus sign
    if (!oldMinusSign && newMinusSign) {
      var newMinusNode = PlusMinus('-');
      var minusSpan = document.createElement('span');
      minusSpan.textContent = '-';
      newMinusNode.jQ = $(minusSpan);

      if (oldCharNodes[0][L]) oldCharNodes[0][L][R] = newMinusNode;
      if (root.ends[L] === oldCharNodes[0]) root.ends[L] = newMinusNode;

      newMinusNode.parent = root;
      newMinusNode[L] = oldCharNodes[0][L];
      newMinusNode[R] = oldCharNodes[0];
      oldCharNodes[0][L] = newMinusNode;

      newMinusNode.contactWeld(); // decide if binary operator
      newMinusNode.jQ.insertBefore(oldCharNodes[0].jQ);
    }

    // update the text of the current nodes
    var commonLength = Math.min(oldDigits.length, newDigits.length);
    for (i=0; i < commonLength; i++) {
      var newText = newDigits[i];
      charNode = oldCharNodes[i];
      if (charNode.ctrlSeq !== newText) {
        charNode.ctrlSeq = newText;
        charNode.jQ[0].textContent = newText;
        charNode.mathspeakName = newText;
      }
    }

    // remove the extra digits at the end
    if (oldDigits.length > newDigits.length) {
      charNode = oldCharNodes[newDigits.length - 1];
      root.ends[R] = charNode;
      charNode[R] = 0;

      for (i = oldDigits.length - 1; i >= commonLength; i--) {
        oldCharNodes[i].jQ.remove();
      }
    }

    // add new digits after the existing ones
    if (newDigits.length > oldDigits.length) {
      var frag = document.createDocumentFragment();

      for (i = commonLength; i < newDigits.length; i++) {
        var span = document.createElement('span');
        span.className = "mq-digit";
        span.textContent = newDigits[i];

        var newNode = Digit(newDigits[i]);
        newNode.parent = root;
        newNode.jQ = $(span);
        frag.appendChild(span);

        // splice this node in
        newNode[L] = root.ends[R];
        newNode[R] = 0;
        newNode[L][R] = newNode;
        root.ends[R] = newNode;
      }

      root.jQ[0].appendChild(frag);
    }

    var currentLatex = this.exportLatex();
    if (currentLatex !== latex) {
      console.warn('tried updating latex efficiently but did not work. Attempted: ' + latex + ' but wrote: ' + currentLatex);
      return false;
    }

    this.cursor.resetToEnd(this);

    var rightMost = root.ends[R];
    if (rightMost.fixDigitGrouping) {
      rightMost.fixDigitGrouping(this.cursor.options);
    }

    return true;
  };
  _.renderLatexMathFromScratch = function (latex) {
    var root = this.root, cursor = this.cursor;
    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    root.ends[L] = root.ends[R] = 0;

    if (block) {
      block.children().adopt(root, 0, 0);
    }

    var jQ = root.jQ;

    if (block) {
      var html = block.join('html');
      jQ.html(html);
      root.jQize(jQ.children());
      root.finalizeInsert(cursor.options);
    }
    else {
      jQ.empty();
    }
    var prependedLabel = this.ariaLabel && this.ariaLabel !== 'Math Input' ? this.ariaLabel + ': ' : '';
    this.container.attr('aria-label', prependedLabel + root.mathspeak().trim());

    delete cursor.selection;
    cursor.insAtRightEnd(root);
  };
  _.renderLatexMath = function(latex) {
    this.notify('replace');

    if (this.renderLatexMathEfficiently(latex)) return;
    this.renderLatexMathFromScratch(latex);
  };
  _.renderLatexText = function(latex) {
    var root = this.root, cursor = this.cursor;

    root.jQ.children().slice(1).remove();
    root.ends[L] = root.ends[R] = 0;
    delete cursor.selection;
    cursor.show().insAtRightEnd(root);

    var regex = Parser.regex;
    var string = Parser.string;
    var eof = Parser.eof;
    var all = Parser.all;

    // Parser RootMathCommand
    var mathMode = string('$').then(latexMathParser)
      // because TeX is insane, math mode doesn't necessarily
      // have to end.  So we allow for the case that math mode
      // continues to the end of the stream.
      .skip(string('$').or(eof))
      .map(function(block) {
        // HACK FIXME: this shouldn't have to have access to cursor
        var rootMathCommand = RootMathCommand(cursor);

        rootMathCommand.createBlocks();
        var rootMathBlock = rootMathCommand.ends[L];
        block.children().adopt(rootMathBlock, 0, 0);

        return rootMathCommand;
      })
    ;

    var escapedDollar = string('\\$').result('$');
    var textChar = escapedDollar.or(regex(/^[^$]/)).map(VanillaSymbol);
    var latexText = mathMode.or(textChar).many();
    var commands = latexText.skip(eof).or(all.result(false)).parse(latex);

    if (commands) {
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(root, root.ends[R], 0);
      }

      root.jQize().appendTo(root.jQ);

      root.finalizeInsert(cursor.options);
    }
  };
});
