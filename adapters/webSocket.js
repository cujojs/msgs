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
	 * Adapters for web socket clients.
	 *
	 * Implemented to the W3C WebSocket API
	 * http://www.w3.org/TR/websockets/#the-websocket-interface
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration = require('../integration');

		/**
		 * Post messages from this socket to this channel
		 *
		 * @param {WebSocket} socket the socket to receive data from
		 * @param {string|Channel} opts.output the channel to send data to
		 */
		integration.prototype.inboundWebSocketAdapter = function inboundWebSocketAdapter(socket, opts) {
			socket.addEventListener('message', this.inboundAdapter(opts.output, function (message) {
				return message.data;
			}));
		};

		/**
		 * Create a handler that writes message payloads to the socket
		 *
		 * @param {string} name name to register the adapter as
		 * @param {WebSocket} socket the web socket to write to
		 * @param {string|Channel} [opts.input] channel to send messages for
		 * @returns {Handler} the handler for this adapter
		 */
		integration.prototype.outboundWebSocketAdapter = integration.utils.optionalName(function outboundWebSocketAdapter(name, socket, opts) {
			var handler;

			handler = this.outboundAdapter(name, socket.send.bind(socket), opts);

			socket.addEventListener('close', function () {
				this.unsubscribe(opts.input, handler);
			}.bind(this));

			return handler;
		});

		/**
		 * Bridges integration channels and web sockets. New connections must
		 * have their bridge reestablished as the WebSocket object is not
		 * reused. Any exceptions are put on the error channel.
		 *
		 * @param {WebSocket} socket the web socket
		 * @param {string|Channel} [opts.input] channel for outbound messages
		 * @param {string|Channel} [opts.output] channel for inbound messages
		 * @param {string|Channel} [opts.error] channel for thrown exceptions
		 *   or socket errors
		 */
		integration.prototype.webSocketGateway = function webSocketGateway(socket, opts) {
			if (opts.output) {
				this.inboundWebSocketAdapter(socket, opts);
			}
			if (opts.input) {
				this.outboundWebSocketAdapter(socket, opts);
			}
			if (opts.error) {
				socket.addEventListener('error',  this.inboundAdapter(opts.error));
			}
		};

		return integration;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
