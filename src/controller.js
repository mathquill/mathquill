/*********************************************
 * Controller for a MathQuill instance,
 * on which services are registered with
 * Controller.open(function(_) { ... });
 ********************************************/

var Controller = P(function(_) {
  _.init = function(root) {
    this.root = root;
    this.cursor = Cursor(root);
  };
});
