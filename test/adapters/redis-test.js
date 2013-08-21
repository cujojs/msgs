/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, sinon;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;
	sinon = buster.sinon;

	function MockClient() {
		this.publish = sinon.spy();
		this.subscribe = sinon.spy();
	}
	MockClient.prototype = {
		on: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/redis-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/redis');

		buster.testCase('msgs/adapters/redis', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive Redis messages with inboundRedisAdapter': function (done) {
				var client, msg;

				client = new MockClient();
				bus.channel('messages');
				bus.inboundRedisAdapter(client, 'topic', { output: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(msg, payload);
					done();
				});

				assert.calledWith(client.subscribe, 'topic');

				msg = {};
				client.message('topic', msg);
			},
			'should write messages to the client with outboundRedisAdapter': function () {
				var client, msg;

				client = new MockClient();
				bus.channel('messages');
				bus.outboundRedisAdapter(client, 'topic', { input: 'messages' });

				msg = {};
				bus.send('messages', msg);

				assert.calledWith(client.publish, 'topic', msg);
			},
			'should bridge sending and receiving messages': function () {
				var client, msg;

				client = new MockClient();
				bus.channel('messages');
				bus.redisGateway(function () { return client; }, 'topic', { input: 'messages', output: 'messages' });

				assert.calledWith(client.subscribe, 'topic');

				msg = 'echo';
				client.message('topic', msg);

				assert.calledWith(client.publish, 'topic', msg);
			},
			'should pass client error events': function (done) {
				var client, msg;

				client = new MockClient();
				bus.channel('messages');
				bus.channel('error');
				bus.redisGateway(function () { return client; }, 'topic', { error: 'error', input: 'messages' });

				bus.on('error', function (payload) {
					assert.same(msg, payload);
					done();
				});

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
