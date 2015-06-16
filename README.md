nodalyzer
===

node.js wrapper for [Wappalyzer](https://wappalyzer.com/)
------
This module will open a headless Webkit browser using [phantomjs-node](https://github.com/sgentle/phantomjs-node) , navigate to the site, invokes [Wappalyzer](https://wappalyzer.com/) Bookmarklet and parses output.

#### Features:
 * API to get technologies used for the url.
 * Additional **server.js** script to consume the API from web service.
 * Additional **nodalyzer** script to invoke from command line.

Installation
------

You can install with `npm`:

``` bash
$ npm install nodalyzer
```

API docs
------

- **init(callback[, options])** - Initializes the library.
	* `callback(status)`: A callback function will be called upon initialization with status indicating if initialization is successfull.
	* `options`: This optional `options` object will passed to phantomjs-node's create function. Additionally following fields are available.
        * `verbosity`: Enable verbose log (default `false`).
        * `port`: To include js files to the page, `nodalyzer` opens a http connection on specified `port`. (default 8125). This is a workaround since [phantomjs-node](https://github.com/sgentle/phantomjs-node) doesn't support [includeJs with libraryPath](https://github.com/sgentle/phantomjs-node/issues/282).

- **get(url, callback)** - Opens the url/site and returns technologies detected.
	* `url`: url
	* `callback(err, response)`: A callback function will be called with error and response object. In case of an error, err will be an instance of `Error`. In case of success, err will be null and response will contain following fields:
		- `apps`: Array of apps with following properties.
			* `name`: Name of the app
			* `category`: Category


- **close([force])** - This will wait for the pending urls to complete and then exits the phantom instance and other dependencies. For sample usage, refer to previous example.
	* `force`: If force is set, exits without waiting for pending urls to complete.

An example usage of above APIs is shown below.
```js
var nodalyzer = require('nodalyzer');

nodalyzer.init(function (status) {
	if (!status) { return; }
	nodalyzer.get('http://www.github.com/', function (err, response) {
      if (err) { throw err; }
      response.apps.forEach(function (app) {
          console.log(app);
      });
	});
    nodalyzer.close();
});

```

Utils
------

- **nodalyzer** - A command line utility to invoke the above API.
An example usage of nodalyzer command is shown below.
```sh
nodalyzer http://www.github.com/
```

- **server.js** - script to consume the web service.
	* `port`: port [default 3000]
	* `hostname`: hostname [default 127.0.0.1]

An example usage of server.js is shown below.
```js
node server.js --port=6000 --host=0.0.0.0
//Once server starts, API can be invoked from curl or some http request tool.
//Ex: `curl 'http://0.0.0.0:6000/?url=http://www.github.com/`
```
