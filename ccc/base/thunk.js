// The Cmacs Project.

goog.provide('ccc.Thunk');



/**
 * A Thunk is a closure that returns another closure. This may be used to
 * implement arbitrarily long (and indeed infinitely long) chains of abstract
 * operations in sequence, and is the basis for the continuation-passing
 * asynchronous execution model throughout ccc core.
 *
 * @typedef {function():ccc.Thunk}
 */
ccc.Thunk;
