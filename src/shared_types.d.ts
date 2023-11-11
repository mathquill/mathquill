type NodeRef = MQNode | 0;
type ControllerEvent =
  | 'move'
  | 'upDown'
  | 'replace'
  | 'edit'
  | 'select'
  | undefined;
type JoinMethod = 'html' | 'mathspeak' | 'latex' | 'text';
type CursorOptions = typeof Options.prototype;
type MathspeakOptions = {
  createdLeftOf?: Cursor;
  ignoreShorthand?: boolean;
};
type EmbedOptions = {
  latex?: () => string;
  text?: () => string;
  htmlString?: string;
};

type InequalityData = {
  ctrlSeq: string;
  ctrlSeqStrict: string;
  html: string;
  htmlStrict: string;
  text: string;
  textStrict: string;
  mathspeak: string;
  mathspeakStrict: string;
};

type API = any;
type HandlerOptions = any;
type ControllerData = any;
type ControllerRoot = MQNode & {
  controller: Controller;
  cursor?: Cursor;
  latex: () => string;
};
type HandlerName = any;
type KIND_OF_MQ = any;
type APIClasses = any;
type JQ_KeyboardEvent = KeyboardEvent & {
  originalEvent?: KeyboardEvent;
};
type RootBlockMixinInput = any;
type BracketSide = L | R | 0;

type ParserAny = any;
type InnerMathField = any;
type InnerFields = any;
type EmbedOptionsData = any;
type MQ = any;
type LatexCmdsAny = any;
type CharCmdsAny = any;
type LatexCmdsSingleCharBuilder = Record<string, (char: string) => MQNode>;
type LatexCmdsSingleChar = Record<
  string,
  undefined | typeof TempSingleCharNode | ((char: string) => TempSingleCharNode)
>;

type LatexFragmentBuilderNoParam = () => LatexFragment;
type MQNodeBuilderNoParam = () => MQNode;
type MQNodeBuilderOneParam = (string: string) => MQNode;

type LatexCmd =
  | typeof MQNode
  | MQNodeBuilderNoParam
  | MQNodeBuilderOneParam
  | LatexFragmentBuilderNoParam;
type LatexCmds = Record<string, LatexCmd>;
type CharCmds = Record<string, LatexCmd>;

declare var MQ1: any;
declare var validateAutoCommandsOption: any;

type JQSelector =
  | $
  | HTMLElement
  | string
  | null
  | Window
  | NodeListOf<ChildNode>
  | HTMLElement[]
  | EventTarget;
interface $ {
  (selector?: JQSelector): $;
  fn: any;
  /** Insert this collection either just before or just after `jQ`, according to the direction specified by `dir`. */
  insDirOf(dir: Direction, jQ: $): $;
  /** Insert this collection into `jQ` either at the beginning or end of its children, according to the direction specified by `dir`. */
  insAtDirEnd(dir: Direction, jQ: $): $;
  insertBefore(el: HTMLElement | $): $;
  insertAfter(el: HTMLElement | $): $;
  wrapAll(el: JQSelector): $;
  removeClass(cls: string): $;
  toggleClass(cls: string, bool?: boolean): $;
  addClass(cls: string): $;
  hasClass(cls: string): boolean;
  appendTo(el: JQSelector): $;
  append(el: JQSelector): $;
  prepend(el: JQSelector): $;
  prependTo(el: JQSelector): $;
  replaceWith(el: JQSelector): $;
  attr(attr: string, val: string | number | null): $;
  css(prop: string, val: string | number | null): $;
  trigger(e: Event): $;
  remove(): $;
  detach(): $;
  select(): $;
  width(): number;
  eq(num: number): $;
  add(el: JQSelector): $;
  val(val: string): $;
  parent(): $;
  children(selector?: string): $;
  stop(): $;
  html(): string;
  html(t: string): $;
  text(str: string): $;
  text(): string;
  next(): $;
  prev(): $;
  animate(
    properties: Object,
    duration?: string | number,
    complete?: Function
  ): $;
  empty(): $;
  bind(evt: string, cb: boolean | ((evt: Event) => any)): $;
  bind(evt: string, cb: boolean | ((evt: Event) => any)): void;
  unbind(evt: string, cb?: Function, capture?: boolean): $;
  mousemove(cb: (evt: MouseEvent) => any): $;
  mouseup(cb: (evt: MouseEvent) => any): $;
  focus(handler?: (eventObject: Event) => any): $;
  blur(handler?: (eventObject: Event) => any): $;
  first(): $;
  last(): $;
  slice(start: number, end?: number): $;
  scrollLeft(): number;
  scrollTop(): number;
  closest(selector: JQSelector): $;
  outerWidth(): number;
  offset(): { left: number; top: number }; // TODO - this can be undefined. Either fix uses or wait until removing jquery
  length: number;
  [index: number]: HTMLElement; // TODO - this can be undefined. Either fix uses or wait until removing jquery
  get(): HTMLElement[];
  get(index: number): HTMLElement;
  contents(): $;
}
