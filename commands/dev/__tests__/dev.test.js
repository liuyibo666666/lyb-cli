'use strict';

const dev = require('..');
const assert = require('assert').strict;

assert.strictEqual(dev(), 'Hello from dev');
console.info('dev tests passed');
