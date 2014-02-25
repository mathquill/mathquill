suite('auto-unitalicized commands', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function assertLatex(input, expected) {
    var result = mq.latex();
    assert.equal(result, expected,
      input+', got \''+result+'\', expected \''+expected+'\''
    );
  }

  test('simple LaTeX parsing, typing', function() {
    function assertUnitalicizedCommandWorks(str, latex) {
      mq.latex(str);
      assertLatex('parsing \''+str+'\'', latex);

      mq.latex(latex);
      assertLatex('parsing \''+latex+'\'', latex);

      mq.latex('');
      for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
      assertLatex('typing \''+str+'\'', latex);
    }

    assertUnitalicizedCommandWorks('sin', '\\sin');
    assertUnitalicizedCommandWorks('arcosh', '\\arcosh');
    assertUnitalicizedCommandWorks('acosh', 'a\\cosh');
    assertUnitalicizedCommandWorks('cosine', '\\cos ine');
    assertUnitalicizedCommandWorks('arcosecant', 'ar\\cosec ant');
    assertUnitalicizedCommandWorks('cscscscscscsc', '\\csc s\\csc s\\csc sc');
    assertUnitalicizedCommandWorks('scscscscscsc', 's\\csc s\\csc s\\csc');
  });

  test('deleting', function() {
    var str = 'cscscscscscsc';
    for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
    assertLatex('typing \''+str+'\'', '\\csc s\\csc s\\csc sc');

    mq.moveToLeftEnd().keystroke('Del');
    assertLatex('deleted first char', 's\\csc s\\csc s\\csc');
  });
});
