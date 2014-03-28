/*********************************************
 * Controller for a MathQuill instance,
 * on which services are registered with
 * Controller.open(function(_) { ... });
 ********************************************/

var Controller = P(function(_) {
  _.init = function(root, container, options) {
    this.root = root;
    this.cursor = Cursor(root);
    this.container = container;
    this.options = options || 0;
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
