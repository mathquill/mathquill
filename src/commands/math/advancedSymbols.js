/************************************
 * Symbols for Advanced Mathematics
 ***********************************/

LatexCmds.notin =
LatexCmds.cong =
LatexCmds.equiv =
LatexCmds.oplus =
LatexCmds.otimes = P(BinaryOperator, function(_, super_) {
  _.init = function(latex) {
    super_.init.call(this, '\\'+latex+' ', '&'+latex+';');
  };
});

LatexCmds['∗'] = LatexCmds.ast = LatexCmds.star = LatexCmds.loast = LatexCmds.lowast =
  bind(BinaryOperator,'\\ast ','&lowast;', 'low asterisk');
LatexCmds.therefor = LatexCmds.therefore =
  bind(BinaryOperator,'\\therefore ','&there4;', 'therefore');

LatexCmds.cuz = // l33t
LatexCmds.because = bind(BinaryOperator,'\\because ','&#8757;', 'because');

LatexCmds.prop = LatexCmds.propto = bind(BinaryOperator,'\\propto ','&prop;', 'proportional to');

LatexCmds['≈'] = LatexCmds.asymp = LatexCmds.approx = bind(BinaryOperator,'\\approx ','&asymp;'), 'approximately equal to';

LatexCmds.isin = LatexCmds['in'] = bind(BinaryOperator,'\\in ','&isin;', 'is in');

LatexCmds.ni = LatexCmds.contains = bind(BinaryOperator,'\\ni ','&ni;', 'is not in');

LatexCmds.notni = LatexCmds.niton = LatexCmds.notcontains = LatexCmds.doesnotcontain =
  bind(BinaryOperator,'\\not\\ni ','&#8716;', 'does not contain');

LatexCmds.sub = LatexCmds.subset = bind(BinaryOperator,'\\subset ','&sub;', 'subset');

LatexCmds.sup = LatexCmds.supset = LatexCmds.superset =
  bind(BinaryOperator,'\\supset ','&sup;', 'superset');

LatexCmds.nsub = LatexCmds.notsub =
LatexCmds.nsubset = LatexCmds.notsubset =
  bind(BinaryOperator,'\\not\\subset ','&#8836;', 'not a subset');

LatexCmds.nsup = LatexCmds.notsup =
LatexCmds.nsupset = LatexCmds.notsupset =
LatexCmds.nsuperset = LatexCmds.notsuperset =
  bind(BinaryOperator,'\\not\\supset ','&#8837;', 'not a superset');

LatexCmds.sube = LatexCmds.subeq = LatexCmds.subsete = LatexCmds.subseteq =
  bind(BinaryOperator,'\\subseteq ','&sube;', 'subset or equal to');

LatexCmds.supe = LatexCmds.supeq =
LatexCmds.supsete = LatexCmds.supseteq =
LatexCmds.supersete = LatexCmds.superseteq =
  bind(BinaryOperator,'\\supseteq ','&supe;', 'superset or equal to');

LatexCmds.nsube = LatexCmds.nsubeq =
LatexCmds.notsube = LatexCmds.notsubeq =
LatexCmds.nsubsete = LatexCmds.nsubseteq =
LatexCmds.notsubsete = LatexCmds.notsubseteq =
  bind(BinaryOperator,'\\not\\subseteq ','&#8840;', 'not subset or equal to');

LatexCmds.nsupe = LatexCmds.nsupeq =
LatexCmds.notsupe = LatexCmds.notsupeq =
LatexCmds.nsupsete = LatexCmds.nsupseteq =
LatexCmds.notsupsete = LatexCmds.notsupseteq =
LatexCmds.nsupersete = LatexCmds.nsuperseteq =
LatexCmds.notsupersete = LatexCmds.notsuperseteq =
  bind(BinaryOperator,'\\not\\supseteq ','&#8841;', 'not superset or equal to');


//the canonical sets of numbers
LatexCmds.N = LatexCmds.naturals = LatexCmds.Naturals =
  bind(VanillaSymbol,'\\mathbb{N}','&#8469;', 'naturals');

LatexCmds.P =
LatexCmds.primes = LatexCmds.Primes =
LatexCmds.projective = LatexCmds.Projective =
LatexCmds.probability = LatexCmds.Probability =
  bind(VanillaSymbol,'\\mathbb{P}','&#8473;', 'P');

LatexCmds.Z = LatexCmds.integers = LatexCmds.Integers =
  bind(VanillaSymbol,'\\mathbb{Z}','&#8484;', 'integers');

LatexCmds.Q = LatexCmds.rationals = LatexCmds.Rationals =
  bind(VanillaSymbol,'\\mathbb{Q}','&#8474;', 'rationals');

LatexCmds.R = LatexCmds.reals = LatexCmds.Reals =
  bind(VanillaSymbol,'\\mathbb{R}','&#8477;', 'reals');

LatexCmds.C =
LatexCmds.complex = LatexCmds.Complex =
LatexCmds.complexes = LatexCmds.Complexes =
LatexCmds.complexplane = LatexCmds.Complexplane = LatexCmds.ComplexPlane =
  bind(VanillaSymbol,'\\mathbb{C}','&#8450;', 'complexes');

LatexCmds.H = LatexCmds.Hamiltonian = LatexCmds.quaternions = LatexCmds.Quaternions =
  bind(VanillaSymbol,'\\mathbb{H}','&#8461;', 'quaternions');

//spacing
LatexCmds.quad = LatexCmds.emsp = bind(VanillaSymbol,'\\quad ','    ', '4 spaces');
LatexCmds.qquad = bind(VanillaSymbol,'\\qquad ','        ', '8 spaces');
/* spacing special characters, gonna have to implement this in LatexCommandInput::onText somehow
case ',':
  return VanillaSymbol('\\, ',' ', 'comma');
case ':':
  return VanillaSymbol('\\: ','  ', 'colon');
case ';':
  return VanillaSymbol('\\; ','   ', 'semicolon');
case '!':
  return Symbol('\\! ','<span style="margin-right:-.2em"></span>', 'exclamation point');
*/

//binary operators
LatexCmds.diamond = bind(VanillaSymbol, '\\diamond ', '&#9671;', 'diamond');
LatexCmds.bigtriangleup = bind(VanillaSymbol, '\\bigtriangleup ', '&#9651;', 'triangle up');
LatexCmds.ominus = bind(VanillaSymbol, '\\ominus ', '&#8854;', 'o minus');
LatexCmds.uplus = bind(VanillaSymbol, '\\uplus ', '&#8846;', 'disjoint union');
LatexCmds.bigtriangledown = bind(VanillaSymbol, '\\bigtriangledown ', '&#9661;', 'triangle down');
LatexCmds.sqcap = bind(VanillaSymbol, '\\sqcap ', '&#8851;', 'greatest lower bound');
LatexCmds.triangleleft = bind(VanillaSymbol, '\\triangleleft ', '&#8882;', 'triangle left');
LatexCmds.sqcup = bind(VanillaSymbol, '\\sqcup ', '&#8852;', 'least upper bound');
LatexCmds.triangleright = bind(VanillaSymbol, '\\triangleright ', '&#8883;', 'triangle right');
//circledot is not a not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.odot = LatexCmds.circledot = bind(VanillaSymbol, '\\odot ', '&#8857;', 'circle dot');
LatexCmds.bigcirc = bind(VanillaSymbol, '\\bigcirc ', '&#9711;', 'circle');
LatexCmds.dagger = bind(VanillaSymbol, '\\dagger ', '&#0134;', 'dagger');
LatexCmds.ddagger = bind(VanillaSymbol, '\\ddagger ', '&#135;', 'big dagger');
LatexCmds.wr = bind(VanillaSymbol, '\\wr ', '&#8768;', 'wreath');
LatexCmds.amalg = bind(VanillaSymbol, '\\amalg ', '&#8720;', 'amalgam');

//relationship symbols
LatexCmds.models = bind(VanillaSymbol, '\\models ', '&#8872;', 'models');
LatexCmds.prec = bind(VanillaSymbol, '\\prec ', '&#8826;', 'precedes');
LatexCmds.succ = bind(VanillaSymbol, '\\succ ', '&#8827;', 'succeeds');
LatexCmds.preceq = bind(VanillaSymbol, '\\preceq ', '&#8828;', 'precedes or equals');
LatexCmds.succeq = bind(VanillaSymbol, '\\succeq ', '&#8829;', 'succeeds or equals');
LatexCmds.simeq = bind(VanillaSymbol, '\\simeq ', '&#8771;', 'similar or equal to');
LatexCmds.mid = bind(VanillaSymbol, '\\mid ', '&#8739;', 'divides');
LatexCmds.ll = bind(VanillaSymbol, '\\ll ', '&#8810;', 'll');
LatexCmds.gg = bind(VanillaSymbol, '\\gg ', '&#8811;', 'gg');
LatexCmds.parallel = bind(VanillaSymbol, '\\parallel ', '&#8741;', 'parallel with');
LatexCmds.nparallel = bind(VanillaSymbol, '\\nparallel ', '&#8742;', 'not parallel with');
LatexCmds.bowtie = bind(VanillaSymbol, '\\bowtie ', '&#8904;', 'bowtie');
LatexCmds.sqsubset = bind(VanillaSymbol, '\\sqsubset ', '&#8847;', 'square subset');
LatexCmds.sqsupset = bind(VanillaSymbol, '\\sqsupset ', '&#8848;', 'square superset');
LatexCmds.smile = bind(VanillaSymbol, '\\smile ', '&#8995;', 'smile');
LatexCmds.sqsubseteq = bind(VanillaSymbol, '\\sqsubseteq ', '&#8849;', 'square subset or equal to');
LatexCmds.sqsupseteq = bind(VanillaSymbol, '\\sqsupseteq ', '&#8850;', 'square superset or equal to');
LatexCmds.doteq = bind(VanillaSymbol, '\\doteq ', '&#8784;', 'dotted equals');
LatexCmds.frown = bind(VanillaSymbol, '\\frown ', '&#8994;', 'frown');
LatexCmds.vdash = bind(VanillaSymbol, '\\vdash ', '&#8870;', 'v dash');
LatexCmds.dashv = bind(VanillaSymbol, '\\dashv ', '&#8867;', 'dash v');
LatexCmds.nless = bind(VanillaSymbol, '\\nless ', '&#8814;', 'not less than');
LatexCmds.ngtr = bind(VanillaSymbol, '\\ngtr ', '&#8815;', 'not greater than');

//arrows
LatexCmds.longleftarrow = bind(VanillaSymbol, '\\longleftarrow ', '&#8592;', 'left arrow');
LatexCmds.longrightarrow = bind(VanillaSymbol, '\\longrightarrow ', '&#8594;', 'right arrow');
LatexCmds.Longleftarrow = bind(VanillaSymbol, '\\Longleftarrow ', '&#8656;', 'left arrow');
LatexCmds.Longrightarrow = bind(VanillaSymbol, '\\Longrightarrow ', '&#8658;', 'right arrow');
LatexCmds.longleftrightarrow = bind(VanillaSymbol, '\\longleftrightarrow ', '&#8596;', 'left and right arrow');
LatexCmds.updownarrow = bind(VanillaSymbol, '\\updownarrow ', '&#8597;', 'up and down arrow');
LatexCmds.Longleftrightarrow = bind(VanillaSymbol, '\\Longleftrightarrow ', '&#8660;', 'left and right arrow');
LatexCmds.Updownarrow = bind(VanillaSymbol, '\\Updownarrow ', '&#8661;', 'up and down arrow');
LatexCmds.mapsto = bind(VanillaSymbol, '\\mapsto ', '&#8614;', 'maps to');
LatexCmds.nearrow = bind(VanillaSymbol, '\\nearrow ', '&#8599;', 'northeast arrow');
LatexCmds.hookleftarrow = bind(VanillaSymbol, '\\hookleftarrow ', '&#8617;', 'hook left arrow');
LatexCmds.hookrightarrow = bind(VanillaSymbol, '\\hookrightarrow ', '&#8618;', 'hook right arrow');
LatexCmds.searrow = bind(VanillaSymbol, '\\searrow ', '&#8600;', 'southeast arrow');
LatexCmds.leftharpoonup = bind(VanillaSymbol, '\\leftharpoonup ', '&#8636;', 'left harpoon up');
LatexCmds.rightharpoonup = bind(VanillaSymbol, '\\rightharpoonup ', '&#8640;', 'right harpoon up');
LatexCmds.swarrow = bind(VanillaSymbol, '\\swarrow ', '&#8601;', 'southwest arrow');
LatexCmds.leftharpoondown = bind(VanillaSymbol, '\\leftharpoondown ', '&#8637;', 'left harpoon down');
LatexCmds.rightharpoondown = bind(VanillaSymbol, '\\rightharpoondown ', '&#8641;', 'right harpoon down');
LatexCmds.nwarrow = bind(VanillaSymbol, '\\nwarrow ', '&#8598;', 'northwest arrow');

//Misc
LatexCmds.ldots = bind(VanillaSymbol, '\\ldots ', '&#8230;', 'l dots');
LatexCmds.cdots = bind(VanillaSymbol, '\\cdots ', '&#8943;', 'c dots');
LatexCmds.vdots = bind(VanillaSymbol, '\\vdots ', '&#8942;', 'v dots');
LatexCmds.ddots = bind(VanillaSymbol, '\\ddots ', '&#8945;', 'd dots');
LatexCmds.surd = bind(VanillaSymbol, '\\surd ', '&#8730;', 'unresolved root');
LatexCmds.triangle = bind(VanillaSymbol, '\\triangle ', '&#9651;', 'triangle');
LatexCmds.ell = bind(VanillaSymbol, '\\ell ', '&#8467;', 'ell');
LatexCmds.top = bind(VanillaSymbol, '\\top ', '&#8868;', 'top');
LatexCmds.flat = bind(VanillaSymbol, '\\flat ', '&#9837;', 'flat');
LatexCmds.natural = bind(VanillaSymbol, '\\natural ', '&#9838;', 'natural');
LatexCmds.sharp = bind(VanillaSymbol, '\\sharp ', '&#9839;', 'sharp');
LatexCmds.wp = bind(VanillaSymbol, '\\wp ', '&#8472;', 'wp');
LatexCmds.bot = bind(VanillaSymbol, '\\bot ', '&#8869;', 'bot');
LatexCmds.clubsuit = bind(VanillaSymbol, '\\clubsuit ', '&#9827;', 'club suit');
LatexCmds.diamondsuit = bind(VanillaSymbol, '\\diamondsuit ', '&#9826;', 'diamond suit');
LatexCmds.heartsuit = bind(VanillaSymbol, '\\heartsuit ', '&#9825;', 'heart suit');
LatexCmds.spadesuit = bind(VanillaSymbol, '\\spadesuit ', '&#9824;', 'spade suit');
//not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.parallelogram = bind(VanillaSymbol, '\\parallelogram ', '&#9649;', 'parallelogram');
LatexCmds.square = bind(VanillaSymbol, '\\square ', '&#11036;', 'square');

//variable-sized
LatexCmds.oint = bind(VanillaSymbol, '\\oint ', '&#8750;', 'o int');
LatexCmds.bigcap = bind(VanillaSymbol, '\\bigcap ', '&#8745;', 'big cap');
LatexCmds.bigcup = bind(VanillaSymbol, '\\bigcup ', '&#8746;', 'big cup');
LatexCmds.bigsqcup = bind(VanillaSymbol, '\\bigsqcup ', '&#8852;', 'big square cup');
LatexCmds.bigvee = bind(VanillaSymbol, '\\bigvee ', '&#8744;', 'big vee');
LatexCmds.bigwedge = bind(VanillaSymbol, '\\bigwedge ', '&#8743;', 'big wedge');
LatexCmds.bigodot = bind(VanillaSymbol, '\\bigodot ', '&#8857;', 'big o dot');
LatexCmds.bigotimes = bind(VanillaSymbol, '\\bigotimes ', '&#8855;', 'big o times');
LatexCmds.bigoplus = bind(VanillaSymbol, '\\bigoplus ', '&#8853;', 'big o plus');
LatexCmds.biguplus = bind(VanillaSymbol, '\\biguplus ', '&#8846;', 'big u plus');

//delimiters
LatexCmds.lfloor = bind(VanillaSymbol, '\\lfloor ', '&#8970;', 'left floor');
LatexCmds.rfloor = bind(VanillaSymbol, '\\rfloor ', '&#8971;', 'right floor');
LatexCmds.lceil = bind(VanillaSymbol, '\\lceil ', '&#8968;', 'left ceiling');
LatexCmds.rceil = bind(VanillaSymbol, '\\rceil ', '&#8969;', 'right ceiling');
LatexCmds.opencurlybrace = LatexCmds.lbrace = bind(VanillaSymbol, '\\lbrace ', '{', 'left brace');
LatexCmds.closecurlybrace = LatexCmds.rbrace = bind(VanillaSymbol, '\\rbrace ', '}', 'right brace');
LatexCmds.lbrack = bind(VanillaSymbol, '[', 'left bracket');
LatexCmds.rbrack = bind(VanillaSymbol, ']', 'right bracket');

//various symbols
LatexCmds.slash = bind(VanillaSymbol, '/', 'slash');
LatexCmds.vert = bind(VanillaSymbol,'|', 'vertical bar');
LatexCmds.perp = LatexCmds.perpendicular = bind(VanillaSymbol,'\\perp ','&perp;', 'perpendicular');
LatexCmds.nabla = LatexCmds.del = bind(VanillaSymbol,'\\nabla ','&nabla;');
LatexCmds.hbar = bind(VanillaSymbol,'\\hbar ','&#8463;', 'horizontal bar');

LatexCmds.AA = LatexCmds.Angstrom = LatexCmds.angstrom =
  bind(VanillaSymbol,'\\text\\AA ','&#8491;', 'AA');

LatexCmds.ring = LatexCmds.circ = LatexCmds.circle =
  bind(VanillaSymbol,'\\circ ','&#8728;', 'circle');

LatexCmds.bull = LatexCmds.bullet = bind(VanillaSymbol,'\\bullet ','&bull;', 'bullet');

LatexCmds.setminus = LatexCmds.smallsetminus =
  bind(VanillaSymbol,'\\setminus ','&#8726;', 'set minus');

LatexCmds.not = //bind(Symbol,'\\not ','<span class="not">/</span>', 'not');
LatexCmds['¬'] = LatexCmds.neg = bind(VanillaSymbol,'\\neg ','&not;', 'not');

LatexCmds['…'] = LatexCmds.dots = LatexCmds.ellip = LatexCmds.hellip =
LatexCmds.ellipsis = LatexCmds.hellipsis =
  bind(VanillaSymbol,'\\dots ','&hellip;', 'ellipsis');

LatexCmds.converges =
LatexCmds.darr = LatexCmds.dnarr = LatexCmds.dnarrow = LatexCmds.downarrow =
  bind(VanillaSymbol,'\\downarrow ','&darr;', 'converges with');

LatexCmds.dArr = LatexCmds.dnArr = LatexCmds.dnArrow = LatexCmds.Downarrow =
  bind(VanillaSymbol,'\\Downarrow ','&dArr;', 'down arrow');

LatexCmds.diverges = LatexCmds.uarr = LatexCmds.uparrow =
  bind(VanillaSymbol,'\\uparrow ','&uarr;', 'diverges from');

LatexCmds.uArr = LatexCmds.Uparrow = bind(VanillaSymbol,'\\Uparrow ','&uArr;', 'up arrow');

LatexCmds.rarr = LatexCmds.rightarrow = bind(VanillaSymbol,'\\rightarrow ','&rarr;', 'right arrow');

LatexCmds.implies = bind(BinaryOperator,'\\Rightarrow ','&rArr;', 'implies');

LatexCmds.rArr = LatexCmds.Rightarrow = bind(VanillaSymbol,'\\Rightarrow ','&rArr;', 'right arrow');

LatexCmds.gets = bind(BinaryOperator,'\\gets ','&larr;', 'gets');

LatexCmds.larr = LatexCmds.leftarrow = bind(VanillaSymbol,'\\leftarrow ','&larr;', 'left arrow');

LatexCmds.impliedby = bind(BinaryOperator,'\\Leftarrow ','&lArr;', 'implied by');

LatexCmds.lArr = LatexCmds.Leftarrow = bind(VanillaSymbol,'\\Leftarrow ','&lArr;', 'left arrow');

LatexCmds.harr = LatexCmds.lrarr = LatexCmds.leftrightarrow =
  bind(VanillaSymbol,'\\leftrightarrow ','&harr;', 'left and right arrow');

LatexCmds.iff = bind(BinaryOperator,'\\Leftrightarrow ','&hArr;', 'if and only if');

LatexCmds.hArr = LatexCmds.lrArr = LatexCmds.Leftrightarrow =
  bind(VanillaSymbol,'\\Leftrightarrow ','&hArr;', 'left and right arrow');

LatexCmds.Re = LatexCmds.Real = LatexCmds.real = bind(VanillaSymbol,'\\Re ','&real;', 'real');

LatexCmds.Im = LatexCmds.imag =
LatexCmds.image = LatexCmds.imagin = LatexCmds.imaginary = LatexCmds.Imaginary =
  bind(VanillaSymbol,'\\Im ','&image;', 'imaginary');

LatexCmds.part = LatexCmds.partial = bind(VanillaSymbol,'\\partial ','&part;', 'partial');

LatexCmds.alef = LatexCmds.alefsym = LatexCmds.aleph = LatexCmds.alephsym =
  bind(VanillaSymbol,'\\aleph ','&alefsym;', 'alef sym');

LatexCmds.xist = //LOL
LatexCmds.xists = LatexCmds.exist = LatexCmds.exists =
  bind(VanillaSymbol,'\\exists ','&exist;', 'there exists at least 1');

LatexCmds.nexists = LatexCmds.nexist =
      bind(VanillaSymbol, '\\nexists ', '&#8708;', 'there is no');

LatexCmds.and = LatexCmds.land = LatexCmds.wedge =
  bind(VanillaSymbol,'\\wedge ','&and;', 'and');

LatexCmds.or = LatexCmds.lor = LatexCmds.vee = bind(VanillaSymbol,'\\vee ','&or;', 'or');

LatexCmds.o = LatexCmds.O =
LatexCmds.empty = LatexCmds.emptyset =
LatexCmds.oslash = LatexCmds.Oslash =
LatexCmds.nothing = LatexCmds.varnothing =
  bind(BinaryOperator,'\\varnothing ','&empty;', 'nothing');

LatexCmds.cup = LatexCmds.union = bind(BinaryOperator,'\\cup ','&cup;', 'union');

LatexCmds.cap = LatexCmds.intersect = LatexCmds.intersection =
  bind(BinaryOperator,'\\cap ','&cap;', 'intersection');

// FIXME: the correct LaTeX would be ^\circ but we can't parse that
LatexCmds.deg = LatexCmds.degree = bind(VanillaSymbol,'\\degree ','&deg;', 'degrees');

LatexCmds.ang = LatexCmds.angle = bind(VanillaSymbol,'\\angle ','&ang;', 'angle');
LatexCmds.measuredangle = bind(VanillaSymbol,'\\measuredangle ','&#8737;', 'measured angle');
