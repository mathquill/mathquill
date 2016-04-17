/************************************
 * Symbols for Advanced Mathematics
 ***********************************/

//spacing
LatexCmds.quad = LatexCmds.emsp = bind(VanillaSymbol,'\\quad ','    ');
LatexCmds.qquad = bind(VanillaSymbol,'\\qquad ','        ');
/* spacing special characters, gonna have to implement this in LatexCommandInput::onText somehow
case ',':
  return VanillaSymbol('\\, ',' ');
case ':':
  return VanillaSymbol('\\: ','  ');
case ';':
  return VanillaSymbol('\\; ','   ');
case '!':
  return Symbol('\\! ','<span style="margin-right:-.2em"></span>');
*/

//
// Relation symbols (Sec 3.8)
//
var BINARY_OPERATORS = [
// Relation Symbols
'equiv:2261', 'prec:227a', 'succ:227b', 'sim:223c', 'perp:22a5', 
'preceq:2aaf', 'succeq:2ab0','simeq:2243', 
'mid:2223', 'll:226a', 'gg:226b', 'asymp:224d', 'parallel:2225',
'bowtie:22c8', 'smile:2323', 'sqsubseteq:2291', 'sqsupseteq:2292', 'doteq:2250',
'frown:2322', 'ni:220b', 'propto:221d', 'vdash:22a2', 'dashv:22a3', 'owns:220b',

// Binary operators
'mp:2213', 'ominus:2296', 'uplus:228e', 'sqcap:2293', 'ast:2217', 'sqcup:2294',
'bigcirc:25ef', 'bullet:2219', 'ddagger:2021', 'wr:2240', 'amalg:2a3f',

'cdot:22c5', 'circ:2218', 'div:00f7', 'pm:00b1', /* 'times:00d7', */ 'cap:2229',
'cup:222a', 'setminus:2216', 'land:2227', 'lor:2228', 'wedge:2227',
'vee:2228', 'surd:221a',
'approx:2248', 'cong:2245', 'gets:2190',
'in:2208', 'notin:2209',
'subset:2282', 'supset:2283',
'subseteq:2286', 'supseteq:2287',
'nsubseteq:2288', 'nsupseteq:2289',
'models:22a8', 'leftarrow:2190',
'ne:2260', 'neq:2260',
'ngeq:2271', 'nleq:2270',
'rightarrow:2192', 'to:2192',

// AMS Binary Operators
'dotplus:2214', 'smallsetminus:2216', 'Cap:22d2', 'Cup:22d3',
'doublebarwedge:2a5e', 'boxminus:229f', 'boxplus:229e', 'divideontimes:22c7',
'ltimes:22c9', 'rtimes:22ca', 'leftthreetimes:22cb', 'rightthreetimes:22cc',
'curlywedge:22cf', 'curlyvee:22ce', 'circleddash:229d', 'circledast:229b',
'centerdot:22c5', 'intercal:22ba', 'doublecap:22d2', 'doublecup:22d3',
'boxtimes:22a0',
'barwedge:22bc', 'veebar:22bb', 'odot:2299', 'oplus:2295',
'otimes:2297', 'partial:2202', 'oslash:2298', 'circledcirc:229a',
'boxdot:22a1', 'bigtriangleup:25b3', 'bigtriangledown:25bd', 'dagger:2020',
'diamond:22c4', 'star:22c6', 'triangleleft:25c3', 'triangleright:25b9',

// AMS binary relations
'leqq:2266', 'leqslant:2a7d', 'eqslantless:2a95', 'lesssim:2272',
'lessapprox:2a85', 'approxeq:224a', 'lessdot:22d6', 'lll:22d8',
'lessgtr:2276', 'lesseqgtr:22da', 'lesseqqgtr:2a8b', 'doteqdot:2251',
'risingdotseq:2253', 'fallingdotseq:2252', 'backsim:223d', 'backsimeq:22cd',
'subseteqq:2ac5', 'Subset:22d0', 'sqsubset:228f', 'preccurlyeq:227c',
'curlyeqprec:22de', 'precsim:227e', 'precapprox:2ab7', 'vartriangleleft:22b2',
'trianglelefteq:22b4', 'vDash:22a8', 'Vvdash:22aa', 'smallsmile:2323',
'smallfrown:2322', 'bumpeq:224f', 'Bumpeq:224e', 'geqq:2267', 'geqslant:2a7e',
'eqslantgtr:2a96', 'gtrsim:2273', 'gtrapprox:2a86', 'gtrdot:22d7',
'ggg:22d9', 'gtrless:2277', 'gtreqless:22db', 'gtreqqless:2a8c',
'eqcirc:2256', 'circeq:2257', 'triangleq:225c', 'thicksim:223c',
'thickapprox:2248', 'supseteqq:2ac6', 'Supset:22d1', 'sqsupset:2290',
'succcurlyeq:227d', 'curlyeqsucc:22df', 'succsim:227f', 'succapprox:2ab8',
'vartriangleright:22b3', 'trianglerighteq:22b5', 'Vdash:22a9', 'shortmid:2223',
'shortparallel:2225', 'between:226c', 'pitchfork:22d4', 'varpropto:221d',
'blacktriangleleft:25c0', 'therefore:2234', 'backepsilon:220d',
'blacktriangleright:25b6', 'because:2235', 'llless:22d8', 'gggtr:22d9',
'lhd:22b2', 'rhd:22b3', 'eqsim:2242', 'Join:22c8', 'Doteq:2251',

// AMS Negated Binary Relations
'nless:226e', 'nleqslant:e010', 'nleqq:e011', 'lneq:2a87', 'lneqq:2268', 'lvertneqq:e00c',
'lnsim:22e6', 'lnapprox:2a89', 'nprec:2280', 'npreceq:22e0', 'precnsim:22e8',
'precnapprox:2ab9', 'nsim:2241', 'nshortmid:e006', 'nmid:2224', 'nvdash:22ac',
'nvDash:22ad', 'ntriangleleft:22ea', 'ntrianglelefteq:22ec', 'subsetneq:228a',
'varsubsetneq:e01a', 'subsetneqq:2acb', 'varsubsetneqq:e017', 'ngtr:226f',
'ngeqslant:e00f', 'ngeqq:e00e', 'gneq:2a88', 'gneqq:2269', 'gvertneqq:e00d',
'gnsim:22e7', 'gnapprox:2a8a', 'nsucc:2281', 'nsucceq:22e1', 'succnsim:22e9',
'succnapprox:2aba', 'ncong:2246', 'nshortparallel:e007', 'nparallel:2226',
'nVDash:22af', 'ntriangleright:22eb', 'ntrianglerighteq:22ed', 'nsupseteqq:e018',
'supsetneq:228b', 'varsupsetneq:e01b', 'supsetneqq:2acc', 'varsupsetneqq:e019',
'nVdash:22ae', 'precneqq:2ab5', 'succneqq:2ab6', 'nsubseteqq:e016', 'unlhd:22b4',
'unrhd:22b5',

// Arrow symbols
'longleftarrow:27f5', 'Leftarrow:21d0', 'Longleftarrow:27f8', 'longrightarrow:27f6',
'Rightarrow:21d2', 'Longrightarrow:27f9', 'leftrightarrow:2194', 'longleftrightarrow:27f7',
'Leftrightarrow:21d4', 'Longleftrightarrow:27fa', 'mapsto:21a6', 'longmapsto:27fc',
'nearrow:2197', 'hookleftarrow:21a9', 'hookrightarrow:21aa', 'searrow:2198',
'leftharpoonup:21bc', 'rightharpoonup:21c0', 'swarrow:2199', 'leftharpoondown:21bd',
'rightharpoondown:21c1', 'nwarrow:2196', 'rightleftharpoons:21cc',

// AMS Negated arrow
'nleftarrow:219a', 'nrightarrow:219b', 'nLeftarrow:21cd', 'nRightarrow:21cf',
'nleftrightarrow:21ae', 'nLeftrightarrow:21ce',

// AMS Arrows
'dashrightarrow:21e2', 'dashleftarrow:21e0', 'leftleftarrows:21c7', 'leftrightarrows:21c6',
'Lleftarrow:21da', 'twoheadleftarrow:219e', 'leftarrowtail:21a2', 'looparrowleft:21ab',
'leftrightharpoons:21cb', 'curvearrowleft:21b6', 'circlearrowleft:21ba', 'Lsh:21b0',
'upuparrows:21c8', 'upharpoonleft:21bf', 'downharpoonleft:21c3', 'multimap:22b8',
'leftrightsquigarrow:21ad', 'rightrightarrows:21c9', 'rightleftarrows:21c4',
'twoheadrightarrow:21a0', 'rightarrowtail:21a3', 'looparrowright:21ac',
'curvearrowright:21b7', 'circlearrowright:21bb', 'Rsh:21b1', 'downdownarrows:21ca',
'upharpoonright:21be', 'downharpoonright:21c2', 'rightsquigarrow:21dd',
'leadsto:21dd', 'Rrightarrow:21db', 'restriction:21be',

// Other arrows
'uparrow:2191', 'Uparrow:21d1',
'downarrow:2193', 'Downarrow:21d3',
'updownarrow:2195', 'Updownarrow:21d5',
];

var VANILLA_SYMBOLS = [
// Misc symbols
'forall:2200', 'exists:2203', 'nabla:2207',  'wp:2118',
'flat:266d', 'natural:266e', 'sharp:266f', 
'clubsuit:2663', 'diamondsuit:2662', 'heartsuit:2661', 'spadesuit:2660',
'emptyset:2205', 'varnothing:2205', 
'Re:211c', 'Im:2111', 

// Math and text
'dag:2020', 'ddag:2021', 'space:00a0',

// AMS Misc
'vartriangle:25b3', 'hslash:210f', 'triangledown:25bd', 'lozenge:25ca', 'circledS:24c8',
'circledR:00ae', 'measuredangle:2221', 'nexists:2204', 'mho:2127', 'Finv:2132', 'Game:2141',
'Bbbk:006b', 'backprime:2035', 'blacktriangle:25b2', 'blacktriangledown:25bc',
'blacksquare:25a0', 'blacklozenge:29eb', 'bigstar:2605', 'sphericalangle:2222',
'complement:2201', 'eth:00f0', 'diagup:2571', 'diagdown:2572', 'square:25a1',
'Box:25a1', 'Diamond:25ca', 'yen:00a5', 'checkmark:2713',

// Basic math symbols
'angle:2220', 'infty:221e', 'prime:2032', 'triangle:25b3', 

'smallint:222b',

// Accents
// TODO: properly display accents above their character. Will probably need a new class for this.
// Note that \vec has its own custom handler (see var Vec = ...). That would be a 
// candidate to be generalized for all accents.
// 'acute:00b4', 'grave:0060', 'ddot:00a8', 'tilde:007e',
// 'bar:00af', 'breve:02d8', 'check:02c7', 'hat:005e',
// 'vec:20d7', 'dot:02d9',
];

var i = 0, m = [];

for (i = 0; i < BINARY_OPERATORS.length; i++) {
    m = BINARY_OPERATORS[i].match(/([a-zA-Z]+):(.+)/);
    LatexCmds[m[1]] = bind(BinaryOperator, '\\' + m[1] + ' ', '&#x' + m[2] +';');
}

for (i = 0; i < VANILLA_SYMBOLS.length; i++) {
    m = VANILLA_SYMBOLS[i].match(/([a-zA-Z]+):(.+)/);
    LatexCmds[m[1]] = bind(VanillaSymbol, '\\' + m[1] + ' ', '&#x' + m[2] +';');
}

LatexCmds.iff = LatexCmds.Longleftrightarrow;
LatexCmds.implies = LatexCmds.Longrightarrow;


//
// MathQuil synonyms and unique (non-standard) commands
//

//circledot is not a not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.circledot = LatexCmds.odot;
//not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.parallelogram = bind(VanillaSymbol, '\\parallelogram ', '&#9649;');
// COMPAT: LatexCmds.deg; This conflicts with an existing amsmath command, and was never
// rendered as a degree anyway: /deg was defined twice and the order made the deg operator
// the winner
LatexCmds.degree = bind(VanillaSymbol,'\\degree ','&deg;');
LatexCmds.intersect = LatexCmds.intersection =LatexCmds.cap;
LatexCmds.union = LatexCmds.cup;
LatexCmds.o = LatexCmds.O = LatexCmds.empty = LatexCmds.emptyset =
// COMPAT: LatexCmds.oslash; This conflicts with an existing amsmath command.
LatexCmds.Oslash = LatexCmds.nothing = LatexCmds.varnothing;
LatexCmds.nexist = LatexCmds.nexists;

LatexCmds.prop = LatexCmds.propto;
LatexCmds['≠'] = LatexCmds.ne;
LatexCmds.loast = LatexCmds.lowast = LatexCmds.ast;
LatexCmds.therefor = LatexCmds.therefore;
// l33t
LatexCmds.cuz = LatexCmds.because;
LatexCmds['≈'] = LatexCmds.approx;
LatexCmds.isin = LatexCmds.in;
LatexCmds.contains = LatexCmds.ni;
LatexCmds.notni = LatexCmds.niton = LatexCmds.notcontains = LatexCmds.doesnotcontain =
  bind(BinaryOperator,'\\not\\ni ','&#8716;');
LatexCmds.sub = LatexCmds.subset;
LatexCmds.sup = LatexCmds.superset = LatexCmds.supset;
LatexCmds.nsub = LatexCmds.notsub =
LatexCmds.nsubset = LatexCmds.notsubset =
  bind(BinaryOperator,'\\not\\subset ','&#8836;');

LatexCmds.nsup = LatexCmds.notsup =
LatexCmds.nsupset = LatexCmds.notsupset =
LatexCmds.nsuperset = LatexCmds.notsuperset =
  bind(BinaryOperator,'\\not\\supset ','&#8837;');

LatexCmds.sube = LatexCmds.subeq = LatexCmds.subsete = LatexCmds.subseteq;
LatexCmds.supe = LatexCmds.supeq = LatexCmds.supsete = 
LatexCmds.supersete = LatexCmds.superseteq = LatexCmds.supseteq;

LatexCmds.nsube = LatexCmds.nsubeq =
LatexCmds.notsube = LatexCmds.notsubeq =
LatexCmds.nsubsete = LatexCmds.nsubseteq =
LatexCmds.notsubsete = LatexCmds.notsubseteq =
  bind(BinaryOperator,'\\not\\subseteq ','&#8840;');

LatexCmds.nsupe = LatexCmds.nsupeq =
LatexCmds.notsupe = LatexCmds.notsupeq =
LatexCmds.nsupsete = LatexCmds.nsupseteq =
LatexCmds.notsupsete = LatexCmds.notsupseteq =
LatexCmds.nsupersete = LatexCmds.nsuperseteq =
LatexCmds.notsupersete = LatexCmds.notsuperseteq =
  bind(BinaryOperator,'\\not\\supseteq ','&#8841;');
  
LatexCmds.perpendicular = LatexCmds.perp;
LatexCmds.del = LatexCmds.nabla;
LatexCmds.ring = LatexCmds.circ = LatexCmds.circle = LatexCmds.circ;
LatexCmds.slash = bind(VanillaSymbol, '/');
LatexCmds.AA = LatexCmds.Angstrom = LatexCmds.angstrom =
  bind(VanillaSymbol,'\\text\\AA ','&#8491;');
LatexCmds.bull = LatexCmds.bullet;

LatexCmds.not = //bind(Symbol,'\\not ','<span class="not">/</span>');
LatexCmds['¬'] = LatexCmds.neg = bind(VanillaSymbol,'\\neg ','&not;');

LatexCmds['…'] = LatexCmds.dots = LatexCmds.ellip = LatexCmds.hellip =
LatexCmds.ellipsis = LatexCmds.hellipsis =
  bind(VanillaSymbol,'\\dots ','&hellip;');

LatexCmds.converges =
    LatexCmds.darr = LatexCmds.dnarr = LatexCmds.dnarrow = LatexCmds.downarrow;
LatexCmds.dArr = LatexCmds.dnArr = LatexCmds.dnArrow = LatexCmds.Downarrow;
LatexCmds.diverges = LatexCmds.uarr = LatexCmds.uparrow;
LatexCmds.uArr = LatexCmds.Uparrow;
LatexCmds.rarr = LatexCmds.rightarrow;
LatexCmds.rArr = LatexCmds.Rightarrow;
LatexCmds.larr = LatexCmds.leftarrow;
LatexCmds.impliedby = bind(BinaryOperator,'\\Longleftarrow ', '&#10232;');
LatexCmds.lArr = LatexCmds.Leftarrow;
LatexCmds.harr = LatexCmds.lrarr = LatexCmds.leftrightarrow;
LatexCmds.hArr = LatexCmds.lrArr = LatexCmds.Leftrightarrow;
LatexCmds.Real = LatexCmds.real = LatexCmds.Re;
LatexCmds.imag = LatexCmds.image = LatexCmds.imagin = 
    LatexCmds.imaginary = LatexCmds.Imaginary = LatexCmds.Im;
LatexCmds.part = LatexCmds.partial;
LatexCmds.infin = LatexCmds.infinity = LatexCmds.infty;
LatexCmds.xist = //LOL
    LatexCmds.xists = LatexCmds.exist = LatexCmds.exists;
LatexCmds.nexist = LatexCmds.nexists;
LatexCmds.and = LatexCmds.land;
LatexCmds.or = LatexCmds.lor;
LatexCmds.ang = LatexCmds.angle;

//the canonical sets of numbers
LatexCmds.N = LatexCmds.naturals = LatexCmds.Naturals =
  bind(VanillaSymbol,'\\mathbb{N}','&#8469;');

LatexCmds.P =
LatexCmds.primes = LatexCmds.Primes =
LatexCmds.projective = LatexCmds.Projective =
LatexCmds.probability = LatexCmds.Probability =
  bind(VanillaSymbol,'\\mathbb{P}','&#8473;');

LatexCmds.Z = LatexCmds.integers = LatexCmds.Integers =
  bind(VanillaSymbol,'\\mathbb{Z}','&#8484;');

LatexCmds.Q = LatexCmds.rationals = LatexCmds.Rationals =
  bind(VanillaSymbol,'\\mathbb{Q}','&#8474;');

LatexCmds.R = LatexCmds.reals = LatexCmds.Reals =
  bind(VanillaSymbol,'\\mathbb{R}','&#8477;');

LatexCmds.C =
LatexCmds.complex = LatexCmds.Complex =
LatexCmds.complexes = LatexCmds.Complexes =
LatexCmds.complexplane = LatexCmds.Complexplane = LatexCmds.ComplexPlane =
  bind(VanillaSymbol,'\\mathbb{C}','&#8450;');

LatexCmds.H = LatexCmds.Hamiltonian = LatexCmds.quaternions = LatexCmds.Quaternions =
  bind(VanillaSymbol,'\\mathbb{H}','&#8461;');
  