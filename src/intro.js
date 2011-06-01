(function($){ //takes in the jQuery function as an argument

var _, //temp variable of prototypes
  undefined,
  isIE7 = $.browser.msie && (parseInt($.browser.version) == 7), // Browser sniffing
  isIE8 = $.browser.msie && (parseInt($.browser.version) == 8),
  jQueryDataKey = '[[mathquill internal data]]';

