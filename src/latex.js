// Parser MathCommand
var VariableParser = LetterParser.pipe(Variable);
var SymbolParser = CharParser(/[^{}]/).pipe(VanillaSymbol);

var SupSubParser = CharParser(/[_^]/).bind(function(ch) {
  var cmd = LatexCmds[ch]();

  return BlockParser.pipe(function(block) {
    block.adopt(cmd, 0, 0);

    return cmd;
  });
});

var ControlSequenceParser =
  CharParser('\\').then(
    LetterParser.many().skip(WhiteSpaceParser)
    .or(WhiteSpaceParser.constResult(' '))
    .or(CharParser())
  ).pipe(function(ctrlSeq) {
    var cmdKlass = LatexCmds[ctrlSeq];

    if (cmdKlass) {
      return cmdKlass(ctrlSeq);
    }
    else {
      var textBlock = TextBlock();
      textBlock.replaces(ctrlSeq);
      return textBlock;
    }
  })
;

var CommandParser =
  ControlSequenceParser
  .or(SupSubParser)
  .or(VariableParser)
  .or(SymbolParser)
;

// Parser [MathCommand]
var GroupParser = CharParser('{').then(CommandParser.many()).skip(CharParser('}'));

// Parser MathBlock
var BlockParser =
  GroupParser
  .or(CommandParser.pipe(function(x) { return [x]; }))
  .pipe(function(commands) {
    var block = MathBlock();

    for (var i = 0; i < commands.length; i += 1) {
      commands[i].adopt(block, block.lastChild, 0);
    }

    return block;
  })
;

var RootParser = CommandParser.many().pipe(function(commands) {
  var block = MathBlock();

  for (var i = 0; i < commands.length; i += 1) {
    commands[i].adopt(block, block.lastChild, 0);
  }

  return block;
});
