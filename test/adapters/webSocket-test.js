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

	function MockSocket() {
		this.send = sinon.spy();
	}
	MockSocket.prototype = {
		addEventListener: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/webSocket-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/webSocket');

		buster.testCase('msgs/adapters/webSocket', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive messages with inboundWebSocketAdapter': function (done) {
				var socket, data;

				socket = new MockSocket();
				bus.channel('messages');
				bus.inboundWebSocketAdapter(socket, { output: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(data, payload);
					done();
				});

				data = {};
				socket.message({ data: data });
			},
			'should write messages to the socket with outboundWebSocketAdapter': function () {
				var socket, data;

				socket = new MockSocket();
				bus.channel('messages');
				bus.outboundWebSocketAdapter(socket, { input: 'messages' });

				data = {};
				bus.send('messages', data);

				assert.calledWith(socket.send, data);
			},
			'should write messages to the socket until closed': function () {
				var socket, data;

				socket = new MockSocket();
				bus.channel('messages');
				bus.outboundWebSocketAdapter(socket, { input: 'messages' });

				data = ['a', 'b', 'c'];
				bus.send('messages', data[0]);
				bus.send('messages', data[1]);
				socket.close();
				bus.send('messages', data[2]);

				assert.equals([data[0]], socket.send.getCall(0).args);
				assert.equals([data[1]], socket.send.getCall(1).args);
				refute(socket.send.getCall(2));
			},
			'should bridge sending and receiving data': function () {
				var socket, data;

				socket = new MockSocket();
				bus.channel('messages');
				bus.webSocketGateway(socket, { input: 'messages', output: 'messages' });

				data = 'echo';
				socket.message({ data: data });

				assert.calledWith(socket.send, data);
			},
			'should pass socket error events': function (done) {
				var socket, data;

				socket = new MockSocket();
				bus.channel('messages');
				bus.webSocketGateway(socket, { error: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(data, payload);
					done();
				});

				data = 'uh oh';
				socket.error(data);
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
