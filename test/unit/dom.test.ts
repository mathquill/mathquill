declare const assert: any; // see test/support/assert.js

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
    actual: HTMLElement,
    expected: string,
    message: string
  ) {
    const expectedNode = parseHTML(expected)[0] as HTMLElement;
    if (actual.isEqualNode(expectedNode)) return;
    assert.fail(
      message +
        ' expected (' +
        actual.outerHTML +
        ') to equal (' +
        expected +
        ')'
    );
  }

  test('simple HTML templates', function () {
    assertDOMEqual(
      renderHtml(new DOMView(0, () => h('span', {}, [h.text('A Symbol')]))),
      '<span mathquill-command-id=1 aria-hidden="true">A Symbol</span>',
      'a symbol'
    );

    assertDOMEqual(
      renderHtml(new DOMView(1, (blocks) => h.block('span', {}, blocks[0]))),
      '<span mathquill-command-id=1 aria-hidden="true" mathquill-block-id=2 aria-hidden="true">Block:0</span>',
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
      '<span mathquill-command-id=1 aria-hidden="true">' +
        '<span mathquill-block-id=2 aria-hidden="true">Block:0</span>' +
        '<span mathquill-block-id=3 aria-hidden="true">Block:1</span>' +
        '</span>',
      'container span with two block spans'
    );

    assertDOMEqual(
      renderHtml(new DOMView(0, () => h('br'))),
      '<br mathquill-command-id=1 aria-hidden="true"/>',
      'self-closing tag'
    );
  });
});
