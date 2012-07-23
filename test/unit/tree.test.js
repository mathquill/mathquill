suite('tree', function() {
  suite('adopt', function() {
    function assertTwoChildren(parent, one, two) {
      assert.equal(one.parent, parent, 'one.parent is set');
      assert.equal(two.parent, parent, 'two.parent is set');

      assert.ok(!one[L], 'one has no prev');
      assert.equal(one[R], two, 'one[R] is two');
      assert.equal(two[L], one, 'two[L] is one');
      assert.ok(!two[R], 'two has no next');

      assert.equal(parent.ch[L], one, 'parent.ch[L] is one');
      assert.equal(parent.ch[R], two, 'parent.ch[R] is two');
    }

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);

      assert.equal(child.parent, parent, 'child.parent is set');
      assert.ok(!child[R], 'child has no next');
      assert.ok(!child[L], 'child has no prev');

      assert.equal(parent.ch[L], child, 'child is parent.ch[L]');
      assert.equal(parent.ch[R], child, 'child is parent.ch[R]');
    });

    test('with two children from the left', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      assertTwoChildren(parent, one, two);
    });

    test('with two children from the right', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      two.adopt(parent, 0, 0);
      one.adopt(parent, 0, two);

      assertTwoChildren(parent, one, two);
    });

    test('adding one in the middle', function() {
      var parent = Node();
      var prev = Node();
      var next = Node();
      var middle = Node();

      prev.adopt(parent, 0, 0);
      next.adopt(parent, prev, 0);
      middle.adopt(parent, prev, next);

      assert.equal(middle.parent, parent, 'middle.parent is set');
      assert.equal(middle[L], prev, 'middle[L] is set');
      assert.equal(middle[R], next, 'middle[R] is set');

      assert.equal(prev[R], middle, 'prev[R] is middle');
      assert.equal(next[L], middle, 'next[L] is middle');

      assert.equal(parent.ch[L], prev, 'parent.ch[L] is prev');
      assert.equal(parent.ch[R], next, 'parent.ch[R] is next');
    });
  });

  suite('disown', function() {
    function assertSingleChild(parent, child) {
      assert.equal(parent.ch[L], child, 'parent.ch[L] is child');
      assert.equal(parent.ch[R], child, 'parent.ch[R] is child');
      assert.ok(!child[L], 'child has no prev');
      assert.ok(!child[R], 'child has no next');
    }

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);
      child.disown();

      assert.ok(!parent.ch[L], 'parent has no firstChild');
      assert.ok(!parent.ch[R], 'parent has no lastChild');
    });

    test('disowning the last child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      two.disown();

      assertSingleChild(parent, one);

      assert.equal(two.parent, parent, 'two retains its parent');
      assert.equal(two[L], one, 'two retains its prev');

      assert.throws(function() { two.disown(); },
                    'disown fails on a malformed tree');
    });

    test('disowning the first child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      one.disown();

      assertSingleChild(parent, two);

      assert.equal(one.parent, parent, 'one retains its parent');
      assert.equal(one[R], two, 'one retains its next');

      assert.throws(function() { one.disown(); },
                    'disown fails on a malformed tree');
    });

    test('disowning the middle', function() {
      var parent = Node();
      var prev = Node();
      var next = Node();
      var middle = Node();

      prev.adopt(parent, 0, 0);
      next.adopt(parent, prev, 0);
      middle.adopt(parent, prev, next);

      middle.disown();

      assert.equal(prev[R], next, 'prev[R] is next');
      assert.equal(next[L], prev, 'next[L] is prev');
      assert.equal(parent.ch[L], prev, 'parent.ch[L] is prev');
      assert.equal(parent.ch[R], next, 'parent.ch[R] is next');

      assert.equal(middle.parent, parent, 'middle retains its parent');
      assert.equal(middle[R], next, 'middle retains its next');
      assert.equal(middle[L], prev, 'middle retains its prev');

      assert.throws(function() { middle.disown(); },
                    'disown fails on a malformed tree');
    });
  });

  suite('fragments', function() {
    test('an empty fragment', function() {
      var empty = Fragment();
      var count = 0;

      empty.each(function() { count += 1 });

      assert.equal(count, 0, 'each is a noop on an empty fragment');
    });

    test('half-empty fragments are disallowed', function() {
      assert.throws(function() {
        Fragment(Node(), 0)
      }, 'half-empty on the right');

      assert.throws(function() {
        Fragment(0, Node());
      }, 'half-empty on the left');
    });

    test('disown is idempotent', function() {
      var parent = Node();
      var one = Node().adopt(parent, 0, 0);
      var two = Node().adopt(parent, one, 0);

      var frag = Fragment(one, two);
      frag.disown();
      frag.disown();
    });
  });
});
