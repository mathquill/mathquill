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

    this.ariaLabel = 'Math Input:';
    this.ariaPostLabel = '';

    root.controller = this;

    this.cursor = root.cursor = Cursor(root, options, this);
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
  _.setAriaLabel = function(ariaLabel) {
    if (ariaLabel && typeof ariaLabel === 'string' && ariaLabel !== '') {
      // If the supplied label doesn't end with a punctuation mark, add a colon by default.
      var suffix = /[\d\l]$/.test(ariaLabel) ? ':' : '';
      this.ariaLabel = ariaLabel + suffix;
    } else {
      this.ariaLabel = 'Math Input:';
    }
    return this;
  };
  _.getAriaLabel = function () {
    return this.ariaLabel || 'Math Input:';
  };
  _.setAriaPostLabel = function(ariaPostLabel, timeout) {
    if(ariaPostLabel && typeof ariaPostLabel === 'string' && ariaPostLabel!='') {
      if (
        ariaPostLabel !== this.ariaPostLabel &&
        typeof timeout === 'number'
      ) {
        if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
        this._ariaAlertTimeout = setTimeout(function() {
          if (!!$(document.activeElement).closest($(this.container)).length) {
            aria.alert(this.root.mathspeak().trim() + ' ' + ariaPostLabel.trim());
          }
        }.bind(this), timeout);
      }
      this.ariaPostLabel = ariaPostLabel;
    } else {
      if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
      this.ariaPostLabel = '';
    }
    return this;
  };
  _.getAriaPostLabel = function () {
    return this.ariaPostLabel || '';
  };
});
