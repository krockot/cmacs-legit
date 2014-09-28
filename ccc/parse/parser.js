// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Parser');

goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Number');
goog.require('ccc.base.Object');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.Vector');
goog.require('ccc.base.T');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.parse.ObjectReader');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenReader');
goog.require('ccc.parse.TokenType');



/**
 * The structure used to track recursive parser state and build nested objects.
 * One of these is created for each list- or vector- opening token.
 *
 * @param {number} bracketType The opening token's bracket type.
 * @constructor
 * @private
 */
var ObjectBuilder_ = function(bracketType, build) {
  /** @public {number} */
  this.bracketType = bracketType;

  /** @public {!Array.<!ccc.base.Object>} */
  this.elements = [];

  /** @public {!ccc.base.Object} */
  this.tail = ccc.base.NIL;
};


/**
 * Produces a new {@code ccc.base.Object} upon closing the form associated with
 * this builder.
 *
 * @return {!ccc.base.Object}
 */
ObjectBuilder_.prototype.build = function() {
  throw new Error('You are making a mistake.');
};


/**
 * @param {number} bracketType
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var ListBuilder_ = function(bracketType) {
  goog.base(this, bracketType);
};
goog.inherits(ListBuilder_, ObjectBuilder_);


/** @override */
ListBuilder_.prototype.build = function() {
  // TODO(krockot): Add Pair type!
  return ccc.base.NIL;
};


/**
 * @param {number} bracketType
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var VectorBuilder_ = function(bracketType) {
  goog.base(this, bracketType);
};
goog.inherits(VectorBuilder_, ObjectBuilder_);


/** @override */
VectorBuilder_.prototype.build = function() {
  goog.asserts.assert(this.tail === ccc.base.NIL,
      'Invalid vector builder. Y u do dis?');
  return new ccc.base.Vector(this.elements);
};


/**
 * @param {!ObjectBuilder_} targetBuilder
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
TailBuilder_ = function(targetBuilder) {
  // TODO(krockot): Add test for targetBuilder being a ListBuilder.
  goog.base(this, targetBuilder.bracketType);
  this.targetBuilder = targetBuilder;
};


/** @override */
TailBuilder_.prototype.build = function() {
  if (this.elements.length == 0) {
    throw new Error('Missing tail element after dot.');
  }
  if (this.elements.length > 1) {
    throw new Error('Unexpected object: ' + this.elements[1].toString);
  }
  this.targetBuilder.tail = this.elements[0];
  return this.targetBuilder.build();
};


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
      goog.asserts.assert(goog.isDef(token.data.name),
          'Invalid symbol literal.');
      production = new ccc.base.Symbol(token.data.name);
      break;
    case T.CHAR_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid character literal.');
      production = new ccc.base.Char(token.data.value);
      break;
    case T.STRING_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid string literal.');
      production = new ccc.base.String(token.data.value);
      break;
    case T.NUMERIC_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid numeric literal.');
      production = new ccc.base.Number(token.data.value);
      break;
    case T.OPEN_LIST:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid opening bracket token.');
      this.builderStack_.push(this.builder_);
      this.builder_ = new ListBuilder_(token.data.type);
      break;
    case T.OPEN_VECTOR:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid opening bracket token.');
      this.builderStack_.push(this.builder_);
      this.builder_ = new VectorBuilder_(token.data.type);
      break;
    case T.CLOSE_FORM:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid closing bracket token.');
      if (goog.isNull(this.builder_) ||
          this.builder_.bracketType != token.data.type) {
        throw new Error('Unbalanced "' + token.text + '"');
      }
      goog.asserts.assert(this.builderStack_.length > 0);
      production = this.builder_.build();
      this.builder_ = this.builderStack_.pop();
      break;
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

  this.builder_.elements.push(production);
};
