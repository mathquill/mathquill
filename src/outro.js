    if ( typeof exports === 'object' ) {
        // add the css data to the head tag
        require('fs').readFile('./mathquill.css', function (err, style_file_contents) {
          $('head').append('<style>' + style_file_contents + '</style>');
        });
        // export the module 
        module.exports = function(selector, argument){
          jQuery(selector).mathquill(argument);
        };
    }
}());
