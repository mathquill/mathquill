suite('tree', function() {
  suite('adopt', function() {
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

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);

      assert.equal(child.parent, parent, 'child.parent is set');
      assert.ok(!child[R], 'child has nothing rightward');
      assert.ok(!child[L], 'child has nothing leftward');

      assert.equal(parent.ends[L], child, 'child is parent.ends[L]');
      assert.equal(parent.ends[R], child, 'child is parent.ends[R]');
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
      var leftward = Node();
      var rightward = Node();
      var middle = Node();

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

  suite('disown', function() {
    function assertSingleChild(parent, child) {
      assert.equal(parent.ends[L], child, 'parent.ends[L] is child');
      assert.equal(parent.ends[R], child, 'parent.ends[R] is child');
      assert.ok(!child[L], 'child has nothing leftward');
      assert.ok(!child[R], 'child has nothing rightward');
    }

    test('the empty case', function() {
      var parent = Node();
      var child = Node();

      child.adopt(parent, 0, 0);
      child.disown();

      assert.ok(!parent.ends[L], 'parent has no left end child');
      assert.ok(!parent.ends[R], 'parent has no right end child');
    });

    test('disowning the right end child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      two.disown();

      assertSingleChild(parent, one);

      assert.equal(two.parent, parent, 'two retains its parent');
      assert.equal(two[L], one, 'two retains its [L]');

      assert.throws(function() { two.disown(); },
                    'disown fails on a malformed tree');
    });

    test('disowning the left end child', function() {
      var parent = Node();
      var one = Node();
      var two = Node();

      one.adopt(parent, 0, 0);
      two.adopt(parent, one, 0);

      one.disown();

      assertSingleChild(parent, two);

      assert.equal(one.parent, parent, 'one retains its parent');
      assert.equal(one[R], two, 'one retains its [R]');

      assert.throws(function() { one.disown(); },
                    'disown fails on a malformed tree');
    });

    test('disowning the middle', function() {
      var parent = Node();
      var leftward = Node();
      var rightward = Node();
      var middle = Node();

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

    test('directionalized constructor call', function() {
      var ChNode = P(Node, { init: function(ch) { this.ch = ch; } });
      var parent = Node();
      var a = ChNode('a').adopt(parent, parent.ends[R], 0);
      var b = ChNode('b').adopt(parent, parent.ends[R], 0);
      var c = ChNode('c').adopt(parent, parent.ends[R], 0);
      var d = ChNode('d').adopt(parent, parent.ends[R], 0);
      var e = ChNode('e').adopt(parent, parent.ends[R], 0);

      function cat(str, node) { return str + node.ch; }
      assert.equal('bcd', Fragment(b, d).fold('', cat));
      assert.equal('bcd', Fragment(b, d, L).fold('', cat));
      assert.equal('bcd', Fragment(d, b, R).fold('', cat));
      assert.throws(function() { Fragment(d, b, L); });
      assert.throws(function() { Fragment(b, d, R); });
    });

    test('disown is idempotent', function() {
      var parent = Node();
      var one = Node().adopt(parent, 0, 0);
      var two = Node().adopt(parent, one, 0);

      var frag = Fragment(one, two);
      frag.disown();
      frag.disown();
    });

    suite('Fragment.between()', function() {
      function assertFragmentBetween(A, B, leftEnd, rightEnd) {
        rightEnd = rightEnd || leftEnd;

        (function eitherOrder(A, B) {

          var frag = Fragment.between(A, B);
          assert.equal(frag.ends[L], leftEnd);
          assert.equal(frag.ends[R], rightEnd);

          return eitherOrder;
        }(A, B)(B, A));
      }

      var parent = Node();
      var child1 = Node().adopt(parent, parent.ends[R], 0);
      var child2 = Node().adopt(parent, parent.ends[R], 0);
      var child3 = Node().adopt(parent, parent.ends[R], 0);
      var A = Point(parent, 0, child1);
      var B = Point(parent, child1, child2);
      var C = Point(parent, child2, child3);
      var D = Point(parent, child3, 0);
      var pt1 = Point(child1, 0, 0);
      var pt2 = Point(child2, 0, 0);
      var pt3 = Point(child3, 0, 0);

      test('same parent, one Node', function() {
        assertFragmentBetween(A, B, child1);
        assertFragmentBetween(B, C, child2);
        assertFragmentBetween(C, D, child3);
      });

      test('same Parent, many Nodes', function() {
        assertFragmentBetween(A, C, child1, child2);
        assertFragmentBetween(A, D, child1, child3);
        assertFragmentBetween(B, D, child2, child3);
      });

      test('Point next to parent of other Point', function() {
        assertFragmentBetween(A, pt1, child1);
        assertFragmentBetween(B, pt1, child1);

        assertFragmentBetween(B, pt2, child2);
        assertFragmentBetween(C, pt2, child2);

        assertFragmentBetween(C, pt3, child3);
        assertFragmentBetween(D, pt3, child3);
      });

      test('Points\' parents are siblings', function() {
        assertFragmentBetween(pt1, pt2, child1, child2);
        assertFragmentBetween(pt2, pt3, child2, child3);
        assertFragmentBetween(pt1, pt3, child1, child3);
      });

      test('Point is sibling of parent of other Point', function() {
        assertFragmentBetween(A, pt2, child1, child2);
        assertFragmentBetween(A, pt3, child1, child3);
        assertFragmentBetween(B, pt3, child2, child3);
        assertFragmentBetween(pt1, D, child1, child3);
        assertFragmentBetween(pt1, C, child1, child2);
      });

      test('same Point', function() {
        assert.throws(function() {
          var A2 = Point(parent, 0, child1);
          Fragment.between(A, A2);
        });
      });

      test('different trees', function() {
        var anotherTree = Node();
        var pt = Point(anotherTree, 0, 0);
        assert.throws(function() { Fragment.between(pt, A); });
        assert.throws(function() { Fragment.between(A, pt); });
      });
    });
  });
});
