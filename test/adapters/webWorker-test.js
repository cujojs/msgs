/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	function StubWorker() {}
	StubWorker.prototype = {
		addEventListener: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/webWorker-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/webWorker');

		buster.testCase('msgs/adapters/webWorker', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should recieve messages with inboundWebWorkerAdapter': function (done) {
				var worker, data;

				worker = new StubWorker();
				bus.channel('messages');
				bus.inboundWebWorkerAdapter(worker, { output: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

				data = {};
				worker.message({ data: data });
			},
			'should post messages to the worker with outboundWebWorkerAdapter': function () {
				var worker, data;

				worker = new StubWorker();
				worker.postMessage = this.spy();
				bus.channel('messages');
				bus.outboundWebWorkerAdapter(worker, { input: 'messages' });

				data = {};
				bus.send('messages', data);

				assert.calledWith(worker.postMessage, data);
			},
			'should bridge sending and receiving data': function () {
				var worker, data;

				worker = new StubWorker();
				worker.postMessage = this.spy();
				bus.channel('messages');
				bus.webWorkerGateway(worker, { input: 'messages', output: 'messages' });

				data = 'echo';
				worker.message({ data: data });

				assert.calledWith(worker.postMessage, data);
			},
			'should pass worker error events': function (done) {
				var worker, data;

				worker = new StubWorker();
				bus.channel('messages');
				bus.webWorkerGateway(worker, { error: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

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
