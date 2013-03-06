/*
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	define('integration/channels/pubsub-test', function (require) {

		var integration, bus;

		integration = require('integration/channels/pubsub');

		buster.testCase('integration/channels/pubsub', {
			setUp: function () {
				bus = integration.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should broadcast all messages to all subscribes for pub-sub channels': function () {
				var channel, aSpy, bSpy;

				channel = bus.pubsubChannel();
				aSpy = this.spy(function (message) {
					assert.equals('everybody gets a message!', message);
				});
				bSpy = this.spy(function (message) {
					assert.equals('everybody gets a message!', message);
				});
				channel.subscribe(bus.outboundAdapter(aSpy));
				channel.subscribe(bus.outboundAdapter(bSpy));

				bus.send(channel, 'everybody gets a message!');
				bus.send(channel, 'everybody gets a message!');

				assert.same(2, aSpy.callCount);
				assert.same(2, bSpy.callCount);
			},
			'should have pubsub type': function () {
				assert.same('pubsub', bus.pubsubChannel().type);
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
