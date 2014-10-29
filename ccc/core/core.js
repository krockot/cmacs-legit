// The Cmacs Project.

goog.provide('ccc.core');

goog.require('ccc.Char');
goog.require('ccc.Environment');
goog.require('ccc.Error');
goog.require('ccc.Evaluator');
goog.require('ccc.Location');
goog.require('ccc.NativeProcedure');
goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.Pair');
goog.require('ccc.Procedure');
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
 * Begins evaluation of a {@code ccc.Data}, returning a {@code ccc.Thunk} which
 * steps evaluation when called.
 *
 * When evaluation is complete the provided continuation will be called with the
 * result or an error.
 *
 * @param {ccc.Data} data The data to evaluate.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform evaluation.
 * @param {ccc.Continuation} continuation The continuation which should
 *     eventually receive the evaluation result or exception.
 * @return {!ccc.Thunk}
 */
ccc.eval = function(data, environment, continuation) {
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
