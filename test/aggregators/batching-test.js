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

	define('msgs/aggregators/batching-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/aggregators/batching');
		require('msgs/channels/direct');

		buster.testCase('msgs/aggregators/batching', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should batch every two messages, abandoning the last message': function (done) {
				var spy = this.spy(function (message) {
					assert.equals(['msg', 'msg'], message);
				});

				bus.directChannel('in', 'agg');
				bus.batchingAggregator('agg', { batch: 2, output: 'out' });
				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', 'msg');
				assert.same(0, spy.callCount);
				bus.send('in', 'msg');
				assert.same(1, spy.callCount);
				bus.send('in', 'msg');
				assert.same(1, spy.callCount);
				bus.send('in', 'msg');
				assert.same(2, spy.callCount);
				bus.send('in', 'lost in the ether');

				setTimeout(function () {
					assert.same(2, spy.callCount);

					done();
				}, 10);
			},

			'should batch every two messages or 10ms': function (done) {
				var spy = this.spy(function (message) {
					message.forEach(function (msg) {
						assert.same('msg', msg);
					});
				});

				bus.directChannel('in', 'agg');
				bus.batchingAggregator('agg', { batch: 2, timeout: 10, output: 'out' });
				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', 'msg');
				assert.same(0, spy.callCount);
				bus.send('in', 'msg');
				assert.same(1, spy.callCount);
				bus.send('in', 'msg');
				assert.same(1, spy.callCount);

				assert.same(1, spy.callCount);

				setTimeout(function () {
					assert.same(2, spy.callCount);

					assert.same(2, spy.getCall(0).args[0].length);
					assert.same(1, spy.getCall(1).args[0].length);

					done();
				}, 10);
			},
			'should batch every 10ms regardless of buffer size': function (done) {
				var spy = this.spy(function (message) {
					message.forEach(function (msg) {
						assert.same('msg', msg);
					});
				});

				bus.directChannel('in', 'agg');
				bus.batchingAggregator('agg', { timeout: 10, output: 'out' });
				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', 'msg');
				bus.send('in', 'msg');
				bus.send('in', 'msg');
				bus.send('in', 'msg');
				bus.send('in', 'msg');

				assert.same(0, spy.callCount);

				setTimeout(function () {
					assert.same(1, spy.callCount);
				}, 50);

				setTimeout(function () {
					assert.same(1, spy.callCount);

					bus.send('in', 'msg');
					bus.send('in', 'msg');
					bus.send('in', 'msg');
				}, 100);

				setTimeout(function () {
					assert.same(2, spy.callCount);

					assert.same(5, spy.getCall(0).args[0].length);
					assert.same(3, spy.getCall(1).args[0].length);

					done();
				}, 150);
			},
			'should assert a valid configuration for an aggregator': function () {
				bus.batchingAggregator({ batch: 10, timeout: 10 });
				bus.batchingAggregator('agg1', { batch: 10, timeout: 10 });
				bus.batchingAggregator('agg2', { timeout: 10 });
				bus.batchingAggregator('agg3', { batch: 10 });
				bus.batchingAggregator('agg4', { batch: 0, timeout: 10 });
				bus.batchingAggregator('agg5', { batch: 10, timeout: 0 });

				try {
					bus.batchingAggregator('agg6', {});
					fail('Exception expected');
				}
				catch (e) {
					assert(e);
				}

				try {
					bus.batchingAggregator('agg7', { timeout: 0 });
					fail('Exception expected');
				}
				catch (e) {
					assert(e);
				}

				try {
					bus.batchingAggregator('agg8', { batch: 0 });
					fail('Exception expected');
				}
				catch (e) {
					assert(e);
				}

				try {
					bus.batchingAggregator('agg9', { timeout: 0, batch: 0 });
					fail('Exception expected');
				}
				catch (e) {
					assert(e);
				}
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
