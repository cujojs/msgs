/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	define('msgs/aggregators/correlating-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/aggregators/correlating');

		buster.testCase('msgs/aggregators/correlating', {
			setUp: function () {
				bus = msgs.bus();
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
				bus.transformer(function (message) {
					return upperCaseVowels(message);
				}, { output: 'vowled', input: 'letters' });
				bus.channel('vowled');
				bus.correlatingAggregator({ output: 'merge', input: 'vowled' });
				bus.channel('merge');
				bus.transformer(function (message) {
					var str = '';
					message.forEach(function (message) {
						str += message.payload;
					}, this);
					return str;
				}, { output: 'out', input: 'merge' });
				bus.channel('out');
				bus.on('out', out);

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
