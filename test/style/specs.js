/*global describe,require,it,browser */
describe('Mathquill style tests', function () {
    'use strict';

    var assert = require('assert'),
        tests = [
            ["Fraction","\\frac{x}{y}"],
            ["Square root","\\sqrt{123}"],
            ["Nested fraction","\\frac{\\frac{x}{y}}{\\frac{x}{y}}"],
            ["Vertically stretched square root","\\sqrt{\\frac{1}{2}}"],
            ["Horizontal alignment: fraction, underset","\\frac{x}{y} + \\underset{y}{x}"]
        ];

    before(function(done) {
        require('webdrivercss').init(browser, {
            // example options
            screenshotRoot: './test/style/screenshots',
            failedComparisonsRoot: './test/style/screenshots/failed',
            misMatchTolerance: 0.05
        });
        browser.url('http://127.0.0.1:8878/test/style.html').then(function () {
            done();
        });
    });

    tests.forEach(function (test, index) {
        it('correctly styles ' + test[0], function (done) {
            var id = addTest(test, index, done);
            browser.webdrivercss('styles', [{
                name: id,
                elem: '#' + id
            }], function(err, res) {
                assert.ifError(err);
                assert.ok(res[id][0].isWithinMisMatchTolerance);
                done();
            });
        });
    });
});

// Add mathquill block to screen and return id
function addTest(test, index) {
    var id = test[0].replace(/[^\w]/g, '') + '-' +  index;
    browser.execute(function (id, latex) {
        var $el = $('<span class="mathquill-math-field">').attr('id', id).text(latex);
        $('#test').append($el);
        MathQuill.MathField($el[0]);
    }, id, test[1]);
    return id;
}