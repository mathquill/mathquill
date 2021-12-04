var jQuery = (window as any).jQuery;
var min = Math.min;
var max = Math.max;

if (!jQuery) throw 'MathQuill requires jQuery 1.5.2+ to be loaded first';

function noop() {}

/**
* a development-only debug method.  This definition and all
* calls to `pray` will be stripped from the minified
* build of mathquill.
*
* This function must be called by name to be removed
* at compile time.  Do not define another function
* with the same name, and only call this function by
* name.
*/
function pray(message:string, cond:any) {
if (!cond) throw new Error('prayer failed: '+message);
}
