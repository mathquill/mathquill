/**
 * Back-end code: Core abstract classes and architecture.
 */

var $ = jQuery, noop = function(){ return this; }, todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };

/**
 * MathElement is the core Math DOM tree node prototype.
 * Both MathBlock's and MathCommand's descend from it.
 */
function MathElement(){}
MathElement.prototype = { 
  prev: null,
  next: null,
  parent: null,
  firstChild: null,
  lastChild: null,
  eachChild: function(fn)
  {
    for(var child = this.firstChild; child !== null; child = child.next)
      if(fn.call(child) === false)
        break;
    return this;
  },
  reduceChildren: function(fn, initVal)
  {
    this.eachChild(function(){
      initVal = fn.call(this, initVal);
    });
    return initVal;
  },
};

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * May contain descendant commands, organized into blocks.
 */
function MathCommand(cmd, num_blocks, html_template)
{ 
  if(!arguments.length)
    return;
  
  this.cmd = cmd;
  this.num_blocks = num_blocks;
  this.html_template = html_template;
  this.jQinit();
  this.initBlocks();
}
MathCommand.prototype = $.extend(new MathElement, {
  jQinit: function()
  {
    return this.jQ = $(this.html_template).data('latexlive', {cmd: this});
  },
  initBlocks: function()
  {
    var newBlock, prev = null, children = this.jQ.children();
    for(var i = 0; i < this.num_blocks; i += 1)
    {
      newBlock = new MathBlock;
      newBlock.jQ = $(children[i]).data('latexlive', {block: newBlock}); /*** optimize me! ***/
      newBlock.parent = this;
      newBlock.prev = prev;
      if(prev)
        prev.next = newBlock;
      else
        this.firstChild = newBlock;
      prev = newBlock;
    }
    this.lastChild = newBlock;
  },
  latex: function()
  {
    return this.cmd + this.reduceChildren(function(initVal){
      return initVal + '{' + this.latex() + '}';
    }, '');
  },
  remove: function()
  {
    if(this.prev)
      this.prev.next = this.next;
    else
      this.parent.firstChild = this.next;
    
    if(this.next)
      this.next.prev = this.prev;
    else
      this.parent.lastChild = this.prev;
    
    this.jQ.remove();
    
    return this;
  },
  //placeholder for context-sensitive spacing.
  respace: noop,
  placeCursor: function(cursor)
  {
    cursor.prependTo(this.firstChild);
    return this;
  },
  isEmpty: function()
  {
    return this.reduceChildren(function(initVal){
      return initVal && this.isEmpty();
    }, true);
  },
});

/**
 * Lightweight command without blocks or children.
 */
function Symbol(cmd, html)
{
  MathCommand.call(this, cmd, 0, html);
}
Symbol.prototype = $.extend(new MathCommand, {
  initBlocks: noop,
  latex: function()
  {
    return this.cmd;
  },
  placeCursor: noop,
  isEmpty: function(){ return true; },
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
function MathBlock(){}
MathBlock.prototype = $.extend(new MathElement, { 
  latex: function()
  {
    return this.reduceChildren(function(initVal){
      return initVal + this.latex();
    }, '');
  },
  isEmpty: function()
  {
    return this.firstChild === null && this.lastChild === null;
  },
});

/**
 * An entity outside the Math DOM tree with one-way pointers (so it's only
 * a "view" of part of the tree, not an actual node/entity in the tree)
 * that delimit a list of symbols and operators.
 */
function MathFragment(parent, prev, next, highlight)
{
  if(!arguments.length)
    return;

  this.parent = parent;
  this.prev = prev;
  this.next = next;

  this.jQinit(this.reduce(function(initVal){ return initVal.add(this.jQ); }, $()));
}
MathFragment.prototype = {
  remove: MathCommand.prototype.remove,
  jQinit: function(children)
  {
    return this.jQ = children.wrapAll('<span></span>').parent();
      //wrapAll clones, so can't do .wrapAll(this.jQ = $(...));
  },
  each: function(fn)
  {
    for(var el = (this.prev ? this.prev.next : this.parent.firstChild); el !== this.next; el = el.next)
      fn.call(el);
    return this;
  },
  reduce: function(fn, initVal)
  {
    this.each(function()
    {
      initVal = fn.call(this, initVal);
    });
    return initVal;
  },
  levelUp: function()
  {
    this.jQ.children().unwrap();
    this.jQinit(this.parent.parent.jQ);

    this.prev = this.parent.parent.prev;
    this.next = this.parent.parent.next;
    this.parent = this.parent.parent.parent;

    return this;
  },
};
