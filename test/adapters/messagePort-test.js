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

	function MockWorker() {
		this.postMessage = sinon.spy();
	}
	MockWorker.prototype = {
		addEventListener: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/messagePort-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/messagePort');

		buster.testCase('msgs/adapters/messagePort', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive messages with inboundMessagePortAdapter': function (done) {
				var worker, data;

				worker = new MockWorker();
				bus.channel('messages');
				bus.inboundMessagePortAdapter(worker, { output: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(data, payload);
					done();
				});

				data = {};
				worker.message({ data: data });
			},
			'should post messages to the worker with outboundMessagePortAdapter': function () {
				var worker, data;

				worker = new MockWorker();
				bus.channel('messages');
				bus.outboundMessagePortAdapter(worker, { input: 'messages' });

				data = {};
				bus.send('messages', data);

				assert.calledWith(worker.postMessage, data);
			},
			'should bridge sending and receiving data': function () {
				var worker, data;

				worker = new MockWorker();
				bus.channel('messages');
				bus.messagePortGateway(worker, { input: 'messages', output: 'messages' });

				data = 'echo';
				worker.message({ data: data });

				assert.calledWith(worker.postMessage, data);
			},
			'should pass worker error events': function (done) {
				var worker, data;

				worker = new MockWorker();
				bus.channel('messages');
				bus.messagePortGateway(worker, { error: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(data, payload);
					done();
				});

				data = 'uh oh';
				worker.error(data);
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
