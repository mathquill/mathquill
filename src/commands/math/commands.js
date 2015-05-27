/***************************
 * Commands and Operators.
 **************************/

var scale, // = function(jQ, x, y) { ... }
//will use a CSS 2D transform to scale the jQuery-wrapped HTML elements,
//or the filter matrix transform fallback for IE 5.5-8, or gracefully degrade to
//increasing the fontSize to match the vertical Y scaling factor.

//ideas from http://github.com/louisremi/jquery.transform.js
//see also http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx

  forceIERedraw = noop,
  div = document.createElement('div'),
  div_style = div.style,
  transformPropNames = {
    transform:1,
    WebkitTransform:1,
    MozTransform:1,
    OTransform:1,
    msTransform:1
  },
  transformPropName;

for (var prop in transformPropNames) {
  if (prop in div_style) {
    transformPropName = prop;
    break;
  }
}

if (transformPropName) {
  scale = function(jQ, x, y) {
    jQ.css(transformPropName, 'scale('+x+','+y+')');
  };
}
else if ('filter' in div_style) { //IE 6, 7, & 8 fallback, see https://github.com/laughinghan/mathquill/wiki/Transforms
  forceIERedraw = function(el){ el.className = el.className; };
  scale = function(jQ, x, y) { //NOTE: assumes y > x
    x /= (1+(y-1)/2);
    jQ.css('fontSize', y + 'em');
    if (!jQ.hasClass('mq-matrixed-container')) {
      jQ.addClass('mq-matrixed-container')
      .wrapInner('<span class="mq-matrixed"></span>');
    }
    var innerjQ = jQ.children()
    .css('filter', 'progid:DXImageTransform.Microsoft'
        + '.Matrix(M11=' + x + ",SizingMethod='auto expand')"
    );
    function calculateMarginRight() {
      jQ.css('marginRight', (innerjQ.width()-1)*(x-1)/x + 'px');
    }
    calculateMarginRight();
    var intervalId = setInterval(calculateMarginRight);
    $(window).load(function() {
      clearTimeout(intervalId);
      calculateMarginRight();
    });
  };
}
else {
  scale = function(jQ, x, y) {
    jQ.css('fontSize', y + 'em');
  };
}

var Style = P(MathCommand, function(_, super_) {
  _.init = function(ctrlSeq, tagName, attrs) {
    super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'>&0</'+tagName+'>');
  };
});

// xrightarrow and xleftarrow
var XArrowStyle = P(MathCommand, function(_, super_) {
  _.init = function(ctrlSeq, tagName, attrs) {
    this.args = arguments;
    super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'><'+tagName+' class="mq-xarrow-over">&0</'+tagName+'></'+tagName+'>');
    this.textTemplate = [ctrlSeq.replace('\\', '') + '(', ')'];
  };
  _.parser = function() {
    var cmd = this;
    return latexMathParser.optBlock.then(function(optBlock) {
      return latexMathParser.block.map(function(block) {
        var withSub = XArrowWithSub.apply(null, cmd.args);
        withSub.blocks = [ optBlock, block ];
        optBlock.adopt(withSub, 0, 0);
        block.adopt(withSub, optBlock, 0);
        return withSub;
      });
    }).or(super_.parser.call(this));
  };
});

// ...with optional subscript
var XArrowWithSub = P(XArrowStyle, function(_, super_) {
  _.init = function(ctrlSeq, tagName, attrs) {
    this.htmlTemplate =
        '<' + tagName + ' ' + attrs + '>'
      +   '<' + tagName + ' class="mq-xarrow-over">&1</' + tagName + '>'
      +   '<' + tagName + ' class="mq-xarrow-under">&0</' + tagName + '>'
      + '</' + tagName + '>'
    ;
    MathCommand.prototype.init.call(this, ctrlSeq);
    this.textTemplate = [ctrlSeq.replace('\\', '') + '[', '](', ')'];
  };
  _.latex = function() {
    return this.ctrlSeq + '['+this.ends[L].latex()+']{'+this.ends[R].latex()+'}';
  };
  _.finalizeTree = function() {
    this.jQ.addClass('mq-withsub');
    this.downInto = this.ends[L].upOutOf = this.ends[R];
    this.upInto = this.ends[R].downOutOf = this.ends[L];
  };
});

var OverLineStyleGenerator = function (className) {

    var arrows = '<span class="' + className + '-inner-right">g</span><span class="' + className + '-inner-left">h</span>';

    return P(MathCommand, function(_, super_) {
      _.init = function(ctrlSeq, tagName, attrs) {
        super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'><'+tagName+' class="' + className + '-inner">' + arrows + '<span class="mq-empty-box">&0</span></'+tagName+'></'+tagName+'>');
      };
    });
};

// Function to attach style to long division symbol.
var LongDivisionStyle = P(MathCommand, function(_, super_) {
  _.init = function(ctrlSeq, tagName, attrs) {
    super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'><span class="mq-longdiv-curve-border">)</span><span class="mq-longdiv-inner"><span class="mq-empty">&0</span></'+tagName+'></span>');
  };
});

var BiggerSymbolStyle = function (className, content) {
    return P(Symbol, function(_, super_) {
      _.init = function(ctrlSeq, tagName, attrs) {
        super_.init.call(this, ctrlSeq, '<'+tagName+' '+attrs+'><'+tagName+' class="' + className + '-inner">' + content + '</'+tagName+'></'+tagName+'>');
      };
    });
};

var DoubleStruck = P(Variable, function(_, super_) {
  _.symbols = {
    C: "&#8450;",
    H: "&#8461;",
    N: "&#8469;",
    P: "&#8473;",
    Q: "&#8474;",
    R: "&#8477;",
    Z: "&#8484;"
  };
  _.init = function(ch) {
    var inner = ch;
    if (this.symbols[ch]) {
      inner = '<span class="mq-original">' + ch + '</span>' + this.symbols[ch];
    }
    super_.init.call(this, ch, inner);
  };
});

//fonts
LatexCmds.mathrm = bind(Style, '\\mathrm', 'span', 'class="mq-roman mq-font"');
LatexCmds.mathit = bind(Style, '\\mathit', 'i', 'class="mq-font"');
LatexCmds.mathbf = bind(Style, '\\mathbf', 'b', 'class="mq-font"');
LatexCmds.mathsf = bind(Style, '\\mathsf', 'span', 'class="mq-sans-serif mq-font"');
LatexCmds.mathtt = bind(Style, '\\mathtt', 'span', 'class="mq-monospace mq-font"');
LatexCmds.mathbb = P(MathCommand, function(_, super_) {
  _.init = function() {
    super_.init.call(this, '\\mathbb', '<span class="mq-mathbb mq-font">&0</span>');
  };
  _.adopt = function() {
    this.eachChild(function(child) {
      if (!child.writeOverride) {
        var origWrite = child.write,
          origDeleteOutOf = child.deleteOutOf;
        child.write = child.writeOverride = function(cursor, ch, replacedFragment) {
          var cmd;
          if (DoubleStruck.prototype.symbols[ch]) {
            cmd = DoubleStruck(ch);
            if (replacedFragment) cmd.replaces(replacedFragment);
            cmd.createLeftOf(cursor);
          } else {
            return origWrite.apply(child, arguments);
          }
        };
        child.deleteOutOf = function(dir, cursor) {
          var variables = [];
          child.eachChild(function(grand) {
            var ch = grand.ctrlSeq;
            variables.push(Variable(ch).adopt(child, child.ends[R], 0));
            grand.remove();
          });
          if (variables.length) cursor[R] = variables[0];
          child.jQize().appendTo(child.jQ);
          return origDeleteOutOf.apply(child, arguments);
        };
      }
    });
    return super_.adopt.apply(this, arguments);
  };
  _.finalizeTree = function() {
    this.eachChild(function(child) {
      child.eachChild(function(grand) {
        var ch = grand.ctrlSeq, NewCmd = Variable;
        if (DoubleStruck.prototype.symbols[ch]) {
          NewCmd = DoubleStruck;
        }
        NewCmd(ch).adopt(child, child.ends[R], 0);
        grand.remove();
      });
      child.jQize().appendTo(child.jQ);
    });
  };
});

//text-decoration
LatexCmds.underline = bind(Style, '\\underline', 'span', 'class="mq-non-leaf mq-underline"');
LatexCmds.overline = LatexCmds.bar = bind(OverLineStyleGenerator('mq-overline'), '\\overline', 'span', 'class="mq-non-leaf mq-overline"');
LatexCmds.longdiv = bind(LongDivisionStyle, '\\longdiv', 'span', 'class="mq-non-leaf mq-longdiv"');
LatexCmds.overleftrightarrow = bind(OverLineStyleGenerator('mq-overleftrightarrow'), '\\overleftrightarrow', 'span', 'class="mq-non-leaf mq-overleftrightarrow"');
LatexCmds.overrightarrow = bind(OverLineStyleGenerator('mq-overarrow'), '\\overrightarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-right"');
LatexCmds.overleftarrow = bind(OverLineStyleGenerator('mq-overarrow'), '\\overleftarrow', 'span', 'class="mq-non-leaf mq-overarrow mq-arrow-left"');
LatexCmds.xleftarrow = bind(XArrowStyle, '\\xleftarrow', 'span', 'class="mq-non-leaf mq-xarrow mq-arrow-left"');
LatexCmds.xrightarrow = bind(XArrowStyle, '\\xrightarrow', 'span', 'class="mq-non-leaf mq-xarrow mq-arrow-right"');

LatexCmds.parallelogram = bind(BiggerSymbolStyle('mq-parallelogram', '&#9649;'), '\\parallelogram ', 'span', 'class="mq-non-leaf mq-parallelogram"');

// `\textcolor{color}{math}` will apply a color to the given math content, where
// `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
// [Mozilla docs][], or [W3C spec][]).
//
// [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
// [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
// [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
var TextColor = LatexCmds.textcolor = P(MathCommand, function(_, super_) {
  _.setColor = function(color) {
    this.color = color;
    this.htmlTemplate =
      '<span class="mq-textcolor" style="color:' + color + '">&0</span>';
  };
  _.latex = function() {
    return '\\textcolor{' + this.color + '}{' + this.blocks[0].latex() + '}';
  };
  _.parser = function() {
    var self = this;
    var optWhitespace = Parser.optWhitespace;
    var string = Parser.string;
    var regex = Parser.regex;

    return optWhitespace
      .then(string('{'))
      .then(regex(/^[#\w\s.,()%-]*/))
      .skip(string('}'))
      .then(function(color) {
        self.setColor(color);
        return super_.parser.call(self);
      })
    ;
  };
});

// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = LatexCmds['class'] = P(MathCommand, function(_, super_) {
  _.parser = function() {
    var self = this, string = Parser.string, regex = Parser.regex;
    return Parser.optWhitespace
      .then(string('{'))
      .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
      .skip(string('}'))
      .then(function(cls) {
        self.htmlTemplate = '<span class="mq-class '+cls+'">&0</span>';
        return super_.parser.call(self);
      })
    ;
  };
});

var SupSub = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '_{...}^{...}';
  _.createLeftOf = function(cursor) {
    if (!cursor[L] && cursor.options.supSubsRequireOperand) return;
    return super_.createLeftOf.apply(this, arguments);
  };
  _.contactWeld = function(cursor) {
    // Look on either side for a SupSub, if one is found compare my
    // .sub, .sup with its .sub, .sup. If I have one that it doesn't,
    // then call .addBlock() on it with my block; if I have one that
    // it also has, then insert my block's children into its block,
    // unless my block has none, in which case insert the cursor into
    // its block (and not mine, I'm about to remove myself) in the case
    // I was just typed.
    // TODO: simplify

    // equiv. to [L, R].forEach(function(dir) { ... });
    for (var dir = L; dir; dir = (dir === L ? R : false)) {
      if (this[dir] instanceof SupSub) {
        // equiv. to 'sub sup'.split(' ').forEach(function(supsub) { ... });
        for (var supsub = 'sub'; supsub; supsub = (supsub === 'sub' ? 'sup' : false)) {
          var src = this[supsub], dest = this[dir][supsub];
          if (!src) continue;
          if (!dest) this[dir].addBlock(src.disown());
          else if (!src.isEmpty()) { // ins src children at -dir end of dest
            src.jQ.children().insAtDirEnd(-dir, dest.jQ);
            var children = src.children().disown();
            var pt = Point(dest, children.ends[R], dest.ends[L]);
            if (dir === L) children.adopt(dest, dest.ends[R], 0);
            else children.adopt(dest, 0, dest.ends[L]);
          }
          else var pt = Point(dest, 0, dest.ends[L]);
          this.placeCursor = (function(dest, src) { // TODO: don't monkey-patch
            return function(cursor) { cursor.insAtDirEnd(-dir, dest || src); };
          }(dest, src));
        }
        this.remove();
        if (cursor && cursor[L] === this) {
          if (dir === R && pt) {
            pt[L] ? cursor.insRightOf(pt[L]) : cursor.insAtLeftEnd(pt.parent);
          }
          else cursor.insRightOf(this[dir]);
        }
        break;
      }
    }
    this.respace();
  };
  Options.p.charsThatBreakOutOfSupSub = '';
  _.finalizeTree = function() {
    this.ends[L].write = function(cursor, ch) {
      if (cursor.options.autoSubscriptNumerals && this === this.parent.sub) {
        if (ch === '_') return;
        var cmd = this.chToCmd(ch);
        if (cmd instanceof Symbol) cursor.deleteSelection();
        else cursor.clearSelection().insRightOf(this.parent);
        return cmd.createLeftOf(cursor.show());
      }
      if (cursor[L] // doesn't apply to 1st char, in case of negative exponents
          && cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1) {
        cursor.insRightOf(this.parent);
      }
      // Check if char was space and there's nothing to the right
      else if (ch === ' ' && !cursor[R]) {
        // inserting polyatomic only when sub already exists
        if (this.parent.supsub === 'sub' && this.parent.sub) {
            var supsub = this.parent;
            // setting correct class and flag for SupSub
            supsub.polyatomic = true;
            supsub.polyatomicClass();
            return;
        }
      }
      MathBlock.p.write.apply(this, arguments);
    };
    this.polyatomicClass();
  };
  _.polyatomicClass = function() {
    // polyatomic flag is set in `SupSub.addBlock`, `SupSub.respace`,
    // `SupSub.finalizeTree` and in `LatexCmds.subscript.parser`
    this.jQ.toggleClass('mq-polyatomic', this.polyatomic);
  };
  _.moveTowards = function(dir, cursor, updown) {
    if (cursor.options.autoSubscriptNumerals && !this.sup) {
      cursor.insDirOf(dir, this);
    }
    else super_.moveTowards.apply(this, arguments);
  };
  _.deleteTowards = function(dir, cursor) {
    if (cursor.options.autoSubscriptNumerals && this.sub) {
      var cmd = this.sub.ends[-dir];
      if (cmd instanceof Symbol) cmd.remove();
      else if (cmd) cmd.deleteTowards(dir, cursor.insAtDirEnd(-dir, this.sub));

      // TODO: factor out a .removeBlock() or something
      // Also note `-dir` because in e.g. x_1^2| want backspacing (leftward)
      // to delete the 1 but to end up rightward of x^2; with non-negated
      // `dir` (try it), the cursor appears to have gone "through" the ^2.
      if (this.sub.isEmpty()) this.sub.deleteOutOf(-dir, cursor.insAtLeftEnd(this.sub));
    }
    else super_.deleteTowards.apply(this, arguments);
  };
  _.latex = function() {
    function latex(prefix, block) {
      var l = block && block.latex();
      return block ? prefix + (l.length === 1 ? l : '{' + (l || ' ') + '}') : '';
    }
    // Add empty braces after subscript if this is polyatomic
    return latex('_', this.sub) + (this.polyatomic ? '{}' : '') + latex('^', this.sup);
  };
  _.respace = _.siblingCreated = _.siblingDeleted = function(opts, dir) {
    if (dir === R) return; // ignore if sibling only changed on the right
    this.jQ.toggleClass('mq-limit', this[L].ctrlSeq === '\\int ');
    if ((!this.sup || !this.sub) && this.polyatomic) {
      this.polyatomic = false;
    }
    this.polyatomicClass();
  };
  _.addBlock = function(block) {
    if (this.supsub === 'sub') {
      this.sup = this.upInto = this.sub.upOutOf = block;
      block.adopt(this, this.sub, 0).downOutOf = this.sub;
      block.jQ = $('<span class="mq-sup"/>').append(block.jQ.children())
        .attr(mqBlockId, block.id).prependTo(this.jQ);
    }
    else {
      this.sub = this.downInto = this.sup.downOutOf = block;
      block.adopt(this, 0, this.sup).upOutOf = this.sup;
      block.jQ = $('<span class="mq-sub"></span>').append(block.jQ.children())
        .attr(mqBlockId, block.id).appendTo(this.jQ.removeClass('mq-sup-only'));
      this.jQ.append('<span style="display:inline-block;width:0">&#8203;</span>');
    }
    if (this.sub && this.sub.polyatomic) this.polyatomic = true;
    // like 'sub sup'.split(' ').forEach(function(supsub) { ... });
    for (var i = 0; i < 2; i += 1) (function(cmd, supsub, oppositeSupsub, updown) {
      cmd[supsub].deleteOutOf = function(dir, cursor) {
        cursor.insDirOf((this[dir] ? -dir : dir), this.parent);
        if (!this.isEmpty()) {
          var end = this.ends[dir];
          this.children().disown()
            .withDirAdopt(dir, cursor.parent, cursor[dir], cursor[-dir])
            .jQ.insDirOf(-dir, cursor.jQ);
          cursor[-dir] = end;
        }
        cmd.supsub = oppositeSupsub;
        delete cmd[supsub];
        delete cmd[updown+'Into'];
        cmd[oppositeSupsub][updown+'OutOf'] = insLeftOfMeUnlessAtEnd;
        delete cmd[oppositeSupsub].deleteOutOf;
        if (supsub === 'sub') $(cmd.jQ.addClass('mq-sup-only')[0].lastChild).remove();
        this.remove();
      };
    }(this, 'sub sup'.split(' ')[i], 'sup sub'.split(' ')[i], 'down up'.split(' ')[i]));
  };
});

function insLeftOfMeUnlessAtEnd(cursor) {
  // cursor.insLeftOf(cmd), unless cursor at the end of block, and every
  // ancestor cmd is at the end of every ancestor block
  var cmd = this.parent, ancestorCmd = cursor;
  do {
    if (ancestorCmd[R]) return cursor.insLeftOf(cmd);
    ancestorCmd = ancestorCmd.parent.parent;
  } while (ancestorCmd !== cmd);
  cursor.insRightOf(cmd);
}

LatexCmds.subscript =
LatexCmds._ = P(SupSub, function(_, super_) {
  _.supsub = 'sub';
  _.htmlTemplate =
      '<span class="mq-supsub mq-non-leaf">'
    +   '<span class="mq-sub"><span class="mq-empty-box">&0</span></span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  ;
  _.textTemplate = [ '_' ];
  _.finalizeTree = function() {
    this.downInto = this.sub = this.ends[L];
    this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
    super_.finalizeTree.call(this);
  };
  _.parser = function () {
    var regex = Parser.regex;
    var optWhitespace = Parser.optWhitespace;
    var self = this;

    return optWhitespace.then(regex(/^([^{}]|{.*}){}/)).map(function (latex) {
      // create our mathblock, removing the '{}'
      self.blocks = [ latexMathParser.parse(latex.replace(/{}$/, '')) ];
      self.blocks[0].adopt(self, self.ends[R], 0);
      self.blocks[0].polyatomic = true;
      return self;
    }).or(super_.parser.call(this));
  };
});

LatexCmds.superscript =
LatexCmds.supscript =
LatexCmds['^'] = P(SupSub, function(_, super_) {
  _.supsub = 'sup';
  _.htmlTemplate =
      '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +   '<span class="mq-sup"><span class="mq-empty-box">&0</span></span>'
    + '</span>'
  ;
  _.textTemplate = [ '**' ];
  _.finalizeTree = function() {
    this.upInto = this.sup = this.ends[R];
    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
    super_.finalizeTree.call(this);
  };
});

var SummationLimitNotation = P(MathCommand, function(_, super_) {
  _.parser = function() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    var blocks = self.blocks = [ MathBlock(), MathBlock() ];
    for (var i = 0; i < blocks.length; i += 1) {
      blocks[i].adopt(self, self.ends[R], 0);
    }

    return optWhitespace.then(string('_').or(string('^'))).then(function(supOrSub) {
      var child = blocks[supOrSub === '_' ? 0 : 1];
      return block.then(function(block) {
        block.children().adopt(child, child.ends[R], 0);
        return succeed(self);
      });
    }).many().result(self);
  };
  _.finalizeTree = function() {
    this.downInto = this.ends[L];
    this.upInto = this.ends[R];
    this.ends[L].upOutOf = this.ends[R];
    this.ends[R].downOutOf = this.ends[L];
  };
});

var SummationNotation = P(SummationLimitNotation, function(_, super_) {
  _.init = function(ch, html) {
    var htmlTemplate =
      '<span class="mq-large-operator mq-non-leaf">'
    +   '<span class="mq-to"><span>&1</span></span>'
    +   '<big>'+html+'</big>'
    +   '<span class="mq-from"><span>&0</span></span>'
    + '</span>'
    ;
    Symbol.prototype.init.call(this, ch, htmlTemplate);
  };
  _.latex = function() {
    function simplify(latex) {
      return latex.length === 1 ? latex : '{' + (latex || ' ') + '}';
    }
    return this.ctrlSeq + '_' + simplify(this.ends[L].latex()) +
      '^' + simplify(this.ends[R].latex());
  };
  _.createLeftOf = function(cursor) {
    super_.createLeftOf.apply(this, arguments);
    if (cursor.options.sumStartsWithNEquals) {
      Letter('n').createLeftOf(cursor);
      Equality().createLeftOf(cursor);
    }
  };
});

LatexCmds['∑'] =
LatexCmds.sum =
LatexCmds.summation = bind(SummationNotation,'\\sum ','&sum;');

LatexCmds['∏'] =
LatexCmds.prod =
LatexCmds.product = bind(SummationNotation,'\\prod ','&prod;');

LatexCmds.coprod =
LatexCmds.coproduct = bind(SummationNotation,'\\coprod ','&#8720;');


LatexCmds.lim =
LatexCmds.limit = P(SummationLimitNotation, function(_, super_) {
  _.init = function() {
    var htmlTemplate =
      '<span class="mq-lim mq-non-leaf">'
    +   '<span class="mq-un-italicized">lim</span>'
    +   '<span class="mq-approaches"><span>&0</span></span>'
    + '</span>'
    ;
    Symbol.prototype.init.call(this, '\\lim ', htmlTemplate);
  };
  _.latex = function() {
    function simplify(latex) {
      return latex.length === 1 ? latex : '{' + (latex || ' ') + '}';
    }
    return this.ctrlSeq + '_' + simplify(this.ends[L].latex());
  };
});

var Fraction =
LatexCmds.frac =
LatexCmds.dfrac =
LatexCmds.cfrac =
LatexCmds.fraction = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\frac';
  _.htmlTemplate =
      '<span class="mq-fraction mq-non-leaf">'
    +   '<span class="mq-numerator"><span class="mq-empty-box">&0</span></span>'
    +   '<span class="mq-denominator"><span class="mq-empty-box">&1</span></span>'
    +   '<span style="display:inline-block;width:0">&#8203;</span>'
    + '</span>'
  ;
  _.textTemplate = ['(', '/', ')'];
  _.finalizeTree = function() {
    this.upInto = this.ends[R].upOutOf = this.ends[L];
    this.downInto = this.ends[L].downOutOf = this.ends[R];
  };
});

var LiveFraction =
LatexCmds.over =
CharCmds['/'] = P(Fraction, function(_, super_) {
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment) {
      var leftward = cursor[L];
      while (leftward &&
        !(
          leftward instanceof BinaryOperator ||
          leftward instanceof (LatexCmds.text || noop) ||
          leftward instanceof SummationNotation ||
          leftward.ctrlSeq === '\\ ' ||
          /^[,;:]$/.test(leftward.ctrlSeq)
        ) //lookbehind for operator
      ) leftward = leftward[L];

      if (leftward instanceof SummationNotation && leftward[R] instanceof SupSub) {
        leftward = leftward[R];
        if (leftward[R] instanceof SupSub && leftward[R].ctrlSeq != leftward.ctrlSeq)
          leftward = leftward[R];
      }

      if (leftward !== cursor[L]) {
        this.replaces(Fragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
        cursor[L] = leftward;
      }
    }
    super_.createLeftOf.call(this, cursor);
  };
});

LatexCmds.underset = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\underset';
  _.htmlTemplate =
      '<span class="mq-underset mq-non-leaf">'
    +   '<span class="mq-over"><span class="mq-empty-box">&1</span></span>'
    +   '<span class="mq-under"><span class="mq-empty-box">&0</span></span>'
    +   '<span style="display:inline-block;width:0">&nbsp;</span>'
    + '</span>'
  ;
  _.textTemplate = ['[', '|', ']'];
  _.finalizeTree = function() {
    // Add extra style for tilde vector notation
    var under = this.ends[L];
    if (under.latex() === '\\sim ') {
      this.jQ.addClass('mq-tilde-vector');
    }
    this.downInto = this.ends[L].upOutOf = this.ends[R];
    this.upInto = this.ends[R].downOutOf = this.ends[L];
  };
});

LatexCmds.overset = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\overset';
  _.htmlTemplate =
      '<span class="mq-overset">'
    +   '<span class="mq-overset-top mq-overset-align"><span class="mq-empty-box">&0</span></span>'
    +   '<span class="mq-text-only mq-overset-align"><span class="mq-empty-box ">&1</span></span>'
    + '</span>'
  ;
  _.textTemplate = ['[', '|', ']'];
  _.finalizeTree = function() {
    // Add extra style for tilde vector notation
    var under = this.ends[L];
    if (under.latex() === '\\sim ') {
      this.jQ.addClass('mq-tilde-vector');
    }
    this.downInto = this.ends[L].upOutOf = this.ends[R];
    this.upInto = this.ends[R].downOutOf = this.ends[L];
  };
});

var SquareRoot =
LatexCmds.sqrt =
LatexCmds['√'] = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\sqrt';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-scaled mq-sqrt-prefix">&radic;</span>'
    +   '<span class="mq-non-leaf mq-sqrt-stem"><span class="mq-empty-box">&0</span></span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt(', ')'];
  _.parser = function() {
    return latexMathParser.optBlock.then(function(optBlock) {
      return latexMathParser.block.map(function(block) {
        var nthroot = NthRoot();
        nthroot.blocks = [ optBlock, block ];
        optBlock.adopt(nthroot, 0, 0);
        block.adopt(nthroot, optBlock, 0);
        return nthroot;
      });
    }).or(super_.parser.call(this));
  };
  _.reflow = function() {
    var block = this.ends[R].jQ.parent();
    scale(block.prev(), 1, block.innerHeight()/+block.css('fontSize').slice(0,-2) - .1);
  };
});

var Vec = LatexCmds.vec = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\vec';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-vector-prefix">&rarr;</span>'
    +   '<span class="mq-vector-stem">&0</span>'
    + '</span>'
  ;
  _.textTemplate = ['vec(', ')'];
});

var NthRoot =
LatexCmds.nthroot = P(SquareRoot, function(_, super_) {
  _.htmlTemplate =
      '<sup class="mq-nthroot mq-non-leaf"><span class="mq-empty-box">&0</span></sup>'
    + '<span class="mq-scaled">'
    +   '<span class="mq-sqrt-prefix mq-scaled">&radic;</span>'
    +   '<span class="mq-sqrt-stem mq-non-leaf"><span class="mq-empty-box">&1</span></span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt[', '](', ')'];
  _.latex = function() {
    return '\\sqrt['+this.ends[L].latex()+']{'+this.ends[R].latex()+'}';
  };
});

var LrnCuberoot =
LatexCmds.lrncuberoot = P(SquareRoot, function(_, super_) {
  _.ctrlSeq = '\\lrncuberoot';
  _.htmlTemplate =
      '<sup class="mq-nthroot mq-non-leaf"><span class="mq-empty-box">3</span></sup>'
    + '<span class="mq-scaled">'
    +   '<span class="mq-sqrt-prefix mq-scaled">&radic;</span>'
    +   '<span class="mq-sqrt-stem mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
    + '</span>'
  ;
  _.textTemplate = ['sqrt[3](', ')'];
  _.latex = function() {
    return '\\sqrt[3]{'+this.ends[L].latex()+'}';
  };
});

var Abs =
LatexCmds.abs = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\abs';
  _.htmlTemplate =
      '<span class="mq-abs mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
  ;
  _.textTemplate = ['|', '|'];
});

var LrnPlaceholder =
LatexCmds.lrnplaceholder = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\lrnplaceholder';
  _.htmlTemplate =
      '<span class="mq-lrnplaceholder mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
  ;
  _.textTemplate = [''];
  _.latex = function() {
    return this.ends[L].latex();
  };
});

var LrnExponent =
LatexCmds.lrnexponent = P(MathCommand, function(_, super_) {
  _.ctrSeq = '\\lrnexponent',
  _.htmlTemplate =
      '<span class="mq-lrnexponent mq-non-leaf">'
    +   '<span class="mq-lrnplaceholder mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
    +   '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +     '<span class="mq-sup"><span class="mq-empty-box">&1</span></span>'
    +   '</span>'
    + '</span>'
  ;
  _.textTemplate = ['', '**'];
  _.latex = function() {
    return this.ends[L].latex()+'^'+this.ends[R].latex();
  };
});

var LrnSquaredExponent =
LatexCmds.lrnsquaredexponent = P(MathCommand, function(_, super_) {
  _.ctrSeq = '\\lrnsquaredexponent',
  _.htmlTemplate =
      '<span class="mq-lrnexponent mq-non-leaf">'
    +   '<span class="mq-lrnplaceholder mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
    +   '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +     '<span class="mq-sup"><span class="mq-empty-box">2</span></span>'
    +   '</span>'
    + '</span>'
  ;
  _.textTemplate = ['', '**2'];
  _.latex = function() {
    return this.ends[L].latex()+'^2';
  };
});

var LrnSubscript =
LatexCmds.lrnsubscript = P(MathCommand, function(_, super_) {
  _.ctrSeq = '\\lrnsubscript',
  _.htmlTemplate =
      '<span class="mq-lrnexponent mq-non-leaf">'
    +   '<span class="mq-lrnplaceholder mq-non-leaf"><span class="mq-empty-box">&0</span></span>'
    +   '<span class="mq-supsub mq-non-leaf">'
    +     '<span class="mq-sub"><span class="mq-empty-box">&1</span></span>'
    +     '<span style="display:inline-block;width:0">&nbsp;</span>'
    +   '</span>'
    + '</span>'
  ;
  _.textTemplate = ['', '_'];
  _.latex = function() {
    return this.ends[L].latex()+'_'+this.ends[R].latex();
  };
});

function DelimsMixin(_, super_) {
  _.jQadd = function() {
    super_.jQadd.apply(this, arguments);
    this.delimjQs = this.jQ.children(':first').add(this.jQ.children(':last'));
    this.contentjQ = this.jQ.children(':eq(1)');
  };
  _.reflow = function() {
    var height = this.contentjQ.outerHeight()
                 / parseFloat(this.contentjQ.css('fontSize'));
    scale(this.delimjQs, min(1 + .2*(height - 1), 1.2), 1.2*height);
  };
}

// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
var Bracket = P(P(MathCommand, DelimsMixin), function(_, super_) {
  _.init = function(side, open, close, ctrlSeq, end) {
    super_.init.call(this, '\\left'+ctrlSeq, undefined, [open, close]);
    this.side = side;
    this.sides = {};
    this.sides[L] = { ch: open, ctrlSeq: ctrlSeq };
    this.sides[R] = { ch: close, ctrlSeq: end };
  };
  _.numBlocks = function() { return 1; };
  _.html = function() { // wait until now so that .side may
    this.htmlTemplate = // be set by createLeftOf or parser
        '<span class="mq-non-leaf">'
      +   '<span class="mq-scaled mq-paren'+(this.side === R ? ' mq-ghost' : '')+'">'
      +     this.sides[L].ch
      +   '</span>'
      +   '<span class="mq-non-leaf">&0</span>'
      +   '<span class="mq-scaled mq-paren'+(this.side === L ? ' mq-ghost' : '')+'">'
      +     this.sides[R].ch
      +   '</span>'
      + '</span>'
    ;
    return super_.html.call(this);
  };
  _.latex = function() {
    return '\\left'+this.sides[L].ctrlSeq+this.ends[L].latex()+'\\right'+this.sides[R].ctrlSeq;
  };
  _.oppBrack = function(opts, node, expectedSide) {
    // return node iff it's a 1-sided bracket of expected side (if any, may be
    // undefined), and of opposite side from me if I'm not a pipe
    return node instanceof Bracket && node.side && node.side !== -expectedSide
      && (this.sides[this.side].ch === '|' || node.side === -this.side)
      && (!opts.restrictMismatchedBrackets
        || OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch
        || { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) && node;
  };
  _.closeOpposing = function(brack) {
    brack.side = 0;
    brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
    brack.delimjQs.eq(this.side === L ? 0 : 1) // mismatched, like [a, b))
      .removeClass('mq-ghost').html(this.sides[this.side].ch);
  };
  _.createLeftOf = function(cursor) {
    if (!this.replacedFragment) { // unless wrapping seln in brackets,
        // check if next to or inside an opposing one-sided bracket
        // (must check both sides 'cos I might be a pipe)
      var opts = cursor.options;
      var brack = this.oppBrack(opts, cursor[L], L)
                  || this.oppBrack(opts, cursor[R], R)
                  || this.oppBrack(opts, cursor.parent.parent);
    }
    if (brack) {
      var side = this.side = -brack.side; // may be pipe with .side not yet set
      this.closeOpposing(brack);
      if (brack === cursor.parent.parent && cursor[side]) { // move the stuff between
        Fragment(cursor[side], cursor.parent.ends[side], -side) // me and ghost outside
          .disown().withDirAdopt(-side, brack.parent, brack, brack[side])
          .jQ.insDirOf(side, brack.jQ);
        brack.bubble('reflow');
      }
    }
    else {
      brack = this, side = brack.side;
      if (brack.replacedFragment) brack.side = 0; // wrapping seln, don't be one-sided
      else if (cursor[-side]) { // elsewise, auto-expand so ghost is at far end
        brack.replaces(Fragment(cursor[-side], cursor.parent.ends[-side], side));
        cursor[-side] = 0;
      }
      super_.createLeftOf.call(brack, cursor);
    }
    if (side === L) cursor.insAtLeftEnd(brack.ends[L]);
    else cursor.insRightOf(brack);
  };
  _.placeCursor = noop;
  _.unwrap = function() {
    this.ends[L].children().disown().adopt(this.parent, this, this[R])
      .jQ.insertAfter(this.jQ);
    this.remove();
  };
  _.deleteSide = function(side, outward, cursor) {
    var parent = this.parent, sib = this[side], farEnd = parent.ends[side];

    if (side === this.side) { // deleting non-ghost of one-sided bracket, unwrap
      this.unwrap();
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
      return;
    }

    var opts = cursor.options;
    this.side = -side;
    // if deleting like, outer close-brace of [(1+2)+3} where inner open-paren
    if (this.oppBrack(opts, this.ends[L].ends[this.side], side)) { // is ghost,
      this.closeOpposing(this.ends[L].ends[this.side]); // then become [1+2)+3
      var origEnd = this.ends[L].ends[side];
      this.unwrap();
      if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
      sib ? cursor.insDirOf(-side, sib) : cursor.insAtDirEnd(side, parent);
    }
    else { // if deleting like, inner close-brace of ([1+2}+3) where outer
      if (this.oppBrack(opts, this.parent.parent, side)) { // open-paren is
        this.parent.parent.closeOpposing(this); // ghost, then become [1+2+3)
        this.parent.parent.unwrap();
      }
      else { // deleting one of a pair of brackets, become one-sided
        this.sides[side] = { ch: OPP_BRACKS[this.sides[this.side].ch],
                             ctrlSeq: OPP_BRACKS[this.sides[this.side].ctrlSeq] };
        this.delimjQs.removeClass('mq-ghost')
          .eq(side === L ? 0 : 1).addClass('mq-ghost').html(this.sides[side].ch);
      }
      if (sib) { // auto-expand so ghost is at far end
        var origEnd = this.ends[L].ends[side];
        Fragment(sib, farEnd, -side).disown()
          .withDirAdopt(-side, this.ends[L], origEnd, 0)
          .jQ.insAtDirEnd(side, this.ends[L].jQ.removeClass('mq-empty'));
        if (origEnd.siblingCreated) origEnd.siblingCreated(cursor.options, side);
        cursor.insDirOf(-side, sib);
      } // didn't auto-expand, cursor goes just outside or just inside parens
      else (outward ? cursor.insDirOf(side, this)
                    : cursor.insAtDirEnd(side, this.ends[L]));
    }
  };
  _.deleteTowards = function(dir, cursor) {
    this.deleteSide(-dir, false, cursor);
  };
  _.finalizeTree = function() {
    this.ends[L].deleteOutOf = function(dir, cursor) {
      this.parent.deleteSide(dir, true, cursor);
    };
    // FIXME HACK: after initial creation/insertion, finalizeTree would only be
    // called if the paren is selected and replaced, e.g. by LiveFraction
    this.finalizeTree = this.intentionalBlur = function() {
      this.delimjQs.eq(this.side === L ? 1 : 0).removeClass('mq-ghost');
      this.side = 0;
    };
  };
  _.siblingCreated = function(opts, dir) { // if something typed between ghost and far
    if (dir === -this.side) this.finalizeTree(); // end of its block, solidify
  };
});

var OPP_BRACKS = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '\\{': '\\}',
  '\\}': '\\{',
  '&lang;': '&rang;',
  '&rang;': '&lang;',
  '\\langle ': '\\rangle ',
  '\\rangle ': '\\langle ',
  '|': '|'
};

function bindCharBracketPair(open, ctrlSeq) {
  var ctrlSeq = ctrlSeq || open, close = OPP_BRACKS[open], end = OPP_BRACKS[ctrlSeq];
  CharCmds[open] = bind(Bracket, L, open, close, ctrlSeq, end);
  CharCmds[close] = bind(Bracket, R, open, close, ctrlSeq, end);
}
bindCharBracketPair('(');
bindCharBracketPair('[');
bindCharBracketPair('{', '\\{');
LatexCmds.langle = bind(Bracket, L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = bind(Bracket, R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = bind(Bracket, L, '|', '|', '|', '|');

LatexCmds.left = P(MathCommand, function(_) {
  _.parser = function() {
    var regex = Parser.regex;
    var string = Parser.string;
    var succeed = Parser.succeed;
    var optWhitespace = Parser.optWhitespace;

    return optWhitespace.then(regex(/^(?:[([|]|\\\{)/))
      .then(function(ctrlSeq) { // TODO: \langle, \rangle
        var open = (ctrlSeq.charAt(0) === '\\' ? ctrlSeq.slice(1) : ctrlSeq);
        return latexMathParser.then(function (block) {
          return string('\\right').skip(optWhitespace)
            .then(regex(/^(?:[\])|]|\\\})/)).map(function(end) {
              var close = (end.charAt(0) === '\\' ? end.slice(1) : end);
              var cmd = Bracket(0, open, close, ctrlSeq, end);
              cmd.blocks = [ block ];
              block.adopt(cmd, 0, 0);
              return cmd;
            })
          ;
        });
      })
    ;
  };
});

LatexCmds.right = P(MathCommand, function(_) {
  _.parser = function() {
    return Parser.fail('unmatched \\right');
  };
});

var Binomial =
LatexCmds.binom =
LatexCmds.binomial = P(P(MathCommand, DelimsMixin), function(_, super_) {
  _.ctrlSeq = '\\binom';
  _.htmlTemplate =
      '<span class="mq-non-leaf">'
    +   '<span class="mq-paren mq-scaled">(</span>'
    +   '<span class="mq-non-leaf">'
    +     '<span class="mq-array mq-non-leaf">'
    +       '<span>&0</span>'
    +       '<span>&1</span>'
    +     '</span>'
    +   '</span>'
    +   '<span class="mq-paren mq-scaled">)</span>'
    + '</span>'
  ;
  _.textTemplate = ['choose(',',',')'];
});

var Choose =
LatexCmds.choose = P(Binomial, function(_) {
  _.createLeftOf = LiveFraction.prototype.createLeftOf;
});

var InnerMathField = P(MathQuill.MathField, function(_) {
  _.init = function(root, ultimateRoot, container) {
    RootBlockMixin(root);
    this.__options = Options();
    var ctrlr = Controller(this, root, container);
    ctrlr.editable = true;
    root.ultimateRoot = ultimateRoot;
    // Required by StaticMathWithEditables.clear
    root.select = EditableField.prototype.select;
    ctrlr.createTextarea();
    ctrlr.editablesTextareaEvents();
    ctrlr.cursor.insAtRightEnd(root);
  };
});
LatexCmds.MathQuillMathField = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\MathQuillMathField';
  _.htmlTemplate =
      '<span class="mq-editable-field mq-inner-editable">'
    +   '<span class="mq-root-block">&0</span>'
    + '</span>'
  ;
  _.parser = function() {
    var self = this,
      string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
    return string('[').then(regex(/^[a-z][a-z0-9]*/i)).skip(string(']'))
      .map(function(name) { self.name = name; }).or(succeed())
      .then(super_.parser.call(self));
  };
  _.finalizeTree = function() {
    var root = Node.byId[this.jQ.closest('.mq-root-block').attr(mqBlockId)],
      superKeystroke = this.ends[L].keystroke;

    function focusAdjacentEditable(dir, dirward, cursor) {
      var adjacent, nextDirward;
      if (!cursor[dir]) {
        while ((nextDirward = dirward[dir] || dirward.parent && dirward.parent[dir])) {
          dirward = nextDirward;
          adjacent = dirward.jQ.filter('.mq-editable-field').add(dirward.jQ.find('.mq-editable-field')).eq(0);
          if (adjacent.length) {
            adjacent.find('.mq-textarea').children()[0].focus();
            return true;
            break;
          }
        }
      }
    }

    InnerMathField(this.ends[L], root, this.jQ);
    this.ends[L].keystroke = function(key, e, ctrlr) {
      var cursor = ctrlr.cursor,
        movedFocus = false;

      switch (key) {
      case 'Left':
        movedFocus = focusAdjacentEditable(L, this.parent, cursor);
        break;
      case 'Right':
        movedFocus = focusAdjacentEditable(R, this.parent, cursor);
        break;
      case 'Up':
        movedFocus = focusAdjacentEditable('upOutOf', this.parent, cursor);
        break;
      case 'Down':
        movedFocus = focusAdjacentEditable('downOutOf', this.parent, cursor);
        break;
      }

      if (!movedFocus && typeof superKeystroke === 'function') {
        superKeystroke.apply(this, arguments);
      }
    };
  };
  _.registerInnerField = function(innerFields) {
    innerFields.push(innerFields[this.name] = this.ends[L].controller.API);
  };
  _.latex = function(){ return this.ends[L].latex(); };
  _.text = function(){ return this.ends[L].text(); };
  _.seek = function() {
    return super_.seek.apply(this, arguments);
  };
  _.focus = function() {
    return super_.focus.apply(this, arguments);
  }
  _.blur = function() {
    return super_.blur && super_.blur.apply(this, arguments);
  }
});

var Matrix =
LatexCmds.matrix = P(MathCommand, function(_, super_) {

  var MatrixCell = P(MathBlock, function(_, super_) {
    _.init = function (column, row) {
      this.column = column;
      this.row = row;
      return super_.init.call(this);
    };
    _.keystroke = function(key, e, ctrlr) {
      switch (key) {
      case 'Shift-Spacebar':
        e.preventDefault();
        return this.parent.insertColumn(this);
        break;
      case 'Shift-Enter':
        return this.parent.insertRow(this);
        break;
      }
      return super_.keystroke.apply(this, arguments);
    };

    _.deleteOutOf = function(dir, cursor) {
      var self = this, args = arguments;
      this.parent.backspace(this, dir, cursor, function () {
        // called when last cell gets deleted
        return super_.deleteOutOf.apply(self, args);
      });
    }
  });

  var delimiters = {
    column: '&',
    row: '\\\\'
  };
  _.parentheses = {
    left: null,
    right: null
  };
  _.maximum = {
    rows: 5,
    columns: 5
  };
  _.defaults = {
    rows: 2,
    columns: 2
  };

  _.ctrlSeq = '\\matrix';

  _.createBlocks = function() {
    var cmd = this,
      blocks = cmd.blocks = [],
      prevRow, column, i = 0;

    this.htmlTemplate.replace(/&\d+/g, function (match, index) {
      var row = cmd.htmlTemplate.substring(0, index).match(/<tr[^>]*>/ig).length - 1;
      column = (prevRow === row) ? column + 1 : 0;

      blocks[i] = MatrixCell(column, row);
      blocks[i].adopt(cmd, cmd.ends[R], 0);
      prevRow = row;
      i++;
    });
  };

  _.reflow = function() {
    var blockjQ = this.jQ.children('table');

    var height = blockjQ.outerHeight()/+blockjQ.css('fontSize').slice(0,-2);

    var parens = this.jQ.children('.mq-paren');
    if (parens.length) {
      scale(parens, min(1 + .2*(height - 1), 1.2), 1.05*height);
    }
  };

  _.latex = function() {
    var matrixName = this.getMatrixName(),
      latex = '\\begin{' + matrixName + '}',
      thisRow, row, i;

    for(i = 0; i < this.blocks.length; i++) {
      thisRow = this.blocks[i].row;

      if (typeof row !== 'undefined') {
        if (row !== thisRow) {
          latex += delimiters.row;
        } else {
          latex += delimiters.column;
        }
      }

      row = thisRow;
      latex += this.blocks[i].latex();
    };

    latex += '\\end{' + matrixName + '}';
    return latex;
  };
  _.createLeftOf = function(cursor) {
    this.cursor = cursor;

    var rows = Math.min(this.defaults.rows, this.maximum.rows),
      columns = Math.min(this.defaults.columns, this.maximum.columns);

    this.defaultHtmlTemplate = this.defaultHtmlTemplate || this.generateHtmlTemplate(rows, columns);
    _.htmlTemplate = this.defaultHtmlTemplate;
    super_.createLeftOf.call(this, cursor);
  };
  // Return string name of this matrix type - e.g. matrix, Bmatrix, pmatrix
  _.getMatrixName = function () {
    return this.ctrlSeq.replace('\\', '');
  }
  _.generateHtmlTemplate = function(numRows, numColumns) {
    var matrix = '<span class="mq-matrix mq-non-leaf">' + parenTemplate(this.parentheses.left);
    matrix += '<table class="mq-non-leaf">';

    numRows = Math.min(numRows, this.maximum.rows);
    numColumns = Math.min(numColumns, this.maximum.columns);

    var count = 0;
    for(var row = 0; row < numRows; row++) {
      matrix += '<tr>';
      for(var col = 0; col < numColumns; col++) {
        matrix += '<td>&' + count + '</td>';
        count++;
      }
      matrix += '</tr>';
    }
    matrix += '</table>';
    matrix += parenTemplate(this.parentheses.right) + '</span>';
    return matrix;

    function parenTemplate(paren) {
      return paren ? '<span class="mq-paren mq-scaled">' + paren + '</span>' : '';
    }
  };
  _.htmlTemplate = _.generateHtmlTemplate(1, 1);

  // Based on matrix parsing method in
  // https://github.com/raywainman/mathquill/commit/5a9c6a04ac4e8bb1fd4f912ccbfa53a99224adf8
  _.parser = function() {
    var regex = Parser.regex, self = this, matrixName = this.getMatrixName(),
      rgxContents = new RegExp("^(.*?)\\\\end{" + matrixName + "}"),
      rgxEnd = new RegExp("\\\\end{" + matrixName + "}");

    return regex(rgxContents)
    .then(function(a) {
      // Strip out the trailing command (\end{matrix})
      var content = a.replace(rgxEnd, '');

      // Parse the individual blocks within the matrix
      // Refer to http://en.wikibooks.org/wiki/LaTeX/Mathematics to learn more about the LaTeX
      // matrix notation.
      // Basically rows are delimited by double backslashes and columns by ampersands
      var blocks = [];
      var rows = content.split(delimiters.row);
      var numRows = Math.min(rows.length, self.maximum.rows);
      var numColumns = 0, columns, i;

      // Get the (highest) number of columns, being defensive against inconsistent input
      for(i = 0; i < numRows; i++) {
        columns = rows[i].split(delimiters.column);
        numColumns = Math.max(numColumns, columns.length);
      }
      // limit number of columns to maximum allowable
      numColumns = Math.min(numColumns, self.maximum.columns);

      for(i = 0; i < numRows; i++) {
        // We have a row, now split it into its respective columns
        columns = rows[i].split(delimiters.column);
        for(var a = 0; a < numColumns; a++) {
          // Parse the individual block, this block may contain other more complicated commands
          // like a square root, we delegate the parsing of this to the Parser object. It returns
          // a MathBlock object which is the object representation of the formula.

          // We create a new MatrixCell which receives the MathBlock's children
          var block = MatrixCell(a, i),
            tmpBlock = latexMathParser.parse(columns[a] || ' ');

          tmpBlock.children().adopt(block, block.ends[R], 0);

          blocks.push(block);
        }
      }

      // Tell our Latex.matrix command how big our matrix is
      self.htmlTemplate = self.generateHtmlTemplate(numRows, numColumns);

      // Attach the child blocks (each element of the matrix) to the parent matrix object
      self.blocks = blocks;
      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(self, self.ends[R], 0);
      }
      // The block elements attached to a command are each rendered and then they replace the
      // '&0', '&1', '&2', '&3'... placeholders that are found within the command's htmlTemplate

      // Return the Latex.matrix() object to the main parser so that it knows to render this
      // particular portion of latex in this fashion
      return Parser.succeed(self);
    });
  };
  // Relink all the cells after parsing
  _.finalizeTree = function() {
    var table = this.jQ.find('table');

    if (table.length) {
      this.relink();

      // update mq-rows-<number> class on table
      table.removeClass(function (index, classes) {
        var toRemove = classes.match(/mq-rows-\d+/g);
        return (toRemove && toRemove.join(' ')) || '';
      });

      table.addClass('mq-rows-' + table.find('tr').length);
    }
  };
  // Reassign directional pointers for cursor key navigation between cells.
  _.relink = function () {
    var allCells = this.jQ.find('td');
    var firstCellBlock = Node.byId[allCells.first().attr(mqBlockId)];
    var lastCellBlock = Node.byId[allCells.last().attr(mqBlockId)];
    var firstRow = allCells.eq(0).closest('tr');
    var blocks = [];

    allCells.each(function (cellIndex) {
      var cellBlock = Node.byId[$(this).attr(mqBlockId)];
      var nextCell = allCells.eq(cellIndex + 1);
      var nextRow = $(this).closest('tr').next('tr');
      var indexInColumn = $(this).closest('tr').index();
      var indexInRow = $(this).index();
      var downCell;

      // set up horizontal linkage
      if (nextCell.length) {
        var nextCellBlock = Node.byId[nextCell.attr(mqBlockId)];
        cellBlock[R] = nextCellBlock;
        nextCellBlock[L] = cellBlock;
      }

      // set up vertical linkage
      if (nextRow.length) {
        downCell = nextRow.find('td').eq(indexInRow);
      } else {
        // bottom most cell links to top cell in next column via down arrow
        downCell = firstRow.find('td').eq(indexInRow + 1);
      }
      if (downCell.length) {
        var downCellBlock = Node.byId[downCell.attr(mqBlockId)];
        cellBlock.downOutOf = downCellBlock;
        downCellBlock.upOutOf = cellBlock;
      }

      cellBlock.column = indexInRow;
      cellBlock.row = indexInColumn;
      blocks.push(cellBlock);
    });
    // set start and end blocks of matrix - first and last cells.
    this.ends[L] = firstCellBlock;
    this.ends[R] = lastCellBlock;

    // delete any leftover linkage to removed blocks at the beginning and end.
    if (firstCellBlock && firstCellBlock[L]) { delete firstCellBlock[L]; }
    if (lastCellBlock && lastCellBlock[R]) { delete lastCellBlock[R]; }

    this.blocks = blocks;
  };

  // Also deletes row or column if it is empty
  _.deleteCell = function (cell) {
    var row = cell.jQ.closest('tr');
    var indexInRow = cell.jQ.index();
    var indexInColumn = row.index();
    var rowCells = row.find('td').not(cell.jQ);
    var colCells = this.jQ.find('tr').not(row).map(function () {
      return $(this).find('td')[indexInRow];
    });
    var isLastBlock = this.jQ.find('td').length === 1;
    var otherBlock;

    function isEmpty() {
      var cellBlock = Node.byId[$(this).attr(mqBlockId)];
      return cellBlock.isEmpty();
    }

    if (rowCells.filter(isEmpty).length === rowCells.length && colCells.length) {
      // row is empty (and there are other rows)
      rowCells.remove();
      cell.jQ.remove();
      row.remove();
      this.finalizeTree();
    }
    if (colCells.filter(isEmpty).length === colCells.length && rowCells.length) {
      // column is empty (and there are other columns)
      colCells.remove();
      cell.jQ.remove();
      this.finalizeTree();
    }

    if (!isLastBlock) {
      indexInColumn = Math.min(indexInColumn, this.jQ.find('tr').length - 1);
      indexInRow = Math.min(indexInRow, this.jQ.find('tr').eq(indexInColumn).find('td').length - 1);
      otherBlock = Node.byId[this.jQ.find('tr').eq(indexInColumn).find('td').eq(indexInRow).attr(mqBlockId)];
    }

    return otherBlock;
  };

  _.addRow = function (prevRow) {
    // limit number of rows that can be added.
    if (this.jQ.find('tr').length >= this.maximum.rows) {
      return;
    }

    var numCols = prevRow.find('td').length;
    var newRow = $('<tr></tr>');
    var newBlock, firstNewBlock;

    for (var i = 0; i < numCols; i++) {
      newBlock = MatrixCell();
      newBlock.parent = this;
      newBlock.jQ = $('<td class="mq-empty">').attr(mqBlockId, newBlock.id);
      newRow.append(newBlock.jQ);

      firstNewBlock = firstNewBlock || newBlock;
    }
    newRow.insertAfter(prevRow);
    return firstNewBlock;
  };

  _.addColumn = function (prevCell) {
    // limit number of columns that can be added.
    if (prevCell.closest('tr').find('td').length >= this.maximum.columns) {
      return;
    }

    var index = prevCell.index();
    var rowIndex = prevCell.closest('tr').index();
    var matrix = this;
    var newBlock, newBlocks = [];

    this.jQ.find('tr').each(function () {
      newBlock = MatrixCell();
      newBlock.parent = matrix;
      newBlock.jQ = $('<td class="mq-empty">').attr(mqBlockId, newBlock.id);
      newBlock.jQ.insertAfter($(this).find('td').eq(index));

      newBlocks.push(newBlock);
    });

    return newBlocks[rowIndex];
  };

  _.insertColumn = function(currentBlock) {
    newBlock = this.addColumn(currentBlock.jQ);
    if (newBlock) {
      this.cursor = this.cursor || this.parent.cursor;
      this.finalizeTree();
      this.bubble('reflow').cursor.insAtRightEnd(newBlock);
    }
  };
  _.insertRow = function(currentBlock) {
    newBlock = this.addRow(currentBlock.jQ.closest('tr'));
    if (newBlock) {
      this.cursor = this.cursor || this.parent.cursor;
      this.finalizeTree();
      this.bubble('reflow').cursor.insAtRightEnd(newBlock);
    }
  };

  _.backspace = function(currentBlock, dir, cursor, finalDeleteCallback) {
    if (currentBlock.isEmpty()) {

      var otherBlock = this.deleteCell(currentBlock);

      if (otherBlock) {
        cursor.insAtRightEnd(otherBlock);
      }
      else {
        finalDeleteCallback();
        this.finalizeTree();
      }
      this.bubble('edited');
    }
  };
});

LatexCmds.pmatrix = P(Matrix, function(_, super_) {
  _.ctrlSeq = '\\pmatrix';

  _.parentheses = {
    left: '(',
    right: ')'
  };
});

LatexCmds.bmatrix = P(Matrix, function(_, super_) {
  _.ctrlSeq = '\\bmatrix';

  _.parentheses = {
    left: '[',
    right: ']'
  };
});

LatexCmds.Bmatrix = P(Matrix, function(_, super_) {
  _.ctrlSeq = '\\Bmatrix';

  _.parentheses = {
    left: '{',
    right: '}'
  };
});

LatexCmds.vmatrix = P(Matrix, function(_, super_) {
  _.ctrlSeq = '\\vmatrix';

  _.parentheses = {
    left: '|',
    right: '|'
  };
});

LatexCmds.Vmatrix = P(Matrix, function(_, super_) {
  _.ctrlSeq = '\\Vmatrix';

  _.parentheses = {
    left: '‖',
    right: '‖'
  };
});
