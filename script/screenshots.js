// This script assumes the following:
//   1. You've installed wd with `npm install wd'.
//   2. You've set the environment variables $SAUCE_USERNAME and $SAUCE_ACCESS_KEY.
//   3. If the environment variable $CIRCLE_ARTIFACTS is not set images will be saved in /tmp
//
// This scripts creates following files for each browser in browserVersions:
//    $CIRCLE_ARTIFACTS/imgs/{browser_version_platform}/#.png
//
// The intention of this script is that it will be ran from CircleCI
//
// Example usage:
//   node screenshots.js http://localhost:9292/test/visual.html
//   node screenshots.js http://google.com

var wd = require('wd');
var fs = require('fs');
var username = process.env['SAUCE_USERNAME'];
var accessKey = process.env['SAUCE_ACCESS_KEY'];
var baseDir = process.env['CIRCLE_ARTIFACTS'] || '/tmp';
var url = process.argv[2];
var allImgsDir = baseDir+'/imgs';
fs.mkdirSync(allImgsDir);

var browserVersions = [
  {
    'version': {
      // Expecting IE 8
      'browserName': 'Internet Explorer',
      'platform': 'Windows XP'
    },
    'pinned': 'PINNED'
  },
  {
    'version': {
      // Expecting IE 11
      'browserName': 'Internet Explorer',
      'platform': 'Windows 7'
    },
    'pinned': 'PINNED'
  },
  {
    'version': {
      'browserName': 'MicrosoftEdge',
      'platform': 'Windows 10'
    },
    'pinned': 'EVERGREEN'
  },
  {
    'version': {
      'browserName': 'Firefox',
      'platform': 'OS X 10.11'
    },
    'pinned': 'EVERGREEN'
  },
  {
    'version': {
      'browserName': 'Safari',
      'platform': 'OS X 10.11'
    },
    'pinned': 'EVERGREEN'
  },
  {
    'version': {
      'browserName': 'Chrome',
      'platform': 'OS X 10.11'
    },
    'pinned': 'EVERGREEN'
  },
  {
    'version': {
      'browserName': 'Firefox',
      'platform': 'Linux'
    },
    'pinned': 'EVERGREEN'
  },
];


browserVersions.forEach(function(obj) {
  var cfg = obj.version;
  var browserDriver = wd.remote('ondemand.saucelabs.com', 80, username, accessKey);
  // The following is in the style of
  // https://github.com/admc/wd/blob/62f2b0060d36a402de5634477b26a5ed4c051967/examples/async/chrome.js#L25-L40
  browserDriver.init(cfg, function(err, _, capabilities) {
    if (err) console.log(err);
    console.log(cfg.browserName,cfg.platform,'init')

    var browser = cfg.browserName.replace(/\s/g, '_');
    var platform = cfg.platform.replace(/\s/g, '_');
    var piecesDir = allImgsDir+'/'+obj.pinned+'_'+platform+'_'+browser;
    fs.mkdirSync(piecesDir);

    browserDriver.get(url, function(err) {
      if (err) console.log(err);
      console.log(cfg.browserName,cfg.platform,'get')
      browserDriver.safeExecute('document.documentElement.scrollHeight', function(err,scrollHeight) {
        if (err) console.log(err);
        console.log(cfg.browserName,cfg.platform,'get scrollHeight')
        browserDriver.safeExecute('document.documentElement.clientHeight', function(err,viewportHeight) {
          if (err) console.log(err);
          console.log(cfg.browserName,cfg.platform,'get clientHeight')

          // Firefox and Internet Explorer will take a screenshot of the entire webpage,
          if (cfg.browserName != 'Safari' && cfg.browserName != 'Chrome' && cfg.browserName != 'MicrosoftEdge') {
            // saves file in the file `piecesDir/browser_version_platform/*.png`
            var filename = piecesDir+'/'+browser+'_'+platform+'.png';
            browserDriver.saveScreenshot(filename, function(err) {
              if (err) console.log(err);
              console.log(cfg.browserName,cfg.platform,'saveScreenshot');

              browserDriver.log('browser', function(err,logs) {
                if (err) console.log(err);
                console.log(cfg.browserName,cfg.platform,'log');

                var logfile = baseDir+'/'+browser+'_'+platform+'.log'
                logs = logs || [];
                fs.writeFile(logfile,logs.join('\n'), function(err) {
                  if (err) console.log(err);

                  browserDriver.quit();
                });
              });

            });
          } else {
            var scrollTop = 0;

            // loop generates the images. Firefox and Internet Explorer will take
            // a screenshot of the entire webpage, but Opera, Safari, and Chrome
            // do not. For those browsers we scroll through the page and take
            // incremental screenshots.
            (function loop() {
              var index = (scrollTop/viewportHeight) + 1;

              // Use `window.scrollTo` because thats what jQuery does
              // https://github.com/jquery/jquery/blob/1.12.3/src/offset.js#L186
              // `window.scrollTo` was used instead of jQuery because jQuery was
              // causing a stackoverflow in Safari.
              browserDriver.safeEval('window.scrollTo(0,'+scrollTop+');', function(err) {
                if (err) console.log(JSON.stringify(err));
                console.log(cfg.browserName,cfg.platform,'safeEval 1');

                // saves file in the file `piecesDir/browser_version_platform/#.png`
                var filename = piecesDir+'/'+index+'.png';
                browserDriver.saveScreenshot(filename, function(err) {
                  if (err) console.log(err);
                  console.log(cfg.browserName,cfg.platform,'saveScreenshot');

                  scrollTop += viewportHeight;
                  if (scrollTop + viewportHeight > scrollHeight) {
                    browserDriver.getWindowSize(function(err,size) {
                      if (err) console.log(err);
                      console.log(cfg.browserName,cfg.platform,'getWindowSize');
                      // account for the viewport offset
                      var extra = size.height - viewportHeight;
                      browserDriver.setWindowSize(size.width, (scrollHeight-scrollTop)+extra, function(err) {
                        if (err) console.log(err);
                        console.log(cfg.browserName,cfg.platform,'setWindowSize');

                        browserDriver.safeEval('window.scrollTo(0,'+scrollHeight+');', function(err) {
                          if (err) console.log(JSON.stringify(err));
                          console.log(cfg.browserName,cfg.platform,'safeEval 2');

                          index++;
                          var filename = piecesDir+'/'+index+'.png';
                          browserDriver.saveScreenshot(filename, function(err) {
                            if (err) console.log(err);
                            console.log(cfg.browserName,cfg.platform,'saveScreenshot Final');

                            browserDriver.log('browser', function(err,logs) {
                              if (err) console.log(err);
                              console.log(cfg.browserName,cfg.platform,'log');

                              var logfile = baseDir+'/'+browser+'_'+platform+'.log'
                              logs = logs || [];
                              fs.writeFile(logfile,logs.join('\n'), function(err) {
                                if (err) console.log(err);
                                console.log(cfg.browserName,cfg.platform,'writeFile');

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
            })();
          }
        });
      });
    });
  });
});
