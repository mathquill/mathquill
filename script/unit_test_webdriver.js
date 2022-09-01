// This script assumes the following:
//   1. You've installed wd with `npm install wd'.
//   2. You've set the environment variables $SAUCE_USERNAME and $SAUCE_ACCESS_KEY.
//   3. If the environment variable $CIRCLE_TEST_REPORTS is not set images will be saved in /tmp
//   4. The argument is a URL of test/unit.html, which defines a get_xunit() async function that this script will call via Selenium WebDriver.
//
// The intention of this script is that it will be ran from CircleCI
//
// Example usage:
//   node unit_test_webdriver.js http://localhost:9292/test/unit.html?xunit=true

var wd = require('wd');
var fs = require('fs');
var url = process.argv[2];
var username = process.env.SAUCE_USERNAME;
var accessKey = process.env.SAUCE_ACCESS_KEY;
var build_name = process.env.MQ_CI_BUILD_NAME;
var baseDir = process.env.CIRCLE_TEST_REPORTS;
if (!baseDir) {
  console.error('No $CIRCLE_TEST_REPORTS found, for testing do something like `CIRCLE_TEST_REPORTS=/tmp node script/unit_test_webdriver.js`');
  process.exit(1);
}

var browserDriver = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
browserDriver.init({
  browserName: 'Chrome',
  platform: 'macOS 12',
  build: build_name,
  name: 'Unit tests',
  customData: { build_url: process.env.CIRCLE_BUILD_URL },
})
.get(url)
.then(willLog('get', url))
.safeExecuteAsync('get_xunit(arguments[0])')
.then(willLog('get_xunit()'))
.then(function(resultsXML) {
  var lines = resultsXML.split('\n');
  console.log('Got results XML (' + lines.length + ' lines):\n' + lines.slice(0, 10).join('\n') + '\n...');

  fs.writeFileSync(baseDir + '/junit/test-results.xml', resultsXML);
  console.log('Wrote to ' + baseDir + '/junit/test-results.xml');

  // TODO: exit status based on whether tests passed
})
.fail(function(err) {
  console.log('ERROR:', JSON.stringify(err, null, 2));
})
.quit();

function willLog() {
  var msg = [].join.call(arguments, ' ');
  return function(value) {
    console.log(msg);
    return value;
  };
}
