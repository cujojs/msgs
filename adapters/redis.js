/*
 * Copyright (c) 2012-2013 VMware, Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (define) {
	'use strict';

	/**
	 * Adapters for Redis pub/sub messaging.
	 *
	 * Implemented assuming a node-redis client.
	 * https://github.com/mranney/node_redis
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration = require('../integration');

		/**
		 * Post messages from Redis to this channel
		 *
		 * @param {RedisClient} client the Redis client subscribe with
		 * @param {string} topic the remote Redis channel to subscribe to
		 * @param {string|Channel} opts.output channel inbound Redis messages
		 *   are sent to
		 */
		integration.prototype.inboundRedisAdapter = function inboundRedisAdapter(client, topic, opts) {
			client.on('message', this.inboundAdapter(opts.output, function (channel, message) {
				// make sure it's the channel we care about
				if (channel === topic) {
					return message;
				}
			}));
			client.subscribe(topic);
		};

		/**
		 * Create a handler that publishes messages to Redis
		 *
		 * @param {string} name name to register the adapter as
		 * @param {RedisClient} client the Redis client to publish with
		 * @param {string} topic the remote Redis channel to publish to
		 * @param {string|Channel} [opts.input] channel outbound Redis messages
		 *   are sent from
		 * @param {string|Channel} [opts.error] channel exceptions from the
		 *   Redis client are sent to
		 * @returns {Handler} the handler for this adapter
		 */
		integration.prototype.outboundRedisAdapter = integration.utils.optionalName(function outboundRedisAdapter(name, client, topic, opts) {
			var handler;

			handler = this.outboundAdapter(name, function (payload) {
				client.publish(topic, payload);
			}, opts);

			if (opts.error) {
				client.on('error', this.inboundAdapter(opts.error));
			}

			return handler;
		});

		/**
		 * Bridges integration channels and Redis Pub/Sub. Any exceptions are
		 * put on the error channel.
		 *
		 * A client factory must be provided instead of a concrete client as
		 * the same client cannot be used for publishing and subscribing.
		 *
		 * @param {Function} clientFactory function that returns a new Redis
		 *   client
		 * @param {string} topic the remote Redis channel to subscribe to
		 * @param {string|Channel} [opts.input] channel outbound Redis messages
		 *   are sent from
		 * @param {string|Channel} [opts.output] channel inbound Redis messages
		 *   are sent to
		 * @param {string|Channel} [opts.error] channel for thrown exceptions
		 */
		integration.prototype.redisGateway = function redisGateway(clientFactory, topic, opts) {
			if (opts.output) {
				this.inboundRedisAdapter(clientFactory(), topic, opts);
			}
			if (opts.input) {
				this.outboundRedisAdapter(clientFactory(), topic, opts);
			}
		};

		return integration;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
