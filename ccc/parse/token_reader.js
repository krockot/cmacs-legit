// The Cmacs Project.

goog.provide('ccc.parse.TokenReader');

goog.require('ccc.parse.Token');
goog.require('goog.Promise');



/**
 * Asynchronous token reader interface.
 *
 * {@code TokenReader} consumers should call {@code readToken} when they
 * want a new Token from the underlying stream. If no more Tokens are
 * available, the promise {@code readToken} returns will resolve to
 * {@code null}.
 *
 * @interface
 * @public
 */
ccc.parse.TokenReader = function() {};


/**
 * @type {function():!goog.Promise.<ccc.parse.Token>}
 * @public
 */
ccc.parse.TokenReader.prototype.readToken;
