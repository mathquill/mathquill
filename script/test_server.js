var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

var PORT = +process.env.PORT || 9292;
var HOST = process.env.HOST || '0.0.0.0';

http.createServer(onRequest).listen(PORT, HOST);
console.log('listening on '+HOST+':'+PORT);

function onRequest(req, res) {
  var reqTime = new Date;

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
