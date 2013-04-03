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
			{ name: 'when', location: 'node_modules/when', main: 'when' },
			{ name: 'wire', location: 'node_modules/wire', main: 'wire' },
			{ name: 'meld', location: 'node_modules/wire/node_modules/meld', main: 'meld' }
		],
		preloads: ['poly']
	};

}(this));
