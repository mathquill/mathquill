// requires
var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var child_process = require('child_process');

// constants
var PORT = +process.env.PORT || 9292;
var HOST = process.env.HOST || '0.0.0.0';

// main
http.createServer(serveRequest).listen(PORT, HOST);
console.log('listening on '+HOST+':'+PORT);
run_make_test();
'src test Makefile package.json'.split(' ').forEach(function(filename) {
  recursivelyWatch(filename, run_make_test);
});

// functions
function serveRequest(req, res) {
  var reqTime = new Date;
  enqueueOrDo(function() {
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
  });
}


function recursivelyWatch(watchee, cb) {
  fs.readdir(watchee, function(err, files) {
    if (err) { // not a directory, just watch it
      fs.watch(watchee, cb);
    }
    else { // a directory, recurse, also watch for files being added or deleted
      files.forEach(recurse);
      fs.watch(watchee, function() {
        fs.readdir(watchee, function(err, filesNew) {
          if (err) return; // watchee may have been deleted
          // filesNew - files = new files or dirs to watch
          filesNew.filter(function(file) { return files.indexOf(file) < 0; })
          .forEach(recurse);
          files = filesNew;
        });
        cb();
      });
    }
    function recurse(file) { recursivelyWatch(path.join(watchee, file), cb); }
  });
}


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
    if (code) {
      console.error('Exit Code ' + code);
    } else {
      console.log('\nMathQuill is now running on localhost:9292');
      console.log('Open http://localhost:9292/test/demo.html\n');
    }
    for (var i = 0; i < q.length; i += 1) q[i]();
    q = undefined;
  });
}
