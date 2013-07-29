var fs = require('fs');
var falafel = require('falafel');

// see http://esprima.org/demo/parse.html
// to test out different types of nodes
function isDebug(node) {
  return (node.type === 'LabeledStatement') &&
         (node.label.type === 'Identifier') &&
         (node.label.name === 'DEBUG');
}

function main(argv) {
  var fname = argv[2];
  var code = fs.readFileSync(fname, 'utf-8')
  var strippedCode = falafel(code, function(node) {
    if(isDebug(node)) node.update('');
  });

  process.stdout.write(strippedCode);
}

main(process.argv);
