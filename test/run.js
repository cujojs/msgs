/*
 * Copyright 2012 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, require) {
	'use strict';

	require(['curl/_privileged', 'domReady!'], function (curl) {

		var modules = Object.keys(curl.cache).filter(function (moduleId) {
			return moduleId.indexOf('-test') > 0;
		});

		require(modules, function () {
			buster.run();
		});

	});

}(
	this.buster,
	this.curl
));
