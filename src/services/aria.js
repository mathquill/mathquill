/*****************************************

 * Add the capability for mathquill to generate ARIA alerts. Necessary so MQ can convey information as a screen reader user navigates the fake MathQuill textareas.
 * Official ARIA specification: https://www.w3.org/TR/wai-aria/
 * WAI-ARIA is still catching on, thus only more recent browsers support it, and even then to varying degrees.
 * The below implementation attempts to be as broad as possible and may not conform precisely to the spec. But, neither do any browsers or adaptive technologies at this point.
 * At time of writing, IE 11, FF 44, and Safari 8.0.8 work. Older versions of these browsers should speak as well, but haven't tested precisely which earlier editions pass.

 * Tested AT: on Windows, Window-Eyes, ZoomText Fusion, NVDA, and JAWS (all supported).
 * VoiceOver on Mac platforms also supported (only tested with OSX 10.10.5 and iOS 9.2.1+).
 * Chrome 54+ on Android works reliably with Talkback.
 ****************************************/

class Aria {
  constructor () {
    this.jQ = jQuery([]); // empty element
    // Add the alert DOM element only after the page has loaded.
    jQuery(document).ready(function() {
      var el = '.mq-aria-alert';
      // No matter how many Mathquill instances exist, we only need one alert object to say something.
      if (!jQuery(el).length) jQuery('body').append("<p aria-live='assertive' aria-atomic='true' class='mq-aria-alert'></p>"); // make this as noisy as possible in hopes that all modern screen reader/browser combinations will speak when triggered later.
      this.jQ = jQuery(el);
    }.bind(this));
    this.items = [];
    this.msg = '';
  };

  queue (item, shouldDescribe) {
    var output = '';
    if (item instanceof MQNode) {
      // Some constructs include verbal shorthand (such as simple fractions and exponents).
      // Since ARIA alerts relate to moving through interactive content, we don't want to use that shorthand if it exists
      // since doing so may be ambiguous or confusing.
      var itemMathspeak = item.mathspeak({ignoreShorthand: true});
      if (shouldDescribe) { // used to ensure item is described when cursor reaches block boundaries
        if (
          item.parent &&
          item.parent.ariaLabel &&
          item.ariaLabel === 'block'
        ) {
          output = item.parent.ariaLabel+' '+itemMathspeak;
        } else if (item.ariaLabel) {
          output = item.ariaLabel+' '+itemMathspeak;
        }
      }
      if (output === '') {
        output = itemMathspeak;
      }
    } else {
      output = item;
    }
    this.items.push(output);
    return this;
  };
  queueDirOf (dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'before' : 'after');
  };
  queueDirEndOf (dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'beginning of' : 'end of');
  };

  alert (t) {
    if (t) this.queue(t);
    if (this.items.length) {
      this.msg = this.items.join(' ').replace(/ +(?= )/g,'').trim();
      this.jQ.empty().text(this.msg);
    }
    return this.clear();
  };

  clear () {
    this.items.length = 0;
    return this;
  };
};

// We only ever need one instance of the ARIA alert object, and it needs to be easily accessible from all modules.
var aria = new Aria();
