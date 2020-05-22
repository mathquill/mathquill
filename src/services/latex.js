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
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var succeed = Parser.succeed;
  var fail = Parser.fail;
  var eof = Parser.eof;

  // Parsers yielding either MathCommands, or Fragments of MathCommands
  //   (either way, something that can be adopted by a MathBlock)
  var variable = letter.map(function(c) { return Letter(c); });
  var symbol = regex(/^[^${}\\_^]/).map(function(c) { return VanillaSymbol(c); });

  var controlSequence =
    regex(/^[^\\a-eg-zA-Z]/) // hotfix #164; match MathBlock::write
    .or(string('\\').then(
      regex(/^[a-z]+/i)
      .or(regex(/^\s+/).result(' '))
      .or(any)
    )).then(function(ctrlSeq) {
      var cmdKlass = localLatexCmds.value[ctrlSeq];

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

  // for renderLatexText; TODO: refactor
  // Parser RootMathCommand
  var mathMode = string('$').then(latexMath)
    // because TeX is insane, math mode doesn't necessarily
    // have to end.  So we allow for the case that math mode
    // continues to the end of the stream.
    .skip(string('$').or(eof))
    .map(function(block) {
      // HACK FIXME: this shouldn't have to have access to cursor
      var rootMathCommand = RootMathCommand();

      rootMathCommand.createBlocks();
      var rootMathBlock = rootMathCommand.ends[L];
      block.children().adopt(rootMathBlock, 0, 0);

      return rootMathCommand;
    })
  ;

  var escapedDollar = string('\\$').result('$');
  var textChar = escapedDollar.or(regex(/^[^$]/)).map(function(ch) {
    return VanillaSymbol(ch); // wrap in fn 'cos in a service, no commands yet
  });
  latexMath.latexText = mathMode.or(textChar).many();

  latexMath.parse =
  latexMath.latexText.parse = function(latex, latexCmds) {
    var parser = this;
    return localLatexCmds.let(latexCmds, function() {
      return parser._parse(latex);
    });
  };
  var localLatexCmds = ENV_VAR(); // LaTeX commands during this parse

  return latexMath;
})();

/**
 * Concise JSON Schema for `customSymbols` declarations:
 *   {
 *     "/[a-z]+/i": {
 *       spacing: { $enum: ['ord', 'bin', 'rel'] },
 *       $optional_italic: { $value: true } // only allowed if spacing === 'ord'
 *     }
 *   }
 * (More about Concise JSON Schemas: https://git.io/vwI9k )
 *
 * This is based on two classifications TeX uses for typesetting:
 *   - the type of atom ("ord, op, bin, rel, open, close, punct and inner")
 *       + determines spacing and line-breaking
 *   - the family of font (normal upright roman, italic, etc)
 *
 * https://github.com/Khan/KaTeX/wiki/Examining-TeX#group-types
 * http://tex.stackexchange.com/a/38984
 */
Options.p.customSymbols = LatexCmds;
optionProcessors.customSymbols = function(defs) {
  latexCmds = mkLatexCmds();
  for (var ctrlSeq in defs) if (defs.hasOwnProperty(ctrlSeq)) {
    if (!/^[a-z]+$/i.test(ctrlSeq)) {
      throw 'Control word must be all letters, got: "' + ctrlSeq + '"';
    }
    var def = defs[ctrlSeq];
    if (def.spacing === 'ord') {
      var kind = (def.italic ? Variable : VanillaSymbol);
    }
    else if (def.spacing === 'bin' || def.spacing === 'rel') {
      if (def.italic) throw 'Custom '+def.spacing+' symbols cannot be italic';
      var kind = BinaryOperator;
    }
    var cmd = latexCmds[ctrlSeq] = bind(spacing, '\\'+ctrlSeq+' ', def.ch);
    if (def.aliases) {
      if (!/^[a-z]+(?: [a-z]+)*$/i.test(def.aliases)) {
        throw 'Control word aliases must be space-delimited list of only letters, '
            + 'got: "' + def.aliases + '"';
      }
      var aliases = def.aliases.split(' ');
      for (var i = 0; i < aliases.length; i += 1) {
        latexCmds[aliases[i]] = cmd;
      }
    }
  }
  return latexCmds;
};

Controller.open(function(_, super_) {
  _.exportLatex = function() {
    return this.root.latex().replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
  };

  optionProcessors.maxDepth = function(depth) {
    return (typeof depth === 'number') ? depth : undefined;
  };
  _.writeLatex = function(latex) {
    var cursor = this.notify('edit').cursor;

    var block = latexMathParser.parse(latex, this.options.customSymbols);

    if (block && !block.isEmpty() && block.prepareInsertionAt(cursor)) {
      block.children().adopt(cursor.parent, cursor[L], cursor[R]);
      var jQ = block.jQize();
      jQ.insertBefore(cursor.jQ);
      cursor[L] = block.ends[R];
      block.finalizeInsert(cursor.options, cursor);
      if (block.ends[R][R].siblingCreated) block.ends[R][R].siblingCreated(cursor.options, L);
      if (block.ends[L][L].siblingCreated) block.ends[L][L].siblingCreated(cursor.options, R);
      cursor.parent.bubble('reflow');
    }

    return this;
  };
  _.renderLatexMath = function(latex) {
    var root = this.root;
    var cursor = this.cursor;
    var options = cursor.options;
    var jQ = root.jQ;

    var block = latexMathParser.parse(latex, this.options.customSymbols);

    root.eachChild('postOrder', 'dispose');
    root.ends[L] = root.ends[R] = 0;

    if (block && block.prepareInsertionAt(cursor)) {
      block.children().adopt(root, 0, 0);
      var html = block.join('html');
      jQ.html(html);
      root.jQize(jQ.children());
      root.finalizeInsert(cursor.options);
    }
    else {
      jQ.empty();
    }

    delete cursor.selection;
    cursor.insAtRightEnd(root);
  };
  _.renderLatexText = function(latex) {
    var root = this.root, cursor = this.cursor;

    root.jQ.children().slice(1).remove();
    root.eachChild('postOrder', 'dispose');
    root.ends[L] = root.ends[R] = 0;
    delete cursor.selection;
    cursor.show().insAtRightEnd(root);

    var commands = latexMathParser.latexText.parse(latex, this.options.customSymbols);

    if (commands) {
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(root, root.ends[R], 0);
      }

      root.jQize().appendTo(root.jQ);

      root.finalizeInsert(cursor.options);
    }
  };
});
