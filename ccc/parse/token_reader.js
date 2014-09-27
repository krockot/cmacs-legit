// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.TokenReader');

goog.require('ccc.parse.Token');



/**
 * Token reader interface.
 *
 * {@code TokenReader} consumers should call {@code readToken} when they
 * want a new Token from the underlying stream. If no more Tokens are
 * available, {@code readToken} returns {@code null}.
 *
 * @interface
 * @public
 */
ccc.parse.TokenReader = function() {};


/**
 * @type {function():ccc.parse.Token}
 * @public
 */
ccc.parse.TokenReader.prototype.readToken;
