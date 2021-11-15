/****************************************
 * Input box to type backslash commands
 ***************************************/

var LatexCommandInput =
CharCmds['\\'] = P(MathCommand, function(_, super_) {
  _.ctrlSeq = '\\';
  _.replaces = function(replacedFragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function() { return false; };
  };
  _.htmlTemplate = '<span class="mq-latex-command-input mq-non-leaf">\\<span>&0</span></span>';
  _.textTemplate = ['\\'];
  _.createBlocks = function() {
    super_.createBlocks.call(this);
    this.ends[L].focus = function() {
      this.parent.jQ.addClass('mq-hasCursor');
      if (this.isEmpty())
        this.parent.jQ.removeClass('mq-empty');

      return this;
    };
    this.ends[L].blur = function() {
      this.parent.jQ.removeClass('mq-hasCursor');
      if (this.isEmpty())
        this.parent.jQ.addClass('mq-empty');

      return this;
    };
    this.ends[L].write = function(cursor, ch) {
      cursor.show().deleteSelection();

      if (ch.match(/[a-z]/i)) {
        VanillaSymbol(ch).createLeftOf(cursor);
        // TODO needs tests
        aria.alert(ch);
      }
      else {
        var cmd = this.parent.renderCommand(cursor);
        // TODO needs tests
        aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
        if (ch !== '\\' || !this.isEmpty()) cursor.parent.write(cursor, ch);
        else aria.alert();
      }
    };
    this.ends[L].keystroke = function(key, e, ctrlr) {
      if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
        var cmd = this.parent.renderCommand(ctrlr.cursor);
        // TODO needs tests
        aria.alert(cmd.mathspeak({ createdLeftOf: ctrlr.cursor }));
        e.preventDefault();
        return;
      }
      return super_.keystroke.apply(this, arguments);
    };
  };
  _.createLeftOf = function(cursor) {
    super_.createLeftOf.call(this, cursor);

    if (this._replacedFragment) {
      var el = this.jQ[0];
      this.jQ =
        this._replacedFragment.jQ.addClass('mq-blur').bind(
          'mousedown mousemove', //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
          function(e) {
            $(e.target = el).trigger(e);
            return false;
          }
        ).insertBefore(this.jQ).add(this.jQ);
    }
  };
  _.latex = function() {
    return '\\' + this.ends[L].latex() + ' ';
  };
  _.renderCommand = function(cursor) {
    this.jQ = this.jQ.last();
    this.remove();
    if (this[R]) {
      cursor.insLeftOf(this[R]);
    } else {
      cursor.insAtRightEnd(this.parent);
    }

    var latex = this.ends[L].latex();
    if (!latex) latex = ' ';
    var cmd = LatexCmds[latex];
    if (cmd) {
      cmd = cmd(latex);
      if (this._replacedFragment) cmd.replaces(this._replacedFragment);
      cmd.createLeftOf(cursor);
    }
    else {
      cmd = TextBlock();
      cmd.replaces(latex);
      cmd.createLeftOf(cursor);
      cursor.insRightOf(cmd);
      if (this._replacedFragment)
        this._replacedFragment.remove();
    }
    return cmd;
  };
});

