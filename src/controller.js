/*********************************************
 * Controller for a MathQuill instance,
 * on which services are registered with
 *
 *   Controller.open(function(_) { ... });
 *
 ********************************************/

var Controller = P(function(_) {
  _.init = function(API, root, container) {
    this.API = API;
    this.root = root;
    this.container = container;

    API.__controller = root.controller = this;

    this.cursor = root.cursor = Cursor(root, API.__options);
    // TODO: stop depending on root.cursor, and rm it

    this.setUnitalicizedTextCmds();
  };

  _.setUnitalicizedTextCmds = function() {
    Units = {};
    var unitalicizedTextCmds = this.API.__options.unItalicizedTextCmds || [];
    if (unitalicizedTextCmds instanceof Array) {
      for (var i = 0; i < unitalicizedTextCmds.length; i += 1) {
        Units[unitalicizedTextCmds[i]] = 1;
      }
      this.API.__options.unItalicizedTextCmds = Units;
    } else if (unitalicizedTextCmds && !(unitalicizedTextCmds instanceof Array)) {
      Units = this.API.__options.unItalicizedTextCmds;
    }
  };

  _.handle = function(name, dir) {
    var handlers = this.API.__options.handlers;
    if (handlers && handlers[name]) {
      if (dir === L || dir === R) handlers[name](dir, this.API);
      else handlers[name](this.API);
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
