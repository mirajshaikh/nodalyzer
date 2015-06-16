#! /usr/bin/env node

var nodalyzer = require('./lib/main'),
    minimist = require('minimist'),
    http = require('http'),
    url = require('url'),
    argv = minimist(process.argv.slice(2)),
    port = argv.port || argv.p || 3000,
    nport = argv.nport || 8125,
    hostname = argv.hostname || argv.h || '127.0.0.1',
    usage = function () {
        console.log('Usage: server.js [-options]');
        console.log('-h, --hostname\t\thostname, default 127.0.0.1');
        console.log('-p, --port\t\tport number, default 3000');
        console.log('    --nport\t\tport number to use for injecting js files, default 8125');
        console.log('    --help\t\tprint this text and exit');
        console.log();
    };

if (argv.help) {
    usage();
    process.exit(0);
}

nodalyzer.init(function(status) {
    http.createServer(function (req, res) {
        var query = url.parse(req.url, true).query;
        nodalyzer.get(query.url, function (err, data) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(err.toString());
            } else {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(JSON.stringify(data));
            }
        });
    }).listen(port, hostname);
    console.log('Server running at http://' + hostname + ':' + port + '/');
}, {
    verbose: argv.verbose || argv.v || false,
    nport: nport,
    dnodeOpts: {
        weak: false,
    },
});
