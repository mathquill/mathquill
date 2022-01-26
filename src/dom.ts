const urlParams = new URLSearchParams(window.location.search);

type TagName = 'span' | 'textarea';

interface CreateElementAttributes {
  class?: string;
  style?: string;
  [name: string]: string | boolean | number | undefined;
}

function parseHTML(s: string) {
  const tmp = document.implementation.createHTMLDocument('');
  tmp.body.innerHTML = s;
  return tmp.body.childNodes;
}

function h(
  type: TagName,
  attributes?: CreateElementAttributes,
  children?: ChildNode[] | NodeListOf<ChildNode>
): HTMLElement {
  // https://youmightnotneedjquery.com/#parse_html
  const el = document.createElement(type);
  for (const key in attributes) {
    const value = attributes[key];
    if (value === undefined) continue;
    el.setAttribute(key, typeof value === 'string' ? value : String(value));
  }

  if (children) {
    for (let i = 0; i < children.length; i++) {
      el.appendChild(children[i]);
    }
  }
  return el;
}

function closest(el: unknown | null, s: string) {
  if (typeof (el as any)?.closest === 'function') {
    return (el as HTMLElement).closest(s);
  }

  if (!(el instanceof HTMLElement)) return null;

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#polyfill
  const matches =
    Element.prototype.matches ||
    (Element.prototype as any).msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;

  var match: ParentNode | null = el;
  do {
    if (matches.call(match, s)) return match;
    match = match?.parentElement ?? match?.parentNode ?? null;
  } while (match !== null && match.nodeType === 1);
  return null;
}
