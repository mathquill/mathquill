/*********************************************************
 * The publicly exposed MathQuill API.
 ********************************************************/

type KIND_OF_MQ = 'StaticMath' | 'MathField' | 'InnerMathField' | 'TextField';

/** MathQuill instance fields/methods that are internal, not exposed in the public type defs. */
interface InternalMathQuillInstance {
  __controller: Controller;
  __options: CursorOptions;
  id: number;
  data: { [key: string]: any };
  mathquillify(classNames: string): void;
  __mathquillify(
    opts: ConfigOptions,
    _interfaceVersion: number
  ): IBaseMathQuill;
}

interface IBaseMathQuill extends BaseMathQuill, InternalMathQuillInstance {}

interface IBaseMathQuillClass {
  new (ctrlr: Controller): IBaseMathQuill;
  RootBlock: typeof MathBlock;
}

interface IEditableField extends EditableMathQuill, InternalMathQuillInstance {}

interface IEditableFieldClass {
  new (ctrlr: Controller): IEditableField;
  RootBlock: typeof MathBlock;
}

interface APIClasses {
  StaticMath?: IBaseMathQuillClass;
  MathField?: IEditableFieldClass;
  InnerMathField?: IEditableFieldClass;
  TextField?: IEditableFieldClass;
  AbstractMathQuill: IBaseMathQuillClass;
  EditableField: IEditableFieldClass;
}

type APIClassBuilders = {
  StaticMath?: (APIClasses: APIClasses) => IBaseMathQuillClass;
  MathField?: (APIClasses: APIClasses) => IEditableFieldClass;
  InnerMathField?: (APIClasses: APIClasses) => IEditableFieldClass;
  TextField?: (APIClasses: APIClasses) => IEditableFieldClass;
};

var API: APIClassBuilders = {};

var EMBEDS: Record<string, (data: EmbedOptionsData) => EmbedOptions> = {};

const processedOptions = {
  handlers: true,
  autoCommands: true,
  quietEmptyDelimiters: true,
  autoParenthesizedFunctions: true,
  autoOperatorNames: true,
  leftRightIntoCmdGoes: true,
  maxDepth: true,
  interpretTildeAsSim: true,
};
type ProcessedOption = keyof typeof processedOptions;

/** Map of functions transforming client-provided config options to the internal representation (i.e. property of the Options class) */
type OptionProcessors = Partial<{
  [K in ProcessedOption]: (optionValue: ConfigOptions[K]) => CursorOptions[K];
}>;

const baseOptionProcessors: OptionProcessors = {};

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
  constructor(public version: 1 | 2 | 3) {}

  ignoreNextMousedown: (_el: MouseEvent) => boolean;
  substituteTextarea: () => HTMLElement;
  /** Only used in interface versions 1 and 2. */
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
  logAriaAlerts?: boolean;
  onPaste?: () => void;
  onCut?: () => void;
  overrideTypedText?: (text: string) => void;
  overrideKeystroke: (key: string, event: KeyboardEvent) => void;
  autoOperatorNames: AutoDict;
  autoCommands: AutoDict;
  autoParenthesizedFunctions: AutoDict;
  quietEmptyDelimiters: { [id: string]: any };
  disableAutoSubstitutionInSubscripts?: boolean;
  interpretTildeAsSim: boolean;
  handlers?: {
    fns: HandlerOptions;
    APIClasses: APIClasses;
  };
  scrollAnimationDuration?: number;

  jQuery: $ | undefined;
  assertJquery() {
    pray('Interface versions > 2 do not depend on JQuery', this.version <= 2);
    pray('JQuery is set for interface v < 3', this.jQuery);
    return this.jQuery;
  }
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

let MQ1: any;
function MathQuill(el: HTMLElement) {
  insistOnInterVer();
  if (!MQ1) {
    MQ1 = getInterface(1);
  }
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
  MAX = (getInterface.MAX = 3);

function getInterface(v: 1): MathQuill.v1.API;
function getInterface(v: 2): MathQuill.v1.API;
function getInterface(v: 3): MathQuill.v3.API;
function getInterface(v: number): MathQuill.v3.API | MathQuill.v1.API {
  if (v !== 1 && v !== 2 && v !== 3)
    throw (
      'Only interface versions between ' +
      MIN +
      ' and ' +
      MAX +
      ' supported. You specified: ' +
      v
    );

  const version = v;

  if (version < 3) {
    const jQuery = (window as any).jQuery;
    if (!jQuery)
      throw `MathQuill interface version ${version} requires jQuery 1.5.2+ to be loaded first`;
    Options.prototype.jQuery = jQuery;
  }

  const optionProcessors: OptionProcessors = {
    ...baseOptionProcessors,
    handlers: (handlers) => ({
      // casting to the v3 version of this type
      fns: (handlers as HandlerOptions) || {},
      APIClasses,
    }),
  };

  function config(currentOptions: CursorOptions, newOptions: ConfigOptions) {
    for (const name in newOptions) {
      if (newOptions.hasOwnProperty(name)) {
        if (name === 'substituteKeyboardEvents' && version >= 3) {
          throw new Error(
            [
              "As of interface version 3, the 'substituteKeyboardEvents'",
              "option is no longer supported. Use 'overrideTypedText' and",
              "'overrideKeystroke' instead.",
            ].join(' ')
          );
        }
        var value = (newOptions as any)[name]; // TODO - think about typing this better
        var processor = (optionProcessors as any)[name]; // TODO - validate option processors better
        (currentOptions as any)[name] = processor ? processor(value) : value; // TODO - think about typing better
      }
    }
  }

  const BaseOptions =
    version < 3 ? Options : class BaseOptions extends Options {};

  abstract class AbstractMathQuill extends Progenote implements IBaseMathQuill {
    __controller: Controller;
    __options: CursorOptions;
    id: number;
    data: ControllerData;
    abstract revert(): HTMLElement;

    constructor(ctrlr: Controller) {
      super();
      this.__controller = ctrlr;
      this.__options = ctrlr.options;
      this.id = ctrlr.id;
      this.data = ctrlr.data;
    }

    abstract __mathquillify(
      opts: ConfigOptions,
      _interfaceVersion: number
    ): IBaseMathQuill;

    mathquillify(classNames: string) {
      var ctrlr = this.__controller,
        root = ctrlr.root,
        el = ctrlr.container;
      ctrlr.createTextarea();

      var contents = domFrag(el).addClass(classNames).children().detach();

      root.setDOM(
        domFrag(h('span', { class: 'mq-root-block', 'aria-hidden': true }))
          .appendTo(el)
          .oneElement()
      );
      NodeBase.linkElementByBlockNode(root.domFrag().oneElement(), root);
      this.latex(contents.text());

      this.revert = function () {
        ctrlr.removeMouseEventListener();
        domFrag(el)
          .removeClass('mq-editable-field mq-math-mode mq-text-mode')
          .empty()
          .append(contents);
        return version < 3 ? (this.__options.assertJquery()(el) as any) : el;
      };
    }

    setAriaLabel(ariaLabel: string) {
      this.__controller.setAriaLabel(ariaLabel);
      return this;
    }
    getAriaLabel() {
      return this.__controller.getAriaLabel();
    }
    config(opts: ConfigOptions) {
      config(this.__options, opts);
      return this;
    }
    el() {
      return this.__controller.container;
    }
    text() {
      return this.__controller.exportText();
    }
    mathspeak() {
      return this.__controller.exportMathSpeak();
    }
    latex(latex: unknown): typeof this;
    latex(): string;
    latex(latex?: unknown) {
      if (arguments.length > 0) {
        this.__controller.renderLatexMath(latex);
        const cursor = this.__controller.cursor;
        if (this.__controller.blurred) cursor.hide().parent.blur(cursor);
        return this;
      }
      return this.__controller.exportLatex();
    }

    selection() {
      return this.__controller.exportLatexSelection();
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
    cursor() {
      return this.__controller.cursor;
    }
  }

  abstract class EditableField
    extends AbstractMathQuill
    implements IEditableField
  {
    mathquillify(classNames: string) {
      super.mathquillify(classNames);
      this.__controller.editable = true;
      this.__controller.addMouseEventListener();
      this.__controller.editablesTextareaEvents();
      return this;
    }
    focus() {
      this.__controller.getTextareaOrThrow().focus();
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

    keystroke(keysString: string, evt?: KeyboardEvent) {
      var keys = keysString.replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var i = 0; i < keys.length; i += 1) {
        this.__controller.keystroke(keys[i], evt);
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
      this.__controller.seek(el, clientX, clientY);
      var cmd = new EmbedNode().setOptions(options);
      cmd.createLeftOf(this.__controller.cursor);
    }
    setAriaPostLabel(ariaPostLabel: string, timeout?: number) {
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
      ctrlr.seek(target, clientX, clientY);
      if (ctrlr.blurred) this.focus();
      return this;
    }
    ignoreNextMousedown(fn: CursorOptions['ignoreNextMousedown']) {
      this.__controller.cursor.options.ignoreNextMousedown = fn;
      return this;
    }
  }

  var APIClasses: APIClasses = {
    AbstractMathQuill,
    EditableField,
  } as unknown as APIClasses;

  pray('API.StaticMath defined', API.StaticMath);
  APIClasses.StaticMath = API.StaticMath(APIClasses);
  pray('API.MathField defined', API.MathField);
  APIClasses.MathField = API.MathField(APIClasses);
  pray('API.InnerMathField defined', API.InnerMathField);
  APIClasses.InnerMathField = API.InnerMathField(APIClasses);
  if (API.TextField) {
    APIClasses.TextField = API.TextField(APIClasses);
  }

  /**
   * Function that takes an HTML element and, if it's the root HTML element of a
   * static math or math or text field, returns an API object for it (else, null).
   *
   *   var mathfield = MQ.MathField(mathFieldSpan);
   *   assert(MQ(mathFieldSpan).id === mathfield.id);
   *   assert(MQ(mathFieldSpan).id === MQ(mathFieldSpan).id);
   *
   */
  const MQ = function (el: HTMLElement) {
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

  MQ.config = function (opts: ConfigOptions) {
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

  /*
   * Export the API functions that MathQuill-ify an HTML element into API objects
   * of each class. If the element had already been MathQuill-ified but into a
   * different kind (or it's not an HTML element), return null.
   */
  MQ.StaticMath = createEntrypoint('StaticMath', APIClasses.StaticMath);
  MQ.MathField = createEntrypoint('MathField', APIClasses.MathField!);
  MQ.InnerMathField = createEntrypoint(
    'InnerMathField',
    APIClasses.InnerMathField
  );
  if (APIClasses.TextField) {
    MQ.TextField = createEntrypoint('TextField', APIClasses.TextField);
  }

  MQ.prototype = AbstractMathQuill.prototype;
  (MQ as any).EditableField = function () {
    throw "wtf don't call me, I'm 'abstract'";
  };
  (MQ as any).EditableField.prototype = EditableField.prototype;

  if (version < 3) {
    (MQ as any).saneKeyboardEvents = defaultSubstituteKeyboardEvents;
  }

  function createEntrypoint<
    K extends keyof typeof API,
    MQClass extends IBaseMathQuillClass | IEditableFieldClass
  >(kind: K, APIClass: MQClass) {
    pray(kind + ' is defined', APIClass);

    function mqEntrypoint(el: null | undefined): null;
    function mqEntrypoint(
      el: HTMLElement,
      config?: ConfigOptions
    ): InstanceType<MQClass>;
    function mqEntrypoint(el?: HTMLElement | null, opts?: ConfigOptions) {
      if (!el || !el.nodeType) return null;
      var mq = MQ(el);
      if (mq instanceof APIClass) return mq;
      var ctrlr = new Controller(
        new APIClass.RootBlock() as ControllerRoot,
        el,
        new BaseOptions(version)
      );
      ctrlr.KIND_OF_MQ = kind;
      return new APIClass(ctrlr).__mathquillify(opts || {}, version);
    }
    mqEntrypoint.prototype = APIClass.prototype;
    return mqEntrypoint;
  }
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
    pray('controller is defined', this.controller);
    this.controller.handle('moveOutOf', dir);
  };
  _.deleteOutOf = function (dir: Direction) {
    pray('controller is defined', this.controller);
    this.controller.handle('deleteOutOf', dir);
  };
  _.selectOutOf = function (dir: Direction) {
    pray('controller is defined', this.controller);
    this.controller.handle('selectOutOf', dir);
  };
  _.upOutOf = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('upOutOf');
    return undefined;
  };
  _.downOutOf = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('downOutOf');
    return undefined;
  };

  _.reflow = function () {
    pray('controller is defined', this.controller);
    this.controller.handle('reflow');
    this.controller.handle('edited');
    this.controller.handle('edit');
  };
}
