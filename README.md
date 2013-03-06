Integration.js
==============

Enterprise Integration Patterns for JavaScript, inspired by Spring Integration.


Build Status
------------

<table>
  <tr><td>Master</td><td><a href="http://travis-ci.org/s2js/integration" target="_blank"><img src="https://secure.travis-ci.org/s2js/integration.png?branch=master" /></a></tr>
  <tr><td>Development</td><td><a href="http://travis-ci.org/s2js/integration" target="_blank"><img src="https://secure.travis-ci.org/s2js/integration.png?branch=dev" /></a></tr>
</table>


Overview
--------

Integration.js applies the vocabulary and patterns defined in the '[Enterprise Integration Patterns](http://www.eaipatterns.com/)' book to JavaScript extending messaging oriented programming into the browser and/or server side JavaScript. Messaging patterns originally developed to integrate loosely coupled disparate systems, apply just as well to loosely coupled modules within a single application process.

At the most basic level, `messages` are sent to `channels` and then dispatched to `handlers`. There are a wide variety of handler types that can easily be extended to provide rich behavior. The foundation handler types include: transforms, filters, routers, splitters and aggregators. Adapters and gateways provide ways in to and out of the messaging system. Channels dispatch messages to one or many handlers using a load balancer or pub-sub respectively, or queue messages until a poller consumes them.

Adapters are provided to aid integrating with popular external systems, protocols and APIs including: Node streams, Redis pub-sub, web sockets and web workers. Expect even more adapters in the future, or contribute your own.

All channels and handlers exist within the context of a message bus. The bus provides factories to create channels and handlers, in addition to a scope for referencing these components by name.

```javascript
var bus = require('integration').bus();

bus.channel('lowercase');
bus.transform(function(message){return message.toUpperCase()}, { input: 'lowercase', output: 'uppercase' });
bus.channel('uppercase');
bus.outboundAdapter(function (str) {
  console.log(str);
}, { input: 'uppercase' });

bus.send('lowercase', 'hello world'); // 'HELLO WORLD'
```

This example defines two channels, `lowercase` and `uppercase`, and a transform that listens for messages on the `lowercase` channel converts them to upper case and sends the transformed message to the `uppercase` channel.  Finally, an adapter listens for messages on the `uppercase` channel and logs it to the console.  So when we send 'hello world' to the `lowercase` channel, 'HELLO WORLD' is logged to the console.

While converting a string to upper case is a bit contrived, it demonstrates the core concepts. A slightly more complex example starts to show the real power.

```javascript
var bus, webSocketServer;

require('integration/adapters/nodeStream');
require('integration/channels/pubsub');

bus = require('integration').bus();
webSocketServer = ...;

bus.pubsubChannel('broadcast');
webSocketServer.on('connection', function (connection) {
  bus.nodeStreamGateway(connection, { output: 'broadcast', input: 'broadcast' });
});

```

Here we're using a publish-subscribe channel to broadcast all messages received from a web socket to every connected web socket.  The `broadcast` channel serves as a medium to receive and dispatch messages. For each new web socket connection that is established, the nodeStreamGateway reads messages sent to the server, and then writes messages back to the client.

This works as long as there is only ever a single application instance, but what if we need to scale horizontally?  In that case, we just need to fold in a inter-process messaging solution, Redis in this case.

```javascript
var bus, webSocketServer, redis;

require('integration/adapters/nodeStream');
require('integration/adapters/redis');
require('integration/channels/pubsub');

bus = require('integration').bus();
redis = require('redis');
webSocketServer = ...;

integration.pubsubChannel('clientMessages');
integration.pubsubChannel('serverMessages');
webSocketServer.on('connection', function (connection) {
  integration.nodeStreamGateway(connection, { output: 'clientMessages', input: 'serverMessages' });
});
integration.redisGateway(redis.createClient, 'redisPubSubTopic', { output: 'serverMessages', input: 'clientMessages' });
```

We took the previous example, altering the nodeStreamGateway to use different channels for sending and receiving messages. The redisGateway bridges these channels while broadcasting messages to every other instance connected to Redis.

Once your application is using messaging, it's rather trivial to extend it into new environments.


Supported Environments
----------------------

Our goal is to work in every major JavaScript environment; Node.js and major browsers are actively tested and supported.

If your preferred environment is not supported, please let us know. Some features may not be available in all environments.

Tested environments:
- Node.js (0.8)
- Chrome (stable)
- Firefox (stable, ESR, should work in earlier versions)
- IE (6-10)
- Safari (5, 6, iOS 4-6, should work in earlier versions)
- Opera (11, 12, should work in earlier versions)

Specific browser test are provided by [Travis CI](https://travis-ci.org/s2js/integration) and [Sauce Labs' Open Sauce Plan](https://saucelabs.com/opensource). You can see [specific browser test results](https://saucelabs.com/u/s2js-integration), although odds are they do not reference this specific release/branch/commit.


Getting Started
---------------

Integration.js can be installed via [npm](https://npmjs.org/), [Bower](http://twitter.github.com/bower/), or from source.

To install without source:

    $ npm install integration

or

    $ bower install integration

From source:

    $ npm install

Integration.js is designed to run in a browser environment, utilizing [AMD modules](https://github.com/amdjs/amdjs-api/wiki/AMD), or within [Node.js](http://nodejs.org/).  [curl](https://github.com/cujojs/curl) is highly recommended as an AMD loader, although any loader should work.

An ECMAScript 5 compatible environment is assumed.  Older browsers, ::cough:: IE, that do not support ES5 natively can be shimmed.  Any shim should work, although we've tested against cujo's [poly](https://github.com/cujojs/poly)


Reporting Issues
----------------

Please report issues on [GitHub](https://github.com/s2js/integration/issues).  Include a brief description of the error, information about the runtime (including shims) and any error messages.

Feature requests are also welcome.


Running the Tests
-----------------

The test suite can be run in two different modes: in node, or in a browser.  We use [npm](https://npmjs.org/) and [Buster.JS](http://busterjs.org/) as the test driver, buster is installed automatically with other dependencies.

Before running the test suite for the first time:

    $ npm install

To run the suite in node:

    $ npm test

To run the suite in a browser:

    $ npm start
    browse to http://localhost:8282/ in the browser(s) you wish to test.  It can take a few seconds to start.


Contributors
------------

- Scott Andrews <andrewss@vmware.com>
- Mark Fisher <markfisher@vmware.com>

Please see CONTRIBUTING.md for details on how to contribute to this project.


Copyright
---------

Integration is made available under the MIT license.  See LICENSE.txt for details.

Copyright (c) 2012-2013 VMware, Inc. All Rights Reserved.

VMware, Inc.
3401 Hillview Avenue
Palo Alto, CA 94304


Change Log
----------

0.3.1
- bug fix, filters now work inside a chain
- easily `forward` messages from one channel to another
- Bower installable, with dependencies
- mutli-browser testing with Sauce Labs

0.3.0
- first release, everything is new
