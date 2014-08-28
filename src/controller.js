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
    this.setUnitalicizedTextCmds();
  };

  _.setUnitalicizedTextCmds = function() {
    Units = {};
    var unitalicizedTextCmds = this.options && this.options.unItalicizedTextCmds || [];
    if (unitalicizedTextCmds instanceof Array) {
      for (var i = 0; i < unitalicizedTextCmds.length; i += 1) {
        Units[unitalicizedTextCmds[i]] = 1;
      }
      this.options.unItalicizedTextCmds = Units;
    } else if (unitalicizedTextCmds && !(unitalicizedTextCmds instanceof Array)) {
      Units = this.options.unItalicizedTextCmds;
    }
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
