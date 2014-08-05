/*********************************************
 * Controller for a MathQuill instance,
 * on which services are registered with
 *
 *   Controller.open(function(_) { ... });
 *
 * and whose default options are set with
 *
 *   defaultOpts.optionName = ...;
 *
 ********************************************/

var DefaultOpts = P(), defaultOpts = MathQuill.options = DefaultOpts.p;

var Controller = P(function(_) {
  _.init = function(API, root, container, options) {
    this.API = API;
    this.root = root;
    this.cursor = root.cursor = Cursor(root);
      // TODO: stop depending on root.cursor, and rm it
    this.container = container;
    this.options = this.cursor.options = P(DefaultOpts, options || 0).p;

    API.controller = root.controller = this;
  };

  var notifyees = [];
  this.onNotify = function(f) { notifyees.push(f); };
  _.notify = function() {
    for (var i = 0; i < notifyees.length; i += 1) {
      notifyees[i].apply(this.cursor, arguments);
    }
    return this;
  };
});
