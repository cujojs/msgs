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
	 * Queue channel. Messages are stored until retrieved.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration, pollableDispatcher;

		integration = require('../integration');
		pollableDispatcher = require('./dispatchers/pollable');

		/**
		 * Receive the next message on a queue
		 *
		 * @param {String|Channel} target the channel to receive the message
		 *   from
		 * @returns {Object} the message payload or undefined if no message is
		 *   available
		 */
		integration.prototype.receive = function receive(target) {
			var message = this.resolveChannel(target).receive();
			// TODO should we return the message instead of the payload?
			return message ? message.payload : undef;
		};

		/**
		 * Create a message queue. Messages are queued and retrieved
		 * individually.
		 *
		 * @param {String} [name] the name to register this channel under
		 * @param {Queue} [queueStrategy] the queuing strategy for this
		 *   channel. The queue must support 'push' and 'shift' for adding and
		 *   removing messages from the queue respectively. Queues may or may
		 *   not be durable. The default queue is a basic Array.
		 */
		integration.prototype.queueChannel = integration.utils.optionalName(function queueChannel(name, queueStrategy) {
			return this._channel(name, pollableDispatcher(queueStrategy));
		});

		return integration;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
