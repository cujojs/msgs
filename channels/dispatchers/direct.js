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
	 * Dedicated dispatcher. A single, fixed handler for all messages.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		/**
		 * Dispatch messages to a specific handler
		 *
		 * @param {String|Handler} handler where to forward messages
		 */
		function directDispatcher(handler) {
			var dispatcher = {};

			/**
			 * Send a message to the configured handler
			 *
			 * @param {Message} message message to send
			 * @param {Function} handlerResolver handler resolver
			 * @throws exceptions from recipient channels
			 * @returns
			 */
			dispatcher.dispatch = function dispatch(message, handlerResolver) {
				handlerResolver(handler).handle(message);
				return true;
			};

			return dispatcher;
		}

		return directDispatcher;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
