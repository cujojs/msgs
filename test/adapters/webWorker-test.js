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

	function StubWorker() {}
	StubWorker.prototype = {
		addEventListener: function (type, handler) {
			this[type] = handler;
		}
	};

	define('integration/adapters/webWorker-test', function (require) {

		var integration, bus;

		integration = require('integration');
		require('integration/adapters/webWorker');

		buster.testCase('integration/adapters/webWorker', {
			setUp: function () {
				bus = integration.bus();
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
