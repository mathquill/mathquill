/****************************************
 * Input box to type backslash commands
 ***************************************/

CharCmds['\\'] = class LatexCommandInput extends MathCommand {
  ctrlSeq = '\\';
  _replacedFragment?: Fragment;

  replaces(replacedFragment: Fragment) {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function () {
      return false;
    };
  }
  htmlTemplate =
    '<span class="mq-latex-command-input mq-non-leaf">\\<span>&0</span></span>';
  textTemplate = ['\\'];
  createBlocks() {
    super.createBlocks();
    const endsL = this.ends[L] as MQNode;

    endsL.focus = function () {
      this.parent.jQ.addClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.jQ.removeClass('mq-empty');

      return this;
    };
    endsL.blur = function () {
      this.parent.jQ.removeClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.jQ.addClass('mq-empty');

      return this;
    };
    endsL.write = function (cursor, ch) {
      cursor.show().deleteSelection();

      if (ch.match(/[a-z]/i)) {
        new VanillaSymbol(ch).createLeftOf(cursor);
        // TODO needs tests
        cursor.controller.aria.alert(ch);
      } else {
        var cmd = (this.parent as LatexCommandInput).renderCommand(cursor);
        // TODO needs tests
        cursor.controller.aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
        if (ch !== '\\' || !this.isEmpty()) cursor.parent.write(cursor, ch);
        else cursor.controller.aria.alert();
      }
    };

    var originalKeystroke = endsL.keystroke;
    endsL.keystroke = function (key, e, ctrlr) {
      if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
        var cmd = (this.parent as LatexCommandInput).renderCommand(
          ctrlr.cursor
        );
        // TODO needs tests
        ctrlr.aria.alert(cmd.mathspeak({ createdLeftOf: ctrlr.cursor }));
        e.preventDefault();
        return;
      }

      return originalKeystroke.call(this, key, e, ctrlr);
    };
  }
  createLeftOf(cursor: Cursor) {
    super.createLeftOf(cursor);

    if (this._replacedFragment) {
      var el = this.jQ[0];
      this.jQ = this._replacedFragment.jQ
        .addClass('mq-blur')
        .bind(
          'mousedown mousemove', //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
          function (e) {
            // TODO - overwritting e.target
            (e as any).target = el;
            $(el).trigger(e);
            return false;
          }
        )
        .insertBefore(this.jQ)
        .add(this.jQ);
    }
  }
  latex() {
    return '\\' + (this.ends[L] as MQNode).latex() + ' ';
  }
  renderCommand(cursor: Cursor) {
    this.jQ = this.jQ.last();
    this.remove();
    if (this[R]) {
      cursor.insLeftOf(this[R] as MQNode);
    } else {
      cursor.insAtRightEnd(this.parent);
    }

    var latex = (this.ends[L] as MQNode).latex();
    if (!latex) latex = ' ';
    var cmd = LatexCmds[latex];

    if (cmd) {
      let node: MQNode;
      if (isMQNodeClass(cmd)) {
        node = new (cmd as typeof TempSingleCharNode)(latex);
      } else {
        node = cmd(latex);
      }
      if (this._replacedFragment)
        (node as MathCommand).replaces(this._replacedFragment);
      node.createLeftOf(cursor);
      return node;
    } else {
      const node = new TextBlock();
      node.replaces(latex);
      node.createLeftOf(cursor);
      cursor.insRightOf(node);
      if (this._replacedFragment) {
        this._replacedFragment.remove();
      }
      return node;
    }
  }
};
