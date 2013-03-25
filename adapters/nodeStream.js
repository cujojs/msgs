/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (define) {
	'use strict';

	/**
	 * Adapters for Node.js style streams.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var msgs = require('..');

		/**
		 * Post messages from this connection to this channel
		 *
		 * @param {Connection} connection the connection to receive data from
		 * @param {string|Channel} opts.output the channel to send data to
		 */
		msgs.prototype.inboundNodeStreamAdapter = function inboundNodeStreamAdapter(connection, opts) {
			connection.on('data', this.inboundAdapter(opts.output));
		};

		/**
		 * Create a handler that writes message payloads to the connection
		 *
		 * @param {string} name name to register the adapter as
		 * @param {Connection} connection the node stream connection to write
		 *   to
		 * @param {string|Channel} [opts.input] the channel to send messages
		 *   for
		 * @returns {Handler} the handler for this adapter
		 */
		msgs.prototype.outboundNodeStreamAdapter = msgs.utils.optionalName(function outboundNodeStreamAdapter(name, connection, opts) {
			var handler;

			handler = this.outboundAdapter(name, connection.write.bind(connection), opts);

			connection.on('close', function () {
				this.unsubscribe(opts.input, handler);
			}.bind(this));

			return handler;
		});

		/**
		 * Bridges channels and connections from a node server. New connections this
		 * server makes are adapted to the input and output channels. Any exceptions
		 * are put on the error channel.
		 *
		 * @param {Connection} connection the node stream connection
		 * @param {string|Channel} [opts.output] channel for inbound messages
		 * @param {string|Channel} [opts.input] channel for outbound messages
		 * @param {string|Channel} [opts.error] channel for thrown exceptions
		 */
		msgs.prototype.nodeStreamGateway = function nodeStreamGateway(connection, opts) {
			if (opts.output) {
				this.inboundNodeStreamAdapter(connection, opts);
			}
			if (opts.input) {
				this.outboundNodeStreamAdapter(connection, opts);
			}
			if (opts.error) {
				connection.on('error', this.inboundAdapter(opts.error));
			}
		};

		return msgs;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
