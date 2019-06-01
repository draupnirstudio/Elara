import * as FlakeId from 'flake-idgen';

const intformat = require('biguint-format');

const flakeIdGen = new FlakeId({epoch: 1555562015000, worker: 1});

export function generateUserId() {
  return intformat(flakeIdGen.next(), 'hex', {prefix: '0x'}).toString();
}

