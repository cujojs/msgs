/*
 * Copyright (c) 2012-2013 VMware, Inc. All Rights Reserved.
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

	function StubSocket() {}
	StubSocket.prototype = {
		addEventListener: function (type, handler) {
			this[type] = handler;
		}
	};

	define('integration/adapters/webSocket-test', function (require) {

		var integration, bus;

		integration = require('integration/adapters/webSocket');

		buster.testCase('integration/adapters/webSocket', {
			setUp: function () {
				bus = integration.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive messages with inboundWebSocketAdapter': function (done) {
				var socket, data;

				socket = new StubSocket();
				bus.channel('messages');
				bus.inboundWebSocketAdapter(socket, { output: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

				data = {};
				socket.message({ data: data });
			},
			'should write messages to the socket with outboundWebSocketAdapter': function () {
				var socket, data;

				socket = new StubSocket();
				socket.send = this.spy();
				bus.channel('messages');
				bus.outboundWebSocketAdapter(socket, { input: 'messages' });

				data = {};
				bus.send('messages', data);

				assert.calledWith(socket.send, data);
			},
			'should write messages to the socket until closed': function () {
				var socket, data;

				socket = new StubSocket();
				socket.send = this.spy();
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

				socket = new StubSocket();
				socket.send = this.spy();
				bus.channel('messages');
				bus.webSocketGateway(socket, { input: 'messages', output: 'messages' });

				data = 'echo';
				socket.message({ data: data });

				assert.calledWith(socket.send, data);
			},
			'should pass socket error events': function (done) {
				var socket, data;

				socket = new StubSocket();
				bus.channel('messages');
				bus.webSocketGateway(socket, { error: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

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
