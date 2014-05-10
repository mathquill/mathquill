/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

/**
 * Global function that takes an HTML element and, if it's the root HTML element
 * of a static math or math or text field, returns its API object (if not, null).
 * Identity of API object guaranteed if called multiple times, i.e.:
 *
 *   var mathfield = MathQuill.MathField(mathFieldSpan);
 *   assert(MathQuill(mathFieldSpan) === mathfield);
 *   assert(MathQuill(mathFieldSpan) === MathQuill(mathFieldSpan));
 *
 */
function MathQuill(el) {
  if (!el || !el.nodeType) return null; // check that `el` is a HTML element, using the
    // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
  var blockId = $(el).children('.mq-root-block').attr(mqBlockId);
  return blockId ? Node.byId[blockId].controller.API : null;
};

MathQuill.noConflict = function() {
  window.MathQuill = origMathQuill;
  return MathQuill;
};
var origMathQuill = window.MathQuill;
window.MathQuill = MathQuill;

/**
 * Publicly export functions that MathQuill-ify an HTML element and return an
 * API object. If it had already been MathQuill-ified into the same kind, return
 * the original API object (if different or not an HTML element, null).
 *
 * Always returns either an instance of itself, or null.
 */
function setMathQuillDot(name, API) {
  MathQuill[name] = function(el, opts) {
    var mq = MathQuill(el);
    if (mq instanceof API || !el || !el.nodeType) return mq;
    return API($(el), opts);
  };
  MathQuill[name].prototype = API.prototype;
}

var AbstractMathQuill = P(function(_) {
  _.init = function() { throw "wtf don't call me, I'm 'abstract'"; };
  _.initRoot = function(root, el, opts) {
    root.jQ = $('<span class="mq-root-block"/>').attr(mqBlockId, root.id)
      .appendTo(el);
    var ctrlr = this.controller = root.controller = Controller(root, el, opts);
    ctrlr.API = this;
    root.cursor = ctrlr.cursor; // TODO: stop depending on root.cursor, and rm it
    ctrlr.createTextarea();
  };
  _.initExtractContents = function(el) {
    var contents = el.contents().detach();
    this.revert = function() {
      return el.empty().unbind('.mathquill')
      .removeClass('mq-editable-field mq-math-mode mq-text-mode')
      .append(contents);
    };
    return contents.text();
  };
  _.el = function() { return this.controller.container[0]; };
  _.text = function() { return this.controller.exportText(); };
  _.latex = function(latex) {
    if (arguments.length > 0) {
      this.controller.renderLatexMath(latex);
      if (this.controller.blurred) this.controller.cursor.hide().parent.blur();
      return this;
    }
    return this.controller.exportLatex();
  };
  _.html = function() {
    return this.controller.root.jQ.html()
      .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
      .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
      .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
      .replace(/ class=(""|(?= |>))/g, '');
  };
  _.redraw = function() {
    this.controller.root.postOrder('edited');
    return this;
  };
});
MathQuill.prototype = AbstractMathQuill.prototype;

setMathQuillDot('StaticMath', P(AbstractMathQuill, function(_) {
  _.init = function(el) {
    var contents = this.initExtractContents(el);
    this.initRoot(MathBlock(), el.addClass('mq-math-mode'));
    this.controller.renderLatexMath(contents);
    this.controller.delegateMouseEvents();
    this.controller.staticMathTextareaEvents();
  };
}));

var EditableField = MathQuill.EditableField = P(AbstractMathQuill, function(_) {
  _.initEvents = function() {
    this.controller.editable = true;
    this.controller.delegateMouseEvents();
    this.controller.editablesTextareaEvents();
  };
  _.focus = function() { this.controller.textarea.focus(); return this; };
  _.blur = function() { this.controller.textarea.blur(); return this; };
  _.write = function(latex) {
    this.controller.writeLatex(latex);
    if (this.controller.blurred) this.controller.cursor.hide().parent.blur();
    return this;
  };
  _.cmd = function(cmd) {
    var ctrlr = this.controller.notify(), cursor = ctrlr.cursor.show(),
      seln = cursor.replaceSelection();
    if (/^\\[a-z]+$/i.test(cmd)) cursor.insertCmd(cmd.slice(1), seln);
    else cursor.parent.write(cursor, cmd, seln);
    if (ctrlr.blurred) cursor.hide().parent.blur();
    return this;
  };
  _.select = function() {
    var ctrlr = this.controller;
    ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
    while (ctrlr.cursor[L]) ctrlr.selectLeft();
    return this;
  };
  _.clearSelection = function() {
    this.controller.cursor.clearSelection();
    return this;
  };

  _.moveToDirEnd = function(dir) {
    this.controller.notify('move').cursor.insAtDirEnd(dir, this.controller.root);
    return this;
  };
  _.moveToLeftEnd = function() { return this.moveToDirEnd(L); };
  _.moveToRightEnd = function() { return this.moveToDirEnd(R); };

  _.keystroke = function(keys) {
    var keys = keys.replace(/^\s+|\s+$/g, '').split(/\s+/);
    for (var i = 0; i < keys.length; i += 1) {
      this.controller.keystroke(keys[i], { preventDefault: noop });
    }
    return this;
  };
  _.typedText = function(text) {
    for (var i = 0; i < text.length; i += 1) this.controller.typedText(text.charAt(i));
    return this;
  };
});

function RootBlockMixin(_) {
  _.handlers = {};
  _.setHandlers = function(handlers, extraArg) {
    if (!handlers) return;
    this.handlers = handlers;
    this.extraArg = extraArg; // extra context arg for handlers
  };

  var names = 'moveOutOf deleteOutOf selectOutOf upOutOf downOutOf edited'.split(' ');
  for (var i = 0; i < names.length; i += 1) (function(name) {
    _[name] = (i < 3
      ? function(dir) { if (this.handlers[name]) this.handlers[name](dir, this.extraArg); }
      : function() { if (this.handlers[name]) this.handlers[name](this.extraArg); });
  }(names[i]));
}

setMathQuillDot('MathField', P(EditableField, function(_, super_) {
  _.init = function(el, opts) {
    var contents = this.initExtractContents(el);
    el.addClass('mq-editable-field mq-math-mode');
    this.initRoot(RootMathBlock(), el, opts);
    this.controller.root.setHandlers(opts && opts.handlers, this);
    this.controller.renderLatexMath(contents);
    this.initEvents();
  };
}));
setMathQuillDot('TextField', P(EditableField, function(_) {
  _.init = function(el) {
    var contents = this.initExtractContents(el);
    el.addClass('mq-editable-field mq-text-mode');
    this.initRoot(RootTextBlock(), el);
    this.controller.renderLatexText(contents);
    this.initEvents();
  };
  _.latex = function(latex) {
    if (arguments.length > 0) {
      this.controller.renderLatexText(latex);
      if (this.controller.blurred) this.controller.cursor.hide().parent.blur();
      return this;
    }
    return this.controller.exportLatex();
  };
}));

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
jQuery(function() {
  jQuery('.mathquill-static-math').each(function() { MathQuill.StaticMath(this); });
  jQuery('.mathquill-math-field').each(function() { MathQuill.MathField(this); });
  jQuery('.mathquill-text-field').each(function() { MathQuill.TextField(this); });
});
