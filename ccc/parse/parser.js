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
 * A function which is used by the Parser to accumulate generated objects.
 *
 * @typedef {function(!ccc.base.Object, !ccc.base.Object)}
 * @private
 */
var ObjectBuilder_;



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

  /**
   * The builder stack. The current builder is pushed into this stack when a
   * new builder is introduced.
   * @private {!Array.<!ObjectBuilder_>}
   */
  this.builderStack_ = [];

  /**
   * The current builder. If this is {@code null}, Objects are emitted as soon
   * as they're generated.
   * @private {ObjectBuilder_}
   */
  this.builder_ = null;

  /**
   * The innermost Object currently being built, if any.
   * @private {ccc.base.Object}
   */
  this.accumulator_ = null;
};


/** @override */
ccc.parse.Parser.prototype.readObject = function() {
  return this.tokenReader_.readToken().then(function(token) {
    var result = this.processToken_(token);
    if (goog.isDef(result)) {
      return result;
    }
    return this.readObject();
  }, null, this);
};


/**
 * Processes a single token. Returns a new {@code ccc.base.Object} if a complete
 * top-level object is parsed, {@code null} if the token stream is terminated,
 * and {@code undefined} otherwise.
 *
 * @param {ccc.parse.Token} token
 * @return {ccc.base.Object|undefined}
 */
ccc.parse.Parser.prototype.processToken_ = function(token) {
  var T = ccc.parse.TokenType;

  if (goog.isNull(token)) {
    if (!goog.isNull(this.builder_))
      throw new Error('Unexpected end of input.');
    return null;
  }

  var production = null;
  switch (token.type) {
    case T.TRUE:
      production = ccc.base.T;
      break;
    case T.FALSE:
      production = ccc.base.F;
      break;
    case T.UNSPECIFIED:
      production = ccc.base.UNSPECIFIED;
      break;
    case T.SYMBOL:
    case T.CHAR_LITERAL:
    case T.STRING_LITERAL:
    case T.NUMERIC_LITERAL:
    case T.OPEN_LIST:
    case T.OPEN_VECTOR:
    case T.CLOSE_FORM:
    case T.DOT:
    case T.OMIT_DATUM:
    case T.QUOTE:
    case T.UNQUOTE:
    case T.UNQUOTE_SPLICING:
    case T.QUASIQUOTE:
      throw new Error('NOT IMPLEMENTED.');
    default:
      throw new Error('Invalid token: ' + token.text);
  }

  if (goog.isNull(production)) {
    return;
  }

  if (goog.isNull(this.builder_)) {
    return production;
  }

  this.accumulator_ = this.builder_(this.accumulator_, production);
};
