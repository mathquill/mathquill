/**
 * MathQuill: http://mathquill.com
 * by Jay and Han (laughinghan@gmail.com)
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 * - Wrapped mathquill in define call.
 * - Added Cursor._lastCursorId property (to support programmatic write into \editable area)
 * - Added 'softkey' command (to directly call backspace and cursor actions on editor)
 * - Init option sets whether to use textarea or focusable span. (to not open soft keyboard on touch devices)
 * - Removed automatic processing of mathquill classed elements. (We want to handle initialisation ourselves)
 * - Allow single spaces; allow these to separate numerator of new fraction from previous symbols.
 * - Added superscriptempty and subscriptempty latex commands.
 * - Added 'editables' command to retrieve an array of latex values from \editable areas.
 * - Expose read-only list of latex commands.
 * - Don't open text block on $ press, add special symbol class for $.
 *
 * Eoghan McIlwaine
 */
define(['vendor/dom'], function (jQuery) {

/**
 * Copyleft 2010-2011 Jay and Han (laughinghan@gmail.com)
 *   under the GNU Lesser General Public License
 *     http://www.gnu.org/licenses/lgpl.html
 * Project Website: http://mathquill.com
 */

(function() {

var jQuery = window.jQuery,
  undefined,
  _, //temp variable of prototypes
  mqCmdId = 'mathquill-command-id',
  mqBlockId = 'mathquill-block-id',
  min = Math.min,
  max = Math.max;

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
