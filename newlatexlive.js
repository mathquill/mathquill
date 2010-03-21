/**
 *
 * usage:
 * $(thing).latexlive();
 * turns thing into a live editable thingy.
 * AMAZORZ.
 */

jQuery.fn.latexlive = (function() { 
  /**
   * mathElement is the main LaTeXDOM prototype.
   * It prototypes both Blocks and Operators.
   */

  var $ = jQuery;

  function MathElement(){}
  MathElement.prototype = { 
    prev: null,
    next: null,
    parent: null,
    firstChild: null,
    lastChild: null,
    jQ: (function() // closure around the actual $ object
    {
      var actual;
      return function(setter)
      {
        if(arguments.length) // not if(el), which would fail on .jQ(undefined)
          return actual = $(setter);
        return actual;
      };
    }()),
    isEmpty: function()
    {
      return this.firstChild === null && this.lastChild === null;
    },
  }

  function MathBlock(commands)
  { 
    if(commands)
      for (var i = 0; i < commands.length; i += 1)
        commands[i].appendTo(this);
    return this;
  }
  MathBlock.prototype = $.extend(new MathElement, { 
    latex: function()
    {
      //TODO
    },
    html: function()
    { 
      var html = '';
      this.eachChild(function(){
        html += this.html();
      });
      return html;
    },
    setEmpty:function()
    {
      if(this.isEmpty())
        this.jQ().html('[ ]').addClass('empty');
      return this;
    },
    removeEmpty:function()
    {
      if(this.jQ().hasClass('empty'))
        this.jQ().html('').removeClass('empty');
      return this;
    },
  });

  function RootMathBlock(dom)
  {
    if(dom)
      $(dom).replaceWith(this.jQ());
    this.cursor = new Cursor(this);
    this.jQ().data('cursor', this.cursor);
  }
  RootMathBlock.prototype = $.extend(new MathBlock, {
    html: function()
    {
      var html = '<span class="latexlive-generated-math">';
      this.eachChild(function(){
        html += this.html();
      });
      html += '</span>';
      return html;
    },
  });

  function MathOperator(cmd, html_template)
  { 
    if (arguments.length == 0)
      return;
    this.command = cmd;
    this.html_template = html_template;
    this.__initBlocks();
  }
  MathOperator.prototype = $.extend(new MathElement, {
    __initBlocks: function()
    {
      for(var i = 0; i < this.html_template.length - 1; i += 1)
        (new MathBlock).appendTo(this); 
    },
    latex: function()
    {
      var rendered = this.cmd
      this.eachChild(function(){
        rendered += '{' + this.latex() + '}';
      });
      return rendered;
    },
    html: function()
    {
      var i = 0;
      rendered = this.html_template[0]

      that = this;
      this.eachChild(function(){
        i += 1;
        try {
          rendered += this.html() + that.html_template[i];
        } catch(e) {
          //since there may be any number of blocks,
          //we have to take into account the case
          //in which html_template.length < 1 + number of blocks.
          //in this case, just silently fail.
        }
      });
      return rendered;
    },
    //placeholder for context-sensitive spacing.
    respace: function() { return this; }
    placeCursor: function(cursor)
    {
      cursor.prependTo(this.firstChild);
      return this;
    }
  });

  function MathSymbol(cmd, html)
  {
    MathOperator.call(this, cmd, [ html ]);
  }
  MathSymbol.prototype = $.extend(new MathOperator, {
    //symbols don't have blocks, so don't place the cursor in any of them.
    placeCursor: function(cursor){return this;}
  });

  function MathVanillaSymbol(ch, html) 
  {
    MathSymbol.call(this, ch, '<span>'+(html || ch)+'</span>');
  }
  MathVanillaSymbol.prototype = MathSymbol.prototype;

  function MathVar(ch)
  {
    MathSymbol.call(this, ch, '<i>'+ch+'</i>');
  }
  MathVar.prototype = MathSymbol.prototype;

  function MathBinaryOperator(cmd, html)
  {
    MathSymbol.call(this, cmd, '<span class="operator">'+html+'</span>');
  }
  MathBinaryOperator.prototype = MathSymbol.prototype;

  function Cursor(block)
  {
    if(block)
      this.prependTo(block);
  }
  Cursor.prototype = {
    next: null,
    prev: null,
    parent: null,
    html: function() { return '<span class="cursor"></span>'; },
    jQ: MathElement.prototype.jQ,
    setParentEmpty: function()
    {
      if(this.parent)
        this.parent.setEmpty();
    },
    detach: function()
    {
      this.setParentEmpty();
      this.prev = this.next = this.parent = null;
      this.jQ().detach();
      return this;
    },
    insertBefore: function(el)
    {
      this.setParentEmpty();
      this.next = el;
      this.prev = el.prev;
      this.parent = el.parent;
      this.jQ().insertBefore(el.jQ()); 
      return this;
    },
    insertAfter: function(el)
    {
      this.setParentEmpty();
      this.prev = el;
      this.next = el.next
      this.parent = el.parent;
      this.jQ().insertAfter(el.jQ());
      return this;
    }, 
    prependTo: function(el)
    {
      this.setParentEmpty();
      el.removeEmpty();
      this.next = el.firstChild;
      this.prev = null;
      this.parent = el;
      this.jQ().prependTo(el.jQ());
      return this;
    },
    appendTo: function(el)
    {
      this.setParentEmpty();
      el.removeEmpty();
      this.prev = el.lastChild;
      this.next = null;
      this.parent = el;
      this.jQ().prependTo(el.jQ());
      return this;
    },
    moveLeft: function()
    {
      if(this.prev)
        if(this.prev.lastChild)
          this.appendTo(this.prev.lastChild)
        else
          this.insertBefore(this.prev);
      else
        if(this.parent.prev)
          this.appendTo(this.parent.prev);
        else if(this.parent.parent)
          this.insertBefore(this.parent.parent);
      //otherwise we're at the beginning of the root, so do nothing.
      return this;
    },
    moveRight: function()
    {
      if(this.next)
        if(this.next.firstChild)
          this.prependTo(this.next.firstChild)
        else
          this.insertAfter(this.next);
      else
        if(this.parent.next)
          this.prependTo(this.parent.next);
        else if(this.parent.parent)
          this.insertAfter(this.parent.parent);
      //otherwise we're at the end of the root, so do nothing.
      return this;
    },
    newBefore: function(el)
    {
      //this.deleteSelection //?
      el.parent = this.parent; 
      el.jQ().insertBefore(this.jQ()); 
      el.next = this.next;
      el.prev = this.prev;
      if(this.prev)
        this.prev.next = el;
      if(this.next)
        this.next.prev = el;

      //respacing
      el.respace();
      if(this.next)
        this.next.respace();
      if(this.prev)
        this.prev.respace();

      this.prev = el;

      if(el.isEmpty())
        el.placeCursor(this);

      this.jQ().removeClass('blink').change();
    }
  }

  function Selection(start, end)
  {
    this.start = start;
    this.end = end;
    var that = this;


    //TODO: figure out how to do this more efficiently with $ and .wrap()
    this.jQ('<span class="selection"></span>').insertBefore(this.start.jQ());
    
    that = this;
    this.each(function(){
      this.jQ().appendTo(that.jQ());
    });
  }
  Selection.prototype = {
    html: function()
    {
      html = '<span class="selection">';
      this.each(function() { html += this.html() } );
      //TODO: use something like this.jQ().html() instead of this.html().
      return html + '</span>';
    },
    jQ: MathBlock.prototype.jQ,
    each: function(fn)
    {
      for(el = this.start; el !== null; el = el.next)
        fn.call(el);
    },
  }


  function chooseOperator(cmd)
  {
      if(cmd.length==1)
      {
          if(cmd.match(/[0-9]/)) //numeric
              return new MathVanillaSymbol(cmd);
          if(cmd.match(/[a-z]/i)) //variable
              return new MathVar(cmd);
      }
      //now look for the "real" commands
      
      //trig
      if(/^\\(a|arc)?(sin|cos|tan|cot|sec|csc)h? $/.test(cmd))
          return new MathVanillaSymbol(cmd, cmd.slice(1,-1));
      
      //text
      if(/^\\text\{.*\} $/.test(cmd))
          return new MathVanillaSymbol(cmd, cmd.slice(6,-2));
      
      ////////////////////////////////////////////////////////////////////////REMOVEME HACK append space if there is none
      if(cmd.length > 1 && cmd.charAt(0)=='\\' && cmd.slice(-1)!=' ')
          cmd+=' ';
      switch(cmd)
      {
          case '\\':
              //it's an input thingy!
              var command = new LatexCommandInput();
              return command;
          case '_':
              return new MathOperator('_', ['<sub>', '</sub>']);
          case '^':
              return new MathOperator('^', ['<sup>', '</sup>']);

          //complicated commands
          case '/':
          case '\\frac ':
              var frac = new MathOperator('\\frac',
                  [
                      '<span class="fraction"><span class="numerator">',
                      '</span><span class="denominator">',
                      '</span>', //will still be length 3 despite comma
                  ]
              );
              /*frac.blocks[1].change(function(){
                  this.parent.jQ.css('verticalAlign',-this.jQ.outerHeight()/2);
              });*/
              if(cmd == '/')
              {
                  if(cursor.prev && $.inArray(cursor.prev.cmd,['+','-','=','\\sum ','\\prod ']) == -1)
                  {
                      frac.blocks[0].removeEmpty();
                      for(var prev = cursor.prev; prev && $.inArray(cursor.prev.cmd,['+','-','=','\\sum ','\\prod ']) == -1;)
                      {
                          var ele = prev;
                          prev = prev.prev;
                          ele.prependTo(frac.blocks[0]);
                      }
                  }
                  frac.placeCursor = function(cursor){
                      cursor.appendTo(this.blocks[1]);
                  };
              }
              
              return frac;
          /*case '\\cases ':
          case '\\casewise ':
              var cases = new MathOperator('\\cases ',
                  [
                      '<table style="display:inline-block"><tr><td>',
                      '</td></tr></table>',
                  ]
              );
              return cases;*/
          
          //symbols that aren't the same HTML character entity reference as they are LaTeX commands
          case '\\not ':
              //return new MathSymbol('\\not ','<span class="not">/</span>');
          case '\\neg ':
              return new MathVanillaSymbol('\\neg ','&not;');
          case '\\quad ':
          case '\\emsp ':
              return new MathVanillaSymbol('\\quad ','&nbsp;&nbsp;&nbsp;&nbsp;');
          case '\\qquad ':
              return new MathVanillaSymbol('\\qquad ','&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
          case '\\, ':
              return new MathVanillaSymbol('\\, ','&nbsp;');
          case '\\: ':
              return new MathVanillaSymbol('\\: ','&nbsp;&nbsp;');
          case '\\; ':
              return new MathVanillaSymbol('\\; ','&nbsp;&nbsp;&nbsp;');
          case '\\! ':
              return new MathSymbol('\\! ','<span style="margin-right:-.2em"></span>');
          case '\\dots ':
          case '\\ellip ':
          case '\\hellip ':
          case '\\ellipsis ':
          case '\\hellipsis ':
              return new MathVanillaSymbol('\\dots ','&hellip;');
          case '\\converges ':
          case '\\darr ':
          case '\\dnarr ':
          case '\\dnarrow ':
          case '\\downarrow ':
              return new MathVanillaSymbol('\\downarrow ','&darr;');
          case '\\dArr ':
          case '\\dnArr ':
          case '\\dnArrow ':
          case '\\Downarrow ':
              return new MathVanillaSymbol('\\Downarrow ','&dArr;');
          case '\\diverges ':
          case '\\uarr ':
          case '\\uparrow ':
              return new MathVanillaSymbol('\\uparrow ','&uarr;');
          case '\\uArr ':
          case '\\Uparrow ':
              return new MathVanillaSymbol('\\Uparrow ','&uArr;');
          case '\\to ':
              return new MathBinaryOperator('\\to ','&rarr;');
          case '\\rarr ':
          case '\\rightarrow ':
              return new MathVanillaSymbol('\\rightarrow ','&rarr;');
          case '\\implies ':
              return new MathBinaryOperator('\\Rightarrow ','&rArr;');
          case '\\rArr ':
          case '\\Rightarrow ':
              return new MathVanillaSymbol('\\Rightarrow ','&rArr;');
          case '\\gets ':
              return new MathBinaryOperator('\\gets ','&larr;');
          case '\\larr ':
          case '\\leftarrow':
              return new MathVanillaSymbol('\\leftarrow ','&larr;');
          case '\\impliedby ':
              return new MathBinaryOperator('\\Leftarrow ','&lArr;');
          case '\\lArr ':
          case '\\Leftarrow ':
              return new MathVanillaSymbol('\\Leftarrow ','&lArr;');
          case '\\harr ':
          case '\\lrarr ':
          case '\\leftrightarrow ':
              return new MathVanillaSymbol('\\leftrightarrow ','&harr;');
          case '\\iff ':
              return new MathBinaryOperator('\\Leftrightarrow ','&hArr;');
          case '\\hArr ':
          case '\\lrArr ':
          case '\Leftrightarrow ':
              return new MathVanillaSymbol('\\Leftrightarrow ','&hArr;');
          case '\\Re ':
          case '\\Real ':
          case '\\real ':
              return new MathVanillaSymbol('\\Re ','&real;');
          case '\\Im ':
          case '\\imag ':
          case '\\image ':
          case '\\imagin ':
          case '\\imaginary ':
          case '\\Imaginary ':
              return new MathVanillaSymbol('\\Im ','&image;');
          case '\\part ':
          case '\\partial ':
              return new MathVanillaSymbol('\\partial ','&part;');
          case '\\inf ':
          case '\\infin ':
          case '\\infty ':
          case '\\infinity ':
              return new MathVanillaSymbol('\\infty ','&infin;');
          case '\\alef ':
          case '\\alefsym ':
          case '\\aleph ':
          case '\\alephsym ':
              return new MathVanillaSymbol('\\aleph ','&alefsym;');
          case '\\xist ':
          case '\\xists ': //LOL
          case '\\exist ':
          case '\\exists ':
              return new MathVanillaSymbol('\\exists ','&exist;');
          case '\\and ':
          case '\\land ':
          case '\\wedge ':
              return new MathVanillaSymbol('\\wedge ','&and;');
          case '\\or ':
          case '\\lor ':
          case '\\vee ':
              return new MathVanillaSymbol('\\vee ','&or;');
          case '\\o ':
          case '\\O ':
          case '\\empty ':
          case '\\emptyset ':
          case '\\nothing ':
          case '\\varnothing ':
              return new MathBinaryOperator('\\O ','&empty;');
          case '\\union ':
              return new MathVanillaSymbol('\\cup ','&cup;');
          case '\\intersect ':
          case '\\intersection ':
              return new MathVanillaSymbol('\\cap ','&cap;');
          case '\\deg ':
          case '\\degree ':
              return new MathVanillaSymbol('^{\\circ}','&deg;');
          
          case '\'' :
          case '\\prime ':
              return new MathVanillaSymbol('\'','&prime;');
          case '*':
          case '\\sdot ':
          case '\\cdot ':
              return new MathVanillaSymbol('\\cdot ', '&sdot;');
          
          //Binary Operators
          case '|':
          case '=':
          case '%':
              return new MathBinaryOperator(cmd, cmd);
          case '+':
              return new MathPlusMinus('+','+');
          case '-':
              return new MathPlusMinus('-','&minus;');
          case '\\pm ':
          case '\\plusmn ':
          case '\\plusminus ':
              return new MathPlusMinus('\\pm ','&plusmn;');
          case '\\mp ':
          case '\\mnplus ':
          case '\\minusplus ':
              return new MathPlusMinus('\\mp ','&#8723;');
          case '\\div ':
          case '\\divide ':
          case '\\divides ':
              return new MathBinaryOperator('\\div ','&divide;');
          case '\\ne ':
          case '\\neq ':
              return new MathBinaryOperator(cmd,'&ne;');
          case '\\ast ':
          case '\\loast ':
          case '\\lowast ':
              return new MathBinaryOperator('\\ast ','&lowast;');
          //case '\\there4 ': // a special exception for this one, perhaps?
          case '\\therefor ':
          case '\\therefore ':
              return new MathBinaryOperator('\\therefore ','&there4;');
          case '\\cuz ': // l33t
          case '\\because ':
              return new MathBinaryOperator('\\because ','&#8757;');
          case '\\prop ':
          case '\\propto ':
              return new MathBinaryOperator('\\propto ','&prop;');
          case '\\asymp ':
          case '\\approx ':
              return new MathBinaryOperator('\\approx ','&asymp;');
          case '<':
          case '\\lt ':
              return new MathBinaryOperator('<','&lt;');
          case '>':
          case '\\gt ':
              return new MathBinaryOperator('<','&gt;');
          case '\\le ':
          case '\\leq ':
              return new MathBinaryOperator(cmd,'&le;');
          case '\\ge ':
          case '\\geq ':
              return new MathBinaryOperator(cmd,'&ge;');
          case '\\sub ':
          case '\\subset ':
              return new MathBinaryOperator('\\subset ','&sub;');
          case '\\nsub ':
          case '\\notsub ':
          case '\\nsubset ':
          case '\\notsubset ':
              return new MathBinaryOperator('\\not\\subset ','&#8836;');
          case '\\sup ':
          case '\\supset ':
          case '\\superset ':
              return new MathBinaryOperator('\\supset ','&sup;');
          case '\\nsup ':
          case '\\notsup ':
          case '\\nsupset ':
          case '\\notsupset ':
          case '\\nsuperset ':
          case '\\notsuperset ':
              return new MathBinaryOperator('\\not\\supset ','&#8837;');
          case '\\sube ':
          case '\\subeq ':
          case '\\subsete ':
          case '\\subseteq ':
              return new MathBinaryOperator('\\subseteq ','&sube;');
          case '\\nsube ':
          case '\\nsubeq ':
          case '\\notsube ':
          case '\\notsubeq ':
          case '\\nsubsete ':
          case '\\nsubseteq ':
          case '\\notsubsete ':
          case '\\notsubseteq ':
              return new MathBinaryOperator('\\not\\subseteq ','&#8840;');
          case '\\supe ':
          case '\\supeq ':
          case '\\supsete ':
          case '\\supseteq ':
              return new MathBinaryOperator('\\supseteq ','&supe;');
          case '\\nsupe ':
          case '\\nsupeq ':
          case '\\notsupe ':
          case '\\notsupeq ':
          case '\\nsupsete ':
          case '\\nsupseteq ':
          case '\\notsupsete ':
          case '\\notsupseteq ':
          case '\\nsupersete ':
          case '\\nsuperseteq ':
          case '\\notsupersete ':
          case '\\notsuperseteq ':
              return new MathBinaryOperator('\\not\\supseteq ','&#8841;');
          case '\\in ':
              return new MathBinaryOperator('\\in ','&isin;');
          case '\\ni ':
          case '\\contains ':
              return new MathBinaryOperator('\\ni ','&ni;');
          case '\\notni ':
          case '\\niton ':
          case '\\notcontains ':
          case '\\doesnotcontain ':
              return new MathBinaryOperator('\\not\\ni ','&#8716;');
          case '\\notin ':
          case '\\sim ':
          case '\\equiv ':
          case '\\times ':
              return new MathBinaryOperator(cmd,'&'+cmd.slice(1,-1)+';');
          
          //non-italicized functions
          case '\\ln ':
          case '\\lg':
          case '\\log ':
          case '\\span ':
          case '\\proj ':
          case '\\det ':
          case '\\dim ':
          case '\\min ':
          case '\\max ':
          case '\\mod ':
          case '\\lcm ':
          case '\\gcd ':
          case '\\lim ':
              return new MathVanillaSymbol(cmd, cmd.slice(1,-1));
          
          case '\\sqrt ':
              return new MathSquareRoot();
          
          //parens
          case '(':
              return new MathParens('(',')');
          case '[':
              return new MathParens('[',']');
          case '{':
              return new MathParens('{','}');
          
          default:
              if(cmd.charAt(0) == '\\')
                  return new MathVanillaSymbol(cmd,'&'+cmd.slice(1,-1)+';');
              else
                  return new MathVanillaSymbol(cmd);
      }
  }

  ////// TODO: change "cursor" to "root.cursor", and clean up a bit.

  //expose public method to $.  
  //this is intended to be called
  //on a $ object.
  return function(tabindex)
  {
    root = new RootMathBlock(tabindex, this)
    root.jQ().attr('tabindex',tabindex).click(function(e)
    {
      var jQ = $(e.target);
      if(jQ.hasClass('empty'))
      {
        cursor.prependTo(jQ.data('latexBlock')).jQ().show();
        return false;
      }
      var cmd = jQ.data('latexCmd');
      if(!cmd && !(cmd = (jQ = jQ.parent()).data('latexCmd'))) // all clickables not MathOperators are either LatexBlocks or like sqrt radicals or parens, both of whose immediate parents are LatexCommands
        return;
      cursor.jQ().show();
      cursor.clearSelection();
      if((e.pageX - jQ.offset().left)*2 < jQ.outerWidth())
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);
      return false;
    });
    cursor.prependTo(this);
    
    //make the cursor blink
    
    var intervalId;
    var continueDefault = true;
    var root = this;
    this.jQ
    .focus(function()
    {
      cursor.jQ().show();
      intervalId = setInterval(function(){
        cursor.jQ().toggle();
      }, 500);
      if(cursor.parent)
      {
        if(cursor.parent.isEmpty())
        {
          var p = cursor.parent;
          cursor.detach().prependTo(p);
        }
      }
      else
        cursor.prependTo(root);
      cursor.parent.jQ().addClass('hasCursor');
    })
    .blur(function(e)
    {
      clearInterval(intervalId);
      cursor.jQ().hide();
      cursor.parent.setEmpty().jQ().removeClass('hasCursor');
      if(root.isEmpty())
        cursor.detach();
      $(this).removeClass('hasCursor');
    })
    .keydown(function(e)
    {
      continueDefault = false;
      if(cursor.parent)
      {
        e.ctrlKey = e.ctrlKey || e.metaKey;
        switch(e.which)
        {
          case 35: //end
            if(e.ctrlKey) //move to the end of the root block.
            {
              root = cursor.parent;
              while(root.parent)
                  root = root.parent.parent;
              cursor.appendTo(root);
              return false;
            }
            else //move to the end of the current block.
            {
              cursor.appendTo(cursor.parent);
              return false;
            }
            return;
          case 36: //home
            if(e.ctrlKey) //move to the start of the root block.
            {
              root = cursor.parent;
              while(root.parent)
                root=root.parent.parent;
              cursor.prependTo(root);
            }
            else
              cursor.prependTo(cursor.parent);
            return false;
          case 37: //left
            if(e.shiftKey)
              cursor.selectLeft();
            else
              cursor.moveLeft();
            return false;
          case 38: //up
            return false;
          case 39: //right
            if(e.shiftKey)
              cursor.selectRight();
            else
              cursor.moveRight();
            return false;
          case 40: //down
            return false;
          case 8: //backspace
            if(e.ctrlKey)
              while(cursor.prev)
                cursor.backspace();
            else
              cursor.backspace();
            return false;
          case 46: //delete
            if(e.ctrlKey)
              while(cursor.next)
                cursor.deleteForward();
            else
              cursor.deleteForward();
            return false;
          case 9: //tab
            var parent = cursor.parent, gramp = parent.parent;
            if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
            {
              if(!gramp) //cursor is in the root
              {
                if(parent.isEmpty())
                  continueDefault = false; //prevent default
                else
                  cursor.prependTo(parent);
                return false;
              }
              if(gramp instanceof LatexCommandInput)
                cursor.renderOperator(gramp);
              parent = cursor.parent;
              gramp = parent.parent;
              if(parent.position == 0) //escape
                cursor.insertBefore(gramp);
              else //move one block left
                cursor.appendTo(gramp.blocks[parent.position-1]);
            }
            else //plain Tab = go one block right if it exists, else 
            {
              if(!gramp) //cursor is in the root
              {
                if(parent.isEmpty())
                  continueDefault = false; //prevent default
                else
                  cursor.appendTo(parent);
                return false;
              }
              if(gramp instanceof LatexCommandInput)
                cursor.renderOperator(gramp);
              parent = cursor.parent;
              gramp = parent.parent;
              if(parent.position == gramp.blocks.length - 1) //escape this block
                cursor.insertAfter(gramp);
              else //move one block right
                cursor.prependTo(gramp.blocks[parent.position+1]);
            }
            return false;
          default:
            //do nothing, pass to keypress.
            continueDefault = true;
        }
      }
    })
    .keypress(function(e)
    {
      if(!continueDefault)
        return false;
      if(cursor.parent)
      {
        if(e.ctrlKey || e.metaKey)
          return; //don't capture Ctrl+anything.
        switch(e.which)
        {
          //eventually there'll be more cases...
          
          default:
            var cmd = String.fromCharCode(e.which);
            if(cmd)
                cursor.newBefore(cmd);
            return false;
        }
      }
    })
    .focus();
  }

})();
