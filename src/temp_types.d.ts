type $ = any;
type NodeRef = MQNode | 0;
type ControllerEvent = 'move' | 'upDown' | 'replace' | 'edit' | 'select' | undefined;
type CursorOptions = any;
type MathBlock = any;
type ControllerData = any;
type ControllerRoot = MQNode & {controller:Controller, cursor?:Cursor, latex: () => string};
type HandlerName = any;
type KIND_OF_MQ = any;
type JQ_KeyboardEvent = KeyboardEvent & {
    originalEvent?: KeyboardEvent
}
type AnyLatexCmds = Record<string, undefined | typeof TempSingleCharNode | ((char:string) => TempSingleCharNode)>

declare var $:$;
declare var SupSub:any;
declare var optionProcessors:any;
declare var MathBlock:MathBlock;
declare var RootMathCommand:any;
declare var Options:{
    prototype: {
        ignoreNextMousedown: () => void;
        substituteTextarea: () => void;
        substituteKeyboardEvents: typeof saneKeyboardEvents
    }
}


declare var Letter:typeof TempSingleCharNode;
declare var Digit:typeof TempSingleCharNode;
declare var VanillaSymbol:typeof TempSingleCharNode;
declare var PlusMinus:typeof TempSingleCharNode;