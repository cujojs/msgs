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
	 * Aggregate messages by correlationId and sequenceNumber
	 *
	 * @author Scott Andrews
	 */
	define(function (require) {

		var integration = require('../integration');

		function sequenceNumberComparator(a, b) {
			return a.headers.sequenceNumber - b.headers.sequenceNumber;
		}

		/**
		 * Aggregates messages that were previously split by a splitter. Once
		 * all of the messages from the splitter are received a new message is
		 * created whose payload is an array of the split messages in order.
		 *
		 * @param {string} [name] the name to register the aggregator as
		 * @param {string|Channel} [opts.output] the channel to post the
		 *   aggregated messages to
		 * @param {string|Channel} [opts.input] the channel to receive message
		 *   from
		 * @param {string|Channel} [opts.error] channel to receive errors
		 * @returns the aggregator
		 */
		integration.prototype.correlatingAggregator = function correlatingAggregator(name, opts) {
			var buckets;

			// optionalName won't work since output channel may be a string
			if (arguments.length < 2) {
				opts = name;
				name = '';
			}

			buckets = {};

			return this.aggregator(name, function (message, release) {
				var correlationId, bucket;
				correlationId = message.headers.correlationId;
				if (!correlationId) {
					return;
				}
				bucket = buckets[correlationId] = buckets[correlationId] || [];
				bucket.push(message);
				if (bucket.length >= message.headers.sequenceSize) {
					bucket.sort(sequenceNumberComparator);
					release(bucket);
					delete buckets[correlationId];
				}
			}, opts);
		};

		return integration;

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
