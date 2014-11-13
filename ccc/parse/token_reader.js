// The Cmacs Project.

goog.provide('ccc.parse.TokenReader');



/**
 * Token reader interface.
 *
 * @interface
 */
ccc.parse.TokenReader = function() {};


/**
 * Retrieves a token. Returns {@code null} if the end of the token stream has
 * been reached and reading should terminate. Returns {@code undefined} if no
 * tokens are currently available and the consumer should try again later.
 *
 * May also return a {@code ccc.Error} if the input is invalid.
 *
 * @return {?ccc.parse.Token|!ccc.Error|undefined}
 */
ccc.parse.TokenReader.prototype.readToken = function() {};
