var Node = P(function(_) {
  _.prev = 0;
  _.next = 0;
  _.parent = 0;
  _.firstChild = 0;
  _.lastChild = 0;

  _.children = function() {
    return Fragment(this.firstChild, this.lastChild);
  };

  _.eachChild = function(fn) {
    return this.children().each(fn);
  };

  _.foldChildren = function(fold, fn) {
    return this.children().fold(fold, fn);
  };

  _.adopt = function(parent, prev, next) {
    Fragment(this, this).adopt(parent, prev, next);
    return this;
  };

  _.disown = function() {
    Fragment(this, this).disown();
    return this;
  };
});

var Fragment = P(function(_) {
  _.first = 0;
  _.last = 0;

  _.init = function(first, last) {
    pray('no half-empty fragments', !first === !last);

    if (!first) return;

    pray('first node is passed to Fragment', first instanceof Node);
    pray('last node is passed to Fragment', last instanceof Node);
    pray('first and last have the same parent',
         first.parent === last.parent);

    this.first = first;
    this.last = last;
  };

  _.adopt = function(parent, prev, next) {
    pray('a parent is always passed to Fragment::adopt', parent);

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
    var first = self.first;

    if (!first) return this;

    var last = self.last;

    if (prev) {
      // NB: this is handled in the ::each() block
      // prev.next = first
    } else {
      parent.firstChild = first;
    }

    if (next) {
      next.prev = last;
    } else {
      parent.lastChild = last;
    }

    self.last.next = next;

    self.each(function(el) {
      el.prev = prev;
      el.parent = parent;
      if (prev) prev.next = el;

      prev = el;
    });

    return self;
  };

  _.disown = function() {
    var self = this;
    var first = self.first;
    if (!first) return self;
    var last = self.last;
    var parent = first.parent;

    if (first.prev) {
      first.prev.next = last.next;
    } else {
      parent.firstChild = last.next;
    }

    if (last.next) {
      last.next.prev = first.prev;
    } else {
      parent.lastChild = first.prev;
    }

    first.prev = last.next = 0;
    self.each(function(el) { el.parent = 0; });

    return self;
  }

  _.each = function(fn) {
    var self = this;
    var el = self.first;
    if (!el) return self;

    for (;el !== self.last.next; el = el.next) {
      if (fn.call(self, el) === false) break;
    }

    return self;
  };

  _.fold = function(fold, fn) {
    this.each(function(el) {
      fold = fn.call(this, fold, el);
    });

    return fold;
  };
});
