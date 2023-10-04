// L = 'left'
// R = 'right'
//
// the contract is that they can be used as object properties
// and (-L) === R, and (-R) === L.
type L = -1;
type R = 1;
const L: L = -1;
const R: R = 1;
type Direction = L | R;

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
function pray(message: string, cond?: any) {
  if (!cond) throw new Error('prayer failed: ' + message);
}

function prayDirection(dir: Direction) {
  pray('a direction was passed', dir === L || dir === R);
}
