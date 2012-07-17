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
    .then(function() { return commandSequence; })
    .skip(string('}'))
  ;

  // Parser [MathCommand]
  var commandOrGroup =
    group.or(command.then(function(x) { return [x]; }))
  ;

  // Parser [MathCommand]
  var commandSequence =
    commandOrGroup
    .many().then(function(lists) {
      var out = [];

      for (var i = 0; i < lists.length; i += 1) {
        for (var j = 0; j < lists[i].length; j += 1) {
          out.push(lists[i][j]);
        }
      }

      return out;
    });

  // Parser MathBlock
  var block =
    commandOrGroup
    .then(function(commands) {
      var block = MathBlock();
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(block, block.lastChild, 0);
      }

      return block;
    });
  ;

  var latex =
    commandSequence.then(function(commands) {
      var rootBlock = RootMathBlock();
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(rootBlock, rootBlock.lastChild, 0);
      }

      return rootBlock;
    })
  ;

  latex.block = block;
  return latex;

})();
