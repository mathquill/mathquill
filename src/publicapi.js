/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

/**
 * Publicly exported objects that expose the API to manipulate
 * MathQuill editable and static math and text fields.
 */
var MathQuillEl = P(function(_) {
  _.init = function(rootBlock) { this.rootBlock = rootBlock; };
  _.revert = function() { return this.rootBlock.revert(); };
  _.jQ = function() { return this.rootBlock.jQ; };

  _.redraw = function() {
    (function postOrderRedraw(el) {
      el.eachChild(postOrderRedraw);
      if (el.redraw) el.redraw();
    }(this.rootBlock));
    return this;
  };

  _.text = function() { return this.rootBlock.text(); };
  _.html = function() { return this.rootBlock.join('html'); };

  _.latex = function(latex) {
    if (arguments.length === 0) return this.rootBlock.latex();

    this.rootBlock.renderLatex(latex);
    return this;
  };
  _.write = function(latex) {
    this.rootBlock.cursor.writeLatex(latex).parent.blur();
    return this;
  };
  _.cmd = function(latex) {
    var cursor = this.rootBlock.cursor.show();
    if (/^\\[a-z]+$/i.test(latex)) {
      if (cursor.selection) {
        //gotta do cursor before cursor.selection is mutated by 'new cmd(cursor.selection)'
        cursor.prev = cursor.selection.prev;
        cursor.next = cursor.selection.next;
      }
      cursor.insertCmd(latex.slice(1), cursor.selection);
      delete cursor.selection;
    }
    else
      cursor.insertCh(latex);
    cursor.hide().parent.blur();
    return this;
  };
});

/**
 * Global function to test if an HTML element has been MathQuill-ified, and
 * get the MathQuill object for it if it has.
 *
 * Globally exported function that will take anything you can pass to jQuery
 * (selector, DOM element, etc) that resolves to a root HTML element of a
 * MathQuill editable or static math or text field, and returns the
 * MathQuillEl instance corresponding to it, or null if it is not a MathQuill
 * thing editable or static math or text field.
 *
 * Guarantees identity of returned object if called multiple separate times on
 * the same MathQuill thing, i.e.,
 *   var mathfield = MathQuill.MathField('#mathfield');
 *   assert(MathQuill('#mathfield') === mathfield);
 *   assert(MathQuill('#mathfield') === MathQuill('#mathfield'));
 *
 * If jQuery doesn't resolve the argument to a single HTML element, an
 * exception will be thrown.
 */
function MathQuill(el, dotName) {
  el = $(el);
  if (el.length !== 1) throw 'MathQuill'+(dotName || '')+'() must be passed a\
single element, got to '+el.length+' elements instead';

  var blockId = $(el).attr(mqBlockId);
  if (!blockId) return null;

  var rootBlock = Node.byId[blockId];
  return !!rootBlock && rootBlock.jQ[0] === el[0] && rootBlock.publicMathQuillObj;
}
MathQuill.prototype = MathQuillEl.prototype; // for instanceof

// TODO: make this + createRoot() suck less
function setMathQuillDot(name, RootBlock, textbox, editable) {
  var SubClass = P(MathQuillEl, { type: name });
  MathQuill[name] = function(el) {
    var mq = MathQuill(el, '.'+name);
    if (mq instanceof SubClass) return mq;
    if (mq) throw 'MathQuill.'+name+'() was passed a MathQuill.'+mq.type;

    var rootBlock = RootBlock();
    createRoot($(el), rootBlock, textbox, editable);
    return rootBlock.publicMathQuillObj = SubClass(rootBlock);
  };
  MathQuill[name].prototype = SubClass.prototype; // for instanceof
}
setMathQuillDot('MathField', RootMathBlock, false, true);
setMathQuillDot('TextField', RootTextBlock, true, true);
setMathQuillDot('StaticMath', RootMathBlock, false, false);

// export as global variable and add .noConflict() method like jQuery
var window_MathQuill = window.MathQuill;
window.MathQuill = MathQuill;
MathQuill.noConflict = function() {
  window.MathQuill = window_MathQuill;
  return MathQuill;
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function() {
  $('.mathquill-static-math').each(function() { MathQuill.StaticMath(this); });
  $('.mathquill-math-field').each(function() { MathQuill.MathField(this); });
  $('.mathquill-text-field').each(function() { MathQuill.TextField(this); });

  // Deprecated:
  $('.mathquill-embedded-latex').each(function() { MathQuill.StaticMath(this); });
  $('.mathquill-editable').each(function() { MathQuill.MathField(this); });
  $('.mathquill-textbox').each(function() { MathQuill.TextField(this); });
});

