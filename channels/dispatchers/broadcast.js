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
	 * Broadcast dispatcher. All subscribers receive each message.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var subscribableDispatcher = require('./_subscribable');

		/**
		 * Dispatch messages to all subscribed handlers
		 */
		function broadcastDispatcher() {
			var dispatcher, getHandlers;

			dispatcher = subscribableDispatcher();
			getHandlers = dispatcher._handlers;
			delete dispatcher._handlers;

			/**
			 * Send a message to all subscribed handlers.
			 *
			 * @param {Message} message message to send
			 * @param {Function} handlerResolver handler resolver
			 * @throws exceptions from recipient handlers
			 * @returns
			 */
			dispatcher.dispatch = function dispatch(message, handlerResolver) {
				var errors, handlers;

				errors = [];
				handlers = getHandlers();

				if (handlers.length === 0) {
					return false;
				}

				handlers.forEach(function (handler) {
					try {
						handlerResolver(handler).handle(message);
					}
					catch (e) {
						errors.push(e);
					}
				}, this);

				if (errors.length !== 0) {
					throw errors;
				}

				return true;
			};

			return dispatcher;
		}

		return broadcastDispatcher;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
