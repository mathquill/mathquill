suite('Cursor::select()', function() {
  var cursor = Cursor();
  cursor.selectionChanged = noop;

  function assertSelection(A, B, leftEnd, rightEnd) {
    var lca = leftEnd.parent, frag = Fragment(leftEnd, rightEnd || leftEnd);

    (function eitherOrder(A, B) {

      var count = 0;
      lca.selectChildren = function(leftEnd, rightEnd) {
        count += 1;
        assert.equal(frag.ends[L], leftEnd);
        assert.equal(frag.ends[R], rightEnd);
        return Node.p.selectChildren.apply(this, arguments);
      };

      Point.p.init.call(cursor, A.parent, A[L], A[R]);
      cursor.startSelection();
      Point.p.init.call(cursor, B.parent, B[L], B[R]);
      assert.equal(cursor.select(), true);
      assert.equal(count, 1);

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
    assertSelection(A, B, child1);
    assertSelection(B, C, child2);
    assertSelection(C, D, child3);
  });

  test('same Parent, many Nodes', function() {
    assertSelection(A, C, child1, child2);
    assertSelection(A, D, child1, child3);
    assertSelection(B, D, child2, child3);
  });

  test('Point next to parent of other Point', function() {
    assertSelection(A, pt1, child1);
    assertSelection(B, pt1, child1);

    assertSelection(B, pt2, child2);
    assertSelection(C, pt2, child2);

    assertSelection(C, pt3, child3);
    assertSelection(D, pt3, child3);
  });

  test('Points\' parents are siblings', function() {
    assertSelection(pt1, pt2, child1, child2);
    assertSelection(pt2, pt3, child2, child3);
    assertSelection(pt1, pt3, child1, child3);
  });

  test('Point is sibling of parent of other Point', function() {
    assertSelection(A, pt2, child1, child2);
    assertSelection(A, pt3, child1, child3);
    assertSelection(B, pt3, child2, child3);
    assertSelection(pt1, D, child1, child3);
    assertSelection(pt1, C, child1, child2);
  });

  test('same Point', function() {
    Point.p.init.call(cursor, A.parent, A[L], A[R]);
    cursor.startSelection();
    assert.equal(cursor.select(), false);
  });

  test('different trees', function() {
    var anotherTree = Node();

    Point.p.init.call(cursor, A.parent, A[L], A[R]);
    cursor.startSelection();
    Point.p.init.call(cursor, anotherTree, 0, 0);
    assert.throws(function() { cursor.select(); });

    Point.p.init.call(cursor, anotherTree, 0, 0);
    cursor.startSelection();
    Point.p.init.call(cursor, A.parent, A[L], A[R]);
    assert.throws(function() { cursor.select(); });
  });
});
