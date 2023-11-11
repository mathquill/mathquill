suite('HTML', function () {
  function renderHtml(numBlocks, htmlTemplate) {
    var cmd = {
      id: 1,
      blocks: Array(numBlocks),
      htmlTemplate: htmlTemplate,
    };
    for (var i = 0; i < numBlocks; i += 1) {
      cmd.blocks[i] = {
        i: i,
        id: 2 + i,
        join: function () {
          return 'Block:' + this.i;
        },
      };
    }
    return MathCommand.prototype.html.call(cmd);
  }

  test('simple HTML templates', function () {
    var htmlTemplate = '<span>A Symbol</span>';
    var html =
      '<span mathquill-command-id=1 aria-hidden="true">A Symbol</span>';

    assert.equal(html, renderHtml(0, htmlTemplate), 'a symbol');

    htmlTemplate = '<span>&0</span>';
    html =
      '<span mathquill-command-id=1 aria-hidden="true" mathquill-block-id=2 aria-hidden="true">Block:0</span>';

    assert.equal(
      html,
      renderHtml(1, htmlTemplate),
      'same span is cmd and block'
    );

    htmlTemplate = '<span>' + '<span>&0</span>' + '<span>&1</span>' + '</span>';
    html =
      '<span mathquill-command-id=1 aria-hidden="true">' +
      '<span mathquill-block-id=2 aria-hidden="true">Block:0</span>' +
      '<span mathquill-block-id=3 aria-hidden="true">Block:1</span>' +
      '</span>';

    assert.equal(
      html,
      renderHtml(2, htmlTemplate),
      'container span with two block spans'
    );
  });

  test('context-free HTML templates', function () {
    var htmlTemplate = '<br/>';
    var html = '<br mathquill-command-id=1 aria-hidden="true"/>';

    assert.equal(html, renderHtml(0, htmlTemplate), 'self-closing tag');

    htmlTemplate =
      '<span>' +
      '<span>&0</span>' +
      '</span>' +
      '<span>' +
      '<span>&1</span>' +
      '</span>';
    html =
      '<span mathquill-command-id=1 aria-hidden="true">' +
      '<span mathquill-block-id=2 aria-hidden="true">Block:0</span>' +
      '</span>' +
      '<span mathquill-command-id=1 aria-hidden="true">' +
      '<span mathquill-block-id=3 aria-hidden="true">Block:1</span>' +
      '</span>';

    assert.equal(html, renderHtml(2, htmlTemplate), 'two cmd spans');

    htmlTemplate =
      '<span></span>' +
      '<span/>' +
      '<span>' +
      '<span>' +
      '<span/>' +
      '</span>' +
      '<span>&1</span>' +
      '<span/>' +
      '<span></span>' +
      '</span>' +
      '<span>&0</span>';
    html =
      '<span mathquill-command-id=1 aria-hidden="true"></span>' +
      '<span mathquill-command-id=1 aria-hidden="true"/>' +
      '<span mathquill-command-id=1 aria-hidden="true">' +
      '<span>' +
      '<span/>' +
      '</span>' +
      '<span mathquill-block-id=3 aria-hidden="true">Block:1</span>' +
      '<span/>' +
      '<span></span>' +
      '</span>' +
      '<span mathquill-command-id=1 aria-hidden="true" mathquill-block-id=2 aria-hidden="true">Block:0</span>';

    assert.equal(
      html,
      renderHtml(2, htmlTemplate),
      'multiple nested cmd and block spans'
    );
  });
});
