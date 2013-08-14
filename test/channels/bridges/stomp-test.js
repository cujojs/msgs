/*
 * Copyright 2013 the original author or authors
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

	define('msgs/channels/bridges/stomp-test', function (require) {

		var msgs, bus, clientCommands, serverCommands, noopHandler1, noopHandler2;

		msgs = require('msgs/channels/bridges/stomp');
		require('msgs/channels/exchange');
		require('msgs/channels/pubsub');
		require('msgs/channels/queue');

		clientCommands = ['stomp', 'connect', 'send', 'subscribe', 'unsubscribe', 'ack', 'nack', 'begin', 'commit', 'abort', 'disconnect'];
		serverCommands = ['connected', 'message', 'receipt', 'error'];

		noopHandler1 = { handle: function () {} };
		noopHandler2 = { handle: function () {} };

		function extractIdHeader(frame) {
			return frame.match(/\nid:([^\n]+)\n/)[1];
		}

		function extractReceiptHeader(frame) {
			return frame.match(/\nreceipt:([^\n]+)\n/)[1];
		}

		function tapControlBus(name) {
			var controlBus = bus.resolveChannel(name || 'bridge').controlBus;

			controlBus.tap('connected', bus.forward(bus.queueChannel('cbConnectedLog')));
			controlBus.tap('disconnected', bus.forward(bus.queueChannel('cbDisconnectedLog')));
			controlBus.tap('subscribed', bus.forward(bus.queueChannel('cbSubscribedLog')));
			controlBus.tap('unsubscribed', bus.forward(bus.queueChannel('cbUnsubscribedLog')));
			controlBus.tap('toServer', bus.forward(bus.queueChannel('cbToServerLog')));
			controlBus.tap('fromServer', bus.forward(bus.queueChannel('cbFromServerLog')));
			controlBus.tap('error', bus.forward(bus.queueChannel('cbErrorLog')));
		}

		buster.testCase('msgs/bridges/stomp', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'a stompBridge': {
				setUp: function () {
					bus.pubsubChannel('toServer');
					bus.pubsubChannel('fromServer');
					bus.pubsubChannel('errors');

					bus.tap('toServer', bus.forward(bus.queueChannel('toServerLog')));
					bus.tap('fromServer', bus.forward(bus.queueChannel('fromServerLog')));
					bus.tap('errors', bus.forward(bus.queueChannel('errorsLog')));

					bus.exchangeChannel('frames');

					clientCommands.forEach(function (command) {
						bus.subscribe('frames!' + command, bus.forward(bus.queueChannel(command)));
					});
					bus.router(function (message) {
						return 'frames!' + message.payload.split('\n')[0].toLowerCase();
					}, { input: 'toServer' });

					serverCommands.forEach(function (command) {
						bus.subscribe('frames!' + command, bus.forward(bus.queueChannel(command)));
					});
					bus.router(function (message) {
						return 'frames!' + message.payload.split('\n')[0].toLowerCase();
					}, { input: 'fromServer' });
				},

				'should have a type of stomp': function () {
					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					assert.same(bus.resolveChannel('bridge').type, 'stomp');
				},
				'should automatically send a connection frame': function () {
					refute(bus.receive('connect'));
					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					assert(bus.receive('connect'));
				},
				'should automatically send a disconnect frame on destroy': function () {
					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('disconnect'));
					bus.resolveChannel('bridge').destroy();
					assert(bus.receive('disconnect'));
				},
				'should fire connected and disconnected messages on the control bus': function () {
					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					tapControlBus();
					refute(bus.receive('cbConnectedLog'));
					bus.send('fromServer', 'CONNECTED\n\n\x00');
					assert(bus.receive('cbConnectedLog'));

					refute(bus.receive('cbDisconnectedLog'));
					bus.send('fromServer', 'ERROR\n\n\x00');
					assert(bus.receive('cbDisconnectedLog'));
				},
				'should indicate if the connection is ready for commands': function () {
					var bridge = bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					refute(bridge.isReady());
					bus.send('fromServer', 'CONNECTED\n\n\x00');
					assert(bridge.isReady());
					bus.send('fromServer', 'ERROR\n\n\x00');
					refute(bridge.isReady());
				},
				'should relay subscriptions to the server': function () {
					var subscriptionFrame, receiptMessage;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					tapControlBus();
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/foo', noopHandler1);
					subscriptionFrame = bus.receive('subscribe').payload;
					assert.match(subscriptionFrame, 'destination:/queue/foo');

					refute(bus.receive('cbSubscribedLog'));
					bus.send('fromServer', 'RECEIPT\nreceipt-id:' + extractReceiptHeader(subscriptionFrame) + '\n\n\x00');
					receiptMessage = bus.receive('cbSubscribedLog');
					assert.same('/queue/foo', receiptMessage.headers.topic);
					assert.same(noopHandler1, receiptMessage.payload);
				},
				'should relay unsubscriptions to the server': function () {
					var unsubscriptionFrame, receiptMessage;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					tapControlBus();
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					bus.subscribe('bridge!/queue/foo', noopHandler1);
					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', noopHandler1);
					unsubscriptionFrame = bus.receive('unsubscribe').payload;
					assert.match(unsubscriptionFrame, 'id:' + extractIdHeader(bus.receive('subscribe').payload));

					bus.send('fromServer', 'RECEIPT\nreceipt-id:' + extractReceiptHeader(unsubscriptionFrame) + '\n\n\x00');
					receiptMessage = bus.receive('cbUnsubscribedLog');
					assert.same('/queue/foo', receiptMessage.headers.topic);
					assert.same(noopHandler1, receiptMessage.payload);
				},
				'should allow subscribing to multiple destinations': function () {
					var subscribe1, subscribe2;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/foo', noopHandler1);
					subscribe1 = bus.receive('subscribe');
					assert.match(subscribe1.payload, 'destination:/queue/foo');

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/bar', noopHandler2);
					subscribe2 = bus.receive('subscribe');
					assert.match(subscribe2.payload, 'destination:/queue/bar');

					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', noopHandler1);
					assert.match(bus.receive('unsubscribe').payload, 'id:' + extractIdHeader(subscribe1.payload));

					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/bar', noopHandler2);
					assert.match(bus.receive('unsubscribe').payload, 'id:' + extractIdHeader(subscribe2.payload));

					refute.equals(extractIdHeader(subscribe1.payload), extractIdHeader(subscribe2.payload));
				},
				'should allow resubscribing to an unsubscribed destination': function () {
					var subscribe1, subscribe2;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/foo', bus.noopHandler);
					subscribe1 = bus.receive('subscribe');
					assert.match(subscribe1.payload, 'destination:/queue/foo');

					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', bus.noopHandler);
					assert.match(bus.receive('unsubscribe').payload, 'id:' + extractIdHeader(subscribe1.payload));

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/foo', bus.noopHandler);
					subscribe2 = bus.receive('subscribe');
					assert.match(subscribe2.payload, 'destination:/queue/foo');

					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', bus.noopHandler);
					assert.match(bus.receive('unsubscribe').payload, 'id:' + extractIdHeader(subscribe2.payload));

					refute.equals(extractIdHeader(subscribe1.payload), extractIdHeader(subscribe2.payload));
				},
				'should consolidate duplicate subscriptions for the server': function () {
					var subscribe;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('subscribe'));
					bus.subscribe('bridge!/queue/foo', noopHandler1);
					subscribe = bus.receive('subscribe');
					assert.match(subscribe.payload, 'destination:/queue/foo');
					bus.subscribe('bridge!/queue/foo', noopHandler2);
					refute(bus.receive('subscribe'));

					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', noopHandler1);
					refute(bus.receive('unsubscribe'));
					bus.unsubscribe('bridge!/queue/foo', noopHandler2);
					assert.match(bus.receive('unsubscribe').payload, 'id:' + extractIdHeader(subscribe.payload));
				},
				'should not indicate a duplicate subscription is subscribed until the first subscription is confirmed live': function () {
					var receipt;

					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					tapControlBus();
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('cbSubscribedLog'));
					bus.subscribe('bridge!/queue/foo', noopHandler1);
					refute(bus.receive('cbSubscribedLog'));
					receipt = extractReceiptHeader(bus.receive('subscribe').payload);

					bus.subscribe('bridge!/queue/foo', noopHandler2);
					refute(bus.receive('cbSubscribedLog'));

					bus.send('fromServer', 'RECEIPT\nreceipt-id:' + receipt + '\n\n\x00');
					assert(bus.receive('cbSubscribedLog'));
					assert(bus.receive('cbSubscribedLog'));
					refute(bus.receive('cbSubscribedLog'));
				},
				'should send messages to the server destination': function () {
					bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
					bus.send('fromServer', 'CONNECTED\n\n\x00');

					refute(bus.receive('send'));
					bus.send('bridge!/queue/foo', 'bar');
					var message = bus.receive('send');
					assert.match(message.payload, 'destination:/queue/foo');
					assert.match(message.payload, '\n\nbar\x00');
				},
				'should receive messages sent to a subscribed destination': {
					'': function () {
						var subscriptionId;

						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function (greeting) {
							assert.same('hello', greeting);
						});
						subscriptionId = extractIdHeader(bus.receive('subscribe').payload);

						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nsubscription:' + subscriptionId + '\nmessage-id:23\n\nhello\x00');
						refute(bus.receive('ack'));
						refute(bus.receive('nack'));
					},
					'with acknowledgment': function () {
						var subscriptionId;

						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer', ack: 'client-individual' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function (greeting) {
							assert.same('hello', greeting);
						});
						subscriptionId = extractIdHeader(bus.receive('subscribe').payload);

						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nsubscription:' + subscriptionId + '\nmessage-id:23\n\nhello\x00');
						assert.equals('23', extractIdHeader(bus.receive('ack').payload));
						refute(bus.receive('nack'));
					}
				},
				'should place on the error channel messages sent without a subscription id': {
					'': function () {
						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer', error: 'errors' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function () {
							fail('message should not be delivered');
						});
						assert(bus.receive('subscribe'));

						refute(bus.receive('errorsLog'));
						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nmessage-id:23\n\nhello\x00');
						assert(bus.receive('message'));
						assert(bus.receive('errorsLog'));
						refute(bus.receive('ack'));
						refute(bus.receive('nack'));
					},
					'with acknowledgment': function () {
						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer', error: 'errors', ack: 'client-individual' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function () {
							fail('message should not be delivered');
						});
						assert(bus.receive('subscribe'));

						refute(bus.receive('errorsLog'));
						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nmessage-id:23\n\nhello\x00');
						assert(bus.receive('message'));
						assert(bus.receive('errorsLog'));
						refute(bus.receive('ack'));
						assert.equals('23', extractIdHeader(bus.receive('nack').payload));
					}
				},
				'should place on the error channel messages sent with a bogus subscription id': {
					'': function () {
						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer', error: 'errors' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function () {
							fail('message should not be delivered');
						});
						assert(bus.receive('subscribe'));

						refute(bus.receive('errorsLog'));
						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nubscription:foobar\nmessage-id:23\n\nhello\x00');
						assert(bus.receive('message'));
						assert(bus.receive('errorsLog'));
						refute(bus.receive('ack'));
						refute(bus.receive('nack'));
					},
					'with acknowledgment': function () {
						bus.stompBridge('bridge', { input: 'fromServer', output: 'toServer', error: 'errors', ack: 'client-individual' });
						bus.send('fromServer', 'CONNECTED\n\n\x00');

						bus.on('bridge!greeting', function () {
							fail('message should not be delivered');
						});
						assert(bus.receive('subscribe'));

						refute(bus.receive('errorsLog'));
						bus.send('fromServer', 'MESSAGE\ndestination:greeting\nubscription:foobar\nmessage-id:23\n\nhello\x00');
						assert(bus.receive('message'));
						assert(bus.receive('errorsLog'));
						refute(bus.receive('ack'));
						assert.equals('23', extractIdHeader(bus.receive('nack').payload));
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
