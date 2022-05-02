type NodeRef = MQNode | 0;
type ControllerEvent =
  | 'move'
  | 'upDown'
  | 'replace'
  | 'edit'
  | 'select'
  | undefined;
type JoinMethod = 'mathspeak' | 'text' | 'latex';

type CursorOptions = Options;

// These types are just aliases for the corresponding public types, for use in internal code.
// If we version the interface, these can be changed to "MathQuill.v4...." (or maybe "MathQuill.v3.... | MathQuill.v3....")
type BaseMathQuill = MathQuill.v3.BaseMathQuill;
type EditableMathQuill = MathQuill.v3.EditableMathQuill;
type EmbedOptions = MathQuill.v3.EmbedOptions;
type EmbedOptionsData = MathQuill.v3.EmbedOptionsData;
type HandlersWithDirection = MathQuill.v3.HandlersWithDirection;
type HandlersWithoutDirection = MathQuill.v3.HandlersWithoutDirection;
type HandlerOptions = MathQuill.v3.HandlerOptions;

type ConfigOptions = MathQuill.v1.Config | MathQuill.v3.Config;

type MathspeakOptions = {
  createdLeftOf?: Cursor;
  ignoreShorthand?: boolean;
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

type LatexContext = {
  latex: string;
  startIndex: number;
  endIndex: number;
  startSelectionBefore?: NodeBase;
  startSelectionAfter?: NodeBase;
  endSelectionBefore?: NodeBase;
  endSelectionAfter?: NodeBase;
};

type ControllerData = any;
type ControllerRoot = MQNode & {
  controller: Controller;
  cursor?: Cursor;
  latex: () => string;
  latexRecursive: (ctx: LatexContext) => void;
};
type JQ_KeyboardEvent = KeyboardEvent & {
  originalEvent?: KeyboardEvent;
};
type RootBlockMixinInput = MQNode & { controller?: Controller };
type BracketSide = L | R | 0;

type InnerMathField = any;
type InnerFields = any;
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
  length: number;
  [index: number]: HTMLElement; // TODO - this can be undefined. Either fix uses or wait until removing jquery
}
