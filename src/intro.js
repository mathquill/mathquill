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
  jQueryDataKey = '[[mathquill internal data]]',
  min = Math.min,
  max = Math.max;

var __slice = [].slice;

/**
 * sugar to make defining lots of commands easier.
 * TODO: rethink this.
 */

function proto(sup, cons) {
  return P(sup, { init: cons });
}

function bind(sup /*, args... */) {
  var args = __slice.call(arguments, 1);

  return P(sup, function(_, _super) {
    _.init = function() {
      _super.init.apply(this, args.concat(arguments));
    };
  });
}

