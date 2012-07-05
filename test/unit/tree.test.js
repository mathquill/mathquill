suite('tree', function() {
  suite('adopt', function() {
    function assertTwoChildren(parent, one, two) {
      assert.equal(one.parent, parent, 'one.parent is set');
      assert.equal(two.parent, parent, 'two.parent is set');

      assert.ok(!one.prev, 'one has no prev');
      assert.equal(one.next, two, 'one.next is two');
      assert.equal(two.prev, one, 'two.prev is one');
      assert.ok(!two.next, 'two has no next');

      assert.equal(parent.firstChild, one, 'parent.firstChild is one');
      assert.equal(parent.lastChild, two, 'parent.lastChild is two');
    }

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);

      assert.equal(child.parent, parent, 'child.parent is set');
      assert.ok(!child.next, 'child has no next');
      assert.ok(!child.prev, 'child has no prev');

      assert.equal(parent.firstChild, child, 'child is parent.firstChild');
      assert.equal(parent.lastChild, child, 'child is parent.lastChild');
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
      assert.equal(middle.prev, prev, 'middle.prev is set');
      assert.equal(middle.next, next, 'middle.next is set');

      assert.equal(prev.next, middle, 'prev.next is middle');
      assert.equal(next.prev, middle, 'next.prev is middle');

      assert.equal(parent.firstChild, prev, 'parent.firstChild is prev');
      assert.equal(parent.lastChild, next, 'parent.lastChild is next');
    });
  });

  suite('disown', function() {
    function assertDisowned(node) {
      assert.ok(!node.parent, 'disowned node has no parent');
      assert.ok(!node.prev, 'disowned node has no prev');
      assert.ok(!node.next, 'disowned node has no next');
    }

    function assertSingleChild(parent, child) {
      assert.equal(parent.firstChild, child, 'parent.firstChild is child');
      assert.equal(parent.lastChild, child, 'parent.lastChild is child');
      assert.ok(!child.prev, 'child has no prev');
      assert.ok(!child.next, 'child has no next');
    }

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);
      child.disown();

      assert.ok(!parent.firstChild, 'parent has no firstChild');
      assert.ok(!parent.lastChild, 'parent has no lastChild');
      assertDisowned(child);
    });

    test('disowning the last child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      two.disown();

      assertSingleChild(parent, one);
      assertDisowned(two);
    });

    test('disowning the first child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      one.disown();

      assertSingleChild(parent, two);
      assertDisowned(one);
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

      assertDisowned(middle);
      assert.equal(prev.next, next, 'prev.next is next');
      assert.equal(next.prev, prev, 'next.prev is prev');
      assert.equal(parent.firstChild, prev, 'parent.firstChild is prev');
      assert.equal(parent.lastChild, next, 'parent.lastChild is next');
    });
  });
});
