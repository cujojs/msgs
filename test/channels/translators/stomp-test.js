/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, undef;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	define('msgs/channels/translators/stomp-test', function (require) {

		var msgs, bus, stomp, translator;

		msgs = require('msgs');
		stomp = require('msgs/channels/translators/stomp');

		buster.testCase('msgs/channels/translators/stomp', {
			setUp: function () {
				bus = msgs.bus();
				translator = stomp(bus);
			},
			tearDown: function () {
				bus.destroy();
			},

			'should build a STOMP frame for a message': {
				'': function () {
					var message, frame;
					message = bus._message(undef, { command: 'send' });
					frame = translator.build(message);
					assert.same(frame, 'SEND\nid:' + message.headers.id + '\n\n\u0000');
				},
				'including a payload': function () {
					var message, frame;
					message = bus._message('hello world', { command: 'send' });
					frame = translator.build(message);
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\ncontent-length:11\n');
					assert.match(frame, /\n\nhello world\u0000$/);
				},
				'including a payload with an explicit content-length': function () {
					var message, frame;
					message = bus._message('hello world', { command: 'send', 'content-length': 4 });
					frame = translator.build(message);
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\ncontent-length:4\n');
					refute.match(frame, '\ncontent-length:11\n');
					assert.match(frame, /\n\nhello world\u0000$/);
				},
				'including custom headers': function () {
					var message, frame;
					message = bus._message('hello world', { command: 'send', 'content-type': 'text/plain' });
					frame = translator.build(message);
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\ncontent-type:text/plain\n');
					assert.match(frame, /\n\nhello world\u0000$/);
				},
				'ignoreing non-string and non-number headers': function () {
					var message, frame;
					message = bus._message(undef, { command: 'send', hello: 'world', foo: 3, bar: {}, baz: function () {}, bleep: /^foo$/ });
					frame = translator.build(message);
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\nhello:world\n');
					assert.match(frame, '\nfoo:3\n');
					refute.match(frame, 'bar');
					refute.match(frame, 'baz');
					refute.match(frame, 'bleep');
					assert.match(frame, /\n\n\u0000$/);
				}
			},
			'should parse a STOMP message': {
				'': function () {
					var message, frame;
					frame = 'MESSAGE\nsubscription:0\nmessage-id:007\ndestination:/queue/a\ncontent-type:text/plain\n\nhello queue a\u0000';
					message = translator.parse(frame);
					assert.same('MESSAGE', message.headers.command);
					assert.same('0', message.headers.subscription);
					assert.same('007', message.headers['message-id']);
					assert.same('/queue/a', message.headers.destination);
					assert.same('text/plain', message.headers['content-type']);
					assert.same('hello queue a', message.payload);
				},
				'with CRLF': function () {
					var message, frame;
					frame = 'MESSAGE\r\nsubscription:0\r\nmessage-id:007\r\ndestination:/queue/a\r\ncontent-type:text/plain\r\n\r\nhello queue a\u0000';
					message = translator.parse(frame);
					assert.same('MESSAGE', message.headers.command);
					assert.same('0', message.headers.subscription);
					assert.same('007', message.headers['message-id']);
					assert.same('/queue/a', message.headers.destination);
					assert.same('text/plain', message.headers['content-type']);
					assert.same('hello queue a', message.payload);
				},
				'without a body': function () {
					var message, frame;
					frame = 'CONNECTED\nversion:1.1\n\n\u0000';
					message = translator.parse(frame);
					assert.same('CONNECTED', message.headers.command);
					assert.same(undef, message.payload);
				},
				'forgiving a missing null byte': function () {
					var message, frame;
					frame = 'MESSAGE\n\nhello world foo bar';
					message = translator.parse(frame);
					assert.same('MESSAGE', message.headers.command);
					assert.same('hello world foo bar', message.payload);
				},
				'ignoreing content after the null byte': function () {
					var message, frame;
					frame = 'MESSAGE\n\nhello world\u0000foo bar';
					message = translator.parse(frame);
					assert.same('MESSAGE', message.headers.command);
					assert.same('hello world', message.payload);
				},
				'ignoreing the command header': function () {
					var message, frame;
					frame = 'MESSAGE\ncommand:foo\n\nhello world\u0000';
					message = translator.parse(frame);
					assert.same('MESSAGE', message.headers.command);
					assert.same('hello world', message.payload);
				},
				'allowing colons in header values': function () {
					var message, frame;
					frame = 'MESSAGE\nkey:foo:bar\n\nhello world\u0000';
					message = translator.parse(frame);
					assert.same('foo:bar', message.headers.key);
				}
			},
			'should parse a heart beat frame': function () {
				var message, frame;
				frame = '\n';
				message = translator.parse(frame);
				refute(message.headers.command);
			},
			'should build a heart beat frame': function () {
				var frame = translator.buildHeartBeatFrame();
				assert.same('\n', frame.payload);
			},
			'should build a CONNECT frame': {
				'': function () {
					var frame = translator.buildConnectFrame({ host: 'stomp.cujojs.com' });
					assert.match(frame, /^CONNECT\n/);
					assert.match(frame, '\nhost:stomp.cujojs.com\n');
					assert.match(frame, '\nheart-beat:0,0\n');
					refute.match(frame, 'login');
					refute.match(frame, 'passcode');
					assert.match(frame, /\n\n\u0000$/);
				},
				'with credentials': function () {
					var frame = translator.buildConnectFrame({
						host: 'stomp.cujojs.com',
						login: 'marisa',
						passcode: 'koala'
					});
					assert.match(frame, '\nlogin:marisa\n');
					assert.match(frame, '\npasscode:koala\n');
				}
			},
			'should build a SEND frame': {
				'': function () {
					var message, frame;
					message = bus._message('hello world', { topic: 'greetings.en.us' });
					frame = translator.buildSendFrame(message);
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\ndestination:greetings.en.us\n');
					assert.match(frame, '\ncontent-length:11\n');
					refute.match(frame, 'topic');
					assert.match(frame, /\n\nhello world\u0000$/);
				},
				'with a defined contentType': function () {
					var message, frame;
					message = bus._message('hello world', {
						topic: 'greetings.en.us',
						contentType: 'text/plain'
					});
					frame = translator.buildSendFrame(message);
					assert.match(frame, '\ncontent-type:text/plain\n');
					refute.match(frame, 'contentType');
				},
				'with a receipt': function () {
					var message, frame;
					message = bus._message('hello world', { topic: 'greetings.en.us' });
					frame = translator.buildSendFrame(message, '5');
					assert.match(frame, /^SEND\n/);
					assert.match(frame, '\nreceipt:5\n');
					assert.match(frame, '\ndestination:greetings.en.us\n');
					assert.match(frame, '\ncontent-length:11\n');
					refute.match(frame, 'topic');
					assert.match(frame, /\n\nhello world\u0000$/);
				}
			},
			'should build a SUBSCRIBE frame': {
				'': function () {
					var frame = translator.buildSubscribeFrame('greetings.#', '4');
					assert.match(frame, /^SUBSCRIBE\n/);
					assert.match(frame, '\ndestination:greetings.#\n');
					assert.match(frame, '\nid:4\n');
					refute.match(frame, '\nreceipt:');
					assert.match(frame, '\nack:auto\n');
					assert.match(frame, /\n\n\u0000$/);
				},
				'with an ack': function () {
					var frame = translator.buildSubscribeFrame('greetings.#', '4', 'client');
					assert.match(frame, /^SUBSCRIBE\n/);
					assert.match(frame, '\ndestination:greetings.#\n');
					assert.match(frame, '\nid:4\n');
					refute.match(frame, '\nreceipt:\n');
					assert.match(frame, '\nack:client\n');
					assert.match(frame, /\n\n\u0000$/);
				},
				'with a receipt': function () {
					var frame = translator.buildSubscribeFrame('greetings.#', '4', undef, '5');
					assert.match(frame, /^SUBSCRIBE\n/);
					assert.match(frame, '\ndestination:greetings.#\n');
					assert.match(frame, '\nid:4\n');
					assert.match(frame, '\nreceipt:5\n');
					assert.match(frame, '\nack:auto\n');
					assert.match(frame, /\n\n\u0000$/);
				}
			},
			'should build a UNSUBSCRIBE frame': {
				'': function () {
					var frame = translator.buildUnsubscribeFrame('4');
					assert.match(frame, /^UNSUBSCRIBE\n/);
					assert.match(frame, '\nid:4\n');
					refute.match(frame, '\nreceipt:');
					assert.match(frame, /\n\n\u0000$/);
				},
				'with a receipt': function () {
					var frame = translator.buildUnsubscribeFrame('4', '5');
					assert.match(frame, /^UNSUBSCRIBE\n/);
					assert.match(frame, '\nid:4\n');
					assert.match(frame, '\nreceipt:5\n');
					assert.match(frame, /\n\n\u0000$/);
				}
			},
			'should build an ACK frame': function () {
				var frame = translator.buildAckFrame('4');
				assert.match(frame, /^ACK\n/);
				assert.match(frame, '\nid:4\n');
				assert.match(frame, /\n\n\u0000$/);
			},
			'should build a NACK frame': function () {
				var frame = translator.buildNackFrame('4');
				assert.match(frame, /^NACK\n/);
				assert.match(frame, '\nid:4\n');
				assert.match(frame, /\n\n\u0000$/);
			},
			'should build a DISCONNECT frame': {
				'': function () {
					var frame = translator.buildDisconnectFrame();
					assert.match(frame, /^DISCONNECT\n/);
					assert.match(frame, /\n\n\u0000$/);
				},
				'with a receipt': function () {
					var frame = translator.buildDisconnectFrame('45');
					assert.match(frame, /^DISCONNECT\n/);
					assert.match(frame, '\nreceipt:45\n');
					assert.match(frame, /\n\n\u0000$/);
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
