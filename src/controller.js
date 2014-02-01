/*********************************************
 * Root math elements with event delegation.
 ********************************************/

var Controller = P(function(_) {
  _.init = function(root) {
    this.root = root;
    this.cursor = Cursor(root);
  };
});
