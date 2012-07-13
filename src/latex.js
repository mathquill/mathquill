var WhiteSpaceParser = CharParser(/\s/).many();
WhiteSpaceParser.name = 'WhiteSpaceParser';
var LetterParser = CharParser(/[a-z]/i);
LetterParser.name = 'LetterParser';

var VariableParser = LetterParser.then(Variable);
VariableParser.name = 'VariableParser';
var SymbolParser = CharParser(/[^{}]/).then(VanillaSymbol);
SymbolParser.name = 'SymbolParser';

var SupSubParser = CharParser(/[_^]/).then(function(ch) {
  var cmd = LatexCmds[ch]();

  return BlockParser.then(function(block) {
    block.adopt(cmd, 0, 0);

    return cmd;
  });
});
SupSubParser.name = 'SupSubParser';

var ControlSequenceParser =
  CharParser('\\').then(
    LetterParser.many().after(WhiteSpaceParser)
    .or(WhiteSpaceParser.then(' '))
    .or(CharParser())
  ).then(function(ctrlSeq) {
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
ControlSequenceParser.name = 'ControlSequenceParser';

// Parser MathCommand
var CommandParser =
  ControlSequenceParser
  .or(SupSubParser)
  .or(VariableParser)
  .or(SymbolParser)
;
CommandParser.name = 'CommandParser';

// Parser [MathCommand]
var GroupParser = CharParser('{').then(CommandParser.many()).after(CharParser('}'));
GroupParser.name = 'GroupParser';

// Parser MathBlock
var BlockParser =
  GroupParser
  .or(CommandParser.then(function(x) { return [x]; }))
  .then(function(commands) {
    var block = MathBlock();

    for (var i = 0; i < commands.length; i += 1) {
      commands[i].adopt(block, block.lastChild, 0);
    }

    return block;
  })
;
BlockParser.name = 'BlockParser';

var RootParser = CommandParser.many().then(function(commands) {
  var block = MathBlock();

  for (var i = 0; i < commands.length; i += 1) {
    commands[i].adopt(block, block.lastChild, 0);
  }

  return block;
});
RootParser.name = 'RootParser';
