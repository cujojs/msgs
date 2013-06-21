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

	define('msgs/channels/queue-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/channels/queue');

		buster.testCase('msgs/channels/queue', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should queue message and return them in order': function () {
				var line = bus.queueChannel();

				refute(bus.receive(line));
				bus.send(line, 'scott');
				bus.send(line, 'mark');
				assert.same('scott', bus.receive(line).payload);
				assert.same('mark', bus.receive(line).payload);

				refute(bus.receive(line));
				bus.send(line, 'jeremy');
				assert.same('jeremy', bus.receive(line).payload);

				refute(bus.receive(line));
			},
			'should have queue type': function () {
				assert.same('queue', bus.queueChannel().type);
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
