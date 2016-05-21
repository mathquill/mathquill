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
var fs = require('fs');
var username = process.env['SAUCE_USERNAME'];
var accessKey = process.env['SAUCE_ACCESS_KEY'];
var baseDir = process.env['CIRCLE_ARTIFACTS'] || '/tmp';
var url = process.argv[2];
var dir = baseDir+'/imgs'
fs.mkdirSync(dir)

var browserVersions = [
  {
    'browserName': 'Internet Explorer',
    'platform': 'Windows XP'
  },
  {
    'browserName': 'firefox',
    'platform': 'OS X 10.11'
  },
  {
    'browserName': 'safari',
    'platform': 'OS X 10.11'
  },
  {
    'browserName': 'chrome',
    'platform': 'OS X 10.11'
  }
];


browserVersions.forEach(function(cfg) {
  var browserDriver = wd.remote('ondemand.saucelabs.com', 80, username, accessKey);
  // The following is in the style of
  // https://github.com/admc/wd/blob/62f2b0060d36a402de5634477b26a5ed4c051967/examples/async/chrome.js#L25-L40
  browserDriver.init(cfg, function(err, _, cap) {
    var browser = cfg.browserName.replace(/\s/g, '_')+(!!cap ? '_'+cap.version : '');
    var platform = (cap ? cap : cfg).platform.replace(/\s/g, '_');
    var subDir = dir+'/'+browser+'_'+platform;
    fs.mkdirSync(subDir)

    if (err) console.log(err);

    browserDriver.get(url, function(err) {
      if (err) console.log(err);
      browserDriver.safeExecute('document.documentElement.scrollHeight', function(err,scrollHeight) {
        if (err) console.log(err);
        browserDriver.safeExecute('document.documentElement.clientHeight', function(err,viewportHeight) {
          if (err) console.log(err);

          var position = 0;
          // loop generates the image(s). Firefox and Internet Explorer will take
          // a screenshot of the entire webpage, but Opera, Safari, and Chrome
          // do not. For those browsers we scroll through the page and take
          // incremental screenshots.
          (function loop() {
            var shot = (position/viewportHeight) + 1;

            if (cfg.browserName == 'firefox' || cfg.browserName == 'Internet Explorer') {
              // saves file in the file `subDir/browser_version_platform.png`
              var filename = subDir+'/'+browser+'_'+platform+'.png';
              browserDriver.saveScreenshot(filename, function(err) {
                if (err) console.log(err);

                browserDriver.quit();
              });
            } else {
              // Use `window.scrollTo` because thats what jQuery does
              // https://github.com/jquery/jquery/blob/1.12.3/src/offset.js#L186
              browserDriver.safeEval('window.scrollTo(0,'+position+');', function(err) {
                if (err) console.log(JSON.stringify(err));

                // saves file in the file `subDir/browser_version_platform/#.png`
                var filename = subDir+'/'+shot+'.png';
                browserDriver.saveScreenshot(filename, function(err) {
                  if (err) console.log(err);

                  position += viewportHeight;
                  if (position + viewportHeight > scrollHeight) {
                    browserDriver.getWindowSize(function(err,size) {
                      // account for the viewport offset
                      var extra = size.height - viewportHeight;
                      browserDriver.setWindowSize(size.width, (scrollHeight-position)+extra, function(err) {
                        if (err) console.log(err);

                        browserDriver.safeEval('window.scrollTo(0,'+scrollHeight+');', function(err) {
                          if (err) console.log(JSON.stringify(err));

                          shot++;
                          var filename = subDir+'/'+shot+'.png';
                          browserDriver.saveScreenshot(filename, function(err) {
                            if (err) console.log(err);

                            browserDriver.log('browser', function(err,logs) {
                              if (err) console.log(err);


                              var logfile = baseDir+'/'+browser+'_'+platform+'.log'
                              fs.writeFile(logfile,logs.join('\n'), function(err) {
                                if (err) console.log(err);

                                browserDriver.quit();
                              });
                            });
                          });
                        });

                      });
                    });
                  } else {
                    loop();
                  }
                });
              });
            }
          })();
        });
      });
    });
  });
});
