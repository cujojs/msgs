/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define, document) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	define('msgs/adapters/dom-test-browser', function (require) {

		var msgs, bus, node;

		msgs = require('msgs/adapters/dom');

		buster.testCase('msgs/adapters/dom', {
			setUp: function () {
				bus = msgs.bus();
				node = document.createElement('node');
				document.body.appendChild(node);
			},
			tearDown: function () {
				bus.destroy();
				node.parentNode.removeChild(node);
			},

			'should receive messages with inboundDOMAdapter': function (done) {
				var event;

				bus.channel('messages');
				bus.inboundDOMAdapter(node, { event: 'click', output: 'messages' });

				bus.on('messages', function (payload) {
					assert.same(event, payload);
					done();
				});

				if (node.dispatchEvent) {
					event = document.createEvent('MouseEvent');
					event.initEvent('click', true, true);
					node.dispatchEvent(event);
				}
				else if (node.fireEvent) {
					event = document.createEventObject();
					event.target = node;
					node.fireEvent('onclick', event);
				}
				else {
					throw new Error('Unable to fire an event');
				}
			},
			'should fire events on the node with outboundDOMAdapter': function (done) {
				var event;

				bus.channel('messages');
				bus.outboundDOMAdapter(node, { input: 'messages' });

				function handleEvent(e) {
					assert.same(event, e);
					done();
				}

				if (node.addEventListener) {
					node.addEventListener('click', handleEvent, false);
					event = document.createEvent('MouseEvent');
					event.initEvent('click', true, true);
				}
				else if (node.attachEvent) {
					node.attachEvent('onclick', handleEvent);
					event = document.createEventObject();
					event.target = node;
					event.type = 'click';
				}

				bus.send('messages', event);
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
	},
	this.document
	// Boilerplate for AMD and Node
));
