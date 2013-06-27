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

	define('msgs/gateways-test', function (require) {

		var msgs, bus, when;

		msgs = require('msgs/gateways');
		when = require('when');

		buster.testCase('msgs/gateways', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should resolve the gateway promise when there is no more work to do': function (done) {
				bus.channel('target').subscribe(bus.transformer(function (payload) {
					return 'Knock, knock? ' + payload;
				}));
				bus.inboundGateway('target')('Who\'s there?').then(function (response) {
					assert.same('Knock, knock? Who\'s there?', response);
				}).otherwise(fail).always(done);
			},
			'should reject the gateway promise when an error is encountered': function (done) {
				bus.channel('target').subscribe(bus.transformer(function (/* payload */) {
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
