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

	var undef;

	/**
	 * Common base for subscribable dispatchers
	 *
	 * @author Scott Andrews
	 */
	define(function (/* require */) {

		/**
		 * Subscribable dispatcher
		 */
		function SubscribableDispatcher() {

			var handlers = [];

			/**
			 * Add a new handler to receive messages sent to this channel
			 *
			 * @param {Handler|string} handler the handler to receive messages
			 */
			this.subscribe = function subscribe(handler) {
				if (handlers.indexOf(handler) >= 0) {
					// already subscribed
					return;
				}
				handlers.push(handler);
			};

			/**
			 * Removes a handler from receiving messages sent to this channel
			 *
			 * @param {Handler|string} handler the handler to stop receiving
			 * messages
			 */
			this.unsubscribe = function unsubscribe(handler) {
				var index = handlers.indexOf(handler);
				if (index >= 0) {
					handlers = handlers.slice(0, index).concat(handlers.slice(index + 1));
				}
			};

			/**
			 * Unsubscribe all handlers
			 */
			this.destroy = function destroy() {
				handlers = undef;
			};

			this.channelMixins = {
				subscribe: this.subscribe,
				unsubscribe: this.unsubscribe,
				destroy: this.destroy
			};

			/**
			 * Obtain a copy of the list of handlers
			 *
			 * @return {Array} the handlers
			 */
			this._handlers = function () {
				return handlers.slice();
			};

		}

		SubscribableDispatcher.prototype = {

			/**
			 * Send a messages to the desired recipients
			 *
			 * @param {Message} message the message to send
			 * @param {Function} handlerResolver handler resolver
			 */
			dispatch: function dispatch(/* message, handlerResolver */) {
				// to be overridden
				return false;
			}

		};

		function subscribableDispatcher() {
			return new SubscribableDispatcher();
		}

		return subscribableDispatcher;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
