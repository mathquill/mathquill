/*
 * LaTeX Math in pure HTML and CSS -- No images whatsoever
 * v0.xa
 * by Jay and Han
 * Lesser GPL Licensed: http://www.gnu.org/licenses/lgpl.html
 * 
 * Usage:
 * [optional new] LatexRoot({element you want to insert LaTeX Math after});
 * 
 * Requires jQuery 1.4+
 *
 */

//$('head').append('<link rel="stylesheet" type="text/css" href="http://github.com/jayferd/latexlive/raw/master/latexlive.css">');
 
var LatexRoot = (function(){

//Ensure that keydown is called every auto-repeat when you hold down a key
//even in browsers that only auto-repeat keypress. Also ensure keypress
//doesn't get called if keydown returns false.
function $keyEvents(jQ, keydown, keypress)
{
    var lastKeydnEvt;
    jQ.keydown(keydown ?
        function(e)
        {
            lastKeydnEvt = e;
            e.happened = true;
            return e.returnValue = keydown.apply(this,arguments);
        }
        :
        function(e)
        {
            lastKeydnEvt = e;
            e.happened = true;
        }
    ).keypress(keypress ?
        function()
        {
            if(!lastKeydnEvt.happened)
                jQuery(this).trigger(lastKeydnEvt);
            lastKeydnEvt.happened = false;
            if(lastKeydnEvt.returnValue === false)
                return false;
            return keypress.apply(this,arguments);
        }
        :
        function()
        {
            if(!lastKeydnEvt.happened)
                jQuery(this).trigger(lastKeydnEvt);
            lastKeydnEvt.happened = false;
            return lastKeydnEvt.returnValue;
        }
    );
}

/*************************** BLOCKS *************************/
function LatexBlock(parent, position, commands)
{
    var latex;
    if(typeof (latex = arguments[0]) == 'string' || typeof (latex = arguments[2]) == 'string') //we've passed in a LaTeX string!
    {
        this.latex(latex);
        if(typeof arguments[0] == 'string')
            parent = null;
    }
    else if(commands)
        for(var i = 0; i < commands.length; i += 1)
            commands[i].appendTo(this);

    this.parent = parent;
    this.position = position;
    
    return this;
}
LatexBlock.prototype = {
    firstChild: null,
    lastChild: null,
    setEmpty:function()
    {
        if(this.isEmpty())
            this.jQ.html('[ ]').addClass('empty');
        return this;
    },
    removeEmpty:function()
    {
        if(this.jQ.hasClass('empty'))
            this.jQ.html('').removeClass('empty');
        return this;
    },
    isEmpty:function()
    {
        return this.firstChild===null || (this.firstChild === this.lastChild && this.firstChild === cursor);
    },
    latex:function(latex)
    {
        if(latex) //passing in source!
        {
            if(cursor.parent)
                cursor.detach();
            this.empty().removeEmpty();
            
            if(typeof latex == 'string')
                latex = latex.match(/\{|\}|\\[a-z]+|./ig);
            
            while(latex.length)
            {
                var token = latex.shift();
                if(token == (this.parent && this.parent.end ? this.parent.end : '}'))
                    break;
                /////////////////////////////////////////////////////////////////// THIS IS A TOTAL REMOVEME QUICKFIX
                if(token == '/')
                    new LatexVanillaSymbol('/').appendTo(this);
                else
                chooseCommand(token).eachChild(function()
                {
                    var token = latex.shift();
                    if(token == '{')
                        this.latex(latex);
                    else if(this.parent instanceof LatexParens)
                    {
                        latex.unshift(token);
                        this.latex(latex);
                    }
                    else
                        this.latex(token);
                }).appendTo(this).eachChild(function recurse(){ /////////////////// This is also pretty bad--goes through the entire tree triggering the change event
                    if(this.firstChild != null)
                        this.eachChild(function(){
                            if(this.blocks.length > 0)
                                this.eachChild(recurse);
                            else
                                this.jQ.change();
                        });
                    else
                        this.jQ.change();
                }).respace();
            }
            return this.setEmpty();
        }
        
        //no source was passed in; just render as latex.
        latex = '';
        this.eachChild(function(){
            latex += this.latex()
        });
        return latex.replace(/ (?![a-z])/ig,'');
    },
    html:function(html)
    {
        if(html) //passed in html to turn into LaTeX
        {
            var block = this.empty();
            $(html).each(function()
            {
                var ele = $(this);
                if(ele.is('i'))
                    ele = new LatexVar(ele.text());
                else if(ele.is('span.operator'))
                    ele = new LatexBinaryOperator(ele.text()); // TODO: Make this smarter
                else if(ele.is('span.fraction'))
                {
                    var frac = new LatexCommand('\\frac',
                        [
                            '<span class="fraction"><span class="numerator">',
                            '</span><span class="denominator">',
                            '</span>', //will still be length 3 despite comma
                        ]
                    );
                    ele.children().each(function(i){
                        frac.blocks[i].html(this);
                    });
                    ele = frac;
                }
                else if(ele.is('span'))
                    ele = new LatexVanillaSymbol(ele.text());
                else if(ele.is('sup'))
                    ele = new new LatexCommand('_', ['<sup>', '</sup>']);
                else if(ele.is('sub'))
                    ele = new new LatexCommand('_', ['<sub>', '</sub>']);
                else
                    alert('unsupported html: '+html), ele = null;
                ele.appendTo(block);
            });
            return this;
        }
        
        //no html was passed in, just render as html
        html = '';
        this.eachChild(function(){
            html += this.html();
        });
        return html;
    },
    /*
     * flattens the block and inserts all its elements after the given element.
     */
    insertAfter:function(cmd)
    {
        this.eachChildReverse(function(){
            this.insertAfter(cmd);
        });
        return this;
    },
    insertBefore:function(cmd)
    {
        this.eachChild(function(){
            this.insertBefore(cmd);
        });
        return this;
    },
    empty:function()
    {
        this.jQ.empty();
        this.firstChild = this.lastChild = null;
        return this;
    },
    eachChild:function(fn)
    {
        for(var cmd = this.firstChild; cmd; cmd = cmd.next)
            fn.call(cmd);
        return this;
    },
    eachChildReverse:function(fn)
    {
        for(var cmd = this.lastChild; cmd; cmd = cmd.prev)
            fn.call(cmd);
        return this;
    },
    change:function(handler)
    {
        var thisBlock = this;
        this.jQ.change(function(){
            handler.call(thisBlock);
        });
        return this;
    },
};

/*************************** ROOT ***************************/
function LatexRoot(textElement, tabindex) 
{
    if(!(this instanceof LatexRoot))
        return new LatexRoot(textElement);
    LatexBlock.call(this);
    tabindex = tabindex || 0;
    this.jQ = $(this.html()).insertAfter(textElement).data('latexBlock',this).attr('tabindex',tabindex).click(function(e)
    {
        var jQ = $(e.target);
        if(jQ.hasClass('empty'))
        {
            cursor.prependTo(jQ.data('latexBlock')).jQ.show();
            return false;
        }
        var cmd = jQ.data('latexCmd');
        if(!cmd && !(cmd = (jQ = jQ.parent()).data('latexCmd'))) // all clickables not LatexCommands are either LatexBlocks or like sqrt radicals or parens, both of whose immediate parents are LatexCommands
            return;
        cursor.jQ.show();
        cursor.clearSelection();
        if((e.pageX - jQ.offset().left)*2 < jQ.outerWidth())
            cursor.insertBefore(cmd);
        else
            cursor.insertAfter(cmd);
        return false;
    });
    cursor.prependTo(this);
    
    //closured vars for event handlers:
    var intervalId; //blinking cursor
    var continueDefault, lastKeydnEvt; //see Wiki page "Keyboard Events"
    var root = this; //to get around dynamic scoping of 'this'
    this.jQ.focus(function()
    {
        cursor.jQ.show();
        intervalId = setInterval(function(){
            cursor.jQ.toggle();
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
            cursor.appendTo(root);
        cursor.parent.jQ.addClass('hasCursor');
    }).blur(function(e){
        clearInterval(intervalId);
        cursor.jQ.hide();
        cursor.parent.setEmpty().jQ.removeClass('hasCursor');
    }).keydown(function(e)
    {
        //see Wiki page "Keyboard Events"
        lastKeydnEvt = e;
        e.happened = true;
        continueDefault = false;
        
        e.ctrlKey = e.ctrlKey || e.metaKey;
        switch(e.which)
        {
            case 8: //backspace
                if(e.ctrlKey)
                    while(cursor.prev)
                        cursor.backspace();
                else
                    cursor.backspace();
                return false;
            case 27: //esc does something weird in keypress, may as well be the same as tab until we figure out what to do with it
            case 9: //tab
                var parent = cursor.parent, gramp = parent.parent;
                if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
                {
                    if(!gramp) //cursor is in the root, allow default
                        return continueDefault = true;
                    if(gramp instanceof LatexCommandInput)
                        return cursor.renderCommand(gramp), false;
                    parent = cursor.parent;
                    gramp = parent.parent;
                    if(parent.position == 0) //escape
                        cursor.insertBefore(gramp);
                    else //move one block left
                        cursor.appendTo(gramp.blocks[parent.position-1]);
                }
                else //plain Tab = go one block right if it exists, else escape right.
                {
                    if(!gramp) //cursor is in the root, allow default
                        return continueDefault = true;
                    if(gramp instanceof LatexCommandInput)
                        return cursor.renderCommand(gramp), false;
                    parent = cursor.parent;
                    gramp = parent.parent;
                    if(parent.position == gramp.blocks.length - 1) //escape this block
                        cursor.insertAfter(gramp);
                    else //move one block right
                        cursor.prependTo(gramp.blocks[parent.position+1]);
                }
                cursor.clearSelection();
                return false;
            case 13: //enter
                return false;
            case 35: //end
                if(e.ctrlKey) //move to the end of the root block.
                {
                    root = cursor.parent;
                    while(root.parent)
                        root = root.parent.parent;
                    cursor.appendTo(root);
                    return false;
                }
                //else move to the end of the current block.
                cursor.appendTo(cursor.parent);
                return false;
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
            case 46: //delete
                if(e.ctrlKey)
                    while(cursor.next)
                        cursor.deleteForward();
                else
                    cursor.deleteForward();
                return false;
            default:
                continueDefault = null; //as in 'neither'. Do nothing, pass to keypress.
                return;
        }
    }).keypress(function(e)
    {
        //on auto-repeat, keypress may get triggered but not keydown (see Wiki page "Keyboard Events")
        if(!lastKeydnEvt.happened)
            $(this).trigger(lastKeydnEvt);
        
        if(continueDefault !== null)
        {
            lastKeydnEvt.happened = false;
            return continueDefault;
        }
        
        if(e.ctrlKey || e.metaKey)
            return; //don't capture Ctrl+anything.
        
        switch(e.which)
        {
            //eventually there might be more cases...
            default:
                var cmd = String.fromCharCode(e.which);
                if(cmd)
                    cursor.newBefore(cmd);
                return false;
        }
    }).focus();
}
LatexRoot.prototype = new LatexBlock;
LatexRoot.prototype.html = function()
{
    var html = '<span class="latexlive-generated-math">';
    this.eachChild(function(){
        html += this.html();
    });
    html += '</span>';
    return html;
};


/***************** BLOCK FRAGMENTS AND SELECTIONS *****************/
function Selection(parent, start, end)
{
    this.parent = parent;
    this.start = start;
    this.end = end;
    
    
    this.jQ = $('<span class="selection"></span>').insertBefore(this.start.jQ);
    
    frag = this;
    this.each(function(){
        this.jQ.appendTo(frag.jQ);
    });
}
Selection.prototype = {
    parent: null,
    start: null,
    end: null,
    each:function(fn)
    {
        for(cmd = this.start; cmd !== null && cmd !== this.start.next; cmd = cmd.next)
            fn.call(cmd);
        return this;
    },
    remove: function()
    {
        if(this.start && this.start.prev)
            this.start.prev.next = this.end && this.end.next;
        if(this.start === this.parent.firstChild)
            if(this.start.prev)
                this.parent.firstChild = this.start.prev;
            else
                this.parent.firstChild = this.end.next;
        if(this.end && this.end.next)
            this.end.next.prev = this.start && this.start.prev;
        if(this.end === this.parent.lastChild)
            if(this.end.next)
                this.parent.lastChild = this.end.next;
            else
                this.parent.lastChild = this.start.prev;
        
        this.jQ.remove();
        return this;
    },
    extendLeft: function()
    {
        if(this.start.isFirst())
        {
            //we've hit the start of a block.  Bubble out if possible
            if(!this.parent.parent) //rootblock case
                return this;
            
            this.start.jQ.unwrap();
            this.jQ = this.parent.parent.jQ.wrap('<span class="selection"></span>').parent();
            
            this.start = this.end = this.parent.parent;
            this.parent = this.parent.parent.parent;
        }
        else
        {
            this.start = this.start.prev;
            if(this.start.cmd == 'the_cursor')
                this.start = this.start.prev;
            this.start.jQ.prependTo(this.jQ);
        }
        return this;
    },
    extendRight: function()
    {
        if(this.end.isLast())
        {
            if(!this.parent.parent)
                return this;
                
            this.end.jQ.unwrap();
            this.jQ = this.parent.parent.jQ.wrap('<span class="selection"></span>').parent();
            
            this.start = this.end = this.parent.parent;
            this.parent = this.parent.parent.parent;
        }
        else
        {
            this.end = this.end.next;
            if(this.end.cmd == 'the_cursor')
                this.end = this.end.next;
            this.end.jQ.appendTo(this.jQ);
        }
        return this;
    },
    retractRight: function()
    {
        if(this.start == this.end)
            return false;
        this.end.jQ.insertAfter(this.jQ);
        this.end = this.end.prev;
    },
    retractLeft: function()
    {
        if(this.start == this.end)
            return false;
        this.start.jQ.insertBefore(this.jQ);
        this.start = this.start.next;
    }
    
}


/*********************** COMMANDS AND SYMBOLS ************************/
function LatexCommand(cmd, html_template)
{
    if(cmd)
        this.cmd = cmd;
    if(html_template)
        this.html_template = html_template;
    
    (this.blocks = []).length = this.html_template.length - 1;
	
	for(var i=0;i<this.blocks.length;i+=1)
		this.blocks[i] = new LatexBlock(this, i);
	
    this.jQ = jQuery(this.html()).data('latexCmd',this);
        
    if(this.html_template.length > 2)
        for(var i in this.blocks)
        {
            this.blocks[i].jQ = this.jQ.children().eq(i).data('latexBlock',this.blocks[i]); //inefficient, but elegant and not performance-critical
            this.blocks[i].setEmpty();
        }
    else if(this.html_template.length == 2)
        if(this.jQ.children().length > 0)
            this.blocks[0].jQ = this.jQ.children().eq(1).data('latexBlock',this.blocks[0]);
        else //no children, must be a symbol
            this.blocks[0].jQ = this.jQ.data('latexBlock',this.blocks[0]);
}
LatexCommand.prototype = {
    latex:function()
    {
        var rendered = this.cmd;
        this.eachChild(function(){
			rendered += '{' + this.latex() + '}';
        });
        return rendered;
    },
    html:function()
    {
        var html = '';
        for(var i in this.blocks)
            html += this.html_template[i] + this.blocks[i].html();
        html += this.html_template[this.blocks.length];
        return html;
    },
    isEmpty:function()
    {
        var empty=true;
        this.eachChild(function() {
            if(empty && !this.isEmpty())
                empty = false;
        });
        return empty;
    },
    insertBefore:function(cmd)
    {
        if(this.parent)
            this.detach();
        
        this.parent = cmd.parent;
        this.prev = cmd.prev;
        if(this.prev)
            this.prev.next = this;
        this.next = cmd;
        cmd.prev = this;
        
        if(cmd === this.parent.firstChild)
            this.parent.firstChild = this;

        this.jQ.insertBefore(cmd.jQ);
        
        return this;
    },
    insertAfter:function(cmd)
    {
        if(this.parent)
            this.detach();
        
        this.parent = cmd.parent;
        this.next = cmd.next;
        if(this.next)
            this.next.prev = this;
        this.prev = cmd;
        cmd.next = this;
        
        if(cmd === this.parent.lastChild)
            this.parent.lastChild = this;

        this.jQ.insertAfter(cmd.jQ);
        
        return this;
    },
    prependTo:function(block)
    {
        if(this.parent)
            this.detach();
        
        this.parent = block;
        this.next = block.firstChild;
        this.prev = null;
        if(block.firstChild)
            block.firstChild.prev = this;
        else
            block.lastChild = this;
        block.firstChild = this;

        this.jQ.prependTo(block.jQ);
        
        return this;
    },
    appendTo:function(block)
    {
        if(this.parent)
            this.detach();
        
        this.parent = block;
        this.prev = block.lastChild;
        this.next = null;
        if(block.lastChild)
            block.lastChild.next = this;
        else
            block.firstChild = this;
        block.lastChild = this;

        this.jQ.appendTo(block.jQ);
        
        return this;
    },
    detach:function()
    {
        this.jQ.detach();

        if(this.prev)
            this.prev.next = this.next;
        if(this.next)
            this.next.prev = this.prev;
        if(this.parent.firstChild === this)
            this.parent.firstChild = this.next;
        if(this.parent.lastChild === this)
            this.parent.lastChild = this.prev;
        
        this.prev = this.next = this.parent = null;

        return this;
    },
    remove:function()
    {
        this.detach();
        this.jQ.remove(); //also removes all child blocks if they exist.
    },
    eachChild:function(fn)
    {
        for(var i in this.blocks)
            fn.call(this.blocks[i], i);
        return this;
    },
    isFirst:function()
    {
        return (this.prev===null ||
            (this.prev.cmd == 'the_cursor' && this.prev.prev === null)
        );
    },
    isLast:function()
    {
        return (this.next===null ||
            (this.next.cmd == 'the_cursor' && this.next.next === null)
        );
    },
    respace:function(){ return this; },
};

//class for symbols (lightweight commands that take no blocks)
function LatexSymbol(cmd, html)
{
    LatexCommand.call(this, cmd, [ html ]);
}
LatexSymbol.prototype = LatexCommand.prototype;

function LatexVanillaSymbol(ch, html)
{
    LatexSymbol.call(this, ch, '<span>'+(html || ch)+'</span>');
}
LatexVanillaSymbol.prototype = LatexCommand.prototype;

function LatexVar(ch)
{
    LatexSymbol.call(this, ch, '<i>'+ch+'</i>');
}
LatexVar.prototype = LatexCommand.prototype;

//like lim, log, ln, sin, cos etc
function LatexNonItalicFunctions()
{
    LatexVanillaSymbol.apply(this, arguments);
}
LatexNonItalicFunctions.prototype = new LatexSymbol('LatexNonItalicFunctions.prototype');

function LatexBinaryOperator(cmd, html)
{
    LatexSymbol.call(this, cmd, '<span class="operator">'+html+'</span>');
}
LatexBinaryOperator.prototype = new LatexSymbol('LatexBinaryOperator.prototype');

function LatexPlusMinus(cmd, html)
{
    LatexVanillaSymbol.apply(this, arguments);
}
LatexPlusMinus.prototype = new LatexBinaryOperator('LatexPlusMinus.prototype');
LatexPlusMinus.prototype.respace = function()
{
    if(!this.prev || this.prev instanceof LatexBinaryOperator || this.prev instanceof LatexNonItalicFunctions || this.prev === cursor && (!this.prev.prev || this.prev.prev instanceof LatexBinaryOperator))
        this.jQ.removeClass('operator');
    else
        this.jQ.addClass('operator');
    return this;
};

function LatexSupSub(cmd, html)
{
  LatexCommand.apply(this, arguments);
  var that = this;
  this.jQ.change(function()
  {
    that.respace();
    if(that.next)
      that.next.respace();
    if(that.prev)
      that.prev.respace();
  });
}
LatexSupSub.prototype = new LatexSymbol;
LatexSupSub.prototype.respace = function()
{
  if(this.respaced = (this.prev && ((this.prev instanceof LatexSupSub && this.prev.cmd != this.cmd && !this.prev.respaced) || (this.prev.cmd == 'the_cursor' && this.prev.prev instanceof LatexSupSub && this.prev.prev.cmd != this.cmd && !this.prev.prev.respaced))))
    this.jQ.css({
      left: -this.prev.jQ.innerWidth(),
      marginRight: -Math.min(this.jQ.innerWidth(), this.prev.jQ.innerWidth())
    });
  else
    this.jQ.css({
      left: 0,
      marginRight: 0
    });
  return this;
};

// Happens when someone hits backslash \: accepts arbitrary-length LaTeX commands
function LatexCommandInput()
{
    LatexCommand.call(this);
    this.blocks[0].setEmpty = function()
    {
        if(this.isEmpty())
            this.jQ.html('&nbsp;&nbsp;').addClass('empty');
        return this;
    };
}
LatexCommandInput.prototype = new LatexCommand('a_latex_command_input',['<span class="latex-command-input">','</span>']);
LatexCommandInput.prototype.latex = function()
{
    return '\\' + this.jQ.text() + ' ';
};

function LatexSquareRoot()
{
    LatexCommand.call(this);
    this.blocks[0].change(function(){
        var block = this.jQ, height = block.height();
        block.css({
            borderTopWidth: height/30+1, // NOTE: Formula will need to be redetermined if we change our font from Times New Roman
        }).prev().css({
            fontSize: height,
            top: height/10+2,
            left: height/30+1,
        });
    });
}
LatexSquareRoot.prototype = new LatexCommand('\\sqrt ',['<span><span class="sqrt-prefix">&radic;</span><span class="sqrt-stem">','</span></span>']);

// Parens/Brackets/Braces etc
function LatexParens(open, close)
{
    LatexCommand.call(this,open,['<span><span class="open-paren">'+open+'</span><span>','</span><span class="close-paren">'+close+'</span></span>']);
    this.end = close;
    this.blocks[0].change(function(){
        var block = this.jQ, height = block.height();
        block.prev().add(block.next()).css('fontSize', block.height()).css('top',-height/15);
    });
}
LatexParens.prototype = new LatexSymbol('LatexParens.prototype');
LatexParens.prototype.latex = function() {
    return this.cmd + this.blocks[0].latex() + this.end;
};

/************************ CURSOR ****************************/
var cursor = new LatexSymbol('the_cursor','<span class="the-cursor"></span>');
cursor.latex = function(){ return ''; };
cursor.jQ.hide = function(){ return this.addClass('blink'); };
cursor.jQ.show = function(){ return this.removeClass('blink'); };
cursor.jQ.toggle = function(){ return this.toggleClass('blink'); };
cursor.detach = function()
{
    var p = this.parent;
    LatexCommand.prototype.detach.apply(this);
    p.setEmpty().jQ.removeClass('hasCursor');
    return this;
};
cursor.insertBefore = function(cmd)
{
    LatexSymbol.prototype.insertBefore.apply(this, arguments);
    this.parent.jQ.addClass('hasCursor');
    return this;
};
cursor.insertAfter = function(cmd)
{
    LatexSymbol.prototype.insertAfter.apply(this, arguments);
    this.parent.jQ.addClass('hasCursor');
    return this;
};
cursor.prependTo = function(block)
{
    block.removeEmpty();
    LatexSymbol.prototype.prependTo.apply(this,arguments);
    block.jQ.addClass('hasCursor');
    return this;
};
cursor.appendTo = function(block)
{
    block.removeEmpty();
    LatexSymbol.prototype.appendTo.apply(this,arguments);
    block.jQ.addClass('hasCursor');
    return this;
};
cursor.moveLeft = function()
{
    this.clearSelection();
    if(this.prev)
        if(this.prev.blocks.length)
            this.appendTo(this.prev.blocks[this.prev.blocks.length-1]);
        else
            this.insertBefore(this.prev);
    else
        if(this.parent.position > 0) // if not first child
            this.appendTo(this.parent.parent.blocks[this.parent.position-1]); // then append to prev
        else if(this.parent.parent)
            this.insertBefore(this.parent.parent);
    
    this.jQ.show();
    
    return this;
};
cursor.moveRight = function()
{
    this.clearSelection();
    if(this.next)
        if(this.next.blocks.length)
            this.prependTo(this.next.blocks[0]);
        else
            this.insertAfter(this.next);
    else if(this.parent.parent)
        if(this.parent.position < this.parent.parent.blocks.length - 1) // if not last child
            this.prependTo(this.parent.parent.blocks[this.parent.position+1]); // then prepend to next
        else
            this.insertAfter(this.parent.parent);
    
    this.jQ.show();
    
    return this;
};
cursor.renderCommand=function(inputCmd)
{
    latex = inputCmd.latex();
    this.insertAfter(inputCmd);
    inputCmd.remove();
    return this.newBefore(latex);
};
cursor.newBefore = function(cmd)
{
    this.deleteSelection();
    if(this.parent.parent instanceof LatexCommandInput && !/[a-z,:;!\{\}]/i.test(cmd))
    {
        this.renderCommand(this.parent.parent);
        if(/\s/.test(cmd))
            return;
    }
    
    cmd = chooseCommand(cmd).insertBefore(this);
    this.prev.respace();
    if(this.prev.prev)
        this.prev.prev.respace();
    if(this.next)
        this.next.respace();
    if(cmd.blocks.length)
        if(cmd.placeCursor)
            cmd.placeCursor(this);
        else
            this.prependTo(cmd.blocks[0]);
    
    this.jQ.show().change();
};
cursor.backspace = function()
{
    if(this.selection)
        this.deleteSelection();
    else if(this.prev && this.prev.isEmpty()) //it's a symbol, delete it.
        this.prev.remove();
    else if(!this.prev && this.parent.parent && this.parent.parent.isEmpty())
        this.insertBefore(this.parent.parent).next.remove();
    else
        this.selectLeft();
    
    this.jQ.show().change();
    if(this.prev)
        this.prev.respace();
    if(this.next)
        this.next.respace();
    
    return this;
};
cursor.deleteForward = function()
{
    if(this.selection)
        this.deleteSelection();
    else if(this.next && this.next.isEmpty()) //it's a symbol!
        this.next.remove();
    else if(!this.next && this.parent.parent && this.parent.parent.isEmpty())
        this.insertBefore(this.parent.parent).next.remove();
    else
        this.selectRight();
    
    this.jQ.show().change();
    if(this.prev)
        this.prev.respace();
    if(this.next)
        this.next.respace();
    
    return this;
}
cursor.selectLeft = function(){
    if(this.selection)
    {
        if(this.next == this.selection.start) //it's a left-oriented selection.
        {
            this.selection.extendLeft();
            this.insertBefore(this.selection.start);
        }
        else 
        {
            if(this.selection.start == this.selection.end)
            {
                this.insertBefore(this.selection.start);
                this.clearSelection();
            }
            else
            {
                this.selection.retractRight();
                this.insertAfter(this.selection.end);
            }
        }
    }
    else    //create a new selection
    {
        if(this.prev)
        {
            this.insertBefore(this.prev);
            this.selection = new Selection(this.parent, this.next, this.next);
        }
        else
        {
            if(!this.parent.parent) //rootblock
                return this;
            
            //select the parent.parent command.
            this.insertBefore(this.parent.parent);
            this.selection = new Selection(this.parent, this.next, this.next);
        }
    }
    return this;
};
cursor.selectRight = function()
{
    if(this.selection)
    {
        if(this.prev == this.selection.end) //right-oriented selection.
        {
            this.selection.extendRight();
            this.insertAfter(this.selection.end);
        }
        else
        {
            if(this.selection.start == this.selection.end)
            {
                this.insertAfter(this.selection.end);
                this.clearSelection();
            }
            else
            {
                this.selection.retractLeft();
                this.insertBefore(this.selection.start);
            }
            
        }
    }
    else
    {
        if(this.next)
        {
            this.insertAfter(this.next);
            this.selection = new Selection(this.parent, this.prev, this.prev);
        }
        else
        {
            if(!this.parent.parent) //rootblock
                return this;
            
            this.insertAfter(this.parent.parent);
            this.selection = new Selection(this.parent, this.prev, this.prev);
        }
    }
}
cursor.clearSelection = function()
{
    if(!this.selection)
        return this;
    this.selection.start.jQ.unwrap();
    delete this.selection;
    return this;
}
cursor.deleteSelection = function()
{
    if(!this.selection)
        return this;
    this.insertBefore(this.selection.start);
    this.jQ.insertBefore(this.selection.jQ);
    this.selection.remove();
    delete this.selection;
}

function chooseCommand(cmd)
{
    if(cmd.length==1)
    {
        if(cmd.match(/[0-9]/)) //numeric
            return new LatexVanillaSymbol(cmd);
        if(cmd.match(/[a-z]/i)) //variable
            return new LatexVar(cmd);
    }
    //now look for the "real" commands
    
    //trig
    if(/^\\(a|arc)?(sin|cos|tan|cot|sec|csc)h? $/.test(cmd))
        return new LatexNonItalicFunctions(cmd, cmd.slice(1,-1));
    
    //text
    if(/^\\text\{.*\} $/.test(cmd))
        return new LatexVanillaSymbol(cmd, cmd.slice(6,-2));
    
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
            return new LatexSupSub('_', ['<sub>', '</sub>']);
        case '^':
            return new LatexSupSub('^', ['<sup>', '</sup>']);

        //complicated commands
        case '/':
        case '\\frac ':
            var frac = new LatexCommand('\\frac',
                [
                    '<span class="fraction"><span class="numerator">',
                    '</span><span class="denominator">',
                    '</span>'
                ]
            );
            /*frac.blocks[1].change(function(){
                this.parent.jQ.css('verticalAlign',-this.jQ.outerHeight()/2);
            });*/
            if(cmd == '/')
            {
                if(cursor.prev && !(cursor.prev instanceof LatexBinaryOperator || cursor.prev instanceof LatexNonItalicFunctions))
                {
                    frac.blocks[0].removeEmpty();
                    var prev = cursor.prev;
                    while(prev && !(prev instanceof LatexBinaryOperator || prev instanceof LatexNonItalicFunctions))
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
            var cases = new LatexCommand('\\cases ',
                [
                    '<table style="display:inline-block"><tr><td>',
                    '</td></tr></table>',
                ]
            );
            return cases;*/
        
        //symbols that aren't the same HTML character entity reference as they are LaTeX commands
        case '\\not ':
            //return new LatexSymbol('\\not ','<span class="not">/</span>');
        case '\\neg ':
            return new LatexVanillaSymbol('\\neg ','&not;');
        case '\\quad ':
        case '\\emsp ':
            return new LatexVanillaSymbol('\\quad ','&nbsp;&nbsp;&nbsp;&nbsp;');
        case '\\qquad ':
            return new LatexVanillaSymbol('\\qquad ','&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        case '\\, ':
            return new LatexVanillaSymbol('\\, ','&nbsp;');
        case '\\: ':
            return new LatexVanillaSymbol('\\: ','&nbsp;&nbsp;');
        case '\\; ':
            return new LatexVanillaSymbol('\\; ','&nbsp;&nbsp;&nbsp;');
        case '\\! ':
            return new LatexSymbol('\\! ','<span style="margin-right:-.2em"></span>');
        case '\\dots ':
        case '\\ellip ':
        case '\\hellip ':
        case '\\ellipsis ':
        case '\\hellipsis ':
            return new LatexVanillaSymbol('\\dots ','&hellip;');
        case '\\converges ':
        case '\\darr ':
        case '\\dnarr ':
        case '\\dnarrow ':
        case '\\downarrow ':
            return new LatexVanillaSymbol('\\downarrow ','&darr;');
        case '\\dArr ':
        case '\\dnArr ':
        case '\\dnArrow ':
        case '\\Downarrow ':
            return new LatexVanillaSymbol('\\Downarrow ','&dArr;');
        case '\\diverges ':
        case '\\uarr ':
        case '\\uparrow ':
            return new LatexVanillaSymbol('\\uparrow ','&uarr;');
        case '\\uArr ':
        case '\\Uparrow ':
            return new LatexVanillaSymbol('\\Uparrow ','&uArr;');
        case '\\to ':
            return new LatexBinaryOperator('\\to ','&rarr;');
        case '\\rarr ':
        case '\\rightarrow ':
            return new LatexVanillaSymbol('\\rightarrow ','&rarr;');
        case '\\implies ':
            return new LatexBinaryOperator('\\Rightarrow ','&rArr;');
        case '\\rArr ':
        case '\\Rightarrow ':
            return new LatexVanillaSymbol('\\Rightarrow ','&rArr;');
        case '\\gets ':
            return new LatexBinaryOperator('\\gets ','&larr;');
        case '\\larr ':
        case '\\leftarrow':
            return new LatexVanillaSymbol('\\leftarrow ','&larr;');
        case '\\impliedby ':
            return new LatexBinaryOperator('\\Leftarrow ','&lArr;');
        case '\\lArr ':
        case '\\Leftarrow ':
            return new LatexVanillaSymbol('\\Leftarrow ','&lArr;');
        case '\\harr ':
        case '\\lrarr ':
        case '\\leftrightarrow ':
            return new LatexVanillaSymbol('\\leftrightarrow ','&harr;');
        case '\\iff ':
            return new LatexBinaryOperator('\\Leftrightarrow ','&hArr;');
        case '\\hArr ':
        case '\\lrArr ':
        case '\Leftrightarrow ':
            return new LatexVanillaSymbol('\\Leftrightarrow ','&hArr;');
        case '\\Re ':
        case '\\Real ':
        case '\\real ':
            return new LatexVanillaSymbol('\\Re ','&real;');
        case '\\Im ':
        case '\\imag ':
        case '\\image ':
        case '\\imagin ':
        case '\\imaginary ':
        case '\\Imaginary ':
            return new LatexVanillaSymbol('\\Im ','&image;');
        case '\\part ':
        case '\\partial ':
            return new LatexVanillaSymbol('\\partial ','&part;');
        case '\\inf ':
        case '\\infin ':
        case '\\infty ':
        case '\\infinity ':
            return new LatexVanillaSymbol('\\infty ','&infin;');
        case '\\alef ':
        case '\\alefsym ':
        case '\\aleph ':
        case '\\alephsym ':
            return new LatexVanillaSymbol('\\aleph ','&alefsym;');
        case '\\xist ':
        case '\\xists ': //LOL
        case '\\exist ':
        case '\\exists ':
            return new LatexVanillaSymbol('\\exists ','&exist;');
        case '\\and ':
        case '\\land ':
        case '\\wedge ':
            return new LatexVanillaSymbol('\\wedge ','&and;');
        case '\\or ':
        case '\\lor ':
        case '\\vee ':
            return new LatexVanillaSymbol('\\vee ','&or;');
        case '\\o ':
        case '\\O ':
        case '\\empty ':
        case '\\emptyset ':
        case '\\nothing ':
        case '\\varnothing ':
            return new LatexBinaryOperator('\\O ','&empty;');
        case '\\union ':
            return new LatexVanillaSymbol('\\cup ','&cup;');
        case '\\intersect ':
        case '\\intersection ':
            return new LatexVanillaSymbol('\\cap ','&cap;');
        case '\\deg ':
        case '\\degree ':
            return new LatexVanillaSymbol('^{\\circ}','&deg;');
        
        case '\'' :
        case '\\prime ':
            return new LatexVanillaSymbol('\'','&prime;');
        case '*':
        case '\\sdot ':
        case '\\cdot ':
            return new LatexVanillaSymbol('\\cdot ', '&sdot;');
        
        //Binary Operators
        case '=':
            return new LatexBinaryOperator(cmd, cmd);
        case '+':
            return new LatexPlusMinus('+','+');
        case '-':
            return new LatexPlusMinus('-','&minus;');
        case '\\pm ':
        case '\\plusmn ':
        case '\\plusminus ':
            return new LatexPlusMinus('\\pm ','&plusmn;');
        case '\\mp ':
        case '\\mnplus ':
        case '\\minusplus ':
            return new LatexPlusMinus('\\mp ','&#8723;');
        case '\\div ':
        case '\\divide ':
        case '\\divides ':
            return new LatexBinaryOperator('\\div ','&divide;');
        case '\\ne ':
        case '\\neq ':
            return new LatexBinaryOperator(cmd,'&ne;');
        case '\\ast ':
        case '\\loast ':
        case '\\lowast ':
            return new LatexBinaryOperator('\\ast ','&lowast;');
        //case '\\there4 ': // a special exception for this one, perhaps?
        case '\\therefor ':
        case '\\therefore ':
            return new LatexBinaryOperator('\\therefore ','&there4;');
        case '\\cuz ': // l33t
        case '\\because ':
            return new LatexBinaryOperator('\\because ','&#8757;');
        case '\\prop ':
        case '\\propto ':
            return new LatexBinaryOperator('\\propto ','&prop;');
        case '\\asymp ':
        case '\\approx ':
            return new LatexBinaryOperator('\\approx ','&asymp;');
        case '<':
        case '\\lt ':
            return new LatexBinaryOperator('<','&lt;');
        case '>':
        case '\\gt ':
            return new LatexBinaryOperator('<','&gt;');
        case '\\le ':
        case '\\leq ':
            return new LatexBinaryOperator(cmd,'&le;');
        case '\\ge ':
        case '\\geq ':
            return new LatexBinaryOperator(cmd,'&ge;');
        case '\\sub ':
        case '\\subset ':
            return new LatexBinaryOperator('\\subset ','&sub;');
        case '\\nsub ':
        case '\\notsub ':
        case '\\nsubset ':
        case '\\notsubset ':
            return new LatexBinaryOperator('\\not\\subset ','&#8836;');
        case '\\sup ':
        case '\\supset ':
        case '\\superset ':
            return new LatexBinaryOperator('\\supset ','&sup;');
        case '\\nsup ':
        case '\\notsup ':
        case '\\nsupset ':
        case '\\notsupset ':
        case '\\nsuperset ':
        case '\\notsuperset ':
            return new LatexBinaryOperator('\\not\\supset ','&#8837;');
        case '\\sube ':
        case '\\subeq ':
        case '\\subsete ':
        case '\\subseteq ':
            return new LatexBinaryOperator('\\subseteq ','&sube;');
        case '\\nsube ':
        case '\\nsubeq ':
        case '\\notsube ':
        case '\\notsubeq ':
        case '\\nsubsete ':
        case '\\nsubseteq ':
        case '\\notsubsete ':
        case '\\notsubseteq ':
            return new LatexBinaryOperator('\\not\\subseteq ','&#8840;');
        case '\\supe ':
        case '\\supeq ':
        case '\\supsete ':
        case '\\supseteq ':
            return new LatexBinaryOperator('\\supseteq ','&supe;');
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
            return new LatexBinaryOperator('\\not\\supseteq ','&#8841;');
        case '\\in ':
            return new LatexBinaryOperator('\\in ','&isin;');
        case '\\ni ':
        case '\\contains ':
            return new LatexBinaryOperator('\\ni ','&ni;');
        case '\\notni ':
        case '\\niton ':
        case '\\notcontains ':
        case '\\doesnotcontain ':
            return new LatexBinaryOperator('\\not\\ni ','&#8716;');
        case '\\notin ':
        case '\\sim ':
        case '\\equiv ':
        case '\\times ':
            return new LatexBinaryOperator(cmd,'&'+cmd.slice(1,-1)+';');
        
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
            return new LatexNonItalicFunctions(cmd, cmd.slice(1,-1));
        case '\\sum ':
        case '\\prod ':
            return new LatexNonItalicFunctions(cmd, '&'+cmd.slice(1,-1)+';');
        case '\\coprod ':
            return new LatexNonItalicFunctions('\\coprod ','&#8720;');
        
        case '\\sqrt ':
            return new LatexSquareRoot();
        
        //parens
        case '(':
            return new LatexParens('(',')');
        case '[':
            return new LatexParens('[',']');
        case '{':
            return new LatexParens('{','}');
        case '|':
            return new LatexParens('|','|');
        
        default:
            if(cmd.charAt(0) == '\\')
                return new LatexVanillaSymbol(cmd,'&'+cmd.slice(1,-1)+';');
            else
                return new LatexVanillaSymbol(cmd);
    }
}

LatexRoot.cursor = cursor;
return LatexRoot;

})();
