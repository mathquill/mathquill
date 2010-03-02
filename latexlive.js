/*
 * LaTeX Math in pure HTML and CSS -- No images whatsoever
 * by Jay and Han
 * Lesser GPL Licensed: http://www.gnu.org/licenses/lgpl.html
 * 
 * Usage:
 * [optional new] LatexRoot({element you want to insert LaTeX Math after});
 * 
 * Requires jQuery 1.4+
 *
 */

$('head').append('<link rel="stylesheet" type="text/css" href="http://latexlive.googlecode.com/files/latexlive.css">');
 
var LatexRoot = (function(){

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
            this.empty().removeEmpty();
            
            if(typeof latex == 'string')
                latex = latex.match(/\{|\}|\\[a-z]+|./ig);
            
            while(latex.length)
            {
                chooseCommand(latex.shift()).eachChild(function()
                {
                    var blocksrc = latex.shift();
                    if(/^\{.*\}$/.test(blocksrc))
                        blocksrc = blocksrc.slice(1,-1); //slice off '{' and '}'
                    this.latex(blocksrc);
                }).appendTo(this);
            }
            return this;
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
        this.eachChild(function(){
            this.remove();
        });
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
    
    //make the cursor blink
    
    var intervalId;
    var keydnTriggered = false;
    var root = this;
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
            cursor.prependTo(root);
        cursor.parent.jQ.addClass('hasCursor');
    }).blur(function(e){
        clearInterval(intervalId);
        cursor.jQ.hide();
        cursor.parent.setEmpty().jQ.removeClass('hasCursor');
        if(root.isEmpty())
            cursor.detach();
        $(this).removeClass('hasCursor');
    }).keydown(function(e)
    {
        keydnTriggered = true;
        if(cursor.parent)
        {
            switch(e.which)
            {
                case 35: //end
                    if(e.metaKey) //move to the end of the root block.
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
                    if(e.metaKey) //move to the start of the root block.
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
                    e.preventDefault();
                    if(e.metaKey)
                        while(cursor.prev)
                            cursor.backspace();
                    else
                        cursor.backspace();
                    return false;
                case 46: //delete
                    e.preventDefault();
                    if(e.metaKey)
                        while(cursor.next)
                            cursor.deleteForward();
                    else
                        cursor.deleteForward();
                    return false;
                case 9: //tab
                    e.preventDefault();
                    if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
                    {
                        if(cursor.parent.parent === null) //cursor is in the root block.
                            cursor.prependTo(cursor.parent); //move it to the beginning.
                        else if(cursor.parent.position == 0) //escape
                            cursor.insertBefore(cursor.parent.parent);
                        else //move one block left
                            cursor.appendTo(cursor.parent.parent.blocks[cursor.parent.position-1]);
                    }
                    else //plain Tab = go one block right if it exists, else 
                    {
                        if(!cursor.parent.parent) //cursor is in the root block.
                            cursor.appendTo(cursor.parent); //move it to the end.
                        else if(cursor.parent.parent.constructor == LatexCommandInput)
                            cursor.renderCommand(cursor.parent.parent);
                        else if(cursor.parent.position == cursor.parent.parent.blocks.length - 1) //escape
                            cursor.insertAfter(cursor.parent.parent);
                        else //move one block right
                            cursor.prependTo(cursor.parent.parent.blocks[cursor.parent.position+1]);
                    }
                    return false;
                default:
                    //do nothing, pass to keypress.
                    keydnTriggered = false;
            }
        }
    }).keypress(function(e)
    {
        if(!keydnTriggered && cursor.parent)
        {
            if(e.metaKey)
                return; //don't capture Ctrl+anything.
            switch(e.which)
            {
                //eventually there'll be more cases...
                
                default:
                    var cmd = String.fromCharCode(e.which);
                    if(cmd)
                    {
                        e.preventDefault();
                        cursor.newBefore(cmd);
                    }
            }
        }
        else
            keydnTriggered = false;
        return false;
    }).focus();
    
    return this;
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
        if(this.end && this.end.next)
            this.end.next.prev = this.start && this.start.prev;
        
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
    }
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

function LatexBinaryOperator(cmd, html)
{
    LatexSymbol.call(this, cmd, '<span class="operator">'+html+'</span>');
}
LatexBinaryOperator.prototype = LatexCommand.prototype;

// Happens when someone hits backslash \: accepts arbitrary-length LaTeX commands
function LatexCommandInput()
{
    LatexCommand.call(this);
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
function LatexBraces(open, close)
{
    LatexCommand.call(this,open,['<span><span class="open-paren">'+open+'</span><span>','</span><span class="close-paren">'+close+'</span></span>']);
    this.opposite = close;
    this.blocks[0].change(function(){
        var block = this.jQ;
        block.prev().add(block.next()).css('fontSize', block.height());
    });
}
LatexBraces.prototype = new LatexSymbol('LatexBraces.prototype');
LatexBraces.prototype.latex = function() {
    return this.cmd + this.blocks[0].latex() + this.opposite;
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
    this.newBefore(latex);
};
cursor.newBefore = function(cmd)
{
    if(this.parent.parent instanceof LatexCommandInput && !/[a-z]/i.test(cmd))
    {
        this.renderCommand(this.parent.parent);
        if(/\s/.test(cmd))
        {
            this.jQ.show().change();
            return;
        }
    }
    
    cmd = chooseCommand(cmd).insertBefore(this);
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
            if(!this.parent) //rootblock
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
            if(!this.parent) //rootblock
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
    
    if(/^\\(a|arc)?(sin|cos|tan|cot|sec|csc)h? $/.test(cmd))
        return new LatexVanillaSymbol(cmd, cmd.slice(1,-1));
    
    //now look for the "real" commands
    if(cmd.length > 1 && cmd.charAt(0)=='\\' && cmd.slice(-1)!=' ')
        cmd+=' ';
    switch(cmd)
    {
        case '\\':
            //it's an input thingy!
            var command = new LatexCommandInput();
            return command;
        case '_':
            return new LatexCommand('_', ['<sub>', '</sub>']);
        case '^':
            return new LatexCommand('^', ['<sup>', '</sup>']);

        //these commands are sort of complicated.  We have to overload html()...maybe.
        case '/': //falls through.  this is how to set an alias.
        case '\\frac ':
            var frac = new LatexCommand('\\frac',
                [
                    '<span class="fraction"><span class="numerator">',
                    '</span><span class="denominator">',
                    '</span>', //will still be length 3 despite comma
                ]
            );
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
        
        //symbols that aren't the same HTML character entity reference as they are LaTeX commands
        case '\\neg ':
            return new LatexVanillaSymbol('\\neg ','&not;');
        case '\\Re ':
        case '\\Real ':
        case '\\real ':
            return new LatexVanillaSymbol('\\Re ','&real;');
        case '\\Im ':
        case '\\Image ':
        case '\\Imaginary ':
        case '\\imaginary ':
            return new LatexVanillaSymbol('\\Im ','&image;');
        case '\\part ':
        case '\\partial ':
            return new LatexVanillaSymbol('\\partial ','&part;');
        case '\\infty ':
            return new LatexVanillaSymbol('\\infty ','&infin;');
        case '\\alef ':
            return new LatexVanillaSymbol('\\alef ','&alefsym;');
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
        case '\\cup ':
        case '\\union ':
            return new LatexVanillaSymbol('\\cup ','&cup;');
        case '\\cap ':
        case '\\intersect ':
        case '\\intersection ':
            return new LatexVanillaSymbol('\\cap ','&cap;');
        
        case '*':
        case '\\cdot ':
            return new LatexVanillaSymbol('\\cdot ', '&sdot;');
        
        //Binary Operators
        case '|':
        case '=':
        case '%':
        case '+':
            return new LatexBinaryOperator(cmd, cmd);
        case '-':
            return new LatexBinaryOperator('-','&minus;');
        case '\\ne ':
        case '\\neq ':
            return new LatexBinaryOperator(cmd,'&ne;');
        case '\\ast ':
            return new LatexBinaryOperator('\\ast ','&lowast;');
        //case '\\there4 ': a special exception for this one, perhaps? lol
        case '\\therefore ':
            return new LatexBinaryOperator('\\therefore ','&there4;');
        case '\\pm ':
        case '\\plusmn ':
        case '\\plusminus ':
            return new LatexBinaryOperator('\\pm ','&plusmn;');
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
        case '\\sup ':
        case '\\supset ':
            return new LatexBinaryOperator('\\supset ','&sup;');
        case '\\sube ':
        case '\\subeq ':
        case '\\subsete ':
        case '\\subseteq ':
            return new LatexBinaryOperator('\\subseteq ','&sube;');
        case '\\supe ':
        case '\\supeq ':
        case '\\supsete ':
        case '\\supseteq ':
            return new LatexBinaryOperator('\\supseteq ','&supe;');
        case '\\in ':
            return new LatexBinaryOperator('\\in ','&isin;');
        case '\\notin ':
        case '\\ni ':
        case '\\sim ':
        case '\\equiv ':
            return new LatexBinaryOperator(cmd,'&'+cmd.slice(1,-1)+';');
        
        //non-italicized functions
        case '\\ln ':
        case '\\lg':
        case '\\log ':
        case '\\span ':
        case '\\proj ':
        case '\\det ':
        case '\\dim ':
        case '\\deg ':
        case '\\min ':
        case '\\max ':
        case '\\mod ':
        case '\\lcm ':
        case '\\gcd ':
        case '\\lim ':
            return new LatexVanillaSymbol(cmd, cmd.slice(1,-1));
        
        case '\\sqrt ':
            return new LatexSquareRoot();
        
        //parens
        case '(':
            return new LatexBraces('(',')');
        case '[':
            return new LatexBraces('[',']');
        
        default:
            if(cmd.charAt(0) == '\\')
                return new LatexSymbol(cmd,'<i>&'+cmd.slice(1,-1)+';</i>');
            else
                return new LatexVanillaSymbol(cmd);
    }
}

LatexRoot.cursor = cursor;
return LatexRoot;

})();
