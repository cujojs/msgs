/*
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
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
	"use strict";

	var undef;

	/**
	 * Adapters for Node.js style streams.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration = require('../integration');

		/**
		 * Post messages from this connection to this channel
		 *
		 * @param {Connection} connection the connection to receive data from
		 * @param {String|Channel} opts.output the channel to send data to
		 */
		integration.prototype.inboundNodeStreamAdapter = function inboundNodeStreamAdapter(connection, opts) {
			connection.on('data', this.inboundAdapter(opts.output));
		};

		/**
		 * Create a handler that writes message payloads to the connection
		 *
		 * @param {String} name name to register the adapter as
		 * @param {Connection} connection the node stream connection to write
		 *   to
		 * @param {String|Channel} [opts.input] the channel to send messages
		 *   for
		 * @returns {Handler} the handler for this adapter
		 */
		integration.prototype.outboundNodeStreamAdapter = integration.utils.optionalName(function outboundNodeStreamAdapter(name, connection, opts) {
			var handler;

			handler = this.outboundAdapter(name, connection.write.bind(connection), opts);

			connection.on('close', function () {
				this.unsubscribe(opts.input, handler);
			}.bind(this));

			return handler;
		});

		/**
		 * Bridges integration channels and connections from a node server. New
		 * connections this server makes are adapted to the input and output
		 * channels. Any exceptions are put on the error channel.
		 *
		 * @param {Connection} connection the node stream connection
		 * @param {String|Channel} [opts.output] channel for inbound messages
		 * @param {String|Channel} [opts.input] channel for outbound messages
		 * @param {String|Channel} [opts.error] channel for thrown exceptions
		 */
		integration.prototype.nodeStreamGateway = function nodeStreamGateway(connection, opts) {
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

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
