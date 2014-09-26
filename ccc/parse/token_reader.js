// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.TokenReader');

goog.require('ccc.parse.Token');



/**
 * Generic token reader interface.
 *
 * @interface
 */
ccc.parse.TokenReader = function() {};


/**
 * Attempts to fetch the next available token from the input. Returns
 * {@code null} if there are no tokens left in the stream.
 *
 * @type {function():ccc.parse.Token}
 * @public
 */
ccc.parse.TokenReader.prototype.readToken;
