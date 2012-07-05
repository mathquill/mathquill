var Node = P(function(_) {
  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.firstChild = 0;
  _.lastChild = 0;

  _.children = function() {
    return Range(this.firstChild, this.lastChild);
  };

  _.eachChild = function(fn) {
    return this.children().each(fn);
  };

  _.foldChildren = function(fold, fn) {
    return this.children().fold(fold, fn);
  };

  _.adopt = function(parent, prev, next) {
    pray('a parent is always passed to Node::adopt', parent);

    pray('prev is properly set up', (function() {
      // either it's empty and next is the first child (possibly empty)
      if (!prev) return parent.firstChild === next;

      // or it's there and its next and parent are properly set up
      return prev.next === next && prev.parent === parent;
    })());

    pray('next is properly set up', (function() {
      // either it's empty and prev is the last child (possibly empty)
      if (!next) return parent.lastChild === prev;

      // or it's there and its next and parent are properly set up
      return next.prev === prev && next.parent === parent;
    })());

    var self = this;

    self.parent = parent;
    self.next = next;
    self.prev = prev;

    if (prev) {
      prev.next = self;
    } else {
      parent.firstChild = self;
    }

    if (next) {
      next.prev = self;
    } else {
      parent.lastChild = self;
    }

    return self;
  };

  _.disown = function() {
    var self = this;

    if (self.prev) {
      self.prev.next = self.next;
    } else {
      self.parent.firstChild = self.next;
    }

    if (self.next) {
      self.next.prev = self.prev;
    } else {
      self.parent.lastChild = self.prev;
    }

    return self;
  };
});

var Range = P(function(_) {
  _.first = 0;
  _.last = 0;

  _.init = function(first, last) {
    this.first = first;
    this.last = last;
  };

  _.each = function(fn) {
    for (var el = this.first; el && el !== this.last.next; el = el.next) {
      if (fn.call(this, el) === false) break;
    }

    return this;
  };

  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });

    return fold;
  };
});
