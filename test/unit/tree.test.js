suite('tree', function () {
  suite('adopt', function () {
    function assertTwoChildren(parent, one, two) {
      assert.equal(one.parent, parent, 'one.parent is set');
      assert.equal(two.parent, parent, 'two.parent is set');

      assert.ok(!one[L], 'one has nothing leftward');
      assert.equal(one[R], two, 'one[R] is two');
      assert.equal(two[L], one, 'two[L] is one');
      assert.ok(!two[R], 'two has nothing rightward');

      assert.equal(parent.ends[L], one, 'parent.ends[L] is one');
      assert.equal(parent.ends[R], two, 'parent.ends[R] is two');
    }

    test('the empty case', function () {
      var parent = new MQNode();
      var child = new MQNode();

      child.adopt(parent, 0, 0);

      assert.equal(child.parent, parent, 'child.parent is set');
      assert.ok(!child[R], 'child has nothing rightward');
      assert.ok(!child[L], 'child has nothing leftward');

      assert.equal(parent.ends[L], child, 'child is parent.ends[L]');
      assert.equal(parent.ends[R], child, 'child is parent.ends[R]');
    });

    test('with two children from the left', function () {
      var parent = new MQNode();
      var one = new MQNode();
      var two = new MQNode();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      assertTwoChildren(parent, one, two);
    });

    test('with two children from the right', function () {
      var parent = new MQNode();
      var one = new MQNode();
      var two = new MQNode();

      two.adopt(parent, 0, 0);
      one.adopt(parent, 0, two);

      assertTwoChildren(parent, one, two);
    });

    test('adding one in the middle', function () {
      var parent = new MQNode();
      var leftward = new MQNode();
      var rightward = new MQNode();
      var middle = new MQNode();

      leftward.adopt(parent, 0, 0);
      rightward.adopt(parent, leftward, 0);
      middle.adopt(parent, leftward, rightward);

      assert.equal(middle.parent, parent, 'middle.parent is set');
      assert.equal(middle[L], leftward, 'middle[L] is set');
      assert.equal(middle[R], rightward, 'middle[R] is set');

      assert.equal(leftward[R], middle, 'leftward[R] is middle');
      assert.equal(rightward[L], middle, 'rightward[L] is middle');

      assert.equal(parent.ends[L], leftward, 'parent.ends[L] is leftward');
      assert.equal(parent.ends[R], rightward, 'parent.ends[R] is rightward');
    });
  });

  suite('disown', function () {
    function assertSingleChild(parent, child) {
      assert.equal(parent.ends[L], child, 'parent.ends[L] is child');
      assert.equal(parent.ends[R], child, 'parent.ends[R] is child');
      assert.ok(!child[L], 'child has nothing leftward');
      assert.ok(!child[R], 'child has nothing rightward');
    }

    test('the empty case', function () {
      var parent = new MQNode();
      var child = new MQNode();

      child.adopt(parent, 0, 0);
      child.disown();

      assert.ok(!parent.ends[L], 'parent has no left end child');
      assert.ok(!parent.ends[R], 'parent has no right end child');
    });

    test('disowning the right end child', function () {
      var parent = new MQNode();
      var one = new MQNode();
      var two = new MQNode();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      two.disown();

      assertSingleChild(parent, one);

      assert.equal(two.parent, parent, 'two retains its parent');
      assert.equal(two[L], one, 'two retains its [L]');

      assert.throws(function () {
        two.disown();
      }, 'disown fails on a malformed tree');
    });

    test('disowning the left end child', function () {
      var parent = new MQNode();
      var one = new MQNode();
      var two = new MQNode();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      one.disown();

      assertSingleChild(parent, two);

      assert.equal(one.parent, parent, 'one retains its parent');
      assert.equal(one[R], two, 'one retains its [R]');

      assert.throws(function () {
        one.disown();
      }, 'disown fails on a malformed tree');
    });

    test('disowning the middle', function () {
      var parent = new MQNode();
      var leftward = new MQNode();
      var rightward = new MQNode();
      var middle = new MQNode();

      leftward.adopt(parent, 0, 0);
      rightward.adopt(parent, leftward, 0);
      middle.adopt(parent, leftward, rightward);

      middle.disown();

      assert.equal(leftward[R], rightward, 'leftward[R] is rightward');
      assert.equal(rightward[L], leftward, 'rightward[L] is leftward');
      assert.equal(parent.ends[L], leftward, 'parent.ends[L] is leftward');
      assert.equal(parent.ends[R], rightward, 'parent.ends[R] is rightward');

      assert.equal(middle.parent, parent, 'middle retains its parent');
      assert.equal(middle[R], rightward, 'middle retains its [R]');
      assert.equal(middle[L], leftward, 'middle retains its [L]');

      assert.throws(function () {
        middle.disown();
      }, 'disown fails on a malformed tree');
    });
  });

  suite('fragments', function () {
    test('an empty fragment', function () {
      var empty = new Fragment();
      var count = 0;

      empty.each(function () {
        count += 1;
      });

      assert.equal(count, 0, 'each is a noop on an empty fragment');
    });

    test('half-empty fragments are disallowed', function () {
      assert.throws(function () {
        new Fragment(new MQNode(), 0);
      }, 'half-empty on the right');

      assert.throws(function () {
        new Fragment(0, new MQNode());
      }, 'half-empty on the left');
    });

    test('directionalized constructor call', function () {
      var ChNode = class extends MQNode {
        constructor(ch) {
          super();
          this.ch = ch;
        }
      };

      var parent = new MQNode();
      var a = new ChNode('a').adopt(parent, parent.ends[R], 0);
      var b = new ChNode('b').adopt(parent, parent.ends[R], 0);
      var c = new ChNode('c').adopt(parent, parent.ends[R], 0);
      var d = new ChNode('d').adopt(parent, parent.ends[R], 0);
      var e = new ChNode('e').adopt(parent, parent.ends[R], 0);

      function cat(str, node) {
        return str + node.ch;
      }
      assert.equal('bcd', new Fragment(b, d).fold('', cat));
      assert.equal('bcd', new Fragment(b, d, L).fold('', cat));
      assert.equal('bcd', new Fragment(d, b, R).fold('', cat));
      assert.throws(function () {
        new Fragment(d, b, L);
      });
      assert.throws(function () {
        new Fragment(b, d, R);
      });
    });

    test('disown is idempotent', function () {
      var parent = new MQNode();
      var one = new MQNode().adopt(parent, 0, 0);
      var two = new MQNode().adopt(parent, one, 0);

      var frag = new Fragment(one, two);
      frag.disown();
      frag.disown();
    });
  });
});
