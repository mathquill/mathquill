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

var left = new String('left');
var right = new String('right');
function leftOrRight(f) {
  f(left, right);
  f(right, left);
}
leftOrRight(function(left) {
  left.most = new String(left+'most');
  left.most.child = left.most+'Child';
});

var jQ = {};
jQ.left = 'jQprev';
jQ.right = 'jQnext';
jQ.leftmost = 'jQfirst';
jQ.rightmost = 'jQlast';

var insert = { left: {}, right: {} };
insert.left.of = 'insertBefore';
insert.right.of = 'insertAfter';
insert.left.most = 'prependTo';
insert.right.most = 'appendTo';

var del = { left: 'backspace', right: 'deleteForward' };

var hop = { left: 'hopLeft', right: 'hopRight' };
var extend = { left: 'extendLeft', right: 'extendRight' };
var retract = { left: 'retractLeft', right: 'retractRight' };

var move = {};
move.left = new String('moveLeft');
move.right = new String('moveRight');
move.left.within = 'moveLeftWithin';
move.right.within = 'moveRightWithin';

var __slice = [].slice;

function noop() {}

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
