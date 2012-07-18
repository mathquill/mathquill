// Parser MathCommand
var latexParser = (function() {
  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var any = Parser.any;
  var succeed = Parser.succeed;

  var whitespace = regex(/^\s*/);

  var variable = letter.map(Variable);
  var symbol = regex(/^[^{}]/).map(VanillaSymbol);

  var supSub = regex(/^[_^]/).skip(whitespace);

  var controlSequence =
    supSub
    .or(string('\\').then(
      regex(/^[a-z]+/i).skip(whitespace)
      .or(regex(/^\s+/).result(' '))
      .or(any)
    )).then(function(ctrlSeq) {
      var cmdKlass = LatexCmds[ctrlSeq];

      if (cmdKlass) {
        return cmdKlass(ctrlSeq).parser();
      }
      else {
        var textBlock = TextBlock();
        textBlock.replaces(ctrlSeq);
        return succeed(textBlock);
      }
    })
  ;

  var command =
    controlSequence
    .or(variable)
    .or(symbol)
  ;

  // Parser MathBlock
  var group =
    string('{')
    .then(function() { return commandSequence; })
    .skip(string('}'))
  ;

  // Parser MathBlock
  var block =
    group.or(command.map(function(cmd) {
      var block = MathBlock();
      cmd.adopt(block, 0, 0);
      return block;
    }))
  ;

  // Parser MathBlock
  var commandSequence =
    block.many().map(function(blocks) {
      var firstBlock = blocks[0] || MathBlock();

      for (var i = 1; i < blocks.length; i += 1) {
        blocks[i].children().adopt(firstBlock, firstBlock.lastChild, 0);
      }

      return firstBlock;
    })
  ;

  // Parser MathBlock
  var latex = commandSequence;

  latex.block = block;
  return latex;

})();
