// The Cmacs Project.

goog.provide('ccc.Continuation');

goog.require('ccc.Data');



/**
 * A Continuation is any function which takes a single {@code ccc.Data} returns
 * a {@code ccc.Thunk}.
 *
 * @typedef {function(ccc.Data):ccc.Thunk}
 * @public
 */
ccc.Continuation;
