#! /usr/bin/env node

var nodalyzer = require('nodalyzer'),
    minimist = require('minimist'),
    argv = minimist(process.argv.slice(2)),
    nport = argv.nport || 8125,
    usage = function () {
        console.log('Usage: nodalyzer [-options] -- url..');
        console.log('-v, --verbose\t\tincrease verbose, default false');
        console.log('    --nport\t\tport number to use for injecting js files, default 8125');
        console.log('    --help\t\tprint this text and exit');
        console.log();
    };

if (argv.help || argv._.length === 0) {
    usage();
    process.exit(0);
}

nodalyzer.init(function(status) {
    if (status === true) {
        argv._.forEach(function (url) {
            nodalyzer.get(url, function (err, data) {
                if (err) {
                    console.error(err);
                } else {
                    console.log(JSON.stringify(data));
                }
            });
        });

        nodalyzer.close();
    } else {
        console.error('Failed to init nodalyzer.');
    }
}, {
    verbose: argv.verbose || argv.v || false,
    nport: nport,
    dnodeOpts: {
        weak: false,
    },
});
