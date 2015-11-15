/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

/**
 * Function that takes an HTML element and, if it's the root HTML element of a
 * static math or math or text field, returns its API object (if not, null).
 * Identity of API object guaranteed if called multiple times, i.e.:
 *
 *   var mathfield = MQ.MathField(mathFieldSpan);
 *   assert(MQ(mathFieldSpan) === mathfield);
 *   assert(MQ(mathFieldSpan) === MQ(mathFieldSpan));
 *
 */
function MQ(el) {
  if (!el || !el.nodeType) return null; // check that `el` is a HTML element, using the
    // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
  var blockId = $(el).children('.mq-root-block').attr(mqBlockId);
  return blockId ? Node.byId[blockId].controller.API : null;
};

/**
 * Returns function (to be publicly exported) that MathQuill-ifies an HTML
 * element and returns an API object. If the element had already been MathQuill-
 * ified into the same kind, return the original API object (if different kind
 * or not an HTML element, null).
 */
function APIFnFor(APIClass) {
  function APIFn(el, opts) {
    var mq = MQ(el);
    if (mq instanceof APIClass || !el || !el.nodeType) return mq;
    return APIClass($(el), opts);
  }
  APIFn.prototype = APIClass.prototype;
  return APIFn;
}

var Options = P(), optionProcessors = {};
MQ.__options = Options.p;

var AbstractMathQuill = P(function(_) {
  _.init = function() { throw "wtf don't call me, I'm 'abstract'"; };
  _.initRoot = function(root, el, opts) {
    this.__options = Options();
    this.config(opts);

    var ctrlr = this.__controller = Controller(root, el, this.__options);
    ctrlr.API = this;
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
  _.config =
  MQ.config = function(opts) {
    for (var opt in opts) if (opts.hasOwnProperty(opt)) {
      var optVal = opts[opt], processor = optionProcessors[opt];
      this.__options[opt] = (processor ? processor(optVal) : optVal);
    }
    return this;
  };
  _.el = function() { return this.__controller.container[0]; };
  _.text = function() { return this.__controller.exportText(); };
  _.latex = function(latex) {
    if (arguments.length > 0) {
      this.__controller.renderLatexMath(latex);
      if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
      return this;
    }
    return this.__controller.exportLatex();
  };
  _.html = function() {
    return this.__controller.root.jQ.html()
      .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
      .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
      .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
      .replace(/ class=(""|(?= |>))/g, '');
  };
  _.reflow = function() {
    this.__controller.root.postOrder('reflow');
    return this;
  };
});
MQ.prototype = AbstractMathQuill.prototype;


var EditableField = MQ.EditableField = P(AbstractMathQuill, function(_) {
  _.initRootAndEvents = function(root, el, opts) {
    this.initRoot(root, el, opts);
    this.__controller.editable = true;
    this.__controller.delegateMouseEvents();
    this.__controller.editablesTextareaEvents();
  };
  _.focus = function() { this.__controller.textarea.focus(); return this; };
  _.blur = function() { this.__controller.textarea.blur(); return this; };
  _.write = function(latex) {
    this.__controller.writeLatex(latex);
    if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
    return this;
  };
  _.cmd = function(cmd) {
    var ctrlr = this.__controller.notify(), cursor = ctrlr.cursor;
    if (/^\\[a-z]+$/i.test(cmd)) {
      cmd = cmd.slice(1);
      var klass = LatexCmds[cmd];
      if (klass) {
        cmd = klass(cmd);
        if (cursor.selection) cmd.replaces(cursor.replaceSelection());
        cmd.createLeftOf(cursor.show());
      }
      else /* TODO: API needs better error reporting */;
    }
    else cursor.parent.write(cursor, cmd);
    if (ctrlr.blurred) cursor.hide().parent.blur();
    return this;
  };
  _.select = function() {
    var ctrlr = this.__controller;
    ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
    while (ctrlr.cursor[L]) ctrlr.selectLeft();
    return this;
  };
  _.clearSelection = function() {
    this.__controller.cursor.clearSelection();
    return this;
  };

  _.moveToDirEnd = function(dir) {
    this.__controller.notify('move').cursor.insAtDirEnd(dir, this.__controller.root);
    return this;
  };
  _.moveToLeftEnd = function() { return this.moveToDirEnd(L); };
  _.moveToRightEnd = function() { return this.moveToDirEnd(R); };

  _.keystroke = function(keys) {
    var keys = keys.replace(/^\s+|\s+$/g, '').split(/\s+/);
    for (var i = 0; i < keys.length; i += 1) {
      this.__controller.keystroke(keys[i], { preventDefault: noop });
    }
    return this;
  };
  _.typedText = function(text) {
    for (var i = 0; i < text.length; i += 1) this.__controller.typedText(text.charAt(i));
    return this;
  };
});

function RootBlockMixin(_) {
  var names = 'moveOutOf deleteOutOf selectOutOf upOutOf downOutOf'.split(' ');
  for (var i = 0; i < names.length; i += 1) (function(name) {
    _[name] = function(dir) { this.controller.handle(name, dir); };
  }(names[i]));
  _.reflow = function() {
    this.controller.handle('reflow');
    this.controller.handle('edited');
    this.controller.handle('edit');
  };
}

/**
 * Interface Versioning (#459) to allow us to virtually guarantee backcompat.
 * v0.10.x introduces it, so for now, don't completely break the API for
 * people who don't know about it, just complain with console.warn().
 *
 * The methods are shimmed in outro.js so that MQ.MathField.prototype etc can
 * be accessed.
 */
function insistOnInterVer() {
  if (window.console) console.warn(
    'This usage of the MathQuill API will fail in v1.0.0. The easiest fix is ' +
    'to get interface version 1 before doing anything else:\n' +
    '\n' +
    '    MathQuill = MathQuill.getInterface(1);\n' +
    '    // now MathQuill.MathField() works like it used to\n' +
    ' '
//   ^ apparently necessary to show the empty line in Blink/WebKit
  );
}
// globally exported API object
function MathQuill(el) {
  insistOnInterVer();
  return MQ(el);
};

MathQuill.getInterface = function(v) {
  if (v !== 1) throw 'Only interface version 1 supported. You specified: ' + v;
  return MQ;
};

MathQuill.noConflict = function() {
  window.MathQuill = origMathQuill;
  return MathQuill;
};
var origMathQuill = window.MathQuill;
window.MathQuill = MathQuill;
