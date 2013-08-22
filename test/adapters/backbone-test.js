/*
 * Copyright 2013 the original author or authors
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

	function MockBackboneObject() {
		this.trigger = sinon.spy();
	}
	MockBackboneObject.prototype = {
		on: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/backbone-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/backbone');

		buster.testCase('msgs/adapters/backbone', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive messages with inboundBackboneAdapter': {
				'': function (done) {
					var bbobj, data;

					bbobj = new MockBackboneObject();
					bus.channel('messages');
					bus.inboundBackboneAdapter(bbobj, { output: 'messages', events: 'save' });

					bus.on('messages', function (payload, headers) {
						assert.same(data, payload);
						assert.equals([data], headers.args);
						done();
					});

					data = {};
					bbobj.save(data);
				},
				'defaulting to all if events options is not defined': function (done) {
					var bbobj, data;

					bbobj = new MockBackboneObject();
					bus.channel('messages');
					bus.inboundBackboneAdapter(bbobj, { output: 'messages' });

					bus.on('messages', function (payload, headers) {
						assert.same(data, payload);
						assert.equals([data], headers.args);
						done();
					});

					data = {};
					bbobj.all(data);
				}
			},
			'should trigger events with outboundBackboneAdapter': {
				'': function () {
					var bbobj, data;

					bbobj = new MockBackboneObject();
					bus.channel('messages');
					bus.outboundBackboneAdapter(bbobj, { input: 'messages', events: 'save' });

					data = {};
					bus.send('messages', data);

					assert.calledWith(bbobj.trigger, 'save', data);
				},
				'with multiple event targets': function () {
					var bbobj, data;

					bbobj = new MockBackboneObject();
					bus.channel('messages');
					bus.outboundBackboneAdapter(bbobj, { input: 'messages', events: 'save update' });

					data = {};
					bus.send('messages', data);

					assert.calledWith(bbobj.trigger, 'save', data);
					assert.calledWith(bbobj.trigger, 'update', data);
				},
				'with the payload applied': function () {
					var bbobj, data;

					bbobj = new MockBackboneObject();
					bus.channel('messages');
					bus.outboundBackboneAdapter(bbobj, { input: 'messages', events: 'save', apply: true });

					data = ['foo', 'bar'];
					bus.send('messages', data);

					assert.calledWith(bbobj.trigger, 'save', 'foo', 'bar');
				},
				'throwing if \'events\' options is not defined': function () {
					try {
						bus.outboundBackboneAdapter(new MockBackboneObject(), { input: 'messages' });
						fail();
					}
					catch (e) {
						assert.same(e.message, '\'events\' option is requried for outboundBackboneAdapter');
					}
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
