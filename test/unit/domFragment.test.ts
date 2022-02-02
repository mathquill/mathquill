suite('DOMFragment', function () {
  function nodeArraysEqual(arr1: ChildNode[], arr2: ChildNode[]) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  function fragmentsEqual(frag1: DOMFragment, frag2: DOMFragment) {
    return nodeArraysEqual(frag1.toNodeArray(), frag2.toNodeArray());
  }

  suite('DOMFragment.create factory function', () => {
    test('DOMFragment.create is aliased to domFrag', () => {
      assert.ok(domFrag === DOMFragment.create);
    });

    test('domFrag() creates an empty fragment', () => {
      assert.ok(domFrag().isEmpty());
    });

    test('domFrag(el) creates a one element fragment', () => {
      const el = h('span');
      assert.equal(domFrag(el).oneElement(), el);
    });

    test('domFrag(text) can hold a text node', () => {
      const el = h.text('text');
      assert.equal(domFrag(el).oneText(), el);
    });

    test('domFrag(el1, el2) throws an error if elements are not siblings', () => {
      const el1 = h('span');
      const el2 = h('span');
      assert.throws(() => domFrag(el1, el2));
    });

    test('domFrag(el, undefined) throws', () => {
      const el = h('span');
      assert.throws(() => domFrag(el, undefined));
    });

    test('domFrag(undefined, el) throws', () => {
      const el = h('span');
      assert.throws(() => domFrag(undefined, el));
    });

    test('domFrag(el1, el2) represents all siblings between el1 and el2', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      const frag = domFrag(parent.firstChild!, parent.lastChild!);

      assert.ok(nodeArraysEqual(frag.toNodeArray(), children));
    });

    test('domFrag(el1, el2) does not include other children of the common parent', () => {
      const children = [
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
      ];
      // Insert children into a parent to make them siblings
      h('span', {}, children);

      const innerChildren = children.slice(1, 4);
      const frag = domFrag(
        innerChildren[0],
        innerChildren[innerChildren.length - 1]
      );

      assert.ok(nodeArraysEqual(frag.toNodeArray(), innerChildren));
    });
  });

  test('.isEmpty()', () => {
    assert.ok(domFrag().isEmpty());
    assert.ok(!domFrag(h('span')).isEmpty());
  });

  suite('.isValid()', () => {
    test('empty fragments are always valid', () => {
      assert.ok(domFrag().isValid());
    });
    test('single element fragments are always valid', () => {
      assert.ok(domFrag(h('span')).isValid());
    });
    test('moving an end of a multi-element fragment invalidates it', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      const frag = domFrag(children[0], children[1]);
      assert.ok(frag.isValid());
      parent.removeChild(parent.lastChild!);
      assert.ok(!frag.isValid());
    });
  });

  suite('.firstNode()', () => {
    test('throws when called on an empty fragment', () => {
      assert.throws(() => domFrag().firstNode());
    });
    test('works for a single element fragment', () => {
      const el = h('span');
      assert.equal(domFrag(el).firstNode(), el);
    });
    test('works for a single text Node fragment', () => {
      const el = h.text('text');
      assert.equal(domFrag(el).firstNode(), el);
    });
    test('works for a multi-element fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      // insert children into a parent so that thehy are siblings
      h('span', {}, children);
      const frag = domFrag(children[0], children[children.length - 1]);
      assert.equal(frag.firstNode(), children[0]);
    });
  });

  suite('.lastNode()', () => {
    test('throws when called on an empty fragment', () => {
      assert.throws(() => domFrag().lastNode());
    });
    test('works for a single element fragment', () => {
      const el = h('span');
      assert.equal(domFrag(el).lastNode(), el);
    });
    test('works for a single text Node fragment', () => {
      const el = h.text('text');
      assert.equal(domFrag(el).lastNode(), el);
    });
    test('works for a multi-element fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      // insert children into a parent so that thehy are siblings
      h('span', {}, children);
      const frag = domFrag(children[0], children[children.length - 1]);
      assert.equal(frag.lastNode(), children[children.length - 1]);
    });
  });

  suite('.children()', () => {
    test('throws when called on an empty fragment', () => {
      assert.throws(() => domFrag().children());
    });
    test('throws when called on a fragment with many nodes', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.throws(() => domFrag(parent).children().children());
    });
    test('returns an empty fragment when called on a fragment holding an element with no children', () => {
      assert.ok(domFrag(h('span')).children().isEmpty());
    });
    test('returns an empty fragment when called on a fragment a Text node', () => {
      assert.ok(domFrag(h.text('text')).children().isEmpty());
    });
    test('returns a fragment representing all children', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });
  });

  suite('.join()', () => {
    test('joining two empty fragments', () => {
      assert.ok(domFrag().join(domFrag()).isEmpty());
    });

    test('joining an empty fragment returns original fragment', () => {
      const frag = domFrag(h('span'));
      assert.ok(fragmentsEqual(frag.join(domFrag()), frag));
    });

    test('joining to an empty fragment returns the argument', () => {
      const frag = domFrag(h('span'));
      assert.ok(fragmentsEqual(domFrag().join(frag), frag));
    });

    test('Joining fragments that are not siblings throws', () => {
      const frag1 = domFrag(h('span'));
      const frag2 = domFrag(h('span'));
      assert.throws(() => frag1.join(frag2));
    });

    test('Joining a fragment to itself is a noop', () => {
      const el = h('span');
      assert.equal(domFrag(el).join(domFrag(el)).oneElement(), el);
    });

    test('Joining fragments that are siblings but not directional siblings throws', () => {
      const children = [h('span'), h.text('text'), h('span')];
      // Insert children into a parent to make them siblings;
      h('span', {}, children);
      assert.throws(() => domFrag(children[2]).join(domFrag(children[0])));
      assert.throws(() =>
        domFrag(children[0], children[2]).join(domFrag(children[1]))
      );
      assert.throws(() =>
        domFrag(children[2]).join(domFrag(children[0], children[2]))
      );
    });

    test('Joining fragments represents the closure of their union', () => {
      const children = [
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
      ];
      // Insert children into a parent to make them siblings
      h('span', {}, children);

      const frag1 = domFrag(children[1], children[3]);
      const frag2 = domFrag(children[5], children[6]);
      const expected = domFrag(children[1], children[6]);

      assert.ok(fragmentsEqual(frag1.join(frag2), expected));
    });
  });

  suite('.oneNode()', () => {
    test('throws for empty fragments', () => {
      assert.throws(() => domFrag().oneNode());
    });

    test('for many node fragments', () => {
      const el = h('span', {}, [h('span'), h('span')]);
      assert.throws(() => domFrag(el).children().oneNode());
    });

    test('returns a single Element node', () => {
      const el = h('span');
      assert.equal(domFrag(el).oneNode(), el);
    });

    test('returns a single Text node', () => {
      const el = h.text('text');
      assert.equal(domFrag(el).oneNode(), el);
    });
  });

  suite('.oneElement()', () => {
    test('throws for empty fragments', () => {
      assert.throws(() => domFrag().oneElement());
    });

    test('for many node fragments', () => {
      const el = h('span', {}, [h('span'), h('span')]);
      assert.throws(() => domFrag(el).children().oneElement());
    });

    test('returns a single Element node', () => {
      const el = h('span');
      assert.equal(domFrag(el).oneElement(), el);
    });

    test('throws for a single Text node', () => {
      const el = h.text('text');
      assert.throws(() => domFrag(el).oneElement());
    });
  });

  suite('.oneText()', () => {
    test('throws for empty fragments', () => {
      assert.throws(() => domFrag().oneText());
    });

    test('for many node fragments', () => {
      const el = h('span', {}, [h.text('a'), h.text('b')]);
      assert.throws(() => domFrag(el).children().oneText());
    });

    test('throws for a single Element node', () => {
      const el = h('span');
      assert.throws(() => domFrag(el).oneText());
    });

    test('returns a single Text node', () => {
      const el = h.text('text');
      assert.equal(domFrag(el).oneText(), el);
    });
  });

  suite('.eachNode()', () => {
    test('never calls its argument for an empty fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag().eachNode(cb);
      assert.equal(count, 0);
    });

    test('calls its argument once for a one element fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag(h('span')).eachNode(cb);
      assert.equal(count, 1);
    });

    test('calls its argument once for a one node fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag(h.text('a')).eachNode(cb);
      assert.equal(count, 1);
    });

    test('calls its argument once for each node of a multi node fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);

      const accum: ChildNode[] = [];
      domFrag(parent)
        .children()
        .eachNode((node) => accum.push(node));

      assert.ok(nodeArraysEqual(accum, children));
    });
  });

  suite('.eachElement()', () => {
    test('never calls its argument for an empty fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag().eachElement(cb);
      assert.equal(count, 0);
    });

    test('calls its argument once for a one element fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag(h('span')).eachElement(cb);
      assert.equal(count, 1);
    });

    test('never calls its argument once for a one text node fragment', () => {
      let count = 0;
      function cb() {
        count += 1;
      }
      domFrag(h.text('a')).eachElement(cb);
      assert.equal(count, 0);
    });

    test('calls its argument once for each element of a multi node fragment', () => {
      const children = [h.text('text'), h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);

      const accum: ChildNode[] = [];
      domFrag(parent)
        .children()
        .eachElement((node) => accum.push(node));

      assert.ok(nodeArraysEqual([children[1], children[3]], accum));
    });
  });

  suite('.text()', () => {
    test('returns empty string for an empty fragment', () => {
      assert.equal(domFrag().text(), '');
    });

    test('returns the text content of a single text node', () => {
      assert.equal(domFrag(h.text('abc')).text(), 'abc');
    });

    test('returns the concatenated of multi-node fragments', () => {
      const el = h('span', {}, [
        h.text('a'),
        h('span', {}, [h.text('b'), h.text('c')]),
        h('span'),
      ]);
      assert.equal(domFrag(el).text(), 'abc');
      assert.equal(domFrag(el).children().text(), 'abc');
    });
  });

  suite('.toNodeArray()', () => {
    test('returns an empty array for an empty fragment', () => {
      assert.ok(nodeArraysEqual(domFrag().toNodeArray(), []));
    });

    test('returns a one node array for a one element fragment', () => {
      const el = h('span');
      assert.ok(nodeArraysEqual(domFrag(el).toNodeArray(), [el]));
    });

    test('returns a one node array for a one text node fragment', () => {
      const el = h.text('a');
      assert.ok(nodeArraysEqual(domFrag(el).toNodeArray(), [el]));
    });

    test('returns an array of each node in a multi-node fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });
  });

  suite('.toElementArray()', () => {
    test('returns an empty array for an empty fragment', () => {
      assert.ok(nodeArraysEqual(domFrag().toElementArray(), []));
    });

    test('returns a one node array for a one element fragment', () => {
      const el = h('span');
      assert.ok(nodeArraysEqual(domFrag(el).toElementArray(), [el]));
    });

    test('returns an empty array for a one text node fragment', () => {
      const el = h.text('a');
      assert.ok(nodeArraysEqual(domFrag(el).toElementArray(), []));
    });

    test('returns an array of each element in a multi-node fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      const expected = [children[0], children[2]];
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toElementArray(), expected)
      );
    });
  });

  suite('.toDocumentFragment()', () => {
    test('returns an empty DocumentFragment for an empty fragment', () => {
      assert.ok(domFrag().toDocumentFragment().firstChild === null);
    });

    test('moves all nodes in the fragment into a document fragment and returns it', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.equal(parent.firstChild, children[0]);
      const docFrag = domFrag(parent).children().toDocumentFragment();
      assert.equal(parent.firstChild, null);
      assert.ok(
        nodeArraysEqual(
          domFrag(docFrag.firstChild!, docFrag.lastChild!).toNodeArray(),
          children
        )
      );
    });
  });

  suite('.insertBefore()', () => {
    test('is a noop when called on an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag().insertBefore(domFrag(parent).children()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('detaches this fragment when called with an empty fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        !domFrag(parent).children().isEmpty(),
        'parent starts off with children'
      );
      assert.ok(domFrag(parent).children().insertBefore(domFrag()).isValid());
      assert.ok(
        domFrag(parent).children().isEmpty(),
        'inserting the parents children somewhere else removes them from parent'
      );
    });

    test('detaches this fragment when called with a parentless fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        !domFrag(parent).children().isEmpty(),
        'parent starts off with children'
      );
      assert.ok(
        domFrag(parent)
          .children()
          .insertBefore(domFrag(h('span')))
          .isValid()
      );
      assert.ok(
        domFrag(parent).children().isEmpty(),
        'inserting the parents children somewhere else removes them from parent'
      );
    });

    test('works correctly with single node targets', () => {
      const nTargetChildren = 3;
      for (let i = 0; i < nTargetChildren; i++) {
        const sourceChildren = [h('span'), h.text('a'), h('span')];
        const sourceParent = h('span', {}, sourceChildren);
        const targetChildren = [h('span'), h.text('a'), h('span')];
        assert.equal(nTargetChildren, targetChildren.length);
        const targetParent = h('span', {}, targetChildren);
        assert.ok(
          !domFrag(sourceParent).children().isEmpty(),
          'source parent starts off with children'
        );
        const targetFrag = domFrag(
          domFrag(targetParent).children().toNodeArray()[i]
        );
        assert.ok(
          domFrag(sourceParent).children().insertBefore(targetFrag).isValid()
        );
        assert.ok(
          domFrag(sourceParent).children().isEmpty(),
          'source parent has no children after they are moved'
        );
        assert.ok(
          nodeArraysEqual(
            domFrag(targetParent).children().toNodeArray(),
            targetChildren
              .slice(0, i)
              .concat(sourceChildren)
              .concat(targetChildren.slice(i))
          )
        );
      }
    });

    test('works correctly with multi node targets', () => {
      const nTargetChildren = 3;
      for (let i = 0; i < nTargetChildren; i++) {
        const sourceChildren = [h('span'), h.text('a'), h('span')];
        const sourceParent = h('span', {}, sourceChildren);
        const targetChildren = [h('span'), h.text('a'), h('span')];
        assert.equal(nTargetChildren, targetChildren.length);
        const targetParent = h('span', {}, targetChildren);
        assert.ok(
          !domFrag(sourceParent).children().isEmpty(),
          'source parent starts off with children'
        );
        const targetNodeArray = domFrag(targetParent).children().toNodeArray();
        // This makes a sliding window of two adjacent sibling nodes
        const targetFrag = domFrag(
          targetNodeArray[i],
          targetNodeArray[Math.min(i + 1, nTargetChildren - 1)]
        );
        assert.ok(
          domFrag(sourceParent).children().insertBefore(targetFrag).isValid()
        );
        assert.ok(
          domFrag(sourceParent).children().isEmpty(),
          'source parent has no children after they are moved'
        );
        assert.ok(
          nodeArraysEqual(
            domFrag(targetParent).children().toNodeArray(),
            targetChildren
              .slice(0, i)
              .concat(sourceChildren)
              .concat(targetChildren.slice(i))
          )
        );
      }
    });
  });

  suite('.insertAfter()', () => {
    test('is a noop when called on an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag().insertAfter(domFrag(parent).children()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('detaches this fragment when called with an empty fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        !domFrag(parent).children().isEmpty(),
        'parent starts off with children'
      );
      assert.ok(domFrag(parent).children().insertAfter(domFrag()).isValid());
      assert.ok(
        domFrag(parent).children().isEmpty(),
        'inserting the parents children somewhere else removes them from parent'
      );
    });

    test('detaches this fragment when called with a parentless fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        !domFrag(parent).children().isEmpty(),
        'parent starts off with children'
      );
      assert.ok(
        domFrag(parent)
          .children()
          .insertAfter(domFrag(h('span')))
          .isValid()
      );
      assert.ok(
        domFrag(parent).children().isEmpty(),
        'inserting the parents children somewhere else removes them from parent'
      );
    });

    test('works correctly with single node targets', () => {
      const nTargetChildren = 3;
      for (let i = 0; i < nTargetChildren; i++) {
        const sourceChildren = [h('span'), h.text('a'), h('span')];
        const sourceParent = h('span', {}, sourceChildren);
        const targetChildren = [h('span'), h.text('a'), h('span')];
        assert.equal(nTargetChildren, targetChildren.length);
        const targetParent = h('span', {}, targetChildren);
        assert.ok(
          !domFrag(sourceParent).children().isEmpty(),
          'source parent starts off with children'
        );
        const targetFrag = domFrag(
          domFrag(targetParent).children().toNodeArray()[i]
        );
        assert.ok(
          domFrag(sourceParent).children().insertAfter(targetFrag).isValid()
        );
        assert.ok(
          domFrag(sourceParent).children().isEmpty(),
          'source parent has no children after they are moved'
        );
        assert.ok(
          nodeArraysEqual(
            domFrag(targetParent).children().toNodeArray(),
            targetChildren
              .slice(0, i + 1)
              .concat(sourceChildren)
              .concat(targetChildren.slice(i + 1))
          )
        );
      }
    });

    test('works correctly with multi node targets', () => {
      const nTargetChildren = 3;
      for (let i = 0; i < nTargetChildren; i++) {
        const sourceChildren = [h('span'), h.text('a'), h('span')];
        const sourceParent = h('span', {}, sourceChildren);
        const targetChildren = [h('span'), h.text('a'), h('span')];
        assert.equal(nTargetChildren, targetChildren.length);
        const targetParent = h('span', {}, targetChildren);
        assert.ok(
          !domFrag(sourceParent).children().isEmpty(),
          'source parent starts off with children'
        );
        const targetNodeArray = domFrag(targetParent).children().toNodeArray();
        // This makes a sliding window of two adjacent sibling nodes
        const targetFrag = domFrag(
          targetNodeArray[Math.max(i - 1, 0)],
          targetNodeArray[i]
        );
        assert.ok(
          domFrag(sourceParent).children().insertAfter(targetFrag).isValid()
        );
        assert.ok(
          domFrag(sourceParent).children().isEmpty(),
          'source parent has no children after they are moved'
        );
        assert.ok(
          nodeArraysEqual(
            domFrag(targetParent).children().toNodeArray(),
            targetChildren
              .slice(0, i + 1)
              .concat(sourceChildren)
              .concat(targetChildren.slice(i + 1))
          )
        );
      }
    });
  });

  suite('.append()', () => {
    test('is a noop when called with an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag(parent).append(domFrag()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('throws on attempt to target an empty fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.throws(() => {
        domFrag().append(domFrag(parent).children());
      });
    });

    test('throws on attempt to target a multi-node fragment', () => {
      const sourceChildren = [h('span'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.throws(() => {
        domFrag(targetParent)
          .children()
          .append(domFrag(sourceParent).children());
      });
    });

    test('throws on attempt to target a non-Element Node', () => {
      const sourceChildren = [h('span'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h.text('text');
      assert.throws(() => {
        domFrag(target).append(domFrag(sourceParent).children());
      });
    });

    test('works correctly on target with no children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h('span');
      assert.ok(domFrag(target).children().isEmpty());
      assert.ok(
        domFrag(target).append(domFrag(sourceParent).children()).isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(target).children().toNodeArray(),
          sourceChildren
        ),
        'all source children moved to target children'
      );
    });

    test('works correctly on target with children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren
        )
      );
      assert.ok(
        domFrag(targetParent).append(domFrag(sourceParent).children()).isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren.concat(sourceChildren)
        ),
        'all source children moved to target children'
      );
    });
  });

  suite('.prepend()', () => {
    test('is a noop when called with an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag(parent).prepend(domFrag()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('throws on attempt to target an empty fragment', () => {
      const children = [h('span'), h('span')];
      const parent = h('span', {}, children);
      assert.throws(() => {
        domFrag().prepend(domFrag(parent).children());
      });
    });

    test('throws on attempt to target a multi-node fragment', () => {
      const sourceChildren = [h('span'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.throws(() => {
        domFrag(targetParent)
          .children()
          .prepend(domFrag(sourceParent).children());
      });
    });

    test('throws on attempt to target a non-Element Node', () => {
      const sourceChildren = [h('span'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h.text('text');
      assert.throws(() => {
        domFrag(target).prepend(domFrag(sourceParent).children());
      });
    });

    test('works correctly on target with no children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h('span');
      assert.ok(domFrag(target).children().isEmpty());
      assert.ok(
        domFrag(target).prepend(domFrag(sourceParent).children()).isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(target).children().toNodeArray(),
          sourceChildren
        ),
        'all source children moved to target children'
      );
    });

    test('works correctly on target with children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren
        )
      );
      assert.ok(
        domFrag(targetParent)
          .prepend(domFrag(sourceParent).children())
          .isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          sourceChildren.concat(targetChildren)
        ),
        'all source children moved to target children'
      );
    });
  });

  suite('.appendTo()', () => {
    test('is a noop when this is an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag().appendTo(domFrag(parent).oneElement()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('works correctly on target with no children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h('span');
      assert.ok(domFrag(target).children().isEmpty());
      assert.ok(
        domFrag(sourceParent)
          .children()
          .appendTo(domFrag(target).oneElement())
          .isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(target).children().toNodeArray(),
          sourceChildren
        ),
        'all source children moved to target children'
      );
    });

    test('works correctly on target with children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren
        )
      );
      assert.ok(
        domFrag(sourceParent)
          .children()
          .appendTo(domFrag(targetParent).oneElement())
          .isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren.concat(sourceChildren)
        ),
        'all source children moved to target children'
      );
    });
  });

  suite('.prependTo()', () => {
    test('is a noop when this is an empty fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
      assert.ok(domFrag().prependTo(domFrag(parent).oneElement()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(parent).children().toNodeArray(), children)
      );
    });

    test('works correctly on target with no children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const target = h('span');
      assert.ok(domFrag(target).children().isEmpty());
      assert.ok(
        domFrag(sourceParent)
          .children()
          .prependTo(domFrag(target).oneElement())
          .isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(target).children().toNodeArray(),
          sourceChildren
        ),
        'all source children moved to target children'
      );
    });

    test('works correctly on target with children', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          targetChildren
        )
      );
      assert.ok(
        domFrag(sourceParent)
          .children()
          .prependTo(domFrag(targetParent).oneElement())
          .isValid()
      );
      assert.ok(
        domFrag(sourceParent).children().isEmpty(),
        'source parent has no children after moving them'
      );
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          sourceChildren.concat(targetChildren)
        ),
        'all source children moved to target children'
      );
    });
  });

  suite('.parent()', () => {
    test('returns an empty fragment when this is an empty fragment', () => {
      assert.ok(domFrag().parent().isEmpty());
    });
    test('returns an empty fragment when this is a fragment with no parent', () => {
      assert.ok(domFrag(h('span')).parent().isEmpty());
    });
    test('returns the parent of a one element fragment', () => {
      const children = [h('span')];
      const parent = h('span', {}, children);
      assert.equal(domFrag(parent).children().parent().oneElement(), parent);
    });
    test('returns the parent of a one text node fragment', () => {
      const children = [h.text('text')];
      const parent = h('span', {}, children);
      assert.equal(domFrag(parent).children().parent().oneElement(), parent);
    });
    test('returns the parent of a multi-element fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.equal(domFrag(parent).children().parent().oneElement(), parent);
    });
  });

  suite('.wrapAll()', () => {
    test("removes all of target's children when called with an empty fragment", () => {
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const target = h('span', {}, targetChildren);
      assert.ok(!domFrag(target).children().isEmpty());
      assert.ok(domFrag().wrapAll(domFrag(target).oneElement()).isValid());
      assert.ok(domFrag(target).children().isEmpty());
    });
    test("replaces target's children with this fragment and places target into the DOM at the previous location of this fragment", () => {
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const target = h('span', {}, targetChildren);
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      // Wrap only the last two source children
      const frag = domFrag(sourceChildren[1], sourceChildren[2]);
      assert.ok(frag.wrapAll(domFrag(target).oneElement()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(sourceParent).children().toNodeArray(), [
          sourceChildren[0],
          target,
        ])
      );
      assert.ok(
        nodeArraysEqual(domFrag(target).children().toNodeArray(), [
          sourceChildren[1],
          sourceChildren[2],
        ])
      );
    });
  });

  suite('.replaceWith()', () => {
    test('detaches source when this is an empty fragment', () => {
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);
      assert.ok(!domFrag(sourceParent).children().isEmpty());
      assert.ok(
        domFrag().replaceWith(domFrag(sourceParent).children()).isValid()
      );
      assert.ok(domFrag(sourceParent).children().isEmpty());
    });

    test('detaches this fragment when called with an empty fragment', () => {
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);

      // This fragment represents only the final two target children
      const frag = domFrag(targetChildren[1], targetChildren[2]);
      assert.ok(frag.replaceWith(domFrag()).isValid());
      assert.ok(
        nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), [
          targetChildren[0],
        ])
      );
    });

    test('replaces this fragment with the fragment it is called with', () => {
      const targetChildren = [h('span'), h.text('text'), h('span')];
      const targetParent = h('span', {}, targetChildren);
      const sourceChildren = [h('span'), h.text('text'), h('span')];
      const sourceParent = h('span', {}, sourceChildren);

      // This fragment represents only the final two target children
      const frag = domFrag(targetChildren[1], targetChildren[2]);
      assert.ok(!domFrag(sourceParent).children().isEmpty());
      assert.ok(frag.replaceWith(domFrag(sourceParent).children()).isValid());
      assert.ok(domFrag(sourceParent).children().isEmpty());
      assert.ok(
        nodeArraysEqual(
          domFrag(targetParent).children().toNodeArray(),
          [targetChildren[0]].concat(sourceChildren)
        )
      );
    });
  });

  suite('.nthElement()', () => {
    test('returns undefined when this is an empty fragments', () => {
      assert.equal(domFrag().nthElement(0), undefined);
      assert.equal(domFrag().nthElement(1), undefined);
      assert.equal(domFrag().nthElement(-1), undefined);
    });
    test('returns undefined when this fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.equal(frag.nthElement(0), undefined);
      assert.equal(frag.nthElement(1), undefined);
      assert.equal(frag.nthElement(-1), undefined);
    });
    test('returns undefined when there is no nth element of a multi-element fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.equal(frag.nthElement(-1), undefined);
      assert.equal(frag.nthElement(0.5), undefined);
      assert.equal(frag.nthElement(3), undefined);
    });
    test('returns the nth element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      const elements = [children[1], children[3]];
      for (let i = 0; i < elements.length; i++) {
        assert.equal(frag.nthElement(i), elements[i]);
      }
    });
  });

  suite('.firstElement()', () => {
    test('returns undefined when this is an empty fragments', () => {
      assert.equal(domFrag().firstElement(), undefined);
    });
    test('returns undefined when this fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.equal(frag.firstElement(), undefined);
    });
    test('returns the first element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.equal(frag.firstElement(), children[1]);
    });
  });

  suite('.lastElement()', () => {
    test('returns undefined when this is an empty fragments', () => {
      assert.equal(domFrag().lastElement(), undefined);
    });
    test('returns undefined when this fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.equal(frag.lastElement(), undefined);
    });
    test('returns the last element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.equal(frag.lastElement(), children[3]);
    });
  });

  suite('.first()', () => {
    test('returns an empty fragment is an empty fragments', () => {
      assert.ok(domFrag().first().isEmpty());
    });
    test('returns an empty fragment fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.ok(frag.first().isEmpty());
    });
    test('returns a fragment representing first element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.equal(frag.first().oneElement(), children[1]);
    });
  });

  suite('.last()', () => {
    test('returns an empty fragment is an empty fragments', () => {
      assert.ok(domFrag().last().isEmpty());
    });
    test('returns an empty fragment fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.ok(frag.last().isEmpty());
    });
    test('returns a fragment representing last element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.equal(frag.last().oneElement(), children[3]);
    });
  });

  suite('.eq()', () => {
    test('returns an empty fragment when this is an empty fragments', () => {
      assert.ok(domFrag().eq(0).isEmpty());
      assert.ok(domFrag().eq(1).isEmpty());
      assert.ok(domFrag().eq(-1).isEmpty());
    });
    test('returns an empty fragment when this fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.ok(frag.eq(0).isEmpty());
      assert.ok(frag.eq(1).isEmpty());
      assert.ok(frag.eq(-1).isEmpty());
    });
    test('returns an empty fragment when there is no nth element of a multi-element fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.ok(frag.eq(-1).isEmpty());
      assert.ok(frag.eq(0.5).isEmpty());
      assert.ok(frag.eq(3).isEmpty());
    });
    test('returns a fragment holding the nth element of a multi-element collection', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      const elements = [children[1], children[3]];
      for (let i = 0; i < elements.length; i++) {
        assert.equal(frag.eq(i).oneElement(), elements[i]);
      }
    });
  });

  suite('.slice()', () => {
    test('returns an empty fragment when this is an empty fragments', () => {
      assert.ok(domFrag().slice(0).isEmpty());
      assert.ok(domFrag().slice(1).isEmpty());
      assert.ok(domFrag().slice(-1).isEmpty());
    });
    test('returns an empty fragment when this fragment contains only non-Element nodes', () => {
      const frag = domFrag(h.text('text'));
      assert.ok(frag.slice(0).isEmpty());
      assert.ok(frag.slice(1).isEmpty());
      assert.ok(frag.slice(-1).isEmpty());
    });
    test('returns an empty fragment when there is no nth element of a multi-element fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.ok(frag.slice(-1).isEmpty());
      assert.ok(frag.slice(0.5).isEmpty());
      assert.ok(frag.slice(3).isEmpty());
    });
    test('returns a fragment starting from the nth element of this fragment and ending at the end of this fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      const parent = h('span', {}, children);
      const frag = domFrag(parent).children();
      assert.ok(
        nodeArraysEqual(frag.slice(0).toNodeArray(), children.slice(1))
      );
      assert.ok(
        nodeArraysEqual(frag.slice(1).toNodeArray(), children.slice(3))
      );
    });
  });

  suite('.next()', () => {
    test('throws when this is an empty fragment', () => {
      assert.throws(() => domFrag().next());
    });
    test('throws when this is a multi-node fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.throws(() => domFrag(parent).children().next());
    });
    test('returns an empty fragment when called on a single element fragment', () => {
      const el = h('span');
      assert.ok(domFrag(el).next().isEmpty());
    });
    test('returns an empty fragment when called on a single text node fragment', () => {
      const el = h.text('text');
      assert.ok(domFrag(el).next().isEmpty());
    });
    test('returns single element fragments holding successive elements of a multi-element fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      // Insert children into a parent to make them siblings
      h('span', {}, children);
      const frag = domFrag(children[0]);
      assert.equal(frag.next().oneElement(), children[1]);
      assert.equal(frag.next().next().oneElement(), children[3]);
      assert.ok(frag.next().next().next().isEmpty());
    });
  });

  suite('.prev()', () => {
    test('throws when this is an empty fragment', () => {
      assert.throws(() => domFrag().prev());
    });
    test('throws when this is a multi-node fragment', () => {
      const children = [h('span'), h.text('text'), h('span')];
      const parent = h('span', {}, children);
      assert.throws(() => domFrag(parent).children().prev());
    });
    test('returns an empty fragment when called on a single element fragment', () => {
      const el = h('span');
      assert.ok(domFrag(el).prev().isEmpty());
    });
    test('returns an empty fragment when called on a single text node fragment', () => {
      const el = h.text('text');
      assert.ok(domFrag(el).prev().isEmpty());
    });
    test('returns single element fragments holding predecessor elements of a multi-element fragment', () => {
      const children = [
        h.text('text'),
        h('span'),
        h.text('text'),
        h('span'),
        h.text('text'),
      ];
      // Insert children into a parent to make them siblings
      h('span', {}, children);
      const frag = domFrag(children[children.length - 1]);
      assert.equal(frag.prev().oneElement(), children[3]);
      assert.equal(frag.prev().prev().oneElement(), children[1]);
      assert.ok(frag.prev().prev().prev().isEmpty());
    });
  });

  suite('.empty()', () => {
    test('is a noop on an empty fragment', () => {
      assert.ok(domFrag().empty().isValid());
    });
    test('is a noop on a single element with no children', () => {
      const el = h('span');
      assert.ok(domFrag(el).children().isEmpty());
      assert.ok(domFrag(el).empty().isValid());
      assert.ok(domFrag(el).children().isEmpty());
    });
    test('is a noop on a single text node fragment', () => {
      const el = h.text('text');
      assert.ok(domFrag(el).children().isEmpty());
      assert.ok(domFrag(el).empty().isValid());
      assert.ok(domFrag(el).children().isEmpty());
    });
    test('empties every element of a multi-element fragment', () => {
      const children = [
        h('span', {}, [h('span'), h.text('text'), h('span')]),
        h.text('text'),
        h('span', {}, [h('span'), h.text('text'), h('span')]),
      ];
      const parent = h('span', {}, children);
      let foundNonEmpty = false;
      for (const child of children) {
        if (!domFrag(child).children().isEmpty()) foundNonEmpty = true;
      }
      assert.ok(foundNonEmpty, 'children are not all empty at start');
      assert.ok(domFrag(parent).children().empty().isValid());
      for (const child of children) {
        assert.ok(
          domFrag(child).children().isEmpty(),
          'every node of the fragment is empty after calling .empty()'
        );
      }
    });
  });

  // remove and detach are currently aliases
  //
  // I propose dropping remove and always using detach, but currently
  // they're both here to express places that jQuery made a distinction
  // that DOMFragment doesn't
  for (const method of ['remove', 'detach'] as const) {
    suite(`.${method}()`, () => {
      test('is a noop on an empty fragment', () => {
        assert.ok(domFrag()[method]().isValid());
      });
      test('is a noop on a fragment with no parent', () => {
        const el = h('span');
        const frag = domFrag(el);
        assert.equal(frag.oneElement(), el);
        assert.ok(domFrag(h('span'))[method]().isValid());
        assert.equal(frag.oneElement(), el);
      });
      test('detaches each node in the fragment from its parent', () => {
        const children = [h('span'), h.text('text'), h('span')];
        const parent = h('span', {}, children);
        assert.ok(!domFrag(parent).children().isEmpty());
        assert.ok(domFrag(parent).children()[method]().isValid());
        assert.ok(domFrag(parent).children().isEmpty());
      });
    });
  }
});
