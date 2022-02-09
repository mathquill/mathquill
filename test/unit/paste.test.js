suite('paste', function () {
  var mq;
  setup(function () {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
  });

  function prayWellFormedPoint(pt) {
    prayWellFormed(pt.parent, pt[L], pt[R]);
  }

  function assertLatex(latex) {
    prayWellFormedPoint(mq.__controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  function simulatePaste(mq, value) {
    const textarea = mq.el().querySelector('textarea');
    trigger.paste(textarea);
    textarea.value = value;
    trigger.input(textarea);
  }

  suite('√', function () {
    test('sqrt symbol in empty latex', function () {
      simulatePaste(mq, '√');
      assertLatex('\\sqrt{ }');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      simulatePaste(mq, '√');
      assertLatex('1+\\sqrt{ }');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      simulatePaste(mq, '√');
      assertLatex('\\sqrt{ }1+');
    });
  });

  suite('√2', function () {
    test('sqrt symbol in empty latex', function () {
      simulatePaste(mq, '√2');
      assertLatex('\\sqrt{ }2');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      simulatePaste(mq, '√2');
      assertLatex('1+\\sqrt{ }2');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      simulatePaste(mq, '√2');
      assertLatex('\\sqrt{ }21+');
    });
  });

  suite('sqrt text', function () {
    test('sqrt symbol in empty latex', function () {
      simulatePaste(mq, 'sqrt');
      assertLatex('sqrt');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      simulatePaste(mq, 'sqrt');
      assertLatex('1+sqrt');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      simulatePaste(mq, 'sqrt');
      assertLatex('sqrt1+');
    });
  });
});
