function setupJqueryStub() {
  (window as any).$ = (window as any).jQuery = function $_stub(
    s: string | Element | null
  ) {
    if (typeof s === 'string') {
      s = document.querySelector(s);
    }

    return {
      0: s,
      html: () => (s as Element).innerHTML,
    };
  };
}
