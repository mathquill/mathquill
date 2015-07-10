    if ( typeof exports === 'object' ) {
        // add the css data to the head tag
        require('./mathquill.css');
        // export the module 
        module.exports = function(selector, argument){
          jQuery(selector).mathquill(argument);
        };
    }
}());
