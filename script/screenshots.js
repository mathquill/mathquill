// This script assumes the following:
//   1. You've installed wd with `npm install wd'.
//   2. You've set the environment variables $SAUCE_USERNAME and $SAUCE_ACCESS_KEY.
//   3. If the environment variable $CIRCLE_ARTIFACTS is not set imanges will be saved in /tmp
//
// The intention of this script is that it will be ran from CircleCI
//
// Example usage:
// node screenshots.js http://localhost:9292/test/visual.html
// node screenshots.js http://google.com

var wd = require('wd');
var username = process.env['SAUCE_USERNAME'];
var accessKey = process.env['SAUCE_ACCESS_KEY'];
var dir = process.env['CIRCLE_ARTIFACTS'] || '/tmp';
var url = process.argv[2];

var browserVersions = [
  {
    'browserName': 'chrome',
    'platform': 'OS X 10.11'
  },
  {
    'browserName': 'firefox',
    'platform': 'OS X 10.11'
  },
  {
    'browserName': 'safari'
    // Adding platform here makes tests hang.
  }
];


browserVersions.forEach(function(cfg) {
  var browserDriver = wd.remote('ondemand.saucelabs.com', 80, username, accessKey);
  // The following is in the style of
  // https://github.com/admc/wd/blob/62f2b0060d36a402de5634477b26a5ed4c051967/examples/async/chrome.js#L25-L40
  browserDriver.init(cfg, function(err, _, cap) {
    if (err) console.log(err);

    browserDriver.get(url, function(err) {
      if (err) console.log(err);
      browserDriver.safeExecute(widthScript, function(err,width) {
        if (err) console.log(err);
        browserDriver.safeExecute(heightScript, function(err,height) {
          if (err) console.log(err);

          browserDriver.setWindowSize(width,height,function(err) {
            if (err) console.log(err);

            var browser = cfg.browserName+(!!cap ? '_'+cap.version : '');
            var platform = cap.platform.replace(/\s/g, '_');

            // saves file in the file `dir/browser_version_platform.png`
            var filename = dir+'/'+browser+'_'+platform+'.png';
            browserDriver.saveScreenshot(filename, function(err) {
              if (err) console.log(err);
              browserDriver.quit()
            });
          });

        });
      });
    });
  });
});
