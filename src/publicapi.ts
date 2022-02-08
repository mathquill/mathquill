/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

type KIND_OF_MQ = 'StaticMath' | 'MathField' | 'InnerMathField' | 'TextField';

interface IAbstractMathQuill {
  __controller: Controller;
  __options: CursorOptions;
  id: number;
  data: ControllerData;
  /** Interface V1 returns a jQuery collection. Interface V2 returns an HTMLElement. */
  revert(): $ | HTMLElement;

  mathquillify(classNames: string): void;
  __mathquillify(
    opts: CursorOptions,
    _interfaceVersion: number
  ): IAbstractMathQuill;
  config(opts: CursorOptions): IAbstractMathQuill;
  el(): HTMLElement;
  text(): string;
  mathspeak(): string;
  latex(latex: string): string | IAbstractMathQuill;
  html(): string;
  reflow(): IAbstractMathQuill;
}
interface IAbstractMathQuillClass {
  new (ctrlr: Controller): IAbstractMathQuill;
}

interface APIClass extends IAbstractMathQuillClass {
  RootBlock: typeof MathBlock;
}

interface APIClasses {
  StaticMath?: APIClass;
  MathField?: APIClass;
  InnerMathField?: APIClass;
  TextField?: APIClass;
  AbstractMathQuill: IAbstractMathQuillClass;
  EditableField: IAbstractMathQuillClass;
}

type API = {
  StaticMath?: (APIClasses: APIClasses) => APIClass;
  MathField?: (APIClasses: APIClasses) => APIClass;
  InnerMathField?: (APIClasses: APIClasses) => APIClass;
  TextField?: (APIClasses: APIClasses) => APIClass;
};

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

type SubstituteKeyboardEvents = (
  el: $,
  controller: Controller
) => {
  select: (text: string) => void;
};

class Options {
  constructor(public version: 1 | 2) {}
  ignoreNextMousedown: (_el: MouseEvent) => boolean;
  substituteTextarea: () => HTMLElement;
  /** Only used in interface version 1. */
  substituteKeyboardEvents: SubstituteKeyboardEvents;

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
  if (v !== 1 && v !== 2)
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
    let blockElement;
    const childArray = domFrag(el).children().toElementArray();
    for (const child of childArray) {
      if (child.classList.contains('mq-root-block')) {
        blockElement = child;
        break;
      }
    }
    var blockNode = NodeBase.getNodeOfElement(blockElement) as MathBlock; // TODO - assumng it's a MathBlock
    var ctrlr = blockNode && blockNode.controller;
    const APIClass = ctrlr && APIClasses[ctrlr.KIND_OF_MQ];
    return ctrlr && APIClass ? new APIClass(ctrlr) : null;
  };

  MQ.L = L;
  MQ.R = R;
  if (v < 2) {
    MQ.saneKeyboardEvents = defaultSubstituteKeyboardEvents;
  }

  function config(
    currentOptions: CursorOptions,
    newOptions: ConfigOptionsV1 | ConfigOptionsV2
  ) {
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

  const BaseOptions = v < 2 ? Options : class BaseOptions extends Options {};
  MQ.config = function (opts: ConfigOptionsV1 | ConfigOptionsV2) {
    config(BaseOptions.prototype, opts);
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

  abstract class AbstractMathQuill
    extends Progenote
    implements IAbstractMathQuill
  {
    __controller: Controller;
    __options: CursorOptions;
    id: number;
    data: ControllerData;
    abstract revert(): HTMLElement | $;

    constructor(ctrlr: Controller) {
      super();
      this.__controller = ctrlr;
      this.__options = ctrlr.options;
      this.id = ctrlr.id;
      this.data = ctrlr.data;
    }

    abstract __mathquillify(
      opts: CursorOptions,
      _interfaceVersion: number
    ): IAbstractMathQuill;

    mathquillify(classNames: string) {
      var ctrlr = this.__controller,
        root = ctrlr.root,
        el = ctrlr.container;
      ctrlr.createTextarea();

      var contents = el.addClass(classNames).children().detach();

      root.setDOMFrag(
        domFrag(
          h('span', { class: 'mq-root-block', 'aria-hidden': true })
        ).appendTo(el.oneElement())
      );
      NodeBase.linkElementByBlockNode(root.domFrag().oneElement(), root);
      this.latex(contents.text());

      this.revert = function () {
        ctrlr.delegateMouseEvents();
        el.removeClass('mq-editable-field mq-math-mode mq-text-mode')
          .empty()
          .append(contents);
        return v < 2 ? el.toJQ() : el.oneElement();
      };
    }
    config(opts: ConfigOptionsV1 | ConfigOptionsV2) {
      config(this.__options, opts);
      return this;
    }
    el() {
      return this.__controller.container.oneElement();
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
      return this.__controller.root
        .domFrag()
        .oneElement()
        .innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g, '') // TODO remove when jQuery is completely gone
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

  abstract class EditableField extends AbstractMathQuill {
    mathquillify(classNames: string) {
      super.mathquillify(classNames);
      this.__controller.editable = true;
      this.__controller.addMouseEventListener();
      this.__controller.editablesTextareaEvents();
      return this;
    }
    focus() {
      this.__controller.getTextareaOrThrow()[0].focus();
      this.__controller.scrollHoriz();
      return this;
    }
    blur() {
      this.__controller.getTextareaOrThrow()[0].blur();
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

      root.setEnds({ [L]: 0, [R]: 0 });
      root.domFrag().empty();
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
      var clientX = pageX - getScrollX();
      var clientY = pageY - getScrollY();

      var el = document.elementFromPoint(clientX, clientY);
      this.__controller.seek($(el), clientX, clientY);
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
      const rootElement = root.domFrag().oneElement();
      if (!rootElement.contains(target)) target = rootElement;
      ctrlr.seek($(target), clientX, clientY);
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
  } as unknown as APIClasses;

  /**
   * Export the API functions that MathQuill-ify an HTML element into API objects
   * of each class. If the element had already been MathQuill-ified but into a
   * different kind (or it's not an HTML element), return null.
   */
  for (var kind in API)
    (function <K extends keyof typeof API>(kind: K, defAPIClass: API[K]) {
      if (!defAPIClass) return;
      var APIClass = (APIClasses[kind] = defAPIClass(APIClasses));
      MQ[kind] = function (el: HTMLElement, opts: CursorOptions) {
        var mq = MQ(el);
        if (mq instanceof APIClass || !el || !el.nodeType) return mq;
        var ctrlr = new Controller(
          new APIClass.RootBlock() as ControllerRoot,
          DOMFragment.create(el),
          new BaseOptions(v)
        );
        ctrlr.KIND_OF_MQ = kind;
        return new APIClass(ctrlr).__mathquillify(opts, v);
      };
      MQ[kind].prototype = APIClass.prototype;
    })(kind as keyof typeof API, API[kind as keyof typeof API]);

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
