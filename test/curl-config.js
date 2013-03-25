/*
 * Copyright 2012 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (global) {
	'use strict';

	global.curl = {
		packages: [
			{ name: 'msgs', location: './', main: 'msgs' },
			{ name: 'curl', location: 'node_modules/curl/src/curl', main: 'curl' },
			{ name: 'poly', location: 'node_modules/poly', main: 'poly' },
			{ name: 'when', location: 'node_modules/when', main: 'when' }
		],
		preloads: ['poly']
	};

}(this));
