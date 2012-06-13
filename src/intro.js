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
 * simple sugar for idiomatic JS classes
 * Usage:
 *  var Cat = _class(new Animal, function(furriness) {
 *    this.furriness = furriness;
 *    this.adorableness = furriness/10;
 *  });
 *  _.play = function(){ this.chase('mouse'); };
 */
function _class(prototype, constructor) {
  if (!constructor) constructor = function(){};
  _ = constructor.prototype = prototype;
  return constructor;
}

/**
 * more sugar, for classes without a pre-supplied prototype
 * Usage:
 *  var Animal = _baseclass();
 *  _.chase = function(prey) ...
 */
function _baseclass(constructor) {
  return _class({}, constructor);
}

/**
 * sugar specifically for copying the constructor
 * Usage:
 *  var HouseCat = _subclass(Cat);
 *  _.play = function(){ this.chase('yarn'); };
 */
function _subclass(superclass) {
  return _class(new superclass, function(){
    if (superclass.prototype.init) {
      superclass.prototype.init.apply(this, arguments);
    } else {
      superclass.apply(this, arguments);
    }
  });
}

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

