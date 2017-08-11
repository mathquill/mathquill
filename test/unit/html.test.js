suite('HTML', function() {
  function renderHtml(numBlocks, htmlTemplate) {
    var cmd = {
      id: 1,
      blocks: Array(numBlocks),
      htmlTemplate: htmlTemplate
    };
    for (var i = 0; i < numBlocks; i += 1) {
      cmd.blocks[i] = {
        i: i,
        id: 2 + i,
        join: function() { return 'Block:' + this.i; }
      };
    }
    return MathCommand.prototype.html.call(cmd);
  }

  test('simple HTML templates', function() {
    var htmlTemplate = '<span>A Symbol</span>';
    var html = '<span aria-hidden="true" mathquill-command-id=1>A Symbol</span>';

    assert.equal(html, renderHtml(0, htmlTemplate), 'a symbol');

    htmlTemplate = '<span>&0</span>';
    html = '<span aria-hidden="true" mathquill-command-id=1 mathquill-block-id=2>Block:0</span>';

    assert.equal(html, renderHtml(1, htmlTemplate), 'same span is cmd and block');

    htmlTemplate =
        '<span>'
      +   '<span>&0</span>'
      +   '<span>&1</span>'
      + '</span>'
    ;
    html =
        '<span aria-hidden="true" mathquill-command-id=1>'
      +   '<span aria-hidden="true" mathquill-block-id=2>Block:0</span>'
      +   '<span aria-hidden="true" mathquill-block-id=3>Block:1</span>'
      + '</span>'
    ;

    assert.equal(html, renderHtml(2, htmlTemplate), 'container span with two block spans');
  });

  test('context-free HTML templates', function() {
    var htmlTemplate = '<br/>';
    var html = '<br aria-hidden="true" mathquill-command-id=1/>';

    assert.equal(html, renderHtml(0, htmlTemplate), 'self-closing tag');

    htmlTemplate =
        '<span>'
      +   '<span>&0</span>'
      + '</span>'
      + '<span>'
      +   '<span>&1</span>'
      + '</span>'
    ;
    html =
        '<span aria-hidden="true" mathquill-command-id=1>'
      +   '<span aria-hidden="true" mathquill-block-id=2>Block:0</span>'
      + '</span>'
      + '<span aria-hidden="true" mathquill-command-id=1>'
      +   '<span aria-hidden="true" mathquill-block-id=3>Block:1</span>'
      + '</span>'
    ;

    assert.equal(html, renderHtml(2, htmlTemplate), 'two cmd spans');

    htmlTemplate =
        '<span></span>'
      + '<span/>'
      + '<span>'
      +   '<span>'
      +     '<span/>'
      +   '</span>'
      +   '<span>&1</span>'
      +   '<span/>'
      +   '<span></span>'
      + '</span>'
      + '<span>&0</span>'
    ;
    html =
        '<span aria-hidden="true" mathquill-command-id=1></span>'
      + '<span aria-hidden="true" mathquill-command-id=1/>'
      + '<span aria-hidden="true" mathquill-command-id=1>'
      +   '<span aria-hidden="true">'
      +     '<span aria-hidden="true"/>'
      +   '</span>'
      +   '<span aria-hidden="true" mathquill-block-id=3>Block:1</span>'
      +   '<span aria-hidden="true"/>'
      +   '<span aria-hidden="true"></span>'
      + '</span>'
      + '<span aria-hidden="true" mathquill-command-id=1 mathquill-block-id=2>Block:0</span>'
    ;

    assert.equal(html, renderHtml(2, htmlTemplate), 'multiple nested cmd and block spans');
  });
});
