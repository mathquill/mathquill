var PORT = +process.env.PORT || 9292;
var HOST = process.env.HOST || '0.0.0.0';

var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

http.createServer(function(req, res) {
  var reqTime = new Date;

  var filepath = path.normalize(url.parse(req.url).pathname).slice(1);
  fs.readFile(filepath, function(err, data) {
    res.end(data);

    console.log('[%s] %s %s /%s - %s%sms',
      reqTime.toISOString(), res.statusCode, req.method, filepath,
      (data ? (data.length >> 10) + 'kb, ' : ''), Date.now() - reqTime);
  });
}).listen(PORT, HOST);

console.log('listening on '+HOST+':'+PORT);
