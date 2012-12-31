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

(function (buster) {
	'use strict';

	var assert, refute;

	assert = buster.assert;
	refute = buster.refute;

	buster.assertions.add('frozen', {
		assert: function (actual) {
			return actual instanceof Object && Object.isFrozen ? Object.isFrozen(actual) : true;
		},
		refute: function (actual) {
			return actual instanceof Object && Object.isFrozen ? !Object.isFrozen(actual) : true;
		},
		assertMessage: 'Expected ${0} to be frozen',
		refuteMessage: 'Expected ${0} to not be frozen'
	});

	buster.assertions.add('empty', {
		assert: function (actual) {
			return 'length' in actual && actual.length === 0;
		},
		assertMessage: 'Expected ${0} to be empty',
		refuteMessage: 'Expected ${0} to not be empty'
	});

}(
	this.buster || require('buster')
));
