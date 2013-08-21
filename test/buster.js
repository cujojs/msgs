/*
 * Copyright 2012-2013 the original author or authors
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
		'test/buster-assertions.js',
		'test/buster-sinon.js'
	]
};

config['msgs:integration'] = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/**/*-test-integration.js'
	],
	testHelpers: [
		'test/buster-assertions.js',
		'test/buster-sinon.js'
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
		'test/**/*.js',
		'node_modules/curl/**/*.js',
		'node_modules/poly/**/*.js',
		'node_modules/when/**/*.js',
		'node_modules/wire/**/*.js'
	],
	libs: [
		'test/curl-config.js',
		'node_modules/curl/src/curl.js'
	],
	sources: [
		// loaded as resources
	],
	tests: [
		'test/**/*-test-browser.js',
		'test/**/*-test.js',
		'test/run.js'
	],
	testHelpers: [
		'test/buster-assertions.js',
		'test/buster-sinon.js'
	]
};
