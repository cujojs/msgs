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
	'use strict';

	/**
	 * Adapters for web workers.
	 *
	 * Implemented to the W3C Worker, MessagePort APIs
	 * http://www.w3.org/TR/workers/#dedicated-workers-and-the-worker-interface
	 * http://www.w3.org/TR/webmessaging/#message-ports
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration = require('../integration');

		/**
		 * Post messages from this work to this channel
		 *
		 * @param {MessagePort} port the worker message port to receive
		 *   messages from
		 * @param {string|Channel} opts.output the channel to send messages to
		 */
		integration.prototype.inboundWebWorkerAdapter = function inboundWebWorkerAdapter(port, opts) {
			port.addEventListener('message', this.inboundAdapter(opts.output, function (event) {
				return event.data;
			}));
		};

		/**
		 * Create a handler that posts messages to a web worker
		 *
		 * @param {string} name name to register the adapter as
		 * @param {MessagePort} port the web worker message port to post to
		 * @param {string|Channel} [opts.input] channel to send messages for
		 * @returns {Handler} the handler for this adapter
		 */
		integration.prototype.outboundWebWorkerAdapter = integration.utils.optionalName(function outboundWebWorkerAdapter(name, port, opts) {
			return this.outboundAdapter(name, port.postMessage, opts);
		});

		/**
		 * Bridges integration channels and web workers. Any exceptions are put
		 * on the error channel.
		 *
		 * @param {MessagePort} port the web worker message port
		 * @param {string|Channel} [opts.input] channel for outbound messages
		 * @param {string|Channel} [opts.output] channel for inbound messages
		 * @param {string|Channel} [opts.error] channel for thrown exceptions
		 *   or worker errors
		 */
		integration.prototype.webWorkerGateway = function webWorkerGateway(port, opts) {
			if (opts.output) {
				this.inboundWebWorkerAdapter(port, opts);
			}
			if (opts.input) {
				this.outboundWebWorkerAdapter(port, opts);
			}
			if (opts.error) {
				port.addEventListener('error', this.inboundAdapter(opts.error));
			}
		};

		return integration;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
