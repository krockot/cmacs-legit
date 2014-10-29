// The Cmacs Project.

goog.provide('ccc.core');

goog.require('ccc.Char');
goog.require('ccc.Environment');
goog.require('ccc.Error');
goog.require('ccc.Location');
goog.require('ccc.NativeProcedure');
goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.Pair');
goog.require('ccc.Procedure');
goog.require('ccc.Thread');
goog.require('ccc.Transformer');
goog.require('ccc.Unspecified');
goog.require('ccc.Vector');
goog.require('ccc.core.types');



/**
 * An element of program data. This can be anytihng other than {@code undefined}
 * or {@code null}. Instances of {@code ccc.Object} and its derivatives are
 * often treated specially by functions which deal with {@code ccc.Data}.
 *
 * @typedef {(string|symbol|number|boolean|!Object)}
 * @public
 */
ccc.Data;



/**
 * A Thunk is a closure that returns another closure. This may be used to
 * implement arbitrarily long (and indeed infinitely long) chains of abstract
 * operations in sequence, and is the basis for the continuation-passing
 * execution model throughout ccc core.
 *
 * @typedef {function():ccc.Thunk}
 */
ccc.Thunk;



/**
 * A Continuation is any function which takes a single {@code ccc.Data} returns
 * a {@code ccc.Thunk}.
 *
 * @typedef {function(ccc.Data):ccc.Thunk}
 * @public
 */
ccc.Continuation;



/**
 * Returns a new {@code ccc.ThreadEntryPoint} which can be used to construct
 * a new {@code ccc.Thread}. The thread, when run, will evaluate {@code data}
 * within {@code environment}.
 *
 * @param {ccc.Data} data The data to evaluate.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform evaluation.
 * @return {ccc.ThreadEntryPoint}
 */
ccc.eval = function(data, environment) {
  return function(continuation) {
    if (ccc.isObject(data))
      return data.eval(environment, continuation);
    if (ccc.isSymbol(data)) {
      var name = Symbol.keyFor(/** @type {symbol} */ (data));
      var value = environment.get(name);
      if (goog.isNull(value))
        return continuation(new ccc.Error('Unbound symbol |' + name + '|'));
      return continuation(value);
    }
    // Default to self-evaluation for everything else.
    return continuation(data);
  };
};
