/*****************************************

 * Add the capability for mathquill to generate ARIA alerts. Necessary so MQ can convey information as a screen reader user navigates the fake MathQuill textareas.
 * Official ARIA specification: https://www.w3.org/TR/wai-aria/
 * WAI-ARIA is still catching on, thus only more recent browsers support it, and even then to varying degrees.
 * The below implementation attempts to be as broad as possible and may not conform precisely to the spec. But, neither do any browsers or adaptive technologies at this point.
 * At time of writing, IE 11, FF 44, and Safari 8.0.8 work. Older versions of these browsers should speak as well, but haven't tested precisely which earlier editions pass.
 * Todo: find out why Chrome refuses to speak.

 * Tested AT: on Windows, Window-Eyes, ZoomText Fusion, NVDA, and JAWS (all supported).
 * VoiceOver on Mac platforms also supported (only tested with OSX 10.10.5 and iOS 9.2.1+).
 * Android is hit or miss, Firefox seems to work more predictably than Chrome when tested against Talkback.
 ****************************************/

var Aria = P(function(_) {
  _.init = function() {
    var el = '.mq-aria-alert';
    // No matter how many Mathquill instances exist, we only need one alert object to say something.
    if (!jQuery(el).length) jQuery('body').append("<div aria-live='assertive' aria-atomic='true' class='mq-aria-alert'></div>"); // make this as noisy as possible in hopes that all modern screen reader/browser combinations will speak when triggered later.
    this.jQ = jQuery(el);
    this.items = [];
  };

  _.queue = function(item, shouldDescribe) {
    if (item instanceof Node) {
      if (shouldDescribe) { // used to ensure item is described when cursor reaches block boundaries
        if (item.parent && item.parent.ariaLabel) item = item.parent.ariaLabel+' '+item.mathspeak();
        else if (item.ariaLabel) item = item.ariaLabel+' '+item.mathspeak();
        else item = item.mathspeak();
      }
      else item = item.mathspeak();
    }
    this.items.push(item);
    return this;
  };
  _.queueDirOf = function(dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'before' : 'after');
  };
  _.queueDirEndOf = function(dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'beginning of' : 'end of');
  };

  _.alert = function(t) {
    if (t) this.queue(t);
    if (this.items.length) this.jQ.empty().html(this.items.join(' '));
    return this.clear();
  };

  _.clear = function() {
    this.items.length = 0;
    return this;
  };
});

// We only ever need one instance of the ARIA alert object, and it needs to be easily accessible from all modules.
var aria = Aria();

Controller.open(function(_) {
  // based on http://www.gh-mathspeak.com/examples/quick-tutorial/
  // and http://www.gh-mathspeak.com/examples/grammar-rules/
  _.exportMathSpeak = function() { return this.root.mathspeak(); };
});
