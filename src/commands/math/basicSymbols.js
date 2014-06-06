/*********************************
 * Symbols for Basic Mathematics
 ********************************/

var Variable = P(Symbol, function(_, super_) {
  _.init = function(ch, html) {
    super_.init.call(this, ch, '<var>'+(html || ch)+'</var>');
  };
  _.text = function() {
    var text = this.ctrlSeq;
    if (this[L] && !(this[L] instanceof Variable)
        && !(this[L] instanceof BinaryOperator))
      text = '*' + text;
    if (this[R] && !(this[R] instanceof BinaryOperator)
        && !(this[R].ctrlSeq === '^'))
      text += '*';
    return text;
  };
});

var AutoCmds = {}, MAX_AUTOCMD_LEN = 0;
MathQuill.addAutoCommands = function(cmds) {
  if (!/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"'+cmds+'" not a space-delimited list of only letters';
  }
  cmds = cmds.split(' ');
  for (var i = 0; i < cmds.length; i += 1) {
    if (cmds[i].length < 2) {
      throw 'autocommand "'+cmds[i]+'" not minimum length of 2';
    }
    if (UnItalicizedCmds.hasOwnProperty(cmds[i])) {
      throw '"' + cmds[i] + '" already auto-unitalicized';
    }
    AutoCmds[cmds[i]] = 1;
    MAX_AUTOCMD_LEN = max(cmds[i].length, MAX_AUTOCMD_LEN);
  }
};

var Letter = P(Variable, function(_, super_) {
  _.init = function(ch) { return super_.init.call(this, this.letter = ch); };
  _.createLeftOf = function(cursor) {
    if (MAX_AUTOCMD_LEN > 0) {
      // want longest possible autocommand, so join together longest
      // sequence of letters
      var str = this.letter, l = cursor[L], i = 1;
      while (l instanceof Letter && i < MAX_AUTOCMD_LEN) {
        str = l.letter + str, l = l[L], i += 1;
      }
      // check for an autocommand, going thru substrings longest to shortest
      while (str.length) {
        if (AutoCmds.hasOwnProperty(str)) {
          for (var i = 2, l = cursor[L]; i < str.length; i += 1, l = l[L]);
          Fragment(l, cursor[L]).remove();
          cursor[L] = l[L];
          return LatexCmds[str](str).createLeftOf(cursor);
        }
        str = str.slice(1);
      }
    }
    super_.createLeftOf.apply(this, arguments);
  };
  _.italicize = function(bool) {
    this.jQ.toggleClass('mq-un-italicized', !bool);
    return this;
  };
  _.finalizeTree = _.siblingDeleted = _.siblingCreated = function(dir) {
    // don't auto-unitalicize if the sibling to my right changed (dir === R or
    // undefined) and it's now a Letter, it will unitalicize everyone
    if (dir !== L && this[R] instanceof Letter) return;
    this.autoUnItalicize();
  };
  _.autoUnItalicize = function() {
    if (MAX_UNITALICIZED_LEN === 0) return;
    // want longest possible auto-unitalicized command, so join together longest
    // sequence of letters
    var str = this.letter;
    for (var l = this[L]; l instanceof Letter; l = l[L]) str = l.letter + str;
    for (var r = this[R]; r instanceof Letter; r = r[R]) str += r.letter;

    // removeClass and delete flags from all letters before figuring out
    // which are part of an auto-unitalicized command, if any
    Fragment(l[R] || this.parent.ends[L], r[L] || this.parent.ends[R]).each(function(el) {
      el.italicize(true).jQ.removeClass('mq-first mq-last');
      el.ctrlSeq = el.letter;
    });

    // check for auto-unitalicized commands: at each position from left to
    // right, check substrings from longest to shortest
    outer: for (var i = 0, first = l[R] || this.parent.ends[L]; i < str.length; i += 1, first = first[R]) {
      for (var len = min(MAX_UNITALICIZED_LEN, str.length - i); len > 0; len -= 1) {
        var word = str.slice(i, i + len);
        if (UnItalicizedCmds.hasOwnProperty(word)) {
          for (var j = 0, letter = first; j < len; j += 1, letter = letter[R]) {
            letter.italicize(false);
            var last = letter;
          }

          var isBuiltIn = OperatorNames.hasOwnProperty(word);
          first.ctrlSeq = (isBuiltIn ? '\\' : '\\operatorname{') + first.ctrlSeq;
          last.ctrlSeq += (isBuiltIn ? ' ' : '}');
          if (TwoWordOps.hasOwnProperty(word)) last[L][L][L].jQ.addClass('mq-last');
          if (nonOperatorSymbol(first[L])) first.jQ.addClass('mq-first');
          if (nonOperatorSymbol(last[R])) last.jQ.addClass('mq-last');

          i += len - 1;
          first = last;
          continue outer;
        }
      }
    }
  };
  function nonOperatorSymbol(node) {
    return node instanceof Symbol && !(node instanceof BinaryOperator);
  }
});
var OperatorNames = {}; // http://latex.wikia.com/wiki/List_of_LaTeX_symbols#Named_operators:_sin.2C_cos.2C_etc.
  // except for over/under line/arrow \lim variants like \varlimsup
var TwoWordOps = { limsup: 1, liminf: 1, projlim: 1, injlim: 1 };
var UnItalicizedCmds = {}, MAX_UNITALICIZED_LEN = 9; // auto-unitalicized words
(function() {
  var mostOps = ('Pr arg deg det dim exp gcd hom inf ker lg lim ln log max min sup'
                 + ' limsup liminf injlim projlim Pr').split(' ');
  for (var i = 0; i < mostOps.length; i += 1) {
    OperatorNames[mostOps[i]] = UnItalicizedCmds[mostOps[i]] = 1;
  }

  var trigOps = 'sin cos tan arcsin arccos arctan sinh cosh tanh'.split(' ');
  for (var i = 0; i < trigOps.length; i += 1) OperatorNames[trigOps[i]] = 1;
  OperatorNames.sec = OperatorNames.csc = OperatorNames.cot =
  OperatorNames.coth = 1; // why coth but not sech and csch, LaTeX?

  var trigs = 'sin cos tan sec cosec csc cotan cot ctg'.split(' ');
  for (var i = 0; i < trigs.length; i += 1) {
    UnItalicizedCmds[trigs[i]] =
    UnItalicizedCmds['arc'+trigs[i]] =
    UnItalicizedCmds[trigs[i]+'h'] =
    UnItalicizedCmds['ar'+trigs[i]+'h'] =
    UnItalicizedCmds['arc'+trigs[i]+'h'] = 1;
  }
}());
MathQuill.overrideAutoUnitalicized = function(cmds) {
  if (!/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"'+cmds+'" not a space-delimited list of only letters';
  }
  cmds = cmds.split(' ');

  UnItalicizedCmds = {};
  MAX_UNITALICIZED_LEN = 0;
  for (var i = 0; i < cmds.length; i += 1) {
    if (cmds[i].length < 2) {
      throw '"'+cmds[i]+'" not minimum length of 2';
    }
    UnItalicizedCmds[cmds[i]] = 1;
    MAX_UNITALICIZED_LEN = max(cmds[i].length, MAX_UNITALICIZED_LEN);
  }
};
var UnItalicized = P(Symbol, function(_, super_) {
  _.init = function(fn) { this.ctrlSeq = fn; };
  _.createLeftOf = function(cursor) {
    var fn = this.ctrlSeq;
    for (var i = 0; i < fn.length; i += 1) {
      Letter(fn.charAt(i)).createLeftOf(cursor);
    }
  };
  _.parser = function() {
    var fn = this.ctrlSeq;
    var block = MathBlock();
    for (var i = 0; i < fn.length; i += 1) {
      Letter(fn.charAt(i)).adopt(block, block.ends[R], 0);
    }
    return Parser.succeed(block.children());
  };
});
for (var fn in OperatorNames) if (OperatorNames.hasOwnProperty(fn)) {
  LatexCmds[fn] = UnItalicized;
}
LatexCmds.operatorname = P(MathCommand, function(_) {
  _.createLeftOf = noop;
  _.numBlocks = function() { return 1; };
  _.parser = function() {
    return latexMathParser.block.map(function(b) { return b.children(); });
  };
});

LatexCmds.f = P(Letter, function(_, super_) {
  _.init = function() {
    Symbol.p.init.call(this, this.letter = 'f', '<var class="mq-florin">&fnof;</var>');
  };
  _.italicize = function(bool) {
    this.jQ.html(bool ? '&fnof;' : 'f').toggleClass('mq-florin', bool);
    return super_.italicize.apply(this, arguments);
  };
});

// VanillaSymbol's
LatexCmds[' '] = LatexCmds.space = bind(VanillaSymbol, '\\ ', ' ');

LatexCmds["'"] = LatexCmds.prime = bind(VanillaSymbol, "'", '&prime;');

LatexCmds.backslash = bind(VanillaSymbol,'\\backslash ','\\');
if (!CharCmds['\\']) CharCmds['\\'] = LatexCmds.backslash;

LatexCmds.$ = bind(VanillaSymbol, '\\$', '$');

// does not use Symbola font
var NonSymbolaSymbol = P(Symbol, function(_, super_) {
  _.init = function(ch, html) {
    super_.init.call(this, ch, '<span class="mq-nonSymbola">'+(html || ch)+'</span>');
  };
});

LatexCmds['@'] = NonSymbolaSymbol;
LatexCmds['&'] = bind(NonSymbolaSymbol, '\\&', '&amp;');
LatexCmds['%'] = bind(NonSymbolaSymbol, '\\%', '%');

//the following are all Greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html

//lowercase Greek letter variables
LatexCmds.alpha =
LatexCmds.beta =
LatexCmds.gamma =
LatexCmds.delta =
LatexCmds.zeta =
LatexCmds.eta =
LatexCmds.theta =
LatexCmds.iota =
LatexCmds.kappa =
LatexCmds.mu =
LatexCmds.nu =
LatexCmds.xi =
LatexCmds.rho =
LatexCmds.sigma =
LatexCmds.tau =
LatexCmds.chi =
LatexCmds.psi =
LatexCmds.omega = P(Variable, function(_, super_) {
  _.init = function(latex) {
    super_.init.call(this,'\\'+latex+' ','&'+latex+';');
  };
});

//why can't anybody FUCKING agree on these
LatexCmds.phi = //W3C or Unicode?
  bind(Variable,'\\phi ','&#981;');

LatexCmds.phiv = //Elsevier and 9573-13
LatexCmds.varphi = //AMS and LaTeX
  bind(Variable,'\\varphi ','&phi;');

LatexCmds.epsilon = //W3C or Unicode?
  bind(Variable,'\\epsilon ','&#1013;');

LatexCmds.epsiv = //Elsevier and 9573-13
LatexCmds.varepsilon = //AMS and LaTeX
  bind(Variable,'\\varepsilon ','&epsilon;');

LatexCmds.piv = //W3C/Unicode and Elsevier and 9573-13
LatexCmds.varpi = //AMS and LaTeX
  bind(Variable,'\\varpi ','&piv;');

LatexCmds.sigmaf = //W3C/Unicode
LatexCmds.sigmav = //Elsevier
LatexCmds.varsigma = //LaTeX
  bind(Variable,'\\varsigma ','&sigmaf;');

LatexCmds.thetav = //Elsevier and 9573-13
LatexCmds.vartheta = //AMS and LaTeX
LatexCmds.thetasym = //W3C/Unicode
  bind(Variable,'\\vartheta ','&thetasym;');

LatexCmds.upsilon = //AMS and LaTeX and W3C/Unicode
LatexCmds.upsi = //Elsevier and 9573-13
  bind(Variable,'\\upsilon ','&upsilon;');

//these aren't even mentioned in the HTML character entity references
LatexCmds.gammad = //Elsevier
LatexCmds.Gammad = //9573-13 -- WTF, right? I dunno if this was a typo in the reference (see above)
LatexCmds.digamma = //LaTeX
  bind(Variable,'\\digamma ','&#989;');

LatexCmds.kappav = //Elsevier
LatexCmds.varkappa = //AMS and LaTeX
  bind(Variable,'\\varkappa ','&#1008;');

LatexCmds.rhov = //Elsevier and 9573-13
LatexCmds.varrho = //AMS and LaTeX
  bind(Variable,'\\varrho ','&#1009;');

//Greek constants, look best in un-italicised Times New Roman
LatexCmds.pi = LatexCmds['π'] = bind(NonSymbolaSymbol,'\\pi ','&pi;');
LatexCmds.lambda = bind(NonSymbolaSymbol,'\\lambda ','&lambda;');

//uppercase greek letters

LatexCmds.Upsilon = //LaTeX
LatexCmds.Upsi = //Elsevier and 9573-13
LatexCmds.upsih = //W3C/Unicode "upsilon with hook"
LatexCmds.Upsih = //'cos it makes sense to me
  bind(Symbol,'\\Upsilon ','<var style="font-family: serif">&upsih;</var>'); //Symbola's 'upsilon with a hook' is a capital Y without hooks :(

//other symbols with the same LaTeX command and HTML character entity reference
LatexCmds.Gamma =
LatexCmds.Delta =
LatexCmds.Theta =
LatexCmds.Lambda =
LatexCmds.Xi =
LatexCmds.Pi =
LatexCmds.Sigma =
LatexCmds.Phi =
LatexCmds.Psi =
LatexCmds.Omega =
LatexCmds.forall = P(VanillaSymbol, function(_, super_) {
  _.init = function(latex) {
    super_.init.call(this,'\\'+latex+' ','&'+latex+';');
  };
});

// symbols that aren't a single MathCommand, but are instead a whole
// Fragment. Creates the Fragment from a LaTeX string
var LatexFragment = P(MathCommand, function(_) {
  _.init = function(latex) { this.latex = latex; };
  _.createLeftOf = function(cursor) {
    var block = latexMathParser.parse(this.latex);
    block.children().adopt(cursor.parent, cursor[L], cursor[R]);
    cursor[L] = block.ends[R];
    block.jQize().insertBefore(cursor.jQ);
    block.finalizeInsert(cursor);
    if (block.ends[R][R].siblingCreated) block.ends[R][R].siblingCreated(L);
    if (block.ends[L][L].siblingCreated) block.ends[L][L].siblingCreated(R);
    cursor.parent.bubble('edited');
  };
  _.parser = function() {
    var frag = latexMathParser.parse(this.latex).children();
    return Parser.succeed(frag);
  };
});

// for what seems to me like [stupid reasons][1], Unicode provides
// subscripted and superscripted versions of all ten Arabic numerals,
// as well as [so-called "vulgar fractions"][2].
// Nobody really cares about most of them, but some of them actually
// predate Unicode, dating back to [ISO-8859-1][3], apparently also
// known as "Latin-1", which among other things [Windows-1252][4]
// largely coincides with, so Microsoft Word sometimes inserts them
// and they get copy-pasted into MathQuill.
//
// (Irrelevant but funny story: Windows-1252 is actually a strict
// superset of the "closely related but distinct"[3] "ISO 8859-1" --
// see the lack of a dash after "ISO"? Completely different character
// set, like elephants vs elephant seals, or "Zombies" vs "Zombie
// Redneck Torture Family". What kind of idiot would get them confused.
// People in fact got them confused so much, it was so common to
// mislabel Windows-1252 text as ISO-8859-1, that most modern web
// browsers and email clients treat the MIME charset of ISO-8859-1
// as actually Windows-1252, behavior now standard in the HTML5 spec.)
//
// [1]: http://en.wikipedia.org/wiki/Unicode_subscripts_andsuper_scripts
// [2]: http://en.wikipedia.org/wiki/Number_Forms
// [3]: http://en.wikipedia.org/wiki/ISO/IEC_8859-1
// [4]: http://en.wikipedia.org/wiki/Windows-1252
LatexCmds['¹'] = bind(LatexFragment, '^1');
LatexCmds['²'] = bind(LatexFragment, '^2');
LatexCmds['³'] = bind(LatexFragment, '^3');
LatexCmds['¼'] = bind(LatexFragment, '\\frac14');
LatexCmds['½'] = bind(LatexFragment, '\\frac12');
LatexCmds['¾'] = bind(LatexFragment, '\\frac34');

var PlusMinus = P(BinaryOperator, function(_) {
  _.init = VanillaSymbol.prototype.init;

  _.contactWeld = _.siblingCreated = _.siblingDeleted = function(dir) {
    if (dir === R) return; // ignore if sibling only changed on the right
    this.jQ[0].className =
      (!this[L] || this[L] instanceof BinaryOperator ? '' : 'mq-binary-operator');
    return this;
  };
});

LatexCmds['+'] = bind(PlusMinus, '+', '+');
//yes, these are different dashes, I think one is an en dash and the other is a hyphen
LatexCmds['–'] = LatexCmds['-'] = bind(PlusMinus, '-', '&minus;');
LatexCmds['±'] = LatexCmds.pm = LatexCmds.plusmn = LatexCmds.plusminus =
  bind(PlusMinus,'\\pm ','&plusmn;');
LatexCmds.mp = LatexCmds.mnplus = LatexCmds.minusplus =
  bind(PlusMinus,'\\mp ','&#8723;');

CharCmds['*'] = LatexCmds.sdot = LatexCmds.cdot =
  bind(BinaryOperator, '\\cdot ', '&middot;');
//semantically should be &sdot;, but &middot; looks better

var Inequality = P(BinaryOperator, function(_, super_) {
  _.init = function(data, strict) {
    this.data = data;
    this.strict = strict;
    var strictness = (strict ? 'Strict' : '');
    super_.init.call(this, data['ctrlSeq'+strictness], data['html'+strictness],
                     data['text'+strictness]);
  };
  _.swap = function(strict) {
    this.strict = strict;
    var strictness = (strict ? 'Strict' : '');
    this.ctrlSeq = this.data['ctrlSeq'+strictness];
    this.jQ.html(this.data['html'+strictness]);
    this.textTemplate = [ this.data['text'+strictness] ];
  };
  _.deleteTowards = function(dir, cursor) {
    if (dir === L && !this.strict) {
      this.swap(true);
      return;
    }
    super_.deleteTowards.apply(this, arguments);
  };
});

var less = { ctrlSeq: '\\le ', html: '&le;', text: '≤',
             ctrlSeqStrict: '<', htmlStrict: '&lt;', textStrict: '<' };
var greater = { ctrlSeq: '\\ge ', html: '&ge;', text: '≥',
                ctrlSeqStrict: '>', htmlStrict: '&gt;', textStrict: '>' };

LatexCmds['<'] = LatexCmds.lt = bind(Inequality, less, true);
LatexCmds['>'] = LatexCmds.gt = bind(Inequality, greater, true);
LatexCmds['≤'] = LatexCmds.le = LatexCmds.leq = bind(Inequality, less, false);
LatexCmds['≥'] = LatexCmds.ge = LatexCmds.geq = bind(Inequality, greater, false);

var Equality = P(BinaryOperator, function(_, super_) {
  _.init = function() {
    super_.init.call(this, '=', '=');
  };
  _.createLeftOf = function(cursor) {
    if (cursor[L] instanceof Inequality && cursor[L].strict) {
      cursor[L].swap(false);
      return;
    }
    super_.createLeftOf.apply(this, arguments);
  };
});
LatexCmds['='] = Equality;

LatexCmds.times = bind(BinaryOperator, '\\times ', '&times;', '[x]');

LatexCmds['÷'] = LatexCmds.div = LatexCmds.divide = LatexCmds.divides =
  bind(BinaryOperator,'\\div ','&divide;', '[/]');
