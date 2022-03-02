const trigger = {
  cut: (el: HTMLElement) => el.dispatchEvent(new ClipboardEvent('cut')),
  copy: (el: HTMLElement) => el.dispatchEvent(new ClipboardEvent('copy')),
  paste: (el: HTMLElement) => el.dispatchEvent(new ClipboardEvent('paste')),
  input: (el: HTMLElement) => el.dispatchEvent(new InputEvent('input')),
  keydown: triggerKeyboardEvent.bind(null, 'keydown'),
  keyup: triggerKeyboardEvent.bind(null, 'keyup'),
  keypress: triggerKeyboardEvent.bind(null, 'keypress'),
  blur: (el: HTMLElement) => {
    el.dispatchEvent(new FocusEvent('blur'));
    el.dispatchEvent(new FocusEvent('focusout'));
  },
  _: '',
};

trigger._ = 'dummy usage of "trigger" to satisfy TypeScript';

function triggerKeyboardEvent(
  type: 'keyup' | 'keydown' | 'keypress',
  el: HTMLElement,
  key: KeyName,
  modifiers: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  } = {}
) {
  el.dispatchEvent(
    new KeyboardEvent(type, {
      ...modifiers,
      key,
    })
  );
}

/**
 * Incomplete list of possible values of KeyEvent.key
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
export type KeyName =
  | 'Backspace'
  | 'Tab'
  | 'Enter'
  | 'Shift'
  | 'Control'
  | 'Alt'
  | 'CapsLock'
  | 'Escape'
  | ' '
  | 'PageUp'
  | 'PageDown'
  | 'End'
  | 'Home'
  | 'ArrowLeft'
  | 'ArrowUp'
  | 'ArrowRight'
  | 'ArrowDown'
  | 'Left'
  | 'Up'
  | 'Right'
  | 'Down'
  | 'Insert'
  | 'Delete'
  | '0'
  | ')'
  | '1'
  | '!'
  | '2'
  | '@'
  | '3'
  | '£'
  | '#'
  | '4'
  | '$'
  | '5'
  | '%'
  | '6'
  | '^'
  | '7'
  | '&'
  | '8'
  | '*'
  | '*'
  | '9'
  | '('
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  | 'Meta'
  | 'LeftWindowKey'
  | 'RightWindowKey'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'NumLock'
  | 'ScrollLock'
  | ';'
  | '='
  | ','
  | '-'
  | '.'
  | '_'
  | '+'
  | '/'
  | '~'
  | '`'
  | '['
  | ']'
  | "'"
  | '"';
