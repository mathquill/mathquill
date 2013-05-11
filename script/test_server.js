var PORT = +process.env.PORT || 9292;
var HOST = process.env.HOST || '0.0.0.0';

var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

http.createServer(function(req, res) {
  var filepath = path.normalize(url.parse(req.url).pathname).slice(1);
  fs.readFile(filepath, function(err, data) { res.end(data); });
}).listen(PORT, HOST);

console.log('listening on '+HOST+':'+PORT);
