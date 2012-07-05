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
