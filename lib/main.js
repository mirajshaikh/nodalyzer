var RESULT_EXP = new RegExp('NODALYZER: (.*)'),

    ph,
    soft_exit,
    invoke_callback,

    util = require('util'),

    isFunction = util.isFunction || function (arg) {
        return typeof arg === 'function';
    },

    isObject = util.isObject || function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    },

    close_requested = false,
    pending_req_count = 0,

    verbosity;


ph = (function() {

    var deasync = require('deasync'),
        phantom = require('phantom'),
        ph = null;

    phantom.create(function (_ph) {
        ph = _ph;
    }, {
        dnodeOpts: {weak: false}
    });

    while(!ph) { deasync.sleep(100); }

    delete deasync;

    return ph;

}());

soft_exit = function () {
    if (close_requested && pending_req_count <= 0) {
        ph.exit(0);
    }
}

invoke_callback = function(callback, err, result) {
    callback(err, result);
    pending_req_count --;
    soft_exit();
};

exports.setOptions = function (options) {
    if (!isObject(options)) {
        throw new Error('Callback must be a function');
    }
    verbosity = options.verbosity;
};

exports.get = function(url, callback) {

    pending_req_count ++;

    var result = {
        url: url,
    };

    ph.createPage(function (page) {

        page.onError(function (msg, trace) {
          if (verbosity) {
              console.error(msg, trace);
          }
        });

        page.onConsoleMessage(function(msg) {
          if (verbosity) {
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
                if (verbosity) {
                    console.error('Opening url:', url, 'failed with status:', status);
                }
                var error = new Error('Opening url:' + url + ' failed with status: ' + status);
                invoke_callback(callback, error, null);
                page.close();
            } else {
                page.injectJs('js/wappalyzer.js');
                page.injectJs('js/apps.js');
                page.injectJs('js/driver.js');
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
