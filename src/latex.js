// Parser MathCommand
var VariableParser = Parser('VariableParser').is(LetterParser).then(Variable);
var SymbolParser = Parser('SymbolParser').is(CharParser(/[^{}]/)).then(VanillaSymbol);

var SupSubParser = Parser('SupSubParser').is(CharParser(/[_^]/)).then(function(ch) {
  var cmd = LatexCmds[ch]();

  return BlockParser.then(function(block) {
    block.adopt(cmd, 0, 0);

    return cmd;
  });
});

var ControlSequenceParser = Parser('ControlSequenceParser')
  .is(CharParser('\\')).then(
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

var CommandParser = Parser('CommandParser')
  .is(ControlSequenceParser)
  .or(SupSubParser)
  .or(VariableParser)
  .or(SymbolParser)
;

// Parser [MathCommand]
var GroupParser = Parser('GroupParser').is(CharParser('{')).then(CommandParser.many()).after(CharParser('}'));

// Parser MathBlock
var BlockParser = Parser('BlockParser')
  .is(GroupParser)
  .or(CommandParser.then(function(x) { return [x]; }))
  .then(function(commands) {
    var block = MathBlock();

    for (var i = 0; i < commands.length; i += 1) {
      commands[i].adopt(block, block.lastChild, 0);
    }

    return block;
  })
;

var RootParser = Parser('RootParser').is(CommandParser).many().then(function(commands) {
  var block = MathBlock();

  for (var i = 0; i < commands.length; i += 1) {
    commands[i].adopt(block, block.lastChild, 0);
  }

  return block;
});
