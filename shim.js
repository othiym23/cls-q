'use strict';

var shimmer = require('shimmer');

module.exports = function patchQ(ns) {
  if (typeof ns.bind !== 'function') {
    throw new TypeError("must include namespace to patch Q against");
  }

  var Q = require('q');
  var proto = Q && Q.makePromise && Q.makePromise.prototype;
  shimmer.wrap(proto, 'then', function (then) {
    return function nsThen(fulfilled, rejected, progressed) {
      if (typeof fulfilled === 'function') fulfilled = ns.bind(fulfilled);
      if (typeof rejected === 'function') rejected = ns.bind(rejected);
      if (typeof progressed === 'function') progressed = ns.bind(progressed);
      return then.call(this, fulfilled, rejected, progressed);
    };
  });

  shimmer.wrap(proto, 'fin', function (fin) {
     return function nsFin(callback) {
       if (typeof callback === 'function') {
           callback = ns.bind(callback);
       }
       return fin.call(this, callback);
     };
  });

  shimmer.wrap(proto, 'tap', function (tap) {
    return function nsFin(callback) {
        if (typeof callback === 'function') {
            callback = ns.bind(callback);
        }
        return tap.call(this, callback);
    };
  });
};
