type NodeRef = MQNode | 0;
type ControllerEvent =
  | 'move'
  | 'upDown'
  | 'replace'
  | 'edit'
  | 'select'
  | undefined;
type JoinMethod = 'mathspeak' | 'latex' | 'text';

type CursorOptions = Options;

type ConfigOptions = ConfigOptionsV1 | ConfigOptionsV2;

interface ConfigOptionsV1 {
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

interface ConfigOptionsV2 {
  ignoreNextMousedown: (_el: MouseEvent) => boolean;
  substituteTextarea: () => HTMLElement;

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
  htmlEntity: string;
  htmlEntityStrict: string;
  text: string;
  textStrict: string;
  mathspeak: string;
  mathspeakStrict: string;
};

type HandlerOptions = any;
type ControllerData = any;
type ControllerRoot = MQNode & {
  controller: Controller;
  cursor?: Cursor;
  latex: () => string;
};
type HandlerName = any;
type JQ_KeyboardEvent = KeyboardEvent & {
  originalEvent?: KeyboardEvent;
};
type RootBlockMixinInput = any;
type BracketSide = L | R | 0;

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
  | null
  | Window
  | NodeListOf<ChildNode>
  | HTMLElement[]
  | EventTarget;

interface $ {
  (selector?: JQSelector): $;
  attr(attr: string, val: string | number | null): $;
  css(prop: string, val: string | number | null): $;
  select(): $;
  val(val: string): $;
  stop(): $;
  html(t: string): $;
  text(str: string): $;
  animate(
    properties: Object,
    duration?: string | number,
    complete?: Function
  ): $;
  bind(opts: Record<string, boolean | ((evt: any) => any)>): $;
  bind(evt: string, cb: boolean | ((evt: Event) => any)): $;
  unbind(evt: string, cb?: Function, capture?: boolean): $;
  mousemove(cb: (evt: MouseEvent) => any): $;
  mouseup(cb: (evt: MouseEvent) => any): $;
  closest(selector: JQSelector): $;
  length: number;
  [index: number]: HTMLElement; // TODO - this can be undefined. Either fix uses or wait until removing jquery
}
