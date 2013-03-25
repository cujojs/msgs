/*
 * Copyright 2012 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

var config;

config = exports;

config['msgs:node'] = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/**/*-test-node.js',
		'test/**/*-test.js'
	],
	testHelpers: [
		'test/buster-assertions.js'
	]
};

config['msgs:browser'] = {
	environment: 'browser',
	autoRun: false,
	rootPath: '../',
	resources: [
		// '**', // ** is busted in buster
		'*.js',
		'adapters/**/*.js',
		'aggregators/**/*.js',
		'channels/**/*.js',
		'node_modules/curl/**/*.js',
		'node_modules/poly/**/*.js',
		'node_modules/when/**/*.js'
	],
	libs: [
		'test/curl-config.js',
		'node_modules/curl/src/curl.js'
	],
	sources: [
		// loaded as resources
	],
	tests: [
		//'test/**/*-test-browser.js',
		'test/**/*-test.js',
		'test/run.js'
	],
	testHelpers: [
		'test/buster-assertions.js'
	]
};
