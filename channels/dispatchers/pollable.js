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
	 * Pollable dispatcher
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		/**
		 * Store messages to be consumed later
		 *
		 * @param {Queue} queue the queuing strategy for this dispatcher. The
		 *   queue must support 'push' and 'shift' for adding and removing
		 *   message from the queue respectively. Queues may or may not be
		 *   durable. The default queue is an Array.
		 */
		function pollableDispatcher(queue) {
			var dispatcher = {};

			queue = queue || [];

			/**
			 * @returns {Message} the next message, may return undefined if no
			 * messages are available
			 */
			function receive() {
				return queue.shift();
			}

			/**
			 * Enqueue a message to be consumed later
			 *
			 * @param {Message} message the message to queue
			 * @param {Function} handlerResolver handler resolver
			 * @returns {Boolean} true if enqueueing is successful
			 */
			dispatcher.dispatch = function dispatch(message, handlerResolver) {
				try {
					return !!queue.push(message);
				}
				catch (e) {
					return false;
				}
			};

			dispatcher.channelMixins = {
				receive: receive
			};

			return dispatcher;
		}

		return pollableDispatcher;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
