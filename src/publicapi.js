/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

var API = {}, optionProcessors = {}, EMBEDS = {};
class Options {};
class Progenote {}

/**
 * Interface Versioning (#459, #495) to allow us to virtually guarantee
 * backcompat. v0.10.x introduces it, so for now, don't completely break the
 * API for people who don't know about it, just complain with console.warn().
 *
 * The methods are shimmed in outro.js so that MQ.MathField.prototype etc can
 * be accessed.
 */
function insistOnInterVer() {
  if (window.console) console.warn(
    'You are using the MathQuill API without specifying an interface version, ' +
    'which will fail in v1.0.0. Easiest fix is to do the following before ' +
    'doing anything else:\n' +
    '\n' +
    '    MathQuill = MathQuill.getInterface(1);\n' +
    '    // now MathQuill.MathField() works like it used to\n' +
    '\n' +
    'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
    '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide'
  );
}
// globally exported API object
function MathQuill(el) {
  insistOnInterVer();
  return MQ1(el);
};
MathQuill.prototype = Progenote.prototype;
MathQuill.VERSION = "{VERSION}";
MathQuill.interfaceVersion = function(v) {
  // shim for #459-era interface versioning (ended with #495)
  if (v !== 1) throw 'Only interface version 1 supported. You specified: ' + v;
  insistOnInterVer = function() {
    if (window.console) console.warn(
      'You called MathQuill.interfaceVersion(1); to specify the interface ' +
      'version, which will fail in v1.0.0. You can fix this easily by doing ' +
      'this before doing anything else:\n' +
      '\n' +
      '    MathQuill = MathQuill.getInterface(1);\n' +
      '    // now MathQuill.MathField() works like it used to\n' +
      '\n' +
      'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
      '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide'
    );
  };
  insistOnInterVer();
  return MathQuill;
};
MathQuill.getInterface = getInterface;

var MIN = getInterface.MIN = 1, MAX = getInterface.MAX = 2;
function getInterface(v) {
  if (!(MIN <= v && v <= MAX)) throw 'Only interface versions between ' +
    MIN + ' and ' + MAX + ' supported. You specified: ' + v;

  /**
   * Function that takes an HTML element and, if it's the root HTML element of a
   * static math or math or text field, returns an API object for it (else, null).
   *
   *   var mathfield = MQ.MathField(mathFieldSpan);
   *   assert(MQ(mathFieldSpan).id === mathfield.id);
   *   assert(MQ(mathFieldSpan).id === MQ(mathFieldSpan).id);
   *
   */
  function MQ(el) {
    if (!el || !el.nodeType) return null; // check that `el` is a HTML element, using the
      // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
    var blockNode = NodeBase.getNodeOfElement($(el).children('.mq-root-block')[0]);
    var ctrlr = blockNode && blockNode.controller;
    return ctrlr ? new APIClasses[ctrlr.KIND_OF_MQ](ctrlr) : null;
  };
  var APIClasses = {};

  MQ.L = L;
  MQ.R = R;
  MQ.saneKeyboardEvents = saneKeyboardEvents;

  function config(currentOptions, newOptions) {
    if (newOptions && newOptions.handlers) {
      newOptions.handlers = { fns: newOptions.handlers, APIClasses: APIClasses };
    }
    for (var name in newOptions) if (newOptions.hasOwnProperty(name)) {
      var value = newOptions[name], processor = optionProcessors[name];
      currentOptions[name] = (processor ? processor(value) : value);
    }
  }
  MQ.config = function(opts) { config(Options.prototype, opts); return this; };
  MQ.registerEmbed = function(name, options) {
    if (!/^[a-z][a-z0-9]*$/i.test(name)) {
      throw 'Embed name must start with letter and be only letters and digits';
    }
    EMBEDS[name] = options;
  };

  var AbstractMathQuill = APIClasses.AbstractMathQuill = class extends Progenote {
    constructor (ctrlr) {
      this.__controller = ctrlr;
      this.__options = ctrlr.options;
      this.id = ctrlr.id;
      this.data = ctrlr.data;
    };
    __mathquillify (classNames) {
      var ctrlr = this.__controller, root = ctrlr.root, el = ctrlr.container;
      ctrlr.createTextarea();

      var contents = el.addClass(classNames).contents().detach();
      root.jQ = $('<span class="mq-root-block"/>').appendTo(el);
      NodeBase.linkElementByBlockId(root.jQ[0], root.id);
      this.latex(contents.text());

      this.revert = function() {
        return el.empty().unbind('.mathquill')
        .removeClass('mq-editable-field mq-math-mode mq-text-mode')
        .append(contents);
      };
    };
    config (opts) { config(this.__options, opts); return this; };
    el () { return this.__controller.container[0]; };
    text () { return this.__controller.exportText(); };
    mathspeak () { return this.__controller.exportMathSpeak(); };
    latex (latex) {
      if (arguments.length > 0) {
        this.__controller.renderLatexMath(latex);
        if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
        return this;
      }
      return this.__controller.exportLatex();
    };
    html () {
      return this.__controller.root.jQ.html()
        .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
        .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
        .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
        .replace(/ class=(""|(?= |>))/g, '');
    };
    reflow () {
      this.__controller.root.postOrder(function (node) { node.reflow(); });
      return this;
    };
  };
  MQ.prototype = AbstractMathQuill.prototype;

  APIClasses.EditableField = class extends AbstractMathQuill {
    __mathquillify () {
      super.__mathquillify.apply(this, arguments);
      this.__controller.editable = true;
      this.__controller.delegateMouseEvents();
      this.__controller.editablesTextareaEvents();
      return this;
    };
    focus () {
      this.__controller.textarea[0].focus();
      this.__controller.scrollHoriz();
      return this;
    };
    blur () { this.__controller.textarea.blur(); return this; };
    write (latex) {
      this.__controller.writeLatex(latex);
      this.__controller.scrollHoriz();
      if (this.__controller.blurred) this.__controller.cursor.hide().parent.blur();
      return this;
    };
    empty () {
      var root = this.__controller.root, cursor = this.__controller.cursor;

      root.ends[L] = root.ends[R] = 0;
      root.jQ.empty();
      delete cursor.selection;
      cursor.insAtRightEnd(root);
      return this;
    };
    cmd (cmd) {
      var ctrlr = this.__controller.notify(), cursor = ctrlr.cursor;
      if (/^\\[a-z]+$/i.test(cmd) && !cursor.isTooDeep()) {
        cmd = cmd.slice(1);
        var klass = LatexCmds[cmd];
        if (klass) {
          if (klass.constructor) {
            cmd = new klass(cmd);
          } else {
            cmd = klass(cmd);
          }
          if (cursor.selection) cmd.replaces(cursor.replaceSelection());
          cmd.createLeftOf(cursor.show());
        }
        else /* TODO: API needs better error reporting */;
      }
      else cursor.parent.write(cursor, cmd);

      ctrlr.scrollHoriz();
      if (ctrlr.blurred) cursor.hide().parent.blur();
      return this;
    };
    select () {
      var ctrlr = this.__controller;
      ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
      while (ctrlr.cursor[L]) ctrlr.selectLeft();
      return this;
    };
    clearSelection () {
      this.__controller.cursor.clearSelection();
      return this;
    };

    moveToDirEnd (dir) {
      this.__controller.notify('move').cursor.insAtDirEnd(dir, this.__controller.root);
      return this;
    };
    moveToLeftEnd () { return this.moveToDirEnd(L); };
    moveToRightEnd () { return this.moveToDirEnd(R); };

    keystroke (keys, evt) {
      var keys = keys.replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var i = 0; i < keys.length; i += 1) {
        this.__controller.keystroke(keys[i], evt || { preventDefault: noop });
      }
      return this;
    };
    typedText (text) {
      for (var i = 0; i < text.length; i += 1) this.__controller.typedText(text.charAt(i));
      return this;
    };
    dropEmbedded (pageX, pageY, options) {
      var clientX = pageX - $(window).scrollLeft();
      var clientY = pageY - $(window).scrollTop();

      var el = document.elementFromPoint(clientX, clientY);
      this.__controller.seek($(el), pageX, pageY);
      var cmd = new LatexCmds.embed().setOptions(options);
      cmd.createLeftOf(this.__controller.cursor);
    };
    setAriaLabel (ariaLabel) {
      this.__controller.setAriaLabel(ariaLabel);
      return this;
    };
    getAriaLabel () {
      return this.__controller.getAriaLabel();
    };
    setAriaPostLabel (ariaPostLabel, timeout) {
      this.__controller.setAriaPostLabel(ariaPostLabel, timeout);
      return this;
    };
    getAriaPostLabel () {
      return this.__controller.getAriaPostLabel();
    };
    clickAt (clientX, clientY, target) {
      target = target || document.elementFromPoint(clientX, clientY);
      var ctrlr = this.__controller, root = ctrlr.root;
      if (!jQuery.contains(root.jQ[0], target)) target = root.jQ[0];
      ctrlr.seek($(target), clientX + pageXOffset, clientY + pageYOffset);
      if (ctrlr.blurred) this.focus();
      return this;
    };
    ignoreNextMousedown (fn) {
      this.__controller.cursor.options.ignoreNextMousedown = fn;
      return this;
    };
  };
  MQ.EditableField = function() { throw "wtf don't call me, I'm 'abstract'"; };
  MQ.EditableField.prototype = APIClasses.EditableField.prototype;

  /**
   * Export the API functions that MathQuill-ify an HTML element into API objects
   * of each class. If the element had already been MathQuill-ified but into a
   * different kind (or it's not an HTML element), return null.
   */
  for (var kind in API) (function(kind, defAPIClass) {
    var APIClass = APIClasses[kind] = defAPIClass(APIClasses);
    MQ[kind] = function(el, opts) {
      var mq = MQ(el);
      if (mq instanceof APIClass || !el || !el.nodeType) return mq;
      var ctrlr = new Controller(new APIClass.RootBlock(), $(el), new Options());
      ctrlr.KIND_OF_MQ = kind;
      return new APIClass(ctrlr).__mathquillify(opts, v);
    };
    MQ[kind].prototype = APIClass.prototype;
  }(kind, API[kind]));

  return MQ;
}

MathQuill.noConflict = function() {
  window.MathQuill = origMathQuill;
  return MathQuill;
};
var origMathQuill = window.MathQuill;
window.MathQuill = MathQuill;

function RootBlockMixin(_) {
  _.moveOutOf = function (dir) { this.controller.handle('moveOutOf', dir) }
  _.deleteOutOf = function (dir) { this.controller.handle('deleteOutOf', dir) }
  _.selectOutOf = function (dir) { this.controller.handle('selectOutOf', dir) }
  _.upOutOf = function (dir) { this.controller.handle('upOutOf', dir) }
  _.downOutOf = function (dir) { this.controller.handle('downOutOf', dir) }

  _.reflow = function() {
    this.controller.handle('reflow');
    this.controller.handle('edited');
    this.controller.handle('edit');
  };
}
