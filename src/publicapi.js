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
 * Returns function (to be publicly exported) that MathQuill-ifies an HTML
 * element and returns an API object. If the element had already been MathQuill-
 * ified into the same kind, return the original API object (if different kind
 * or not an HTML element, null).
 */
function APIFnFor(APIClass) {
  function APIFn(el, opts) {
    var mq = MathQuill(el);
    if (mq instanceof APIClass || !el || !el.nodeType) return mq;
    return APIClass($(el), opts);
  }
  APIFn.prototype = APIClass.prototype;
  return APIFn;
}

var AbstractMathQuill = P(function(_) {
  _.init = function() { throw "wtf don't call me, I'm 'abstract'"; };
  _.initRoot = function(root, el, opts) {
    var ctrlr = Controller(this, root, el, opts);
    ctrlr.createTextarea();

    var contents = el.contents().detach();
    root.jQ =
      $('<span class="mq-root-block"/>').attr(mqBlockId, root.id).appendTo(el);
    this.latex(contents.text());

    this.revert = function() {
      return el.empty().unbind('.mathquill')
      .removeClass('mq-editable-field mq-math-mode mq-text-mode')
      .append(contents);
    };
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

MathQuill.StaticMath = APIFnFor(P(AbstractMathQuill, function(_, super_) {
  _.init = function(el) {
    this.initRoot(MathBlock(), el.addClass('mq-math-mode'));
    this.controller.delegateMouseEvents();
    this.controller.staticMathTextareaEvents();
  };
  _.latex = function() {
    var returned = super_.latex.apply(this, arguments);
    if (arguments.length > 0) {
      this.controller.root.postOrder('registerInnerField', this.innerFields = []);
    }
    return returned;
  };
}));

var EditableField = MathQuill.EditableField = P(AbstractMathQuill, function(_) {
  _.initRootAndEvents = function(root, el, opts) {
    this.initRoot(root, el, opts);
    this.controller.editable = true;
    this.controller.delegateMouseEvents();
    this.controller.editablesTextareaEvents();
    root.setHandlers(this.controller.options.handlers, this);
  };
  _.focus = function() { this.controller.textarea.focus(); return this; };
  _.blur = function() { this.controller.textarea.blur(); return this; };
  _.write = function(latex) {
    this.controller.writeLatex(latex);
    if (this.controller.blurred) this.controller.cursor.hide().parent.blur();
    return this;
  };
  _.cmd = function(cmd) {
    var ctrlr = this.controller.notify(), cursor = ctrlr.cursor.show();
    if (/^\\[a-z]+$/i.test(cmd)) {
      cmd = cmd.slice(1);
      var klass = LatexCmds[cmd];
      if (klass) {
        cmd = klass(cmd);
        if (cursor.selection) cmd.replaces(cursor.replaceSelection());
        cmd.createLeftOf(cursor);
      }
      else /* TODO: API needs better error reporting */;
    }
    else cursor.parent.write(cursor, cmd, cursor.replaceSelection());
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
