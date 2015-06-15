var RESULT_EXP = new RegExp('NODALYZER: (.*)'),

    ph,
    soft_exit,
    invoke_callback,

    util = require('util'),
    phantom = require('phantom'),

    isFunction = util.isFunction || function (arg) {
        return typeof arg === 'function';
    },

    isObject = util.isObject || function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    },

    close_requested = false,
    pending_req_count = 0,

    http = require('http'),
    fs = require('fs'),
    jsurl,
    server,

    verbose;


soft_exit = function () {
    if (close_requested && pending_req_count <= 0) {
        ph.exit(0);
        server.close();
    }
}

invoke_callback = function(callback, err, result) {
    callback(err, result);
    pending_req_count --;
    soft_exit();
};


exports.init = function (callback, options_) {

    var options = options_ || {};
    verbose = options.verbose

    server = http.createServer(function (request, response) {
        var filePath = request.url;
        fs.readFile(__dirname + '/..' + filePath, function(error, content) {
            if (!error) {
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.end(content, 'utf-8');
            } else {
                response.end(error.toString());
            }
        });
    });

    var port = options.nport || 8125;

    jsurl = 'http://127.0.0.1:' + port + '/';
    if (verbose) {
        console.log('js files will be serverd from '+ jsurl);
    }

    server.on('error', function(err) {
        if (err.code === 'EADDRINUSE') {
            console.error('If you are using nodalyzer in multiple processes, use `nport` option to pass unique available port for every process.');
        }
        console.error(err);
        return callback(false);
    });

    server.listen(port, function(err) {
        delete options.nport;
        delete options.verbose;

        phantom.create(function (_ph) {
            ph = _ph;
            callback(true);
        }, options);
    });
};


exports.get = function(url, callback) {

    if (!ph) {
        throw new Error('Nodalyzer is not initialized. Call init before calling this API.');
    }

    pending_req_count ++;

    var result = {
        url: url,
    };

    ph.createPage(function (page) {

        page.onError(function (msg, trace) {
          if (verbose) {
              console.error(msg, trace);
          }
        });

        page.onConsoleMessage(function(msg) {
          if (verbose) {
              console.log(msg);
          }

          // TODO: Somehow 2 times this function is getting called
          // so for now if response_status[url] is required.
          if (RESULT_EXP.test(msg)) {
              result.apps = JSON.parse(RESULT_EXP.exec(msg)[1]);
              invoke_callback(callback, null, result);
              page.close();
          }
        });

        page.open(url, function (status) {

            if (status !== 'success') {
                if (verbose) {
                    console.error('Opening url:', url, 'failed with status:', status);
                }
                var error = new Error('Opening url:' + url + ' failed with status: ' + status);
                invoke_callback(callback, error, null);
                page.close();
            } else {
                page.includeJs(jsurl + 'js/wappalyzer.js', function() {
                    page.includeJs(jsurl + 'js/apps.js', function() {
                        page.includeJs(jsurl + 'js/driver.js');
                    });
                });
            }

        });

    });

};

exports.close = function(force) {
    if (force) {
        ph.exit(0);
    } else {
        close_requested = true;
        soft_exit();
    }
};
