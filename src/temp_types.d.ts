type NodeRef = MQNode | 0;
type ControllerEvent = 'move' | 'upDown' | 'replace' | 'edit' | 'select' | undefined;
type JoinMethod = 'html' | 'mathspeak' | 'latex' | 'text';
type CursorOptions = typeof Options.prototype;
type MathspeakOptions = {
    createdLeftOf?:Cursor, 
    ignoreShorthand?: boolean
}

type API = any;
type HandlerOptions = any;
type ControllerData = any;
type ControllerRoot = MQNode & {controller:Controller, cursor?:Cursor, latex: () => string};
type HandlerName = any;
type KIND_OF_MQ = any;
type APIClasses = any;
type JQ_KeyboardEvent = KeyboardEvent & {
    originalEvent?: KeyboardEvent
}
type RootBlockMixinInput = any;

type MQ = any;
type LatexCmdsAny = any;
type CharCmdsAny = any;
type LatexCmdsSingleCharBuilder = Record<string, (char:string) => MQNode>;
type LatexCmdsSingleChar = Record<string, undefined | typeof TempSingleCharNode | ((char:string) => TempSingleCharNode)>

type MQNodeBuilderNoParam= () => MQNode;
type MQNodeBuilderOneParam= (string:string) => MQNode;

type LatexCmd = typeof MQNode | MQNodeBuilderNoParam | MQNodeBuilderOneParam;
type LatexCmds = Record<string,LatexCmd>
type CharCmds = Record<string,LatexCmd>

declare var MQ1:any;
declare var RootMathCommand:any;
declare var validateAutoCommandsOption:any;

declare var Letter:typeof TempSingleCharNode;
declare var Digit:typeof TempSingleCharNode;
declare var PlusMinus:typeof TempSingleCharNode;





type JQSelector = $ | HTMLElement | string | null | Window | NodeListOf<ChildNode> | HTMLElement[] | EventTarget;
interface $ {
    (selector?:JQSelector):$;
    fn: any;
    jqAdd(el:$):$;
    insDirOf(dir:Direction, jQ:$):$,
    insAtDirEnd(dir:Direction, jQ:$):$;
    insertBefore(el:HTMLElement | $):$;
    wrapAll(el:JQSelector):$;
    removeClass(cls:string):$;
    toggleClass(cls:string):$;
    addClass(cls:string):$;
    hasClass(cls:string):boolean;
    appendTo(el:JQSelector):$;
    append(el:JQSelector):$;
    prepend(el:JQSelector):$;
    replaceWith(el:JQSelector):$;
    attr(attr:string, val:string|number|null):$;
    remove():$;
    detach():$;
    select():$;
    add(el:JQSelector):$;
    val(val:string):$;
    parent():$;
    children(selector?:string):$;
    stop():$;
    html():string;
    html(t:string):$;
    text(str:string):$;
    text():string;
    animate(properties: Object, duration?: string|number, complete?: Function):$;
    empty():$;
    bind(evt:string, cb:boolean | ((evt:Event) => any)): $
    bind(evt:string, cb:boolean | ((evt:Event) => any)): void
    unbind(evt:string, cb?:Function, capture?:boolean): $;
    mousemove(cb:(evt:MouseEvent) => any):$;
    mouseup(cb:(evt:MouseEvent) => any):$;
    focus(handler?: (eventObject: Event) => any):$;
    blur(handler?: (eventObject: Event) => any):$;
    first():$
    last():$
    slice(start: number, end?: number): $;
    scrollLeft():number;
    scrollTop():number;
    closest(selector:JQSelector): $;
    outerWidth():number;
    offset():{left:number, top:number} // TODO - this can be undefined
    length: number;
    [index:number]:HTMLElement; // TODO - this can be undefined....
    get():HTMLElement[];
    get(index:number):HTMLElement;
    contents():$;
}
