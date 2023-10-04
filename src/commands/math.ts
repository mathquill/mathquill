/*************************************************
 * Abstract classes of math blocks and commands.
 ************************************************/

/**
 * Math tree node base class.
 * Some math-tree-specific extensions to MQNode.
 * Both MathBlock's and MathCommand's descend from it.
 */
class MathElement extends MQNode {
  finalizeInsert(options: CursorOptions, cursor: Cursor) {
    var self = this;
    self.postOrder(function (node) {
      node.finalizeTree(options);
    });
    self.postOrder(function (node) {
      node.contactWeld(cursor);
    });

    // note: this order is important.
    // empty elements need the empty box provided by blur to
    // be present in order for their dimensions to be measured
    // correctly by 'reflow' handlers.
    self.postOrder(function (node) {
      node.blur(cursor);
    });

    self.postOrder(function (node) {
      node.reflow();
    });
    var selfR = self[R];
    var selfL = self[L];
    if (selfR) selfR.siblingCreated(options, L);
    if (selfL) selfL.siblingCreated(options, R);
    self.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }
  // If the maxDepth option is set, make sure
  // deeply nested content is truncated. Just return
  // false if the cursor is already too deep.
  prepareInsertionAt(cursor: Cursor) {
    var maxDepth = cursor.options.maxDepth;
    if (maxDepth !== undefined) {
      var cursorDepth = cursor.depth();
      if (cursorDepth > maxDepth) {
        return false;
      }
      this.removeNodesDeeperThan(maxDepth - cursorDepth);
    }
    return true;
  }
  // Remove nodes that are more than `cutoff`
  // blocks deep from this node.
  removeNodesDeeperThan(cutoff: number) {
    var depth = 0;
    var queue: [[MQNode, number]] = [[this, depth]];
    var current: [MQNode, number] | undefined;

    // Do a breadth-first search of this node's descendants
    // down to cutoff, removing anything deeper.
    while ((current = queue.shift())) {
      var c = current;
      c[0].children().each(function (child) {
        var i = child instanceof MathBlock ? 1 : 0;
        depth = c[1] + i;

        if (depth <= cutoff) {
          queue.push([child, depth]);
        } else {
          (i ? child.children() : child).remove();
        }
        return undefined;
      });
    }
  }
}

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
class MathCommand extends MathElement {
  replacedFragment: Fragment | undefined;

  constructor(
    ctrlSeq?: string,
    htmlTemplate?: string,
    textTemplate?: string[]
  ) {
    super();
    this.setCtrlSeqHtmlAndText(ctrlSeq, htmlTemplate, textTemplate);
  }

  setCtrlSeqHtmlAndText(
    ctrlSeq?: string,
    htmlTemplate?: string,
    textTemplate?: string[]
  ) {
    if (!this.ctrlSeq) this.ctrlSeq = ctrlSeq;
    if (htmlTemplate) this.htmlTemplate = htmlTemplate;
    if (textTemplate) this.textTemplate = textTemplate;
  }

  // obvious methods
  replaces(replacedFragment: Fragment) {
    replacedFragment.disown();
    this.replacedFragment = replacedFragment;
  }
  isEmpty() {
    return this.foldChildren(true, function (isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  }

  parser(): Parser<MQNode> {
    var block = latexMathParser.block;

    return block.times(this.numBlocks()).map((blocks) => {
      this.blocks = blocks;

      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(this, this.ends[R], 0);
      }

      return this;
    });
  }

  // createLeftOf(cursor) and the methods it calls
  createLeftOf(cursor: Cursor) {
    var cmd = this;
    var replacedFragment = cmd.replacedFragment;

    cmd.createBlocks();
    super.createLeftOf(cursor);
    if (replacedFragment) {
      const cmdEndsL = cmd.ends[L] as MQNode;
      replacedFragment.adopt(cmdEndsL, 0, 0);
      replacedFragment.jQ.appendTo(cmdEndsL.jQ);
      cmd.placeCursor(cursor);
      cmd.prepareInsertionAt(cursor);
    }
    cmd.finalizeInsert(cursor.options, cursor);
    cmd.placeCursor(cursor);
  }
  createBlocks() {
    var cmd = this,
      numBlocks = cmd.numBlocks(),
      blocks = (cmd.blocks = Array(numBlocks));

    for (var i = 0; i < numBlocks; i += 1) {
      var newBlock = (blocks[i] = new MathBlock());
      newBlock.adopt(cmd, cmd.ends[R], 0);
    }
  }
  placeCursor(cursor: Cursor) {
    //insert the cursor at the right end of the first empty child, searching
    //left-to-right, or if none empty, the right end child
    cursor.insAtRightEnd(
      this.foldChildren(this.ends[L] as MQNode, function (leftward, child) {
        return leftward.isEmpty() ? leftward : child;
      })
    );
  }

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  moveTowards(dir: Direction, cursor: Cursor, updown?: 'up' | 'down') {
    var updownInto: NodeRef | undefined;
    if (updown === 'up') {
      updownInto = this.upInto;
    } else if (updown === 'down') {
      updownInto = this.downInto;
    }

    const el = (updownInto || this.ends[-dir as Direction]) as MQNode;
    cursor.insAtDirEnd(-dir as Direction, el);
    cursor.controller.aria
      .queueDirEndOf(-dir as Direction)
      .queue(cursor.parent, true);
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    if (this.isEmpty()) cursor[dir] = this.remove()[dir];
    else this.moveTowards(dir, cursor);
  }
  selectTowards(dir: Direction, cursor: Cursor) {
    cursor[-dir as Direction] = this;
    cursor[dir] = this[dir];
  }
  selectChildren(): MQSelection {
    return new MQSelection(this, this);
  }
  unselectInto(dir: Direction, cursor: Cursor) {
    const antiCursor = cursor.anticursor as Anticursor;
    const ancestor = antiCursor.ancestors[this.id] as MQNode;
    cursor.insAtDirEnd(-dir as Direction, ancestor);
  }
  seek(pageX: number, cursor: Cursor) {
    function getBounds(node: MQNode) {
      var l: number = node.jQ.offset().left;
      var r: number = l + node.jQ.outerWidth();
      return {
        [L]: l,
        [R]: r,
      };
    }

    var cmd = this;
    var cmdBounds = getBounds(cmd);

    if (pageX < cmdBounds[L]) return cursor.insLeftOf(cmd);
    if (pageX > cmdBounds[R]) return cursor.insRightOf(cmd);

    var leftLeftBound = cmdBounds[L];
    cmd.eachChild(function (block) {
      var blockBounds = getBounds(block);
      if (pageX < blockBounds[L]) {
        // closer to this block's left bound, or the bound left of that?
        if (pageX - leftLeftBound < blockBounds[L] - pageX) {
          if (block[L]) cursor.insAtRightEnd(block[L] as MQNode);
          else cursor.insLeftOf(cmd);
        } else cursor.insAtLeftEnd(block);
        return false;
      } else if (pageX > blockBounds[R]) {
        if (block[R]) leftLeftBound = blockBounds[R];
        // continue to next block
        else {
          // last (rightmost) block
          // closer to this block's right bound, or the cmd's right bound?
          if (cmdBounds[R] - pageX < pageX - blockBounds[R]) {
            cursor.insRightOf(cmd);
          } else cursor.insAtRightEnd(block);
        }
        return undefined;
      } else {
        block.seek(pageX, cursor);
        return false;
      }
    });

    return undefined;
  }

  // methods involved in creating and cross-linking with HTML DOM nodes
  /*
    They all expect an .htmlTemplate like
      '<span>&0</span>'
    or
      '<span><span>&0</span><span>&1</span></span>'

    See html.test.js for more examples.

    Requirements:
    - For each block of the command, there must be exactly one "block content
      marker" of the form '&<number>' where <number> is the 0-based index of the
      block. (Like the LaTeX \newcommand syntax, but with a 0-based rather than
      1-based index, because JavaScript because C because Dijkstra.)
    - The block content marker must be the sole contents of the containing
      element, there can't even be surrounding whitespace, or else we can't
      guarantee sticking to within the bounds of the block content marker when
      mucking with the HTML DOM.
    - The HTML not only must be well-formed HTML (of course), but also must
      conform to the XHTML requirements on tags, specifically all tags must
      either be self-closing (like '<br/>') or come in matching pairs.
      Close tags are never optional.

    Note that &<number> isn't well-formed HTML; if you wanted a literal '&123',
    your HTML template would have to have '&amp;123'.
  */
  numBlocks() {
    var matches = (this.htmlTemplate as string).match(/&\d+/g);
    return matches ? matches.length : 0;
  }
  html() {
    // Render the entire math subtree rooted at this command, as HTML.
    // Expects .createBlocks() to have been called already, since it uses the
    // .blocks array of child blocks.
    //
    // See html.test.js for example templates and intended outputs.
    //
    // Given an .htmlTemplate as described above,
    // - insert the mathquill-command-id attribute into all top-level tags,
    //   which will be used to set this.jQ in .jQize().
    //   This is straightforward:
    //     * tokenize into tags and non-tags
    //     * loop through top-level tokens:
    //         * add #cmdId attribute macro to top-level self-closing tags
    //         * else add #cmdId attribute macro to top-level open tags
    //             * skip the matching top-level close tag and all tag pairs
    //               in between
    // - for each block content marker,
    //     + replace it with the contents of the corresponding block,
    //       rendered as HTML
    //     + insert the mathquill-block-id attribute into the containing tag
    //   This is even easier, a quick regex replace, since block tags cannot
    //   contain anything besides the block content marker.
    //
    // Two notes:
    // - The outermost loop through top-level tokens should never encounter any
    //   top-level close tags, because we should have first encountered a
    //   matching top-level open tag, all inner tags should have appeared in
    //   matching pairs and been skipped, and then we should have skipped the
    //   close tag in question.
    // - All open tags should have matching close tags, which means our inner
    //   loop should always encounter a close tag and drop nesting to 0. If
    //   a close tag is missing, the loop will continue until i >= tokens.length
    //   and token becomes undefined. This will not infinite loop, even in
    //   production without pray(), because it will then TypeError on .slice().

    var cmd = this;
    var blocks = cmd.blocks as MathBlock[];
    var cmdId = ' mathquill-command-id=' + cmd.id;
    var tokens = (cmd.htmlTemplate as string).match(
      /<[^<>]+>|[^<>]+/g
    ) as string[];

    pray('no unmatched angle brackets', tokens.join('') === this.htmlTemplate);

    // add cmdId and aria-hidden (for screen reader users) to all top-level tags
    // Note: with the RegExp search/replace approach, it's possible that an element which is both a command and block may contain redundant aria-hidden attributes.
    // In practice this doesn't appear to cause problems for screen readers.
    for (var i = 0, token = tokens[0]; token; i += 1, token = tokens[i]) {
      // top-level self-closing tags
      if (token.slice(-2) === '/>') {
        tokens[i] = token.slice(0, -2) + cmdId + ' aria-hidden="true"/>';
      }
      // top-level open tags
      else if (token.charAt(0) === '<') {
        pray('not an unmatched top-level close tag', token.charAt(1) !== '/');

        tokens[i] = token.slice(0, -1) + cmdId + ' aria-hidden="true">';

        // skip matching top-level close tag and all tag pairs in between
        var nesting = 1;
        do {
          (i += 1), (token = tokens[i]);
          pray('no missing close tags', token);
          // close tags
          if (token.slice(0, 2) === '</') {
            nesting -= 1;
          }
          // non-self-closing open tags
          else if (token.charAt(0) === '<' && token.slice(-2) !== '/>') {
            nesting += 1;
          }
        } while (nesting > 0);
      }
    }
    return tokens
      .join('')
      .replace(/>&(\d+)/g, function (_$0: string, $1: string) {
        var num1 = parseInt($1, 10);
        return (
          ' mathquill-block-id=' +
          blocks[num1].id +
          ' aria-hidden="true">' +
          blocks[num1].join('html')
        );
      });
  }

  // methods to export a string representation of the math tree
  latex() {
    return this.foldChildren(this.ctrlSeq || '', function (latex, child) {
      return latex + '{' + (child.latex() || ' ') + '}';
    });
  }
  textTemplate = [''];
  text() {
    var cmd = this,
      i = 0;
    return cmd.foldChildren(cmd.textTemplate[i], function (text, child) {
      i += 1;
      var child_text = child.text();
      if (
        text &&
        cmd.textTemplate[i] === '(' &&
        child_text[0] === '(' &&
        child_text.slice(-1) === ')'
      )
        return text + child_text.slice(1, -1) + cmd.textTemplate[i];
      return text + child_text + (cmd.textTemplate[i] || '');
    });
  }
  mathspeakTemplate = [''];
  mathspeak() {
    var cmd = this,
      i = 0;
    return cmd.foldChildren(
      cmd.mathspeakTemplate[i] || 'Start' + cmd.ctrlSeq + ' ',
      function (speech, block) {
        i += 1;
        return (
          speech +
          ' ' +
          block.mathspeak() +
          ' ' +
          (cmd.mathspeakTemplate[i] + ' ' || 'End' + cmd.ctrlSeq + ' ')
        );
      }
    );
  }
}

/**
 * Lightweight command without blocks or children.
 */
class MQSymbol extends MathCommand {
  constructor(
    ctrlSeq?: string,
    html?: string,
    text?: string,
    mathspeak?: string
  ) {
    super();
    this.setCtrlSeqHtmlTextAndMathspeak(ctrlSeq, html, text, mathspeak);
  }

  setCtrlSeqHtmlTextAndMathspeak(
    ctrlSeq?: string,
    html?: string,
    text?: string,
    mathspeak?: string
  ) {
    if (!text && !!ctrlSeq) {
      text = ctrlSeq.replace(/^\\/, '');
    }

    this.mathspeakName = mathspeak || text;
    super.setCtrlSeqHtmlAndText(ctrlSeq, html, [text || '']);
  }

  parser() {
    return Parser.succeed(this);
  }
  numBlocks() {
    return 0;
  }

  replaces(replacedFragment: Fragment) {
    replacedFragment.remove();
  }
  createBlocks() {}

  moveTowards(dir: Direction, cursor: Cursor) {
    cursor.jQ.insDirOf(dir, this.jQ);
    cursor[-dir as Direction] = this;
    cursor[dir] = this[dir];
    cursor.controller.aria.queue(this);
  }
  deleteTowards(dir: Direction, cursor: Cursor) {
    cursor[dir] = this.remove()[dir];
  }
  seek(pageX: number, cursor: Cursor) {
    // insert at whichever side the click was closer to
    if (pageX - this.jQ.offset().left < this.jQ.outerWidth() / 2)
      cursor.insLeftOf(this);
    else cursor.insRightOf(this);

    return cursor;
  }

  latex() {
    return this.ctrlSeq || '';
  }
  text() {
    return this.textTemplate.join('');
  }
  mathspeak(_opts?: MathspeakOptions) {
    return this.mathspeakName || '';
  }
  placeCursor() {}
  isEmpty() {
    return true;
  }
}
class VanillaSymbol extends MQSymbol {
  constructor(ch: string, html?: string, mathspeak?: string) {
    super(ch, '<span>' + (html || ch) + '</span>', undefined, mathspeak);
  }
}
function bindVanillaSymbol(ch: string, html?: string, mathspeak?: string) {
  return () => new VanillaSymbol(ch, html, mathspeak);
}

class BinaryOperator extends MQSymbol {
  constructor(
    ctrlSeq?: string,
    html?: string,
    text?: string,
    mathspeak?: string,
    treatLikeSymbol?: boolean
  ) {
    if (treatLikeSymbol) {
      super(
        ctrlSeq,
        '<span>' + (html || ctrlSeq) + '</span>',
        undefined,
        mathspeak
      );
    } else {
      super(
        ctrlSeq,
        '<span class="mq-binary-operator">' + html + '</span>',
        text,
        mathspeak
      );
    }
  }
}
function bindBinaryOperator(
  ctrlSeq?: string,
  html?: string,
  text?: string,
  mathspeak?: string
) {
  return () => new BinaryOperator(ctrlSeq, html, text, mathspeak);
}

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
class MathBlock extends MathElement {
  controller?: Controller;

  join(methodName: JoinMethod) {
    return this.foldChildren('', function (fold, child) {
      return fold + child[methodName]();
    });
  }
  html() {
    return this.join('html');
  }
  latex() {
    return this.join('latex');
  }
  text() {
    var endsL = this.ends[L];
    var endsR = this.ends[R];
    return endsL === endsR && endsL !== 0 ? endsL.text() : this.join('text');
  }
  mathspeak() {
    var tempOp = '';
    var autoOps: CursorOptions['autoOperatorNames'] = {};
    if (this.controller) autoOps = this.controller.options.autoOperatorNames;
    return (
      this.foldChildren<string[]>([], function (speechArray, cmd) {
        if (cmd.isPartOfOperator) {
          tempOp += cmd.mathspeak();
        } else {
          if (tempOp !== '') {
            if (autoOps._maxLength! > 0) {
              var x = autoOps[tempOp.toLowerCase()];
              if (typeof x === 'string') tempOp = x;
            }
            speechArray.push(tempOp + ' ');
            tempOp = '';
          }
          var mathspeakText = cmd.mathspeak();
          var cmdText = cmd.ctrlSeq;
          if (
            isNaN(cmdText as any) && // TODO - revisit this to improve the isNumber() check
            cmdText !== '.' &&
            (!cmd.parent ||
              !cmd.parent.parent ||
              !cmd.parent.parent.isTextBlock())
          ) {
            mathspeakText = ' ' + mathspeakText + ' ';
          }
          speechArray.push(mathspeakText);
        }
        return speechArray;
      })
        .join('')
        .replace(/ +(?= )/g, '')
        // For Apple devices in particular, split out digits after a decimal point so they aren't read aloud as whole words.
        // Not doing so makes 123.456 potentially spoken as "one hundred twenty-three point four hundred fifty-six."
        // Instead, add spaces so it is spoken as "one hundred twenty-three point four five six."
        .replace(/(\.)([0-9]+)/g, function (_match, p1, p2) {
          return p1 + p2.split('').join(' ').trim();
        })
    );
  }

  ariaLabel = 'block';

  keystroke(key: string, e: KeyboardEvent, ctrlr: Controller) {
    if (
      ctrlr.options.spaceBehavesLikeTab &&
      (key === 'Spacebar' || key === 'Shift-Spacebar')
    ) {
      e.preventDefault();
      ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
      return;
    }
    return super.keystroke(key, e, ctrlr);
  }

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  moveOutOf(dir: Direction, cursor: Cursor, updown?: 'up' | 'down') {
    var updownInto: NodeRef | undefined;
    if (updown === 'up') {
      updownInto = this.parent.upInto;
    } else if (updown === 'down') {
      updownInto = this.parent.downInto;
    }

    if (!updownInto && this[dir]) {
      const otherDir = -dir as Direction;
      cursor.insAtDirEnd(otherDir, this[dir] as MQNode);
      cursor.controller.aria.queueDirEndOf(otherDir).queue(cursor.parent, true);
    } else {
      cursor.insDirOf(dir, this.parent);
      cursor.controller.aria.queueDirOf(dir).queue(this.parent);
    }
  }
  selectOutOf(dir: Direction, cursor: Cursor) {
    cursor.insDirOf(dir, this.parent);
  }
  deleteOutOf(_dir: Direction, cursor: Cursor) {
    cursor.unwrapGramp();
  }
  seek(pageX: number, cursor: Cursor) {
    var node = this.ends[R];
    if (!node || node.jQ.offset().left + node.jQ.outerWidth() < pageX) {
      return cursor.insAtRightEnd(this);
    }

    var endsL = this.ends[L] as MQNode;
    if (pageX < endsL.jQ.offset().left) return cursor.insAtLeftEnd(this);
    while (pageX < node.jQ.offset().left) node = node[L] as MQNode;
    return node.seek(pageX, cursor);
  }
  chToCmd(ch: string, options: CursorOptions) {
    var cons;
    // exclude f because it gets a dedicated command with more spacing
    if (ch.match(/^[a-eg-zA-Z]$/)) return new Letter(ch);
    else if (/^\d$/.test(ch)) return new Digit(ch);
    else if (options && options.typingSlashWritesDivisionSymbol && ch === '/')
      return (LatexCmds as LatexCmdsSingleCharBuilder)['÷'](ch);
    else if (options && options.typingAsteriskWritesTimesSymbol && ch === '*')
      return (LatexCmds as LatexCmdsSingleCharBuilder)['×'](ch);
    else if (options && options.typingPercentWritesPercentOf && ch === '%')
      return (LatexCmds as LatexCmdsSingleCharBuilder).percentof(ch);
    else if (
      (cons = (CharCmds as CharCmdsAny)[ch] || (LatexCmds as LatexCmdsAny)[ch])
    ) {
      if (cons.constructor) {
        return new cons(ch);
      } else {
        return cons(ch);
      }
    } else return new VanillaSymbol(ch);
  }
  write(cursor: Cursor, ch: string) {
    var cmd = this.chToCmd(ch, cursor.options);
    if (cursor.selection) cmd.replaces(cursor.replaceSelection());
    if (!cursor.isTooDeep()) {
      cmd.createLeftOf(cursor.show());
      // special-case the slash so that fractions are voiced while typing
      if (ch === '/') {
        cursor.controller.aria.alert('over');
      } else {
        cursor.controller.aria.alert(cmd.mathspeak({ createdLeftOf: cursor }));
      }
    }
  }

  writeLatex(cursor: Cursor, latex: string) {
    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser
      .skip(eof)
      .or(all.result<false>(false))
      .parse(latex);

    if (block && !block.isEmpty() && block.prepareInsertionAt(cursor)) {
      block
        .children()
        .adopt(cursor.parent, cursor[L] as NodeRef, cursor[R] as NodeRef); // TODO - masking undefined. should be 0
      var jQ = block.jQize();
      jQ.insertBefore(cursor.jQ);
      cursor[L] = block.ends[R];
      block.finalizeInsert(cursor.options, cursor);
      var blockEndsR = block.ends[R];
      var blockEndsL = block.ends[L];
      var blockEndsRR = (blockEndsR as MQNode)[R];
      var blockEndsLL = (blockEndsL as MQNode)[L];
      if (blockEndsRR) blockEndsRR.siblingCreated(cursor.options, L);
      if (blockEndsLL) blockEndsLL.siblingCreated(cursor.options, R);
      cursor.parent.bubble(function (node) {
        node.reflow();
        return undefined;
      });
    }
  }

  focus() {
    this.jQ.addClass('mq-hasCursor');
    this.jQ.removeClass('mq-empty');

    return this;
  }
  blur(cursor: Cursor) {
    this.jQ.removeClass('mq-hasCursor');
    if (this.isEmpty()) {
      this.jQ.addClass('mq-empty');
      if (
        cursor &&
        this.isQuietEmptyDelimiter(cursor.options.quietEmptyDelimiters)
      ) {
        this.jQ.addClass('mq-quiet-delimiter');
      }
    }
    return this;
  }
}

Options.prototype.mouseEvents = true;
API.StaticMath = function (APIClasses: APIClasses) {
  return class StaticMath extends APIClasses.AbstractMathQuill {
    static RootBlock = MathBlock;

    __mathquillify(opts: CursorOptions, _interfaceVersion: number) {
      this.config(opts);
      super.__mathquillify('mq-math-mode');
      if (this.__options.mouseEvents) {
        this.__controller.delegateMouseEvents();
        this.__controller.staticMathTextareaEvents();
      }
      return this;
    }
    constructor(el: MQNode) {
      super(el);
      var innerFields = (this.innerFields = []);
      this.__controller.root.postOrder(function (node: MQNode) {
        node.registerInnerField(innerFields, APIClasses.InnerMathField);
      });
    }
    latex() {
      var returned = super.latex.apply(this, arguments);
      if (arguments.length > 0) {
        var innerFields = (this.innerFields = []);
        this.__controller.root.postOrder(function (node: MQNode) {
          node.registerInnerField(innerFields, APIClasses.InnerMathField);
        });
        // Force an ARIA label update to remain in sync with the new LaTeX value.
        this.__controller.updateMathspeak();
      }
      return returned;
    }
    setAriaLabel(ariaLabel: string) {
      this.__controller.setAriaLabel(ariaLabel);
      return this;
    }
    getAriaLabel() {
      return this.__controller.getAriaLabel();
    }
  };
};

class RootMathBlock extends MathBlock {}
RootBlockMixin(RootMathBlock.prototype); // adds methods to RootMathBlock

API.MathField = function (APIClasses: APIClasses) {
  return class MathField extends APIClasses.EditableField {
    static RootBlock = RootMathBlock;

    __mathquillify(opts: CursorOptions, interfaceVersion: number) {
      this.config(opts);
      if (interfaceVersion > 1) this.__controller.root.reflow = noop;
      super.__mathquillify('mq-editable-field mq-math-mode');
      delete this.__controller.root.reflow;
      return this;
    }
  };
};

API.InnerMathField = function (APIClasses: APIClasses) {
  return class extends APIClasses.MathField {
    makeStatic() {
      this.__controller.editable = false;
      this.__controller.root.blur();
      this.__controller.unbindEditablesEvents();
      this.__controller.container.removeClass('mq-editable-field');
    }
    makeEditable() {
      this.__controller.editable = true;
      this.__controller.editablesTextareaEvents();
      this.__controller.cursor.insAtRightEnd(this.__controller.root);
      this.__controller.container.addClass('mq-editable-field');
    }
  };
};
