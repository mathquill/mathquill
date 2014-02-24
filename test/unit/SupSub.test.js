suite('SupSub', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function prayWellFormedPoint(pt) { prayWellFormed(pt.parent, pt[L], pt[R]); }

  var expecteds = 'x_{ab} x_{ba}, x_a^b x_a^b; x_b^a x_b^a, x^{ab} x^{ba}';
  'sub super'.split(' ').forEach(function(initSupsub, i) {
    var initialLatex = 'x_a x^a'.split(' ')[i];

    'typed wrote'.split(' ').forEach(function(did, j) {
      var doTo = [
        function(mq, supsub) { mq.typedText(supsub).typedText('b'); },
        function(mq, supsub) { mq.write(supsub+'b'); }
      ][j];

      'sub super'.split(' ').forEach(function(supsub, k) {
        var cmd = '_^'.split('')[k];

        'after before'.split(' ').forEach(function(side, l) {
          var moveToSide = [
            noop,
            function(mq) { mq.moveToLeftEnd().keystroke('Right'); }
          ][l];

          var expected = expecteds.split('; ')[i].split(', ')[k].split(' ')[l];

          test('initial '+initSupsub+'script then '+did+' '+supsub+'script '+side, function() {
            mq.latex(initialLatex);
            assert.equal(mq.latex(), initialLatex);

            moveToSide(mq);

            doTo(mq, cmd);
            assert.equal(mq.latex(), expected);

            prayWellFormedPoint(mq.controller.cursor);
          });
        });
      });
    });
  });

  test('render LaTeX with 2 SupSub\'s in a row', function() {
    mq.latex('x_a_b');
    assert.equal(mq.latex(), 'x_{ab}');

    mq.latex('x^a^b');
    assert.equal(mq.latex(), 'x^{ab}');
  });
});
