type $ = any;
type NodeRef = MQNode | 0;
type ControllerEvent = 'move' | 'upDown' | 'replace' | 'edit' | 'select' | undefined;
type JoinMethod = 'html' | 'mathspeak' | 'latex' | 'text';
type CursorOptions = {
    ignoreNextMousedown: (e:MouseEvent) => boolean;
    substituteTextarea: () => HTMLElement;
    substituteKeyboardEvents: typeof saneKeyboardEvents;
    spaceBehavesLikeTab: boolean | undefined;
    typingAsteriskWritesTimesSymbol: boolean | undefined;
    typingSlashWritesDivisionSymbol: boolean | undefined;
    typingPercentWritesPercentOf: boolean | undefined;
    resetCursorOnBlur: boolean | undefined;
    leftRightIntoCmdGoes: 'up' | 'down' | undefined;
    enableDigitGrouping: boolean | undefined;
    mouseEvents: boolean | undefined;
    maxDepth: number | undefined;
    disableCopyPaste: boolean | undefined;
    statelessClipboard: boolean | undefined;
    onPaste?: () => void;
    onCut?: () => void;
    overrideTypedText?:(text:string) => void;
    overrideKeystroke: (key:string, event:KeyboardEvent) => void;
    autoOperatorNames:{
        _maxLength?: number;
        [id:string]:any;
    };
    handlers: HandlerOptions
};
type HandlerOptions = any;
type ControllerData = any;
type ControllerRoot = MQNode & {controller:Controller, cursor?:Cursor, latex: () => string};
type HandlerName = any;
type KIND_OF_MQ = any;
type APIClasses = any;
type JQ_KeyboardEvent = KeyboardEvent & {
    originalEvent?: KeyboardEvent
}

type LatexCmdsAny = any;
type CharCmdsAny = any;
type LatexCmdsSingleCharBuilder = Record<string, (char:string) => MQNode>;
type LatexCmdsSingleChar = Record<string, undefined | typeof TempSingleCharNode | ((char:string) => TempSingleCharNode)>

declare var RootBlockMixin:any;
declare var API:any;
declare var $:$;
declare var SupSub:any;
declare var optionProcessors:any;
declare var RootMathCommand:any;
declare var Options:{
    prototype:CursorOptions;
}


declare var Letter:typeof TempSingleCharNode;
declare var Digit:typeof TempSingleCharNode;
declare var PlusMinus:typeof TempSingleCharNode;