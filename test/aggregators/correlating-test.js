/*
 * Copyright (c) 2012-2013 VMware, Inc. All Rights Reserved.
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

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	define('integration/aggregators/correlating-test', function (require) {

		var integration, bus;

		integration = require('integration/aggregators/correlating');

		buster.testCase('integration/aggregators/correlating', {
			setUp: function () {
				bus = integration.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should aggregate split messages': function () {
				var upperCaseVowels, out;

				upperCaseVowels = this.spy(function (character) {
					return (/^[aeiou]$/).test(character) ?
						character.toUpperCase() :
						character;
				});
				out = this.spy(function (message) {
					assert.same('AbcdEfghIjklmnOpqrstUvwxyz', message);
				});

				bus.channel('in');
				bus.splitter(function (message) {
					return message.payload.split('');
				}, { output: 'letters', input: 'in' });
				bus.channel('letters');
				bus.transform(function (message) {
					return upperCaseVowels(message);
				}, { output: 'vowled', input: 'letters' });
				bus.channel('vowled');
				bus.correlatingAggregator({ output: 'merge', input: 'vowled' });
				bus.channel('merge');
				bus.transform(function (message) {
					var str = '';
					message.forEach(function (message) {
						str += message.payload;
					}, this);
					return str;
				}, { output: 'out', input: 'merge' });
				bus.channel('out');
				bus.outboundAdapter(out, { input: 'out' });

				bus.send('in', 'abcdefghijklmnopqrstuvwxyz');

				assert.same(26, upperCaseVowels.callCount);
				assert.same(1, out.callCount);
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
