suite('ans command', function () {
  const $ = window.test_only_jquery;
  var mq;
  setup(function () {
    MQ.config({ autoCommands: 'ans' });
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function () {
    $(mq.el()).remove();
  });

  test('Typing and backspacing', function () {
    mq.typedText('2+ans');
    assert.equal(mq.latex(), '2+\\operatorname{ans}');
    mq.keystroke('Backspace');
    assert.equal(mq.latex(), '2+');
  });

  test('Parsing', function () {
    mq.latex('\\operatorname{ans}');
    assert.equal(mq.latex(), '\\operatorname{ans}');
  });
});
