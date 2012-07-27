// Parser MathCommand
var latexMathParser = (function() {
  function commandToBlock(cmd) {
    var block = MathBlock();
    cmd.adopt(block, 0, 0);
    return block;
  }

  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var succeed = Parser.succeed;
  var fail = Parser.fail;

  var variable = letter.map(Variable);
  var symbol = regex(/^[^${}\\_^]/).map(VanillaSymbol);

  var controlSequence =
    regex(/^[^\\]/)
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
    .or(symbol)
  ;

  // Parser MathBlock
  var mathGroup =
    string('{')
    .then(function() { return mathCommandSequence; })
    .skip(string('}'))
  ;

  // Parser MathBlock
  // NB: we skip whitespace after every block because we're in math mode.
  var mathBlock = optWhitespace.then(mathGroup.or(command.map(commandToBlock)));

  // Parser MathBlock
  var mathCommandSequence =
    mathBlock.many().map(function(blocks) {
      var firstBlock = blocks[0] || MathBlock();

      for (var i = 1; i < blocks.length; i += 1) {
        blocks[i].children().adopt(firstBlock, firstBlock.lastChild, 0);
      }

      return firstBlock;
    }).skip(optWhitespace)
  ;

  // Parser MathBlock
  var latexMath = mathCommandSequence;

  latexMath.block = mathBlock;
  return latexMath;
})();
