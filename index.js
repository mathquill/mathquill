var connect = require('connect');

var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static(__dirname))
;

var port = +(process.env.PORT || 9292)
var host = process.env.HOST || '0.0.0.0';

console.log('listening on '+host+':'+port);
app.listen(port, host);
