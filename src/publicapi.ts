/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

var API: API = {};

var EMBEDS: Record<string, (data: EmbedOptionsData) => EmbedOptions> = {};

class OptionProcessors {
  maxDepth: (n: number) => CursorOptions['maxDepth'];
  leftRightIntoCmdGoes: (
    s: 'up' | 'down'
  ) => CursorOptions['leftRightIntoCmdGoes'];
  autoCommands: (list: string) => CursorOptions['autoOperatorNames'];
  autoOperatorNames: (list: string) => CursorOptions['autoOperatorNames'];
  autoParenthesizedFunctions: (
    list: string
  ) => CursorOptions['autoOperatorNames'];
  quietEmptyDelimiters: (list: string) => CursorOptions['quietEmptyDelimiters'];
}

const optionProcessors = new OptionProcessors();
type AutoDict = {
  _maxLength?: number;
  [id: string]: any;
};

class Options {
  ignoreNextMousedown: (_el: MouseEvent) => boolean;
  substituteTextarea: () => HTMLElement;
  substituteKeyboardEvents: typeof saneKeyboardEvents;

  restrictMismatchedBrackets?: boolean;
  typingSlashCreatesNewFraction?: boolean;
  charsThatBreakOutOfSupSub: string;
  sumStartsWithNEquals?: boolean;
  autoSubscriptNumerals?: boolean;
  supSubsRequireOperand?: boolean;
  spaceBehavesLikeTab?: boolean;
  typingAsteriskWritesTimesSymbol?: boolean;
  typingSlashWritesDivisionSymbol: boolean;
  typingPercentWritesPercentOf?: boolean;
  resetCursorOnBlur?: boolean | undefined;
  leftRightIntoCmdGoes?: 'up' | 'down';
  enableDigitGrouping?: boolean;
  mouseEvents?: boolean;
  maxDepth?: number;
  disableCopyPaste?: boolean;
  statelessClipboard?: boolean;
  onPaste?: () => void;
  onCut?: () => void;
  overrideTypedText?: (text: string) => void;
  overrideKeystroke: (key: string, event: KeyboardEvent) => void;
  autoOperatorNames: AutoDict;
  autoCommands: AutoDict;
  autoParenthesizedFunctions: AutoDict;
  quietEmptyDelimiters: { [id: string]: any };
  disableAutoSubstitutionInSubscripts?: boolean;
  handlers: HandlerOptions;
}
class Progenote {}

/**
 * Interface Versioning (#459, #495) to allow us to virtually guarantee
 * backcompat. v0.10.x introduces it, so for now, don't completely break the
 * API for people who don't know about it, just complain with console.warn().
 *
 * The methods are shimmed in outro.js so that MQ.MathField.prototype etc can
 * be accessed.
 */
var insistOnInterVer = function () {
  if (window.console)
    console.warn(
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
};
// globally exported API object
function MathQuill(el: HTMLElement) {
  insistOnInterVer();
  return MQ1(el);
}
MathQuill.prototype = Progenote.prototype;
MathQuill.VERSION = '{VERSION}';
MathQuill.interfaceVersion = function (v: number) {
  // shim for #459-era interface versioning (ended with #495)
  if (v !== 1) throw 'Only interface version 1 supported. You specified: ' + v;
  insistOnInterVer = function () {
    if (window.console)
      console.warn(
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

var MIN = (getInterface.MIN = 1),
  MAX = (getInterface.MAX = 2);
function getInterface(v: number) {
  if (!(MIN <= v && v <= MAX))
    throw (
      'Only interface versions between ' +
      MIN +
      ' and ' +
      MAX +
      ' supported. You specified: ' +
      v
    );

  /**
   * Function that takes an HTML element and, if it's the root HTML element of a
   * static math or math or text field, returns an API object for it (else, null).
   *
   *   var mathfield = MQ.MathField(mathFieldSpan);
   *   assert(MQ(mathFieldSpan).id === mathfield.id);
   *   assert(MQ(mathFieldSpan).id === MQ(mathFieldSpan).id);
   *
   */
  var MQ: MQ = function (el: HTMLElement) {
    if (!el || !el.nodeType) return null; // check that `el` is a HTML element, using the
    // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
    var blockNode = NodeBase.getNodeOfElement(
      $(el).children('.mq-root-block')[0]
    ) as MathBlock; // TODO - assumng it's a MathBlock
    var ctrlr = blockNode && blockNode.controller;
    return ctrlr ? new APIClasses[ctrlr.KIND_OF_MQ](ctrlr) : null;
  };

  MQ.L = L;
  MQ.R = R;
  MQ.saneKeyboardEvents = saneKeyboardEvents;

  function config(currentOptions: CursorOptions, newOptions: CursorOptions) {
    if (newOptions && newOptions.handlers) {
      newOptions.handlers = {
        fns: newOptions.handlers,
        APIClasses: APIClasses,
      };
    }
    for (var name in newOptions)
      if (newOptions.hasOwnProperty(name)) {
        var value = (newOptions as any)[name]; // TODO - think about typing this better
        var processor = (optionProcessors as any)[name]; // TODO - validate option processors better
        (currentOptions as any)[name] = processor ? processor(value) : value; // TODO - think about typing better
      }
  }
  MQ.config = function (opts: CursorOptions) {
    config(Options.prototype, opts);
    return this;
  };
  MQ.registerEmbed = function (
    name: string,
    options: (data: EmbedOptionsData) => EmbedOptions
  ) {
    if (!/^[a-z][a-z0-9]*$/i.test(name)) {
      throw 'Embed name must start with letter and be only letters and digits';
    }
    EMBEDS[name] = options;
  };

  class AbstractMathQuill extends Progenote {
    __controller: Controller;
    __options: CursorOptions;
    id: number;
    data: ControllerData;
    revert?: () => $;

    constructor(ctrlr: Controller) {
      super();
      this.__controller = ctrlr;
      this.__options = ctrlr.options;
      this.id = ctrlr.id;
      this.data = ctrlr.data;
    }
    __mathquillify(classNames: string) {
      var ctrlr = this.__controller,
        root = ctrlr.root,
        el = ctrlr.container;
      ctrlr.createTextarea();

      var contents = el.addClass(classNames).contents().detach();
      root.jQ = $('<span class="mq-root-block"/>').appendTo(el);
      NodeBase.linkElementByBlockId(root.jQ[0], root.id);
      this.latex(contents.text());

      this.revert = function () {
        return el
          .empty()
          .unbind('.mathquill')
          .removeClass('mq-editable-field mq-math-mode mq-text-mode')
          .append(contents);
      };
    }
    config(opts: CursorOptions) {
      config(this.__options, opts);
      return this;
    }
    el() {
      return this.__controller.container[0];
    }
    text() {
      return this.__controller.exportText();
    }
    mathspeak() {
      return this.__controller.exportMathSpeak();
    }
    latex(latex: string) {
      if (arguments.length > 0) {
        this.__controller.renderLatexMath(latex);
        const cursor = this.__controller.cursor;
        if (this.__controller.blurred) cursor.hide().parent.blur(cursor);
        return this;
      }
      return this.__controller.exportLatex();
    }
    html() {
      return this.__controller.root.jQ
        .html()
        .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
        .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
        .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
        .replace(/ class=(""|(?= |>))/g, '');
    }
    reflow() {
      this.__controller.root.postOrder(function (node) {
        node.reflow();
      });
      return this;
    }
  }
  MQ.prototype = AbstractMathQuill.prototype;

  class EditableField extends AbstractMathQuill {
    __mathquillify(classNames: string) {
      super.__mathquillify(classNames);
      this.__controller.editable = true;
      this.__controller.delegateMouseEvents();
      this.__controller.editablesTextareaEvents();
      return this;
    }
    focus() {
      this.__controller.getTextareaOrThrow()[0].focus();
      this.__controller.scrollHoriz();
      return this;
    }
    blur() {
      this.__controller.getTextareaOrThrow().blur();
      return this;
    }
    write(latex: string) {
      this.__controller.writeLatex(latex);
      this.__controller.scrollHoriz();
      const cursor = this.__controller.cursor;
      if (this.__controller.blurred) cursor.hide().parent.blur(cursor);
      return this;
    }
    empty() {
      var root = this.__controller.root,
        cursor = this.__controller.cursor;

      root.ends[L] = root.ends[R] = 0;
      root.jQ.empty();
      delete cursor.selection;
      cursor.insAtRightEnd(root);
      return this;
    }
    cmd(cmd: string) {
      var ctrlr = this.__controller.notify(undefined),
        cursor = ctrlr.cursor;
      if (/^\\[a-z]+$/i.test(cmd) && !cursor.isTooDeep()) {
        cmd = cmd.slice(1);
        var klass = (LatexCmds as LatexCmdsAny)[cmd];
        var node;
        if (klass) {
          if (klass.constructor) {
            node = new klass(cmd);
          } else {
            node = klass(cmd);
          }
          if (cursor.selection) node.replaces(cursor.replaceSelection());
          node.createLeftOf(cursor.show());
        } /* TODO: API needs better error reporting */ else;
      } else cursor.parent.write(cursor, cmd);

      ctrlr.scrollHoriz();
      if (ctrlr.blurred) cursor.hide().parent.blur(cursor);
      return this;
    }
    select() {
      this.__controller.selectAll();
      return this;
    }
    clearSelection() {
      this.__controller.cursor.clearSelection();
      return this;
    }

    moveToDirEnd(dir: Direction) {
      this.__controller
        .notify('move')
        .cursor.insAtDirEnd(dir, this.__controller.root);
      return this;
    }
    moveToLeftEnd() {
      return this.moveToDirEnd(L);
    }
    moveToRightEnd() {
      return this.moveToDirEnd(R);
    }

    keystroke(keysString: string, evt: KeyboardEvent) {
      var keys = keysString.replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var i = 0; i < keys.length; i += 1) {
        this.__controller.keystroke(keys[i], evt || { preventDefault: noop });
      }
      return this;
    }
    typedText(text: string) {
      for (var i = 0; i < text.length; i += 1)
        this.__controller.typedText(text.charAt(i));
      return this;
    }
    dropEmbedded(pageX: number, pageY: number, options: EmbedOptions) {
      var clientX = pageX - $(window).scrollLeft();
      var clientY = pageY - $(window).scrollTop();

      var el = document.elementFromPoint(clientX, clientY);
      this.__controller.seek($(el), pageX, pageY);
      var cmd = new EmbedNode().setOptions(options);
      cmd.createLeftOf(this.__controller.cursor);
    }
    setAriaLabel(ariaLabel: string) {
      this.__controller.setAriaLabel(ariaLabel);
      return this;
    }
    getAriaLabel() {
      return this.__controller.getAriaLabel();
    }
    setAriaPostLabel(ariaPostLabel: string, timeout: number) {
      this.__controller.setAriaPostLabel(ariaPostLabel, timeout);
      return this;
    }
    getAriaPostLabel() {
      return this.__controller.getAriaPostLabel();
    }
    clickAt(clientX: number, clientY: number, target: HTMLElement) {
      target = target || document.elementFromPoint(clientX, clientY);
      var ctrlr = this.__controller,
        root = ctrlr.root;
      if (!jQuery.contains(root.jQ[0], target)) target = root.jQ[0];
      ctrlr.seek($(target), clientX + pageXOffset, clientY + pageYOffset);
      if (ctrlr.blurred) this.focus();
      return this;
    }
    ignoreNextMousedown(fn: CursorOptions['ignoreNextMousedown']) {
      this.__controller.cursor.options.ignoreNextMousedown = fn;
      return this;
    }
  }
  MQ.EditableField = function () {
    throw "wtf don't call me, I'm 'abstract'";
  };
  MQ.EditableField.prototype = EditableField.prototype;

  var APIClasses: APIClasses = {
    AbstractMathQuill,
    EditableField,
  };

  /**
   * Export the API functions that MathQuill-ify an HTML element into API objects
   * of each class. If the element had already been MathQuill-ified but into a
   * different kind (or it's not an HTML element), return null.
   */
  for (var kind in API)
    (function (kind, defAPIClass) {
      var APIClass = (APIClasses[kind] = defAPIClass(APIClasses));
      MQ[kind] = function (el: HTMLElement, opts: CursorOptions) {
        var mq = MQ(el);
        if (mq instanceof APIClass || !el || !el.nodeType) return mq;
        var ctrlr = new Controller(
          new APIClass.RootBlock(),
          $(el),
          new Options()
        );
        ctrlr.KIND_OF_MQ = kind;
        return new APIClass(ctrlr).__mathquillify(opts, v);
      };
      MQ[kind].prototype = APIClass.prototype;
    })(kind, API[kind]);

  return MQ;
}

MathQuill.noConflict = function () {
  window.MathQuill = origMathQuill;
  return MathQuill;
};
var origMathQuill = window.MathQuill;
window.MathQuill = MathQuill;

function RootBlockMixin(_: RootBlockMixinInput) {
  _.moveOutOf = function (dir: Direction) {
    this.controller.handle('moveOutOf', dir);
  };
  _.deleteOutOf = function (dir: Direction) {
    this.controller.handle('deleteOutOf', dir);
  };
  _.selectOutOf = function (dir: Direction) {
    this.controller.handle('selectOutOf', dir);
  };
  _.upOutOf = function (dir: Direction) {
    this.controller.handle('upOutOf', dir);
  };
  _.downOutOf = function (dir: Direction) {
    this.controller.handle('downOutOf', dir);
  };

  _.reflow = function () {
    this.controller.handle('reflow');
    this.controller.handle('edited');
    this.controller.handle('edit');
  };
}
