/* globals module, require */

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        webdriver: {
            chrome: {
                tests: ['./test/style/specs.js'],
                options: {
                    desiredCapabilities: {
                        browserName: 'chrome'
                    }
                }
            }
        },
        'http-server': {
            tests: {
                port: 8878,
                root : '.',
                runInBackground: true
            }
        }
    });

    grunt.registerTask('test', ['http-server:tests', 'webdriver']);
};