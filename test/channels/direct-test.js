/*
 * Copyright 2012 the original author or authors
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

	define('msgs/channels/direct-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/channels/direct');

		buster.testCase('msgs/channels/direct', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should send messages to a dedicated handler': function () {
				var spy = this.spy();

				bus.directChannel('in', bus.outboundAdapter(spy));

				bus.send('in', 'hello');
				assert.same(1, spy.callCount);
				assert.same('hello', spy.getCall(0).args[0]);
			},
			'should have direct type': function () {
				assert.same('direct', bus.directChannel().type);
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
