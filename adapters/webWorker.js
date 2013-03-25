/*
 * Copyright 2012 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
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

		var msgs = require('..');

		/**
		 * Post messages from this work to this channel
		 *
		 * @param {MessagePort} port the worker message port to receive
		 *   messages from
		 * @param {string|Channel} opts.output the channel to send messages to
		 */
		msgs.prototype.inboundWebWorkerAdapter = function inboundWebWorkerAdapter(port, opts) {
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
		msgs.prototype.outboundWebWorkerAdapter = msgs.utils.optionalName(function outboundWebWorkerAdapter(name, port, opts) {
			return this.outboundAdapter(name, port.postMessage, opts);
		});

		/**
		 * Bridges channels and web workers. Any exceptions are put on the error
		 * channel.
		 *
		 * @param {MessagePort} port the web worker message port
		 * @param {string|Channel} [opts.input] channel for outbound messages
		 * @param {string|Channel} [opts.output] channel for inbound messages
		 * @param {string|Channel} [opts.error] channel for thrown exceptions
		 *   or worker errors
		 */
		msgs.prototype.webWorkerGateway = function webWorkerGateway(port, opts) {
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

		return msgs;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
