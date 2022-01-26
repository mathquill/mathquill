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
  console.error(
    'No $CIRCLE_ARTIFACTS found, for testing do something like `CIRCLE_ARTIFACTS=/tmp script/screenshots.js`'
  );
  process.exit(1);
}
fs.mkdirSync(baseDir + '/imgs');
fs.mkdirSync(baseDir + '/imgs/pieces');
fs.mkdirSync(baseDir + '/browser_logs');

var browsers = [
  {
    config: {
      browserName: 'Internet Explorer',
      platform: 'Windows XP',
    },
    pinned: true, // assume pinned to IE 8
  },
  {
    config: {
      browserName: 'Internet Explorer',
      platform: 'Windows 7',
    },
    pinned: true, // assume pinned to IE 11
  },
  {
    config: {
      browserName: 'MicrosoftEdge',
      platform: 'Windows 10',
    },
  },
  {
    config: {
      browserName: 'Firefox',
      platform: 'OS X 10.11',
    },
  },
  {
    config: {
      browserName: 'Safari',
      platform: 'OS X 10.11',
    },
  },
  {
    config: {
      browserName: 'Chrome',
      platform: 'OS X 10.11',
    },
  },
  {
    config: {
      browserName: 'Firefox',
      platform: 'Linux',
    },
  },
];

browsers.forEach(function (browser) {
  browser.config.build = build_name;
  browser.config.name =
    'Visual tests, ' +
    browser.config.browserName +
    ' on ' +
    browser.config.platform;
  browser.config.customData = { build_url: process.env.CIRCLE_BUILD_URL };
  var browserDriver = wd.promiseChainRemote(
    'ondemand.saucelabs.com',
    80,
    username,
    accessKey
  );
  return browserDriver
    .init(browser.config)
    .then(function (args) {
      var cfg = browser.config,
        capabilities = args[1];
      var version = capabilities.version || capabilities.browserVersion;
      var sessionName = [cfg.browserName, version, cfg.platform].join(' ');
      if (capabilities.platformVersion)
        sessionName += ' ' + capabilities.platformVersion;
      console.log(sessionName, 'init', args);

      var evergreen = browser.pinned ? '' : '_(evergreen)';
      var fileName = [cfg.browserName, version + evergreen, cfg.platform].join(
        '_'
      );
      if (capabilities.platformVersion)
        fileName += ' ' + capabilities.platformVersion;
      fileName = fileName.replace(/ /g, '_');

      return browserDriver
        .get(url)
        .then(willLog(sessionName, 'get'))
        .safeExecute('document.body.focus()') // blur anything that's auto-focused
        .then(willLog(sessionName, 'document.body.focus()'))
        .safeExecute('document.documentElement.style.overflow = "hidden"') // hide scrollbars
        .then(willLog(sessionName, 'hide scrollbars'))
        .then(function () {
          // Microsoft Edge starts out with illegally big window: https://git.io/vD63O
          if (cfg.browserName === 'MicrosoftEdge') {
            return browserDriver
              .getWindowSize()
              .then(function (size) {
                return browserDriver.setWindowSize(size.width, size.height);
              })
              .then(
                willLog(sessionName, 'reset window size (Edge-only workaround)')
              );
          }
        })
        .then(function () {
          return [
            browserDriver.safeExecute('document.documentElement.scrollHeight'),
            browserDriver.safeExecute('document.documentElement.clientHeight'),
          ];
        })
        .spread(function (scrollHeight, viewportHeight) {
          console.log(
            sessionName,
            'get scrollHeight, clientHeight',
            scrollHeight,
            viewportHeight
          );

          // the easy case: IE and Firefox on Linux return a screenshot of the entire webpage
          if (
            cfg.browserName === 'Internet Explorer' ||
            (cfg.browserName === 'Firefox' && cfg.platform === 'Linux')
          ) {
            return browserDriver
              .saveScreenshot(baseDir + '/imgs/' + fileName + '.png')
              .then(willLog(sessionName, 'saveScreenshot'));
            // the hard case: for Chrome, Safari, and Edge, scroll through the page and
            // take screenshots of each piece; circle.yml will stitch them together
          } else {
            var piecesDir = baseDir + '/imgs/pieces/' + fileName + '/';
            fs.mkdirSync(piecesDir);

            var scrollTop = 0;
            var index = 1;

            return (function loop() {
              return browserDriver
                .safeEval('window.scrollTo(0,' + scrollTop + ');')
                .then(willLog(sessionName, 'scrollTo()'))
                .saveScreenshot(piecesDir + index + '.png')
                .then(function () {
                  console.log(sessionName, 'saveScreenshot');

                  scrollTop += viewportHeight;
                  index += 1;

                  // if the viewport hasn't passed the bottom edge of the page yet,
                  // scroll down and take another screenshot
                  if (scrollTop + viewportHeight <= scrollHeight) {
                    // Use `window.scrollTo` because thats what jQuery does:
                    //   https://github.com/jquery/jquery/blob/1.12.3/src/offset.js#L186
                    // Use `window.scrollTo` instead of jQuery because jQuery was
                    // causing a stackoverflow in Safari.
                    return loop();
                  } else {
                    // we are past the bottom edge of the page, reduce window size to
                    // fit only the part of the page that hasn't been screenshotted.

                    // If there is no remaining part of the page, we're done, short-circuit
                    if (scrollTop === scrollHeight) return browserDriver;

                    return browserDriver
                      .getWindowSize()
                      .then(function (windowSize) {
                        console.log(sessionName, 'getWindowSize');
                        // window size is a little bigger than the viewport because of address
                        // bar and scrollbars and stuff
                        var windowPadding = windowSize.height - viewportHeight;
                        var newWindowHeight =
                          scrollHeight - scrollTop + windowPadding;
                        return browserDriver
                          .setWindowSize(windowSize.width, newWindowHeight)
                          .then(willLog(sessionName, 'setWindowSize'))
                          .safeEval('window.scrollTo(0,' + scrollHeight + ');')
                          .then(willLog(sessionName, 'scrollTo() Final'))
                          .saveScreenshot(piecesDir + index + '.png')
                          .then(willLog(sessionName, 'saveScreenshot Final'));
                      });
                  }
                });
            })();
          }
        })
        .then(function () {
          return browserDriver.log('browser').then(
            function (logs) {
              var logfile =
                baseDir +
                '/browser_logs/' +
                sessionName.replace(/ /g, '_') +
                '.log';
              return new Promise(function (resolve, reject) {
                fs.writeFile(
                  logfile,
                  JSON.stringify(logs, null, 2),
                  function (err) {
                    err ? reject(err) : resolve();
                  }
                );
              }).then(willLog(sessionName, 'writeFile'));
            },
            function (err) {
              // the Edge, IE, and Firefox-on-macOS drivers don't support logs, but the others do
              console.log(
                sessionName,
                'Error fetching logs:',
                JSON.stringify(err, null, 2)
              );
            }
          );
        });
    })
    .sauceJobStatus(true)
    .fail(function (err) {
      console.log(
        'ERROR:',
        browser.config.browserName,
        browser.config.platform
      );
      console.log(JSON.stringify(err, null, 2));
      return browserDriver.sauceJobStatus(false);
    })
    .quit();

  function willLog() {
    var msg = [].join.call(arguments, ' ');
    return function (value) {
      console.log(msg);
      return value;
    };
  }
});
