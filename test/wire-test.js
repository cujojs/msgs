/*
 * Copyright 2013-2014 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, undef;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;

	define('msgs/wire-test', function (require) {

		var msgs, wire, when;

		msgs = require('msgs');
		wire = require('wire');
		when = require('when');

		require('msgs/channels/pubsub');

		buster.testCase('msgs/wire', {
			'should support plugin namespaces': function () {
				var spec = {
					bus: { $ref: 'int:bus!' },
					plugins: [{ module: 'msgs/wire', $ns: 'int' }]
				};
				return wire(spec, { require: require }).then(function (spec) {
					var bus = spec.bus;
					refute.same(msgs, bus);
					assert.same(msgs.prototype, bus.prototype);
				}).then(undef, fail);
			},
			'should chain bus from parent specs': function () {
				var spec = {
					bus: { channels: 'parent' },
					child: { wire: { spec: 'msgs/test/wire/nestedBus' } },
					plugins: [{ module: 'msgs/wire' }]
				};
				return wire(spec, { require: require }).then(function (spec) {
					var parent = spec.bus;
					return when(spec.child, function (spec) {
						var d, child;

						d = when.defer();
						child = spec.bus;

						refute.same(parent, child);
						assert(msgs.isBus(parent));
						assert(msgs.isBus(child));

						child.forward('child', 'parent');
						parent.outboundAdapter(function (payload) {
							assert.same('hello', payload);
							d.resolve();
						}, { input: 'parent' });
						child.send('child', 'hello');

						return d.promise;
					});
				}).then(undef, fail);
			},
			'should resolve the message bus for bus!': function () {
				var spec = {
					bus: { $ref: 'bus!' },
					plugins: [{ module: 'msgs/wire' }]
				};
				return wire(spec, { require: require }).then(function (spec) {
					var bus = spec.bus;
					refute.same(msgs, bus);
					assert.same(msgs.prototype, bus.prototype);
				}).then(undef, fail);
			},
			'should destroy the message bus when the spec is destroyed': function () {
				var spec, spy;
				spy = this.spy;
				spec = {
					bus: { $ref: 'bus!' },
					plugins: [{ module: 'msgs/wire' }]
				};
				return wire(spec, { require: require }).then(function (spec) {
					var bus, destroySpy;
					bus = spec.bus;
					destroySpy = bus.destroy = spy(bus.destroy);
					return spec.destroy().then(function () {
						assert.called(destroySpy);
					});
				}).then(undef, fail);
			},
			'should send messages to the target channel as an inbound gateway': function (done) {
				var spec = {
					bus: { $ref: 'bus!' },
					source: {
						literal: {
							event: function () { return 'hello'; },
							next: function (message) {
								assert.same('HELLO', message);
								done();
							}
						},
						after: {
							event: 'channel!world | next'
						}
					},
					plugins: [
						{ module: 'msgs/wire' },
						{ module: 'wire/aop' }
					]
				};
				wire(spec, { require: require }).then(function (spec) {
					spec.bus.channel('world');
					spec.bus.transformer(function (message) {
						return message.toUpperCase();
					}, { input: 'world' });
					spec.source.event();
				}).then(undef, fail);
			},
			'should create channels with the channels factory': {
				'returning the integration bus': function () {
					var spec = {
						bus: { $ref: 'bus!' },
						integration: {
							channels: 'world'
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						assert.same(spec.bus, spec.integration);
					}).then(undef, fail);
				},
				'with a single channel name': function () {
					var spec = {
						bus: { $ref: 'bus!' },
						integration: {
							channels: 'world'
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						assert.same('default', spec.bus.resolveChannel('world').type);
					}).then(undef, fail);
				},
				'with an array of channel names': function () {
					var spec = {
						bus: { $ref: 'bus!' },
						integration: {
							channels: ['hello', 'world']
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						assert.same('default', spec.bus.resolveChannel('hello').type);
						assert.same('default', spec.bus.resolveChannel('world').type);
					}).then(undef, fail);
				},
				'with the desired type': function () {
					var spec = {
						bus: { $ref: 'bus!' },
						integration: {
							channels: {
								pubsubChannel: 'world'
							}
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						assert.same('pubsub', spec.bus.resolveChannel('world').type);
					}).then(undef, fail);
				},
				'failing for unknown channel type': function () {
					var spec = {
						bus: { $ref: 'bus!' },
						integration: {
							channels: {
								nonExistentChannel: 'world'
							}
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(
						fail,
						function (reason) {
							assert(reason.indexOf('Unable to define channels:') === 0);
						}
					);
				}
			},
			'should create outboundAdapters for the subscribe facet': {
				'for a single target': function () {
					var spec = {
						component: {
							literal: {
								receive: this.spy(function (message) {
									assert.same('hello', message);
								})
							}
						},
						bus: {
							channels: 'world',
							subscribe: {
								world: 'component.receive'
							}
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						spec.bus.send('world', 'hello');
						assert.called(spec.component.receive);
					}).then(undef, fail);
				},
				'for multiple targets': function () {
					var spec = {
						component: {
							literal: {
								receive: this.spy(function (message) {
									assert.same('hello', message);
								})
							}
						},
						altReceive: {
							literal: this.spy(function (message) {
								assert.same('hello', message);
							})
						},
						bus: {
							channels: {
								pubsubChannel: 'world'
							},
							subscribe: {
								world: ['component.receive', 'altReceive']
							}
						},
						plugins: [{ module: 'msgs/wire' }]
					};
					return wire(spec, { require: require }).then(function (spec) {
						spec.bus.send('world', 'hello');
						assert.called(spec.component.receive);
						assert.called(spec.altReceive);
					}).then(undef, fail);
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
