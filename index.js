var connect = require('connect');

var app = connect().use(connect.static(__dirname));

var terminal = require('child_process').spawn('make', ['dev', 'test']);

terminal.stdout.pipe(process.stdout);
terminal.stderr.pipe(process.stderr);

var port = +(process.env.PORT || 9292)

terminal.on('exit', function() {
  console.log('listening on localhost:'+port)
  app.listen(port);
});
