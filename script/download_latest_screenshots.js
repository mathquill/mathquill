// This script assumes the following:
//   1. That the json it will be working with will be in the form of the data that is returned
//      by https://circleci.com/api/v1/project/mathquill/mathquill/latest/artifacts
//   2. If the environment variable $CIRCLE_ARTIFACTS is not set images will be saved in /tmp
//   3. There is an `img` directory in $CIRCLE_ARTIFACTS or /tmp.
//
// This scripts creates following files for each browser in browserVersions in the artifacts:
//    $CIRCLE_ARTIFACTS/imgs/PREV_{browser_version_platform}.png
//
// The intention of this script is that it will be ran from CircleCI
//
// Example usage:
//   curl https://circleci.com/api/v1/project/mathquill/mathquill/latest/artifacts > latest_artifacts.json
//   node download_latest_screenshots.js latest_artifacts.json

var exec = require('child_process').exec;
var baseDir = process.env['CIRCLE_ARTIFACTS'] || '/tmp';
var allImgsDir = baseDir+'/imgs';
var artifacts = require('./'+process.argv[2]);

var images = artifacts.filter(function(a) { return /.*png$/.test(a.path); })

var xs = ['curl'];
images.forEach(function(image) {
  var str = '$CIRCLE_ARTIFACTS/img/';
  var imgPath = allImgsDir+'/PREV_'+image.pretty_path.slice(str.length+1);
  xs.push(image.url, '-o', imgPath);
});

exec(xs.join(' '), function(err) {
  if (err) console.log(err);
});
