suite('HTML', function () {
  function renderHtml(domView: DOMView) {
    const Cmd = class extends MathCommand {
      constructor() {
        super(undefined, domView);
        this.id = 1;
        this.blocks = Array(domView.childCount);
        for (let i = 0; i < domView.childCount; i += 1) {
          const content = 'Block:' + i;
          this.blocks[i] = {
            id: 2 + i,
            setDOM: (_sibling) => {},
            html: () => {
              const frag = document.createDocumentFragment();
              frag.appendChild(h.text(content));
              return frag;
            },
          } as MathBlock;
        }
      }
    };

    return new Cmd().html();
  }

  function assertDOMEqual(
    actual: Element | DocumentFragment,
    expected: string,
    message: string
  ) {
    const expectedNode = parseHTML(expected);
    if (actual.isEqualNode(expectedNode)) return;

    const d = document.createElement('div');
    d.appendChild(actual);
    const actualString = d.innerHTML;

    assert.fail(
      message + ' expected (' + actualString + ') to equal (' + expected + ')'
    );
  }

  test('simple HTML templates', function () {
    assertDOMEqual(
      renderHtml(new DOMView(0, () => h('span', {}, [h.text('A Symbol')]))),
      '<span>A Symbol</span>',
      'a symbol'
    );

    assertDOMEqual(
      renderHtml(new DOMView(1, (blocks) => h.block('span', {}, blocks[0]))),
      '<span>Block:0</span>',
      'same span is cmd and block'
    );

    assertDOMEqual(
      renderHtml(
        new DOMView(2, (blocks) =>
          h('span', {}, [
            h.block('span', {}, blocks[0]),
            h.block('span', {}, blocks[1]),
          ])
        )
      ),
      '<span>' + '<span>Block:0</span>' + '<span>Block:1</span>' + '</span>',
      'container span with two block spans'
    );

    assertDOMEqual(
      renderHtml(new DOMView(0, () => h('br'))),
      '<br/>',
      'self-closing tag'
    );
  });

  test('Attempting to render multiple html nodes into a math command throws', function () {
    assert.throws(() => {
      renderHtml(
        new DOMView(2, (blocks) => {
          const frag = document.createDocumentFragment();
          frag.appendChild(h('span', {}, [h.block('span', {}, blocks[0])]));
          frag.appendChild(h('span', {}, [h.block('span', {}, blocks[1])]));
          return frag as any;
        })
      );
    });
  });
});
