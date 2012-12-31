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

	function StubClient() {}
	StubClient.prototype = {
		on: function (type, handler) {
			this[type] = handler;
		}
	};

	define('integration/adapters/redis-test', function (require) {

		var integration, bus;

		integration = require('integration');
		require('integration/adapters/redis');

		buster.testCase('integration/adapters/redis', {
			setUp: function () {
				bus = integration.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive Redis messages with inboundRedisAdapter': function (done) {
				var client, msg;

				client = new StubClient();
				client.subscribe = this.spy();
				bus.channel('messages');
				bus.inboundRedisAdapter(client, 'topic', { output: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(msg, payload);
					done();
				}, { input: 'messages' });

				assert.calledWith(client.subscribe, 'topic');

				msg = {};
				client.message('topic', msg);
			},
			'should write messages to the client with outboundRedisAdapter': function () {
				var client, msg;

				client = new StubClient();
				client.publish = this.spy();
				bus.channel('messages');
				bus.outboundRedisAdapter(client, 'topic', { input: 'messages' });

				msg = {};
				bus.send('messages', msg);

				assert.calledWith(client.publish, 'topic', msg);
			},
			'should write messages to the client until closed': function () {
				var client, msg;

				client = new StubClient();
				client.publish = this.spy();
				bus.channel('messages');
				bus.outboundRedisAdapter(client, 'topic', { input: 'messages' });

				msg = ['a', 'b', 'c'];
				bus.send('messages', msg[0]);
				bus.send('messages', msg[1]);
				client.end();
				bus.send('messages', msg[2]);

				assert.equals(['topic', msg[0]], client.publish.getCall(0).args);
				assert.equals(['topic', msg[1]], client.publish.getCall(1).args);
				refute(client.publish.getCall(2));
			},
			'should bridge sending and receiving messages': function () {
				var client, msg;

				client = new StubClient();
				client.subscribe = this.spy();
				client.publish = this.spy();
				bus.channel('messages');
				bus.redisGateway(function () { return client; }, 'topic', { input: 'messages', output: 'messages' });

				assert.calledWith(client.subscribe, 'topic');

				msg = 'echo';
				client.message('topic', msg);

				assert.calledWith(client.publish, 'topic', msg);
			},
			'should pass client error events': function (done) {
				var client, msg;

				client = new StubClient();
				bus.channel('messages');
				bus.redisGateway(function () { return client; }, 'topic', { error: 'messages', input: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(msg, payload);
					done();
				}, { input: 'messages' });

				msg = 'uh oh';
				client.error(msg);
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
