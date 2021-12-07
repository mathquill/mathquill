type Controller = any;

type $ = any;
type NodeRef = MQNode | 0;
type ControllerEvent = 'move' | 'upDown' | 'replace' | 'edit' | 'select' | undefined;
type CursorOptions = any;
type MathBlock = any;
type ControllerData = any;
type ControllerRoot = MQNode & {controller?:Controller, cursor?:Cursor};
type HandlerName = any;
type KIND_OF_MQ = any;
type JQ_KeyboardEvent = KeyboardEvent & {
    originalEvent?: KeyboardEvent
}

declare var $:$;
declare var SupSub:any;
declare var optionProcessors:any;
declare var MathBlock:MathBlock;
