/***********************************************
 * Horizontal panning for editable fields that
 * overflow their width
 **********************************************/

Controller.open(function(_) {
  _.setOverflowClasses = function () {
    var $root = this.root.jQ;
    if (this.cursor.jQ[0]) {
      var width = $root.outerWidth();
      var scrollWidth = $root[0].scrollWidth;
      var scroll = $root.scrollLeft();
      $root.toggleClass('mq-editing-overflow-right', (scrollWidth > width + scroll));
      $root.toggleClass('mq-editing-overflow-left', (scroll > 0));
    } else {
      $root.removeClass('mq-editing-overflow-right');
      $root.removeClass('mq-editing-overflow-left');
    }
  }
  _.scrollHoriz = function() {
    var cursor = this.cursor, seln = cursor.selection;
    var rootRect = this.root.jQ[0].getBoundingClientRect();
    if (!cursor.jQ[0]) {
      this.root.jQ.stop().animate({scrollLeft: 0}, 100, function () {
        this.setOverflowClasses();
      }.bind(this));
      return;
    } else if (!seln) {
      var x = cursor.jQ[0].getBoundingClientRect().left;
      if (x > rootRect.right - 20) var scrollBy = x - (rootRect.right - 20);
      else if (x < rootRect.left + 20) var scrollBy = x - (rootRect.left + 20);
      else return;
    } else {
      var rect = seln.jQ[0].getBoundingClientRect();
      var overLeft = rect.left - (rootRect.left + 20);
      var overRight = rect.right - (rootRect.right - 20);
      if (seln.ends[L] === cursor[R]) {
        if (overLeft < 0) var scrollBy = overLeft;
        else if (overRight > 0) {
          if (rect.left - overRight < rootRect.left + 20) var scrollBy = overLeft;
          else var scrollBy = overRight;
        }
        else return;
      }
      else {
        if (overRight > 0) var scrollBy = overRight;
        else if (overLeft < 0) {
          if (rect.right - overLeft > rootRect.right - 20) var scrollBy = overRight;
          else var scrollBy = overLeft;
        }
        else return;
      }
    }
    this.root.jQ.stop().animate({ scrollLeft: '+=' + scrollBy}, 100, function () {
      this.setOverflowClasses();
    }.bind(this));
  };
});
