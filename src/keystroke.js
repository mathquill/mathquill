/*****************************************
 * Deals with the browser DOM events from
 * interaction with the typist.
 ****************************************/

Node.open(function(_) {
  _.keystroke = function(key, e, cursor) {
    switch (key) {
    case 'Ctrl-Shift-Backspace':
    case 'Ctrl-Backspace':
      while (cursor[L] || cursor.selection) {
        cursor.backspace();
      }
      break;

    case 'Shift-Backspace':
    case 'Backspace':
      cursor.backspace();
      break;

    // Tab or Esc -> go one block right if it exists, else escape right.
    case 'Esc':
    case 'Tab':
      cursor.escapeDir(R, key, e);
      return;

    // Shift-Tab -> go one block left if it exists, else escape left.
    case 'Shift-Tab':
    case 'Shift-Esc':
      cursor.escapeDir(L, key, e);
      return;

    // Prevent newlines from showing up
    case 'Enter': break;


    // End -> move to the end of the current block.
    case 'End':
      cursor.prepareMove().insAtRightEnd(cursor.parent);
      break;

    // Ctrl-End -> move all the way to the end of the root block.
    case 'Ctrl-End':
      cursor.prepareMove().insAtRightEnd(cursor.root);
      break;

    // Shift-End -> select to the end of the current block.
    case 'Shift-End':
      while (cursor[R]) {
        cursor.selectRight();
      }
      break;

    // Ctrl-Shift-End -> select to the end of the root block.
    case 'Ctrl-Shift-End':
      while (cursor[R] || cursor.parent !== cursor.root) {
        cursor.selectRight();
      }
      break;

    // Home -> move to the start of the root block or the current block.
    case 'Home':
      cursor.prepareMove().insAtLeftEnd(cursor.parent);
      break;

    // Ctrl-Home -> move to the start of the current block.
    case 'Ctrl-Home':
      cursor.prepareMove().insAtLeftEnd(cursor.root);
      break;

    // Shift-Home -> select to the start of the current block.
    case 'Shift-Home':
      while (cursor[L]) {
        cursor.selectLeft();
      }
      break;

    // Ctrl-Shift-Home -> move to the start of the root block.
    case 'Ctrl-Shift-Home':
      while (cursor[L] || cursor.parent !== cursor.root) {
        cursor.selectLeft();
      }
      break;

    case 'Left': cursor.moveLeft(); break;
    case 'Shift-Left': cursor.selectLeft(); break;
    case 'Ctrl-Left': break;

    case 'Right': cursor.moveRight(); break;
    case 'Shift-Right': cursor.selectRight(); break;
    case 'Ctrl-Right': break;

    case 'Up': cursor.moveUp(); break;
    case 'Down': cursor.moveDown(); break;

    case 'Shift-Up':
      if (cursor[L]) {
        while (cursor[L]) cursor.selectLeft();
      } else {
        cursor.selectLeft();
      }

    case 'Shift-Down':
      if (cursor[R]) {
        while (cursor[R]) cursor.selectRight();
      }
      else {
        cursor.selectRight();
      }

    case 'Ctrl-Up': break;
    case 'Ctrl-Down': break;

    case 'Ctrl-Shift-Del':
    case 'Ctrl-Del':
      while (cursor[R] || cursor.selection) {
        cursor.deleteForward();
      }
      break;

    case 'Shift-Del':
    case 'Del':
      cursor.deleteForward();
      break;

    case 'Meta-A':
    case 'Ctrl-A':
      cursor.prepareMove().insAtRightEnd(cursor.root);
      while (cursor[L]) cursor.selectLeft();
      break;

    default:
      return false;
    }
    e.preventDefault();
    return false;
  };
});
