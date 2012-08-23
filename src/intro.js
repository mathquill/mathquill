/**
 * Copyleft 2010-2011 Jay and Han (laughinghan@gmail.com)
 *   under the GNU Lesser General Public License
 *     http://www.gnu.org/licenses/lgpl.html
 * Project Website: http://mathquill.com
 */

(function() {

var $ = jQuery,
  undefined,
  _, //temp variable of prototypes
  mqCmdId = 'mathquill-command-id',
  mqBlockId = 'mathquill-block-id',
  min = Math.min,
  max = Math.max;

function noop() {}

var __slice = [].slice;
function variadic(n, fn) {
  return function() {
    var args = __slice.call(arguments, 0, n);
    var varArg = __slice.call(arguments, n);
    return fn.apply(this, args.concat([ varArg ]));
  };
}

var send = variadic(1, function(method, args) {
  return variadic(1, function(obj, moreArgs) {
    if (method in obj) return obj[method].apply(obj, args.concat(moreArgs));
  });
});

/**
 * sugar to make defining lots of commands easier.
 * TODO: rethink this.
 */
function bind(cons /*, args... */) {
  var args = __slice.call(arguments, 1);
  return function() {
    return cons.apply(this, args);
  };
}

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
function pray(message, cond) {
  if (!cond) throw new Error('prayer failed: '+message);
}
