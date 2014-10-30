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
 * Returns a new {@code ccc.ThreadEntryPoint} at the start of the expansion
 * process for an input {@ccc.Data}.
 *
 * @param {ccc.Data} data The data to expand.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform the expansion.
 * @return {ccc.ThreadEntryPoint}
 */
ccc.expand = function(data, environment) {
  return function(continuation) {
    if (ccc.isObject(data))
      return data.expand(environment, continuation);
    return continuation(data);
  };
};


/**
 * Returns a new {@code ccc.ThreadEntryPoint} at the start of the compilation
 * process for an input {@ccc.Data}. The data should already be fully expanded.
 *
 * @param {ccc.Data} data The data to compile.
 * @param {!ccc.Environment} environment The environment in which to perform
 *     the compilation.
 * @return {ccc.ThreadEntryPoint}
 */
ccc.compile = function(data, environment) {
  return function(continuation) {
    if (ccc.isObject(data))
      return data.compile(environment);
    return continuation(data);
  };
};


/**
 * Returns a new {@code ccc.ThreadEntryPoint} at the start of the evaluation
 * process for an input {@ccc.Data}. The data should already be expanded and
 * compiled.
 *
 * @param {ccc.Data} data The data to evaluate.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform the evaluation.
 * @return {ccc.ThreadEntryPoint}
 */
ccc.eval = function(data, environment) {
  return function(continuation) {
    if (ccc.isObject(data))
      return data.eval(environment, continuation);
    // TODO(krockot): Remove this hack. Symbols should be compiled out.
    if (ccc.isSymbol(data)) {
      var name = Symbol.keyFor(/** @type {symbol} */ (data));
      var value = environment.get(name);
      if (goog.isNull(value))
        return continuation(new ccc.Error('Unbound symbol |' + name + '|'));
      return continuation(value);
    }
    return continuation(data);
  };
};
