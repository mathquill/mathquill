/***********************************************
 * Horizontal panning for editable fields that
 * overflow their width
 **********************************************/

class Controller_scrollHoriz extends Controller_mouse {
  setOverflowClasses() {
    var root = this.root.domFrag().oneElement();
    var shouldHaveOverflowRight = false;
    var shouldHaveOverflowLeft = false;
    if (!this.blurred) {
      var width = getBoundingClientRect(root).width;
      var scrollWidth = root.scrollWidth;
      var scroll = root.scrollLeft;
      shouldHaveOverflowRight = scrollWidth > width + scroll;
      shouldHaveOverflowLeft = scroll > 0;
    }
    if (
      root.classList.contains('mq-editing-overflow-right') !==
      shouldHaveOverflowRight
    )
      root.classList.toggle('mq-editing-overflow-right');
    if (
      root.classList.contains('mq-editing-overflow-left') !==
      shouldHaveOverflowLeft
    )
      root.classList.toggle('mq-editing-overflow-left');
  }
  scrollHoriz() {
    var cursor = this.cursor,
      seln = cursor.selection;
    var rootRect = getBoundingClientRect(this.root.domFrag().oneElement());
    if (cursor.domFrag().isEmpty() && !seln) {
      this.root
        .getJQ()
        .stop()
        .animate({ scrollLeft: 0 }, 100, () => {
          this.setOverflowClasses();
        });
      return;
    } else if (!seln) {
      var x = getBoundingClientRect(cursor.domFrag().oneElement()).left;
      if (x > rootRect.right - 20) var scrollBy = x - (rootRect.right - 20);
      else if (x < rootRect.left + 20) var scrollBy = x - (rootRect.left + 20);
      else return;
    } else {
      var rect = getBoundingClientRect(seln.domFrag().oneElement());
      var overLeft = rect.left - (rootRect.left + 20);
      var overRight = rect.right - (rootRect.right - 20);
      if (seln.getEnd(L) === cursor[R]) {
        if (overLeft < 0) var scrollBy = overLeft;
        else if (overRight > 0) {
          if (rect.left - overRight < rootRect.left + 20)
            var scrollBy = overLeft;
          else var scrollBy = overRight;
        } else return;
      } else {
        if (overRight > 0) var scrollBy = overRight;
        else if (overLeft < 0) {
          if (rect.right - overLeft > rootRect.right - 20)
            var scrollBy = overRight;
          else var scrollBy = overLeft;
        } else return;
      }
    }

    var root = this.root.domFrag().oneElement();
    if (scrollBy < 0 && root.scrollLeft === 0) return;
    if (scrollBy > 0 && root.scrollWidth <= root.scrollLeft + rootRect.width)
      return;
    this.root
      .getJQ()
      .stop()
      .animate({ scrollLeft: '+=' + scrollBy }, 100, () => {
        this.setOverflowClasses();
      });
  }
}
