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
	 * Unicast dispatcher. A single subscriber receives each message. Includes
	 * common load balancer strategies.
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var subscribableDispatcher = require('./_subscribable');

		/**
		 * Dispatch messages to a single subscribed handler selected by the
		 * load balancer
		 *
		 * @param {Function} [loadBalancer=random] load balancer strategy,
		 *   defaults to the random load balancer
		 */
		function unicastDispatcher(loadBalancer) {
			var dispatcher, getHandlers;

			dispatcher = subscribableDispatcher();
			getHandlers = dispatcher._handlers;
			delete dispatcher._handlers;

			// deafult to a random load balancer
			loadBalancer = loadBalancer || unicastDispatcher.loadBalancers.random();

			/**
			 * Send a message to a single handler.
			 *
			 * @param {Message} message the message
			 * @param {Function} handlerResolver handler resolver
			 * @throws exceptions from recipient handler
			 * @returns {boolean} true if the message was received
			 */
			dispatcher.dispatch = function dispatch(message, handlerResolver) {
				var handlers, handler;

				handlers = getHandlers();
				if (handlers.length === 0) {
					return false;
				}

				handler = loadBalancer(handlers);
				handlerResolver(handler).handle(message);

				return true;
			};

			return dispatcher;
		}

		unicastDispatcher.loadBalancers = {
			random: function () {
				return function (handlers) {
					var i = Math.floor(Math.random() * handlers.length);
					return handlers[i];
				};
			},
			roundRobin: function () {
				var last;
				return function (handlers) {
					var i = (handlers.indexOf(last) + 1) % handlers.length;
					last = handlers[i];
					return last;
				};
			},
			naiveRoundRobin: function () {
				var last;
				return function (handlers) {
					var i = (last + 1) % handlers.length;
					last = i;
					return handlers[i];
				};
			}
		};

		return unicastDispatcher;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
