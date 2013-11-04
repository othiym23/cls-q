### patch Q to work better with continuation-local storage

Certain kinds of asynchronous operations don't play nicely with Q and
continuation-local storage. This shim was put together to make CLS and Q
work better with [`node-redis`](https://github.com/mranney/node_redis);
there may be other modules that are doing funky things with asynchronous
execution that require it. All it does is bind callbacks passed to
`promise.then` so that the active CLS contexts at the time `then()` was
called are correctly set.

It only binds to one namespace at a time:

```js
var cls = require('continuation-local-storage');
var ns = cls.createNamespace('NODESPACE');

var Q = require('q');

// load shim
var patchQ = require('cls-q');
patchQ(ns);
```

You can bind to more than one, but the overhead of doing so will start
to add up quickly.

### tests

The tests assume a Redis server is up and running on localhost on the
standard port. Work is underway to find a test case that doesn't require
any external dependencies.
