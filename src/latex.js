// Parser MathCommand
var latexParser = (function() {
  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var any = Parser.any;

  var variable = letter.then(Variable);
  var symbol = regex(/^[^{}]/).then(VanillaSymbol);

  var supSub = regex(/^[_^]/);

  var controlSequence =
    supSub
    .or(string('\\').then(
      regex(/^[a-z]+/i)
      .or(regex(/^\s+/).then(' '))
      .or(any)
    )).then(function(ctrlSeq) {
      var cmdKlass = LatexCmds[ctrlSeq];

      if (cmdKlass) {
        return cmdKlass(ctrlSeq).parser();
      }
      else {
        var textBlock = TextBlock();
        textBlock.replaces(ctrlSeq);
        return textBlock;
      }
    })
  ;

  var command =
    controlSequence
    .or(variable)
    .or(symbol)
  ;

  // Parser [MathCommand]
  var group =
    string('{')
    .then(command.many())
    .skip(string('}'))
  ;

  // Parser MathBlock
  var block =
    group.or(command.then(function(x) { return [x]; }))
    .then(function(commands) {
      var block = MathBlock();

      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(block, block.lastChild, 0);
      }

      return block;
    })
  ;

  var latex =
    command.many().then(function(commands) {
      var block = MathBlock();

      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(block, block.lastChild, 0);
      }

      return block;
    })
  ;

  latex.block = block;
  return latex;

})();
