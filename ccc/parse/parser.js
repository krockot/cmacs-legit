// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Parser');

goog.require('ccc.base.NIL');
goog.require('ccc.base.Object');
goog.require('ccc.parse.ObjectReader');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenReader');
goog.require('ccc.parse.TokenType');



/**
 * The result of a single transition step.
 *
 * @typedef {{
 *   object: (!ccc.base.Object|undefined),
 *   state: (!Transition_|undefined)
 * }}
 * @private
 */
var TransitionResult_;



/**
 * A state transition function.
 *
 * @typedef {function(!ccc.parse.Token):!TransitionResult_}
 * @private
 */
var Transition_;



/**
 * Parser for ccc code. This reads tokens from a {@code ccc.parse.TokenReader}
 * and supplies top-level forms ({@code ccc.base.Object} instances) via its
 * {@code ccc.parse.ObjectReader} interface.
 *
 * @param {!ccc.parse.TokenReader} tokenReader Food supply for the Parser.
 * @constructor
 * @implements {ccc.parse.ObjectReader}
 * @public
 */
ccc.parse.Parser = function(tokenReader) {
  /** @private {!ccc.parse.TokenReader} */
  this.tokenReader_ = tokenReader;

  /** @private {!ccc.parse.ParserState} */
  this.state_ = START_STATE_;
};


/** @override */
ccc.parse.Parser.prototype.readObject = function() {
  return this.tokenReader_.readToken().then(function(token) {
    var result = this.state_(token);
    if (goog.isDef(result.object)) {
      this.state_ = START_STATE_;
      return result.object;
    }
    goog.asserts.assert(goog.isDef(result.state), 'Invalid state transition.');
    this.state_ = result.state;
    return this.readObject();
  }, null, this);
};


/**
 * The parsing state machine.
 *
 * @private {!Transition_}
 * @const
 */
var START_STATE_ = (function() {
  /**
   * @param {!ccc.parseToken} token
   * @return {!TransitionResult_}
   */
  return function(token) {
    if (goog.isNull(token))
      return { object: null };
    return { object: ccc.base.NIL };
  };
}());
