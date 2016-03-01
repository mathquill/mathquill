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
    if (!jQuery(el).length) jQuery('body').append("<div role='alert' aria-live='assertive' aria-atomic='true' class='mq-aria-alert'></div>"); // make this as noisy as possible in hopes that all modern screen reader/browser combinations will speak when triggered later.
    this.jQ = jQuery(el);
    this.text = "";
    this.repDict = {
      "+": " plus ",
      "-": " minus ",
      "*": " times ",
      "/": " over ",
      "^": " exponent ",
      "=": " equals ",
      "(": " left paren ",
      ")": " right paren ",
      "frac": "fraction",
      "sqrt": "square root"
    };
  };

  _.massageText = function(t) {
    for(var key in this.repDict) {
      if (this.repDict.hasOwnProperty(key)) t = t.replace(key, this.repDict[key]);
    }
    return t;
  };


  _.queue = function(item, shouldAppend) {
    var t = "", spaceChar = " ";
    if(typeof(item) === 'object' ) {
      if(item.text) t = item.text();
      else if(item.ctrlSeq) t = item.ctrlSeq;
      else if(item.ch) t = item.ch;
      t = this.massageText(t);
    }
    else t = item;

    if(this.text === "" || t === "") spaceChar = "";
    if(t) {
      if (shouldAppend) {
        this.text = this.text + spaceChar + t;
      }
      else {
        this.text = t + spaceChar + this.text;
      }
    }
  };

  _.alert = function(t) {
    if(t) this.queue(t, true);
    if(this.text) this.jQ.empty().html(this.text);
    this.clear();
  };

  _.clear = function() {
    this.text = "";
  };
});

// We only ever need one instance of the ARIA alert object, and it needs to be easily accessible from all modules.
var aria = Aria();
