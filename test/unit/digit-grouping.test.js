suite('Digit Grouping', function() {

    function buildTreeRecursively ($el) {
        var tree = {};

        if ($el[0].className) {
            tree.classes = $el[0].className;
        }

        var children = $el.children();
        if (children.length) {
            tree.content = [];
            for (var i=0; i < children.length; i++) {
                tree.content.push(buildTreeRecursively($(children[i])));
            }
        } else {
            tree.content = $el[0].innerHTML;
        }

        return tree;
    }

    function assertClasses (mq, expected) {
        var $el = $(mq.el());
        var actual = {
            latex: mq.latex(),
            suppressedGrouping: $el.hasClass('mq-suppress-grouping'),
            tree: buildTreeRecursively($el.find('.mq-root-block'))
        };

        window.actual = actual;
        assert.equal(JSON.stringify(actual, null, 2), JSON.stringify(expected, null, 2));
    }

    test('edge cases', function () {
        var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {enableDigitGrouping: true});
        assertClasses(mq, {
            latex: '',
            suppressedGrouping: false,
            tree: {
                classes: 'mq-root-block mq-empty',
                content: ''
            }
        })

        mq.latex('1\\ ');
        assertClasses(mq, {
            latex: '1\\ ',
            suppressedGrouping: false,
            tree: {
                classes: 'mq-root-block',
                content: [
                    {
                        classes: 'mq-digit',
                        content: '1'
                    },
                    {
                        content: '&nbsp;',
                    }
                ],
            }
        });

        mq.latex('\\ 1');
        assertClasses(mq, {
            "latex": "\\ 1",
            "suppressedGrouping": false,
            "tree": {
                "classes": "mq-root-block",
                "content": [
                {
                    "content": "&nbsp;"
                },
                {
                    "classes": "mq-digit",
                    "content": "1"
                }
                ]
            }
        });

        mq.latex('\\ 1\\ ');
        assertClasses(mq, {
            "latex": "\\ 1\\ ",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "&nbsp;"
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "content": "&nbsp;"
                }
              ]
            }
        });

        mq.latex('a');
        assertClasses(mq, {
            "latex": "a",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "a"
                }
              ]
            }
        });

        mq.latex('a\\ ');
        assertClasses(mq, {
            "latex": "a\\ ",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "a"
                },
                {
                  "content": "&nbsp;"
                }
              ]
            }
        });

        mq.latex('\\ a');
        assertClasses(mq, {
            "latex": "\\ a",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "a"
                }
              ]
            }
        });

        mq.latex('a\\ a');
        assertClasses(mq, {
            "latex": "a\\ a",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "a"
                },
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "a"
                }
              ]
            }
        });

        mq.latex('\\ a\\ ');
        assertClasses(mq, {
            "latex": "\\ a\\ ",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "a"
                },
                {
                  "content": "&nbsp;"
                }
              ]
            }
        });

        mq.latex('.');
        assertClasses(mq, {
            "latex": ".",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "."
                }
              ]
            }
        });

        mq.latex('.\\ .');
        assertClasses(mq, {
            "latex": ".\\ .",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "content": "&nbsp;"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                }
              ]
            }
        });

        mq.latex('..');
        assertClasses(mq, {
            "latex": "..",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                }
              ]
            }
        });

        mq.latex('2..');
        assertClasses(mq, {
            "latex": "2..",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                }
              ]
            }
          });

        mq.latex('..2');
        assertClasses(mq, {
            "latex": "..2",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                }
              ]
            }
          });

        mq.latex('\\ \\ ');
        assertClasses(mq, {
            "latex": "\\ \\ ",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "&nbsp;"
                }
              ]
            }
          });

        mq.latex('\\ \\ \\ ');
        assertClasses(mq, {
            "latex": "\\ \\ \\ ",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "&nbsp;"
                },
                {
                  "content": "&nbsp;"
                }
              ]
            }
        });

        mq.latex('1234');
        assertClasses(mq, {
            "latex": "1234",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit mq-group-leading-1",
                  "content": "1"
                },
                {
                  "classes": "mq-digit mq-group-start",
                  "content": "2"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "3"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "4"
                }
              ]
            }
          });
    });

    test('efficient latex updates - grouping enabled', function () {
        var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {enableDigitGrouping: true});
        assertClasses(mq, {
            latex: '',
            suppressedGrouping: false,
            tree: {
                classes: 'mq-root-block mq-empty',
                content: ''
            }
        })

        mq.latex('1.2322');
        assertClasses(mq, {
            "latex": "1.2322",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                    "classes": "mq-digit",
                    "content": "2"
                }
              ]
            }
          });

        mq.latex('1231.123');
        assertClasses(mq, {
            "latex": "1231.123",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit mq-group-leading-1",
                  "content": "1"
                },
                {
                  "classes": "mq-digit mq-group-start",
                  "content": "2"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "3"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                }
              ]
            }
        });

        mq.latex('1231.432');
        assertClasses(mq, {
            "latex": "1231.432",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit mq-group-leading-1",
                  "content": "1"
                },
                {
                  "classes": "mq-digit mq-group-start",
                  "content": "2"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "3"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "4"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                }
              ]
            }
        });

        mq.latex('1231232.432');
        assertClasses(mq, {
            "latex": "1231232.432",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit mq-group-leading-1",
                  "content": "1"
                },
                {
                  "classes": "mq-digit mq-group-start",
                  "content": "2"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "3"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "1"
                },
                {
                  "classes": "mq-digit mq-group-start",
                  "content": "2"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "3"
                },
                {
                  "classes": "mq-digit mq-group-other",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "4"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                }
              ]
            }
        });
    });

    test('efficient latex updates - grouping disabled', function () {
        var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
        assertClasses(mq, {
            latex: '',
            suppressedGrouping: false,
            tree: {
                classes: 'mq-root-block mq-empty',
                content: ''
            }
        })

        mq.latex('1.2322');
        assertClasses(mq, {
            "latex": "1.2322",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                    "classes": "mq-digit",
                    "content": "2"
                }
              ]
            }
          });

        mq.latex('1231.123');
        assertClasses(mq, {
            "latex": "1231.123",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                }
              ]
            }
        });

        mq.latex('1231.432');
        assertClasses(mq, {
            "latex": "1231.432",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "4"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                }
              ]
            }
        });

        mq.latex('1231232.432');
        assertClasses(mq, {
            "latex": "1231232.432",
            "suppressedGrouping": false,
            "tree": {
              "classes": "mq-root-block",
              "content": [
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "1"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                },
                {
                  "classes": "mq-digit",
                  "content": "."
                },
                {
                  "classes": "mq-digit",
                  "content": "4"
                },
                {
                  "classes": "mq-digit",
                  "content": "3"
                },
                {
                  "classes": "mq-digit",
                  "content": "2"
                }
              ]
            }
        });
    });

});