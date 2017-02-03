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
var url = process.argv[2];
var username = process.env.SAUCE_USERNAME;
var accessKey = process.env.SAUCE_ACCESS_KEY;
var build_name = process.env.MQ_CI_BUILD_NAME;
var baseDir = process.env.CIRCLE_ARTIFACTS;
if (!baseDir) {
  console.error('No $CIRCLE_ARTIFACTS found, for testing do something like `CIRCLE_ARTIFACTS=/tmp script/screenshots.js`');
  process.exit(1);
}
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
  var browser = cfg.browserName.replace(/\s/g, '_');
  var platform = cfg.platform.replace(/\s/g, '_');
  var piecesDir = allImgsDir+'/'+obj.pinned+'_'+platform+'_'+browser;

  cfg.build = build_name;
  var browserDriver = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
  return browserDriver.init(cfg)
  .then(function(_, capabilities) {
    console.log(cfg.browserName,cfg.platform,'init');

    fs.mkdirSync(piecesDir);

    return browserDriver;
  })
  .get(url)
  .then(function() {
    console.log(cfg.browserName,cfg.platform,'get');
    return [browserDriver.safeExecute('document.documentElement.scrollHeight'),
            browserDriver.safeExecute('document.documentElement.clientHeight')];
  })
  .spread(function(scrollHeight, viewportHeight) {
    console.log(cfg.browserName, cfg.platform, 'get scrollHeight, clientHeight', scrollHeight, viewportHeight);

    // Firefox and Internet Explorer will take a screenshot of the entire webpage,
    if (cfg.browserName != 'Safari' && cfg.browserName != 'Chrome' && cfg.browserName != 'MicrosoftEdge') {
      // saves file in the file `piecesDir/browser_version_platform/*.png`
      var filename = piecesDir+'/'+browser+'_'+platform+'.png';
      console.log(cfg.browserName, cfg.platform, 'about to saveScreenshot');
      return browserDriver.saveScreenshot(filename)
      .then(willLog(cfg.browserName,cfg.platform,'saveScreenshot'))
      .then(function() {
        return browserDriver.log('browser')
        .then(willLog(cfg.browserName,cfg.platform,'log'), function(err) {
          // the Edge/Internet Explorer drivers don't support logs, but the others do
          console.log(cfg.browserName, cfg.platform, 'Error fetching logs:', JSON.stringify(err, null, 2));
          return [];
        });
      })
      .then(function(logs) {
        var logfile = baseDir+'/'+browser+'_'+platform+'.log'
        return new Promise(function(resolve, reject) {
          fs.writeFile(logfile,logs.join('\n'), function(err) {
            if (err) return reject(err);

            return resolve(browserDriver.quit());
          });
        });
      });
    } else {
      var scrollTop = 0;

      // loop generates the images. Firefox and Internet Explorer will take
      // a screenshot of the entire webpage, but Opera, Safari, and Chrome
      // do not. For those browsers we scroll through the page and take
      // incremental screenshots.
      return (function loop() {
        var index = (scrollTop/viewportHeight) + 1;
        // saves file in the file `piecesDir/browser_version_platform/#.png`
        var filename = piecesDir+'/'+index+'.png';

        // Use `window.scrollTo` because thats what jQuery does
        // https://github.com/jquery/jquery/blob/1.12.3/src/offset.js#L186
        // `window.scrollTo` was used instead of jQuery because jQuery was
        // causing a stackoverflow in Safari.
        return browserDriver.safeEval('window.scrollTo(0,'+scrollTop+');')
        .then(willLog(cfg.browserName,cfg.platform,'safeEval 1'))
        .saveScreenshot(filename)
        .then(function() {
          console.log(cfg.browserName,cfg.platform,'saveScreenshot');

          scrollTop += viewportHeight;
          if (scrollTop + viewportHeight > scrollHeight) {
            return browserDriver.getWindowSize()
            .then(function(size) {
              console.log(cfg.browserName,cfg.platform,'getWindowSize');
              // account for the viewport offset
              var extra = size.height - viewportHeight;
              return browserDriver.setWindowSize(size.width, (scrollHeight-scrollTop)+extra)
              .then(willLog(cfg.browserName,cfg.platform,'setWindowSize'))
              .safeEval('window.scrollTo(0,'+scrollHeight+');')
              .then(function() {
                console.log(cfg.browserName,cfg.platform,'safeEval 2');

                index++;
                var filename = piecesDir+'/'+index+'.png';
                return browserDriver.saveScreenshot(filename)
                .then(willLog(cfg.browserName,cfg.platform,'saveScreenshot Final'))
                .then(function() {
                  return browserDriver.log('browser')
                  .then(willLog(cfg.browserName,cfg.platform,'log'), function(err) {
                    // the Edge/Internet Explorer drivers don't support logs, but the others do
                    console.log(cfg.browserName, cfg.platform, 'Error fetching logs:', JSON.stringify(err, null, 2));
                    return [];
                  });
                })
                .then(function(logs) {
                  var logfile = baseDir+'/'+browser+'_'+platform+'.log'
                  return new Promise(function(resolve, reject) {
                    fs.writeFile(logfile,logs.join('\n'), function(err) {
                      if (err) return reject(err);
                      console.log(cfg.browserName,cfg.platform,'writeFile');

                      return resolve(browserDriver.quit());
                    });
                  });
                });
              });
            });
          } else {
            return loop();
          }
        });
      })();
    }
  })
  .fail(function(err) {
    console.log('ERROR:', cfg.browserName, cfg.platform);
    console.log(JSON.stringify(err, null, 2));
  });

  function willLog() {
    var msg = [].join.call(arguments, ' ');
    return function(value) {
      console.log(msg);
      return value;
    };
  }
});
