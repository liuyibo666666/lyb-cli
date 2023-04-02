'use strict';

const build = require('..');
const assert = require('assert').strict;

assert.strictEqual(build(), 'Hello from build');
console.info('build tests passed');
