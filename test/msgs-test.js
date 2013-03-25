/*
 * Copyright 2012 the original author or authors
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

	define('msgs-test', function (require) {

		var msgs, bus, when;

		msgs = require('msgs');
		when = require('when');
		require('msgs/channels/direct');

		buster.testCase('msgs', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should detect a message bus': function () {
				assert(msgs.isBus(bus));
				refute(msgs.isBus({}));
			},
			'should create a message for a payload and headers': function () {
				var message = bus._message('payload', { name: 'value' });
				assert.same('payload', message.payload);
				assert.same('value', message.headers.name);
			},
			'should create a message with headers, even when none are provided': function () {
				var message = bus._message('payload');
				assert.same('payload', message.payload);
				assert(message.headers.id);
			},
			'should not modify an exsisting message payload, headers must be different': function () {
				var message = bus._message('payload');
				assert.same(message.payload, bus._message(message).payload);
				refute.equals(message.headers, bus._message(message).headers);
			},
			'should contain unique message IDs': function () {
				refute.equals(bus._message().headers.id, bus._message().headers.id);
			},
			'should create channels that pass messages': function () {
				var publisher, consumer;

				publisher = bus.channel();
				consumer = {
					handle: function (message) {
						assert.same('hello world', message.payload);
					}
				};
				bus.subscribe(publisher, consumer);

				bus.send(publisher, 'hello world');
			},
			'should lookup channels with a name': function () {
				bus.channel('identity');
				bus.channel('not-identity');
				assert.same(bus.resolveChannel('identity'), bus.resolveChannel('identity'));
				refute.same(bus.resolveChannel('identity'), bus.resolveChannel('not-identity'));
				refute(bus.resolveHandler('identity'));
				refute(bus.resolveHandler('not-identity'));
			},
			'should lookup handlers with a name': function () {
				bus.filter('identity', function () { return true; });
				bus.filter('not-identity', function () { return true; });
				assert.same(bus.resolveHandler('identity'), bus.resolveHandler('identity'));
				refute.same(bus.resolveHandler('identity'), bus.resolveHandler('not-identity'));
				refute(bus.resolveChannel('identity'));
				refute(bus.resolveChannel('not-identity'));
			},
			'should return provided channels/handlers when passed as name': function () {
				var channel, pseudoChannel, handler, pseudoHandler;

				channel = bus.channel();
				pseudoChannel = { send: function () {} };
				handler = bus.filter();
				pseudoHandler = { handle: function () {} };

				assert.same(channel, bus.resolveChannel(channel));
				assert.same(pseudoChannel, bus.resolveChannel(pseudoChannel));
				refute(bus.resolveHandler(channel));
				refute(bus.resolveHandler(pseudoChannel));

				assert.same(handler, bus.resolveHandler(handler));
				assert.same(pseudoHandler, bus.resolveHandler(pseudoHandler));
				refute(bus.resolveChannel(handler));
				refute(bus.resolveChannel(pseudoHandler));
			},
			'should adapt messages to normal function invocations with outbound adapters': function () {
				var publisher, consumer;

				publisher = bus.channel();
				consumer = bus.outboundAdapter(function (message) {
					assert.same('hello world', message);
				});
				bus.subscribe(publisher, consumer);

				bus.send(publisher, 'hello world');
			},
			'should adapt normal function invocations to messages with inbound adapters': function () {
				var publisher, adapter, consumer;

				publisher = bus.channel();
				adapter = bus.inboundAdapter(publisher);
				consumer = {
					handle: function (message) {
						assert.same('hello world', message.payload);
					}
				};
				bus.subscribe(publisher, consumer);

				adapter('hello world');
			},
			'should adapt normal function invocations to messages with inbound adapters with a transform': function () {
				var publisher, adapter, consumer;

				publisher = bus.channel();
				adapter = bus.inboundAdapter(publisher, String.prototype.toUpperCase);
				consumer = {
					handle: function (message) {
						assert.same('HELLO WORLD', message.payload);
					}
				};
				bus.subscribe(publisher, consumer);

				adapter('hello world');
			},
			'should apply a sequence number to inbound messages': function () {
				var handler, adapter;
				handler = {
					handle: this.spy(function () { return true; })
				};
				adapter = bus.inboundAdapter(bus.directChannel(handler));

				adapter('hello');
				adapter('world');

				assert.same(2, handler.handle.callCount);
				assert.same(0, handler.handle.getCall(0).args[0].headers.sequenceNumber);
				assert.same(1, handler.handle.getCall(1).args[0].headers.sequenceNumber);
			},
			'should start local and then ask parent bus to find handlers': function () {
				var parent, child;

				parent = bus;
				child = parent.bus();

				refute(parent.resolveHandler('parent'));
				refute(child.resolveHandler('parent'));
				refute(parent.resolveHandler('child'));
				refute(child.resolveHandler('child'));

				parent.filter('parent', function () {});
				child.filter('child', function () {});

				// child can resolve to parent
				assert(parent.resolveHandler('parent'));
				assert(child.resolveHandler('parent'));
				assert.same(parent.resolveHandler('parent'), child.resolveHandler('parent'));

				// parent cannot resolve to child
				refute(parent.resolveHandler('child'));
				assert(child.resolveHandler('child'));
				refute.same(child.resolveHandler('child'), parent.resolveHandler('child'));
			},
			'should start local and then ask parent bus to find channels': function () {
				var parent, child;

				parent = bus;
				child = parent.bus();

				refute(parent.resolveChannel('parent'));
				refute(child.resolveChannel('parent'));
				refute(parent.resolveChannel('child'));
				refute(child.resolveChannel('child'));

				parent.channel('parent');
				child.channel('child');

				// child can resolve to parent
				assert(parent.resolveChannel('parent'));
				assert(child.resolveChannel('parent'));
				assert.same(parent.resolveChannel('parent'), child.resolveChannel('parent'));

				// parent cannot resolve to child
				refute(parent.resolveChannel('child'));
				assert(child.resolveChannel('child'));
				refute.same(child.resolveChannel('child'), parent.resolveChannel('child'));
			},
			'should receive dead letter messages at local and parent channels': function () {
				var parent, child, channel, callback;

				parent = bus;
				child = parent.bus();

				callback = this.spy(function (message) {
					assert.same('you\'re dead to me', message);
				});

				channel = child.channel();

				parent.deadLetterChannel.subscribe(parent.outboundAdapter(callback));
				child.deadLetterChannel.subscribe(child.outboundAdapter(callback));

				bus.send(channel, 'you\'re dead to me');
				assert.same(2, callback.callCount);
			},
			'should receive invalid messages at local and parent channels': function () {
				var parent, child, channel, callback;

				parent = bus;
				child = parent.bus();

				callback = this.spy(function (message) {
					assert.same('let\'s hope this works', message);
				});

				channel = child.channel();

				parent.invalidMessageChannel.subscribe(parent.outboundAdapter(callback));
				child.invalidMessageChannel.subscribe(child.outboundAdapter(callback));

				channel.subscribe(child.outboundAdapter(function () { throw new Error(); }));

				bus.send(channel, 'let\'s hope this works');
				assert.same(2, callback.callCount);
			},
			'should dispatch messages to a single subscriber for default channels': function () {
				var channel, aSpy, bSpy;

				channel = bus.channel();
				aSpy = this.spy(function (message) {
					assert.equals('one of us gets a message!', message);
				});
				bSpy = this.spy(function (message) {
					assert.equals('one of us gets a message!', message);
				});
				channel.subscribe(bus.outboundAdapter(aSpy));
				channel.subscribe(bus.outboundAdapter(bSpy));

				bus.send(channel, 'one of us gets a message!');
				bus.send(channel, 'one of us gets a message!');

				assert.same(2, aSpy.callCount + bSpy.callCount);
			},
			'should dispatch to a wiretap in addition to subscriptions': function () {
				var channel, tap, sub;

				channel = bus.channel();
				tap = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				sub = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				bus.tap(channel, bus.outboundAdapter(tap));
				bus.subscribe(channel, bus.outboundAdapter(sub));

				bus.send(channel, 'it feels like we\'re being watched');

				assert.same(1, tap.callCount);
				assert.same(1, sub.callCount);
			},
			'should dispatch to each wiretap in addition to subscriptions': function () {
				var channel, tapA, tapB, subA, subB;

				channel = bus.channel();
				tapA = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				tapB = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				subA = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				subB = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});
				bus.tap(channel, bus.outboundAdapter(tapA));
				bus.tap(channel, bus.outboundAdapter(tapB));
				bus.subscribe(channel, bus.outboundAdapter(subA));
				bus.subscribe(channel, bus.outboundAdapter(subB));

				bus.send(channel, 'it feels like we\'re being watched');
				bus.send(channel, 'it feels like we\'re being watched');

				assert.same(2, tapA.callCount);
				assert.same(2, tapB.callCount);
				assert.same(2, subA.callCount + subB.callCount);
			},
			'should not receive messages at untapped wiretaps': function () {
				var channel, tap;

				channel = bus.channel();
				tap = { handle: this.spy() };

				assert.same(0, tap.handle.callCount);

				bus.tap(channel, tap);
				bus.send(channel, 'it feels like we\'re being watched');
				assert.same(1, tap.handle.callCount);
				bus.send(channel, 'it feels like we\'re being watched');
				assert.same(2, tap.handle.callCount);

				bus.untap(channel, tap);
				bus.send(channel, 'it feels like we\'re being watched');
				assert.same(2, tap.handle.callCount);
			},
			'should squelch exceptions from wiretaps': function () {
				var channel, tap, sub;

				channel = bus.channel();
				tap = {
					handle: this.spy(function () {
						throw new Error();
					})
				};
				sub = this.spy(function (message) {
					assert.equals('it feels like we\'re being watched', message);
				});

				channel.tap(tap);
				bus.subscribe(channel, bus.outboundAdapter(sub));

				bus.send(channel, 'it feels like we\'re being watched');

				assert.same(1, tap.handle.callCount);
				assert.same(1, sub.callCount);
			},
			'should alter the message payload with a transform': function () {
				bus.channel('in');
				bus.channel('out');
				bus.transform(function (message) {
					return message + '... NOT!';
				}, { input: 'in', output: 'out' });
				bus.subscribe('out', bus.outboundAdapter(function (message) {
					assert.same('JavaScript sucks... NOT!', message);
				}));
				bus.inboundAdapter('in').call(undef, 'JavaScript sucks');
			},
			'should filter messages that do not match some criteria': function () {
				var func, oddSpy, evenSpy;
				oddSpy = this.spy(function (message) {
					assert(message % 2 === 1);
				});
				evenSpy = this.spy(function (message) {
					assert(message % 2 === 0);
				});
				bus.channel('in');
				bus.channel('goodNumbers');
				bus.channel('otherNumbers');
				func = bus.inboundAdapter('in');
				bus.filter(function (num) { return num % 2 === 1; }, { input: 'in', output: 'goodNumbers', discard: 'otherNumbers' });
				bus.subscribe('goodNumbers', bus.outboundAdapter(oddSpy));
				bus.subscribe('otherNumbers', bus.outboundAdapter(evenSpy));
				func(0);
				func(1);
				func(2);
				func(3);
				func(4);
				assert.same(3, evenSpy.callCount);
				assert.same(2, oddSpy.callCount);
			},
			'should route messages dynamically': function () {
				bus.channel('in');
				bus.router(function (message) { return message.headers.dest; }, { input: 'in' });
				bus.channel('resort');
				bus.subscribe('resort', bus.outboundAdapter(function (message) {
					assert.same('Did I end up at the resort?', message);
				}));
				bus.send('in', 'Did I end up at the resort?', { dest: 'resort' });
			},
			'should route messages with channel aliases': function () {
				bus.channel('in');
				bus.router(function (message) { return message.headers.dest; }, { routes: { resort: 'disneyWorld' }, input: 'in' });
				bus.channel('disneyWorld');
				bus.subscribe('disneyWorld', bus.outboundAdapter(function (message) {
					assert.same('Did I end up at the resort?', message);
				}));
				bus.send('in', 'Did I end up at the resort?', { dest: 'resort' });
			},
			'should not suppress routing errors': function () {
				try {
					bus.router('route', function () { throw new Error(); });
					bus.bridge('in', 'route');
					bus.send('in', 'Did I end up at the resort?', { dest: 'resort' });
					fail('Exception expected');
				}
				catch (e) {
					assert(e);
				}
			},
			'should resolve an aliased channel': function () {
				bus.channel('a');
				bus.alias('b', 'a');
				bus.alias('c', 'b');
				assert.same(bus.resolveHandler('a'), bus.resolveHandler('c'));
			},
			'should execute chain handlers in order': function () {
				bus.transform('jr', function (name) {
					return name + ' Jr.';
				});
				bus.transform('md', function (name) {
					return name + ' M.D.';
				});

				bus.directChannel('post', bus.outboundAdapter(function (name) {
					assert.equals(name, 'Bigglesworth Jr. M.D.');
				}));
				bus.channel('pre');
				bus.chain(['jr', 'md'], { output: 'post', input: 'pre' });

				bus.send('pre', 'Bigglesworth');
			},
			'should filter messages in a chain': function () {
				var spy = this.spy(function (message) {
					assert.same('hello', message);
				});

				bus.channel('start');
				bus.channel('end');
				bus.subscribe('end', bus.outboundAdapter(spy));

				bus.chain([
					bus.filter(function (message) {
						return (/^[a-z]+$/).test(message);
					})
				], { input: 'start', output: 'end' });

				bus.send('start', 'HELLO');
				bus.send('start', 'hello');

				assert.same(1, spy.callCount);
			},
			'should resolve the gateway promise when there is no more work to do': function (done) {
				bus.channel('target').subscribe(bus.transform(function (payload) {
					return 'Knock, knock? ' + payload;
				}));
				bus.inboundGateway('target')('Who\'s there?').then(function (response) {
					assert.same('Knock, knock? Who\'s there?', response);
				}).otherwise(fail).always(done);
			},
			'should reject the gateway promise when an error is encountered': function (done) {
				bus.channel('target').subscribe(bus.transform(function (/* payload */) {
					throw new Error();
				}));
				bus.inboundGateway('target')('Who\'s there?').then(
					fail,
					function (/* response */) {
						assert(true);
					}
				).always(done);
			},
			'should apply a sequence number to gateway messages': function () {
				var handler, gateway;
				handler = {
					handle: this.spy(function () { return true; })
				};
				gateway = bus.inboundGateway(bus.directChannel(handler));

				gateway('hello');
				gateway('world');

				assert.same(2, handler.handle.callCount);
				assert.same(0, handler.handle.getCall(0).args[0].headers.sequenceNumber);
				assert.same(1, handler.handle.getCall(1).args[0].headers.sequenceNumber);
			},
			'should split a message into multiple messages': function () {
				var spy = this.spy(function (message) {
					assert.same('msg', message);
				});

				bus.directChannel('in', 'split');
				bus.splitter('split', function (message) {
					return message.payload;
				}, { output: 'out' });
				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', ['msg', 'msg']);
				assert.same(2, spy.callCount);
			},
			'should aggregate two messages into one': function () {
				var spy = this.spy(function (message) {
					assert.equals(['msg', 'msg'], message);
				});

				bus.channel('in');
				bus.aggregator((function () {
					var buffer = [];
					return function (message, callback) {
						buffer.push(message.payload);
						if (buffer.length > 1) {
							callback(buffer);
							buffer = [];
						}
					};
				}()), { output: 'out', input: 'in' });
				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', 'msg');
				assert.same(0, spy.callCount);
				bus.send('in', 'msg');
				assert.same(1, spy.callCount);
			},
			'should log received messages': function () {
				var console, handler;

				console = {
					log: this.spy()
				};
				handler = {
					handle: this.spy()
				};

				bus.channel('logger');
				bus.subscribe('logger', handler);

				bus.logger({
					console: console,
					prefix: 'Integration message: ',
					tap: 'logger'
				});

				bus.send('logger', 'Hello Console');

				assert.same('Hello Console', handler.handle.getCall(0).args[0].payload);
				assert.same('Integration message: ', console.log.getCall(0).args[0]);
				assert.same('Hello Console', console.log.getCall(0).args[1].payload);
			},
			'should export channels to the parent message bus': function () {
				var parent = bus,
					child = parent.bus(),
					spy = this.spy();

				child.directChannel('out', child.outboundAdapter(spy));
				child.exportChannel('subprocess', 'out');

				parent.send('subprocess', 'Hello Child');

				assert.same(1, spy.callCount);
				assert.same('Hello Child', spy.getCall(0).args[0]);
			},
			'should accept a configuration closure when creating a message bus': function () {
				var spy = this.spy();

				bus.bus(function () {
					this.directChannel('out', this.outboundAdapter(spy));
					this.exportChannel('in', 'out');
				});

				bus.send('in', 'Hello encapsulated child');

				assert.same(1, spy.callCount);
				assert.same('Hello encapsulated child', spy.getCall(0).args[0]);
				refute(bus.resolveChannel('out'));
			},
			'should post a reply message from an outbound gateway to the output channel': function (done) {
				var spy = this.spy(function (message) {
					assert.same('HELLO SERVICE', message);
					done();
				});

				bus.channel('in');

				bus.outboundGateway('service', function (message) {
					var d = when.defer();
					setTimeout(function () {
						d.resolve(message.toUpperCase());
					}, 10);
					return d.promise;
				}, { input: 'in', output: 'out', error: 'err' });

				bus.directChannel('err', bus.outboundAdapter(function () {
					fail('A message should not have been received on the error channel');
					done();
				}));

				bus.directChannel('out', bus.outboundAdapter(spy));

				bus.send('in', 'Hello Service');
				refute(spy.called);
			},
			'should post a rejected promise from an outbound gateway to the error channel': function (done) {
				var spy = this.spy(function (message) {
					assert.same('HELLO SERVICE', message);
					done();
				});

				bus.channel('in');

				bus.outboundGateway('service', function (message) {
					var d = when.defer();
					setTimeout(function () {
						d.reject(message.toUpperCase());
					}, 10);
					return d.promise;
				}, { input: 'in', output: 'out', error: 'err' });

				bus.directChannel('out', bus.outboundAdapter(function () {
					fail('A message should not have been received on the output channel');
					done();
				}));

				bus.directChannel('err', bus.outboundAdapter(spy));

				bus.send('in', 'Hello Service');
				refute(spy.called);
			},
			'should post a throw error from an outbound gateway to the error channel': function (done) {
				var spy = this.spy(function (message) {
					assert.same('Hello Service', message);
					done();
				});

				bus.channel('in');

				bus.outboundGateway('service', function (message) {
					throw message.toUpperCase();
				}, { input: 'in', output: 'out', error: 'err' });

				bus.directChannel('out', bus.outboundAdapter(function () {
					fail('A message should not have been received on the output channel');
					done();
				}));

				bus.directChannel('err', bus.outboundAdapter(spy));

				bus.send('in', 'Hello Service');
			},
			'should forward messages from one channel to another': function () {
				var spy = this.spy(function (message) {
					assert.same('hello', message);
				});

				bus.channel('a');
				bus.channel('b');

				bus.forward('a', 'b');
				bus.subscribe('b', bus.outboundAdapter(spy));

				bus.send('a', 'hello');
				assert.same(1, spy.callCount);
			},
			'should have default channel type': function () {
				assert.same('default', bus.channel().type);
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
