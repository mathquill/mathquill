type Controller = any;

type $ = any;
type NodeRef = MQNode | 0;
type Cursor = any;
type ControllerEvent = 'move' | 'upDown' | any;
type CursorOptions = any;
type MathBlock = any;

declare var $:$;
declare var MQSelection:any;
declare var SupSub:any;
declare var aria:any;
declare var Controller_focusBlur:any;
declare var optionProcessors:any;

declare var ControllerBase: {
    onNotify: (this:Controller, e:ControllerEvent) => void
}