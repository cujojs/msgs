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

	define('msgs/channels/bridges/stomp-test', function (require) {

		var msgs, sjsc, when, bus, socket, controlBus;

		msgs = require('msgs/channels/bridges/stomp');
		sjsc = require('sockjs-client');
		when = require('when');
		require('msgs/adapters/stream');

		// experimental, may make a first class citizen
		msgs.prototype.next = function next(channel) {
			var d, handler;
			d = when.defer();
			handler = this._handler(undef, function (message) {
				this.unsubscribe(channel, handler);
				d.resolve(message.payload);
			}, this.noopChannel, channel);
			return d.promise;
		};

		buster.testCase('msgs/channels/bridges/stomp-integration', {
			setUp: function (done) {
				bus = msgs.bus();

				socket = sjsc.create('http://localhost:15674/stomp');
				socket.on('connection', function () {
					controlBus = bus.stompStreamBridge('stomp', socket, { login: 'guest', passcode: 'guest' }).controlBus;
					controlBus.on('connected', done);

//					controlBus.logger({ tap: 'toServer', prefix: 'toServer:' });
//					controlBus.logger({ tap: 'fromServer', prefix: 'fromServer:' });
				});
			},
			tearDown: function () {
				socket.close();
				bus.destroy();
			},

			'echo a message via a server': function (done) {
				bus.on('stomp!/topic/greeting', function (message) {
					assert.equals('hello', message);
					done();
				});
				controlBus.on('subscribed!/topic/greeting', function () {
					bus.send('stomp!/topic/greeting', 'hello');
				});
			},
			'topic based subscriptions': function () {
				var spys = {}, subscriptions, received;

				subscriptions = [
					controlBus.next('subscribed!/exchange/amq.topic/greeting.en.us'),
					controlBus.next('subscribed!/exchange/amq.topic/greeting.en.gb'),
					controlBus.next('subscribed!/exchange/amq.topic/greeting.en.#'),
					controlBus.next('subscribed!/exchange/amq.topic/greeting.es.#'),
					controlBus.next('subscribed!/exchange/amq.topic/greeting.#')
				];
				received = [
					bus.next('stomp!/exchange/amq.topic/greeting.en.us'),
					bus.next('stomp!/exchange/amq.topic/greeting.en.gb'),
					bus.next('stomp!/exchange/amq.topic/greeting.en.#'),
					bus.next('stomp!/exchange/amq.topic/greeting.es.#'),
					bus.next('stomp!/exchange/amq.topic/greeting.#')
				];

				bus.on('stomp!/exchange/amq.topic/greeting.en.us', spys.us = this.spy());
				bus.on('stomp!/exchange/amq.topic/greeting.en.gb', spys.gb = this.spy());
				bus.on('stomp!/exchange/amq.topic/greeting.en.#', spys.en = this.spy());
				bus.on('stomp!/exchange/amq.topic/greeting.es.#', spys.es = this.spy());
				bus.on('stomp!/exchange/amq.topic/greeting.#', spys.all = this.spy());

				return when.all(subscriptions).then(function () {
					bus.send('stomp!/exchange/amq.topic/greeting.en.us', 'hey');
					bus.send('stomp!/exchange/amq.topic/greeting.en.gb', 'hello');
					bus.send('stomp!/exchange/amq.topic/greeting.es', 'hola');

					return when.all(received).then(function () {
						assert.calledOnce(spys.us);
						assert.calledWith(spys.us, 'hey');

						assert.calledOnce(spys.gb);
						assert.calledWith(spys.gb, 'hello');

						assert.calledOnce(spys.es);
						assert.calledWith(spys.es, 'hola');

						assert.calledTwice(spys.en);
						assert.calledWith(spys.en, 'hey');
						assert.calledWith(spys.en, 'hello');

						assert.calledThrice(spys.all);
						assert.calledWith(spys.all, 'hey');
						assert.calledWith(spys.all, 'hello');
						assert.calledWith(spys.all, 'hola');
					});
				});
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
