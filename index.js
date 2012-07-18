var connect = require('connect');

function runMakeMiddleware(req, res, next) {
  // don't run make when fetching static assets
  if (/^\/test\/support/.test(req.url)) return next();
  if (/^\/build/.test(req.url)) return next();

  var terminal = require('child_process').spawn('make', ['dev', 'test']);

  terminal.stdout.pipe(process.stdout);
  terminal.stderr.pipe(process.stderr);

  terminal.on('exit', next);
}

var app = connect()
  .use(connect.logger('dev'))
  .use(runMakeMiddleware)
  .use(connect.static(__dirname))
;

var port = +(process.env.PORT || 9292)
var host = process.env.HOST || '0.0.0.0';

console.log('listening on '+host+':'+port);
app.listen(port, host);
