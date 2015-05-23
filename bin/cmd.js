#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var path = require('path');
var ecstatic = require('ecstatic');
var st = ecstatic(path.join(__dirname, '../public'));

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port' },
    default: { port: 0 }
});
var file = path.resolve(argv._[0]);
if (!file) {
    console.error('specify a markdown file as the first argument');
    process.exit(1);
}

var server = http.createServer(function (req, res) {
    if (req.url === '/slides.md') {
        res.setHeader('content-type', 'text/plain');
        var r = fs.createReadStream(file);
        r.on('error', function (err) {
            res.statusCode = err.code === 'ENOENT' ? 404 : 500;
            res.end(err + '\n');
        });
        r.pipe(res);
        return;
    }
    if (/^\/\d+$/.test(req.url)) req.url = '/';
    st(req, res)
});
server.listen(argv.port, function () {
    console.error('listening on :' + server.address().port);
});
