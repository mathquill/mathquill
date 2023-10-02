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

  suite('√', function () {
    test('sqrt symbol in empty latex', function () {
      $(mq.el()).find('textarea').trigger('paste').val('√').trigger('input');
      assertLatex('\\sqrt{ }');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      $(mq.el()).find('textarea').trigger('paste').val('√').trigger('input');
      assertLatex('1+\\sqrt{ }');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      $(mq.el()).find('textarea').trigger('paste').val('√').trigger('input');
      assertLatex('\\sqrt{ }1+');
    });
  });

  suite('√2', function () {
    test('sqrt symbol in empty latex', function () {
      $(mq.el()).find('textarea').trigger('paste').val('√2').trigger('input');
      assertLatex('\\sqrt{ }2');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      $(mq.el()).find('textarea').trigger('paste').val('√2').trigger('input');
      assertLatex('1+\\sqrt{ }2');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      $(mq.el()).find('textarea').trigger('paste').val('√2').trigger('input');
      assertLatex('\\sqrt{ }21+');
    });
  });

  suite('sqrt text', function () {
    test('sqrt symbol in empty latex', function () {
      $(mq.el()).find('textarea').trigger('paste').val('sqrt').trigger('input');
      assertLatex('sqrt');
    });
    test('sqrt symbol in non-empty latex', function () {
      mq.latex('1+');
      $(mq.el()).find('textarea').trigger('paste').val('sqrt').trigger('input');
      assertLatex('1+sqrt');
    });
    test('sqrt symbol at start of non-empty latex', function () {
      mq.latex('1+');
      mq.moveToLeftEnd();
      $(mq.el()).find('textarea').trigger('paste').val('sqrt').trigger('input');
      assertLatex('sqrt1+');
    });
  });
});
