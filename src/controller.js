/*********************************************
 * Controller for a MathQuill instance,
 * on which services are registered with
 *
 *   Controller.open(function(_) { ... });
 *
 ********************************************/

var Controller = P(function(_) {
  _.init = function(root, container, options) {
    this.id = root.id;
    this.data = {};

    this.root = root;
    this.container = container;
    this.options = options;

    this.ariaLabel = 'MathQuill Input';
    this.ariaPostLabel = '';

    root.controller = this;

    this.cursor = root.cursor = Cursor(root, options);
    // TODO: stop depending on root.cursor, and rm it
  };

  _.handle = function(name, dir) {
    var handlers = this.options.handlers;
    if (handlers && handlers.fns[name]) {
      var mq = handlers.APIClasses[this.KIND_OF_MQ](this);
      if (dir === L || dir === R) handlers.fns[name](dir, mq);
      else handlers.fns[name](mq);
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
