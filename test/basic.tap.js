'use strict';

var test = require('tap').test;

test("promises + CLS without shim = failure", function (t) {
  t.plan(4);

  var cls = require('continuation-local-storage');
  var ns = cls.createNamespace('test1');

  var Q = require('q');

  var redis = require('redis');
  var client = redis.createClient();

  function fetch(key) {
    t.equal(ns.get('id'), key, "cls ID matches what was passed");

    return Q.ninvoke(client, 'get', key).then(
      function (data) {
        var parsed = JSON.parse(data);
        t.equal(parsed.id, key, "retrieved correct value");
        t.notOk(ns.get('id'), "inner context value isn't available");

        if (parsed) {
          return Q.resolve(parsed);
        } else {
          return Q.reject();
        }
      },
      function (error) {
        return Q.reject(error);
      }
    );
  }

  function test() {
    ns.run(function () {
      ns.set('id', 1);
      fetch(ns.get('id')).then(function () {
        t.notOk(ns.get('id'), "inner context value is lost in resolved");
        client.end();
      }).fail(function (error) {
        t.notOk(ns.get('id'), "inner context value is lost in failed");
        t.fail(error);
      });
    });
  }

  ns.run(function () {
    var saved = Q.defer();
    var data = JSON.stringify({id : 1});
    client.set(1, data, saved.resolve.bind(saved));

    Q.when(saved).then(test);
  });
});

test("promises + CLS with shim = success", function (t) {
  t.plan(4);

  var cls = require('continuation-local-storage');
  var ns = cls.createNamespace('test2');

  var Q = require('q');

  // load shim
  var patchQ = require('../shim.js');
  patchQ(ns);

  var redis = require('redis');
  var client = redis.createClient();

  function fetch(key) {
    t.equal(ns.get('id'), key, "cls ID matches what was passed");

    return Q.ninvoke(client, 'get', key).then(function (data) {
      var parsed = JSON.parse(data);
      t.equal(parsed.id, key, "retrieved correct value");
      t.equal(ns.get('id'), parsed.id, "correct inner context value in ninvoke");

      if (parsed) {
        return Q.resolve(parsed);
      } else {
        return Q.reject();
      }
    },
    function (error) {
      t.ok(error, "fetch error");
      return Q.reject(error);
    }
    );
  }

  function test() {
    ns.run(function () {
      ns.set('id', 1);
      fetch(ns.get('id')).then(function (data) {
        t.equal(ns.get('id'), data.id, "correct inner context value in resolved");
        client.end();
      }).fail(function (error) {
        t.equal(ns.get('id'), 1, "correct inner context value in failed");
        t.fail(error);
      });
    });
  }

  ns.run(function () {
    var saved = Q.defer();
    var data = JSON.stringify({id : 1});
    client.set(1, data, saved.resolve.bind(saved));

    Q.when(saved).then(test);
  });
});
