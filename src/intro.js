(function($){ //takes in the jQuery function as an argument

var _, //temp variable of prototypes
  undefined,
  jQueryDataKey = '[[mathquill internal data]]';

/*************************************************
 * Helper functions
 ************************************************/
function unescapeHTML(html) {
  return $("<div />").html(html).text();
}