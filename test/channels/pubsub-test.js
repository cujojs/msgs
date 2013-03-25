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

	define('msgs/channels/pubsub-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/channels/pubsub');

		buster.testCase('msgs/channels/pubsub', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should broadcast all messages to all subscribes for pub-sub channels': function () {
				var channel, aSpy, bSpy;

				channel = bus.pubsubChannel();
				aSpy = this.spy(function (message) {
					assert.equals('everybody gets a message!', message);
				});
				bSpy = this.spy(function (message) {
					assert.equals('everybody gets a message!', message);
				});
				channel.subscribe(bus.outboundAdapter(aSpy));
				channel.subscribe(bus.outboundAdapter(bSpy));

				bus.send(channel, 'everybody gets a message!');
				bus.send(channel, 'everybody gets a message!');

				assert.same(2, aSpy.callCount);
				assert.same(2, bSpy.callCount);
			},
			'should have pubsub type': function () {
				assert.same('pubsub', bus.pubsubChannel().type);
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
