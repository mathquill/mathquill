var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var child_process = require('child_process');

var PORT = +process.env.PORT || 9292;
var HOST = process.env.HOST || '0.0.0.0';

http.createServer(serveRequest).listen(PORT, HOST);
console.log('listening on '+HOST+':'+PORT);

function serveRequest(req, res) {
  var reqTime = new Date;
  enqueueOrDo(function() { readFile(req, res, reqTime); });
}

function readFile(req, res, reqTime) {
  var filepath = path.normalize(url.parse(req.url).pathname).slice(1);
  fs.readFile(filepath, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        res.statusCode = 404;
        res.end('404 Not Found: /' + filepath + '\n');
      }
      else {
        console.log(err);
        res.statusCode = 500;
        res.end('500 Internal Server Error: ' + err.code + '\n');
      }
    }
    else {
      res.end(data);
    }

    console.log('[%s] %s %s /%s - %s%sms',
      reqTime.toISOString(), res.statusCode, req.method, filepath,
      (data ? (data.length >> 10) + 'kb, ' : ''), Date.now() - reqTime);
  });
}

'src test Makefile package.json'.split(' ').forEach(function(filename) {
  fs.watch(filename, run_make_test);
});
var q;
function enqueueOrDo(cb) { q ? q.push(cb) : cb(); }
function run_make_test() {
  if (q) return;
  q = [];
  console.log('[%s]\nmake test', (new Date).toISOString());
  var make_test = child_process.exec('make test', { env: process.env });
  make_test.stdout.pipe(process.stdout, { end: false });
  make_test.stderr.pipe(process.stderr, { end: false });
  make_test.on('exit', function(code) {
    if (code) console.error('Exit Code ' + code);
    for (var i = 0; i < q.length; i += 1) q[i]();
    q = undefined;
  });
}
run_make_test();
