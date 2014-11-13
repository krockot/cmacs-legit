// The Cmacs Project.

goog.provide('ccc.parse.Parser');

goog.require('ccc.core');
goog.require('ccc.parse.DataReader');
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
var ObjectBuilder_ = function(bracketType) {
  /** @public {number} */
  this.bracketType = bracketType;

  /** @protected {ccc.Data} */
  this.tail_ = ccc.NIL;

  /** @protected {!Array.<ccc.Data>} */
  this.elements_ = [];
};


/**
 * Produces a new {@code ccc.Data} upon closing the form associated with
 * this builder. If this returns {@code undefined}, no object is produced.
 *
 * @return {ccc.Data|undefined}
 */
ObjectBuilder_.prototype.build = function() {
  return new ccc.Error('Reaching the unreachable.');
};


/**
 * Adds an element to this builder. Returns {@code true} to indicate that
 * the builder should produce an object immediately after this addition.
 * Default implementation always returns {@code false}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ObjectBuilder_.prototype.add = function(data) {
  this.elements_.push(data);
  return false;
};


/**
 * @param {number} bracketType
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var ListBuilder_ = function(bracketType) {
  ObjectBuilder_.call(this, bracketType);
};
goog.inherits(ListBuilder_, ObjectBuilder_);


/** @override */
ListBuilder_.prototype.build = function() {
  return ccc.Pair.makeList(this.elements_, this.tail_);
};


/**
 * @param {number} bracketType
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var VectorBuilder_ = function(bracketType) {
  ObjectBuilder_.call(this, bracketType);
};
goog.inherits(VectorBuilder_, ObjectBuilder_);


/** @override */
VectorBuilder_.prototype.build = function() {
  goog.asserts.assert(this.tail_ === ccc.NIL,
      'Invalid vector builder. Y u do dis?');
  return new ccc.Vector(this.elements_);
};


/**
 * @param {!ObjectBuilder_} targetBuilder
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var TailBuilder_ = function(targetBuilder) {
  ObjectBuilder_.call(this, targetBuilder.bracketType);

  /** @private {!ObjectBuilder_} */
  this.targetBuilder_ = targetBuilder;
};
goog.inherits(TailBuilder_, ObjectBuilder_);


/** @override */
TailBuilder_.prototype.build = function() {
  if (this.elements_.length == 0) {
    return new ccc.Error('Missing tail element after dot');
  }
  if (this.targetBuilder_.elements_.length == 0) {
    return new ccc.Error('Unexpected token');
  }
  if (this.elements_.length > 1) {
    return new ccc.Error('Unexpected object ' + this.elements_[1].toString());
  }
  this.targetBuilder_.tail_ = this.elements_[0];
  return this.targetBuilder_.build();
};


/**
 * Throws away the next datum in the token stream.
 *
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
var CommentBuilder_ = function() {
  ObjectBuilder_.call(this, -1);
};
goog.inherits(CommentBuilder_, ObjectBuilder_);


/** @override */
CommentBuilder_.prototype.build = function() {};


/** @override */
CommentBuilder_.prototype.add = function(object) { return true; };


/**
 * Transforms the next datum in the token stream by wrapping it in a list
 * with a given head symbol.
 *
 * @param {string} headName
 * @extends {ObjectBuilder_}
 * @constructor
 * @private
 */
var WrapperBuilder_ = function(headName) {
  ObjectBuilder_.call(this, -1);

  /** @private {!ccc.Symbol} */
  this.head_ = new ccc.Symbol(headName);
};
goog.inherits(WrapperBuilder_, ObjectBuilder_);


WrapperBuilder_.prototype.build = function() {
  return new ccc.Pair(this.head_, new ccc.Pair(this.elements_[0], ccc.NIL));
};


WrapperBuilder_.prototype.add = function(object) {
  this.elements_.push(object);
  return true;
};


/**
 * Parser for ccc code. This reads tokens from a {@code ccc.parse.TokenReader}
 * and supplies top-level data ({@code ccc.Data} values) via its
 * {@code ccc.parse.DataReader} interface.
 *
 * @param {!ccc.parse.TokenReader} tokenReader Food supply for the Parser.
 * @constructor
 * @implements {ccc.parse.DataReader}
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
   * The last token that was successfully processed.
   * @private {ccc.parse.Token}
   */
  this.lastToken_ = null;
};


/** @override */
ccc.parse.Parser.prototype.read = function() {
  var token = this.tokenReader_.readToken();
  if (token instanceof ccc.Error)
    return token;
  if (!goog.isNull(token))
    this.lastToken_ = /** @type {ccc.parse.Token} */ (token);
  var result = this.processToken_(/** @type {ccc.parse.Token} */ (token));
  if (result instanceof ccc.Error) {
    if (goog.isNull(token))
      return result;
    return new ccc.Error('[Line ' + token.line + ', Col ' + token.column +
        '] near "' + token.text + '": ' + result);
  }
  return result;
};


/**
 * Processes a single token. Returns a {@code ccc.Data} value if a complete
 * top-level data is parsed, {@code null} if the token stream is terminated,
 * and {@code undefined} otherwise.
 *
 * @param {ccc.parse.Token} token
 * @return {?ccc.Data|!ccc.Error|undefined}
 * @private
 */
ccc.parse.Parser.prototype.processToken_ = function(token) {
  var T = ccc.parse.TokenType;

  if (goog.isNull(token)) {
    if (!goog.isNull(this.builder_))
      return new ccc.Error('Unexpected end of input');
    return null;
  }

  /** @type {?ccc.Data|undefined} */
  var production = null;
  switch (token.type) {
    case T.TRUE:
      production = true;
      break;
    case T.FALSE:
      production = false;
      break;
    case T.UNSPECIFIED:
      production = ccc.UNSPECIFIED;
      break;
    case T.SYMBOL:
      goog.asserts.assert(goog.isDef(token.data.name),
          'Invalid symbol literal.');
      production = new ccc.Symbol(token.data.name);
      break;
    case T.CHAR_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid character literal.');
      production = new ccc.Char(token.data.value);
      break;
    case T.STRING_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid string literal.');
      production = token.data.value;
      break;
    case T.NUMERIC_LITERAL:
      goog.asserts.assert(goog.isDef(token.data.value),
          'Invalid numeric literal.');
      production = token.data.value;
      break;
    case T.OPEN_LIST:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid opening bracket token.');
      this.pushBuilder_(new ListBuilder_(token.data.type));
      break;
    case T.OPEN_VECTOR:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid opening bracket token.');
      this.pushBuilder_(new VectorBuilder_(token.data.type));
      break;
    case T.CLOSE_FORM:
      goog.asserts.assert(goog.isDef(token.data.type),
          'Invalid closing bracket token.');
      if (!(this.builder_ instanceof ListBuilder_) &&
          !(this.builder_ instanceof VectorBuilder_) &&
          !(this.builder_ instanceof TailBuilder_)) {
        return new ccc.Error('Unexpected "' + this.lastToken_.text + '"');
      }
      if (this.builder_.bracketType != token.data.type) {
        return new ccc.Error('Unbalanced "' + token.text + '"');
      }
      goog.asserts.assert(this.builderStack_.length > 0,
          'Misplaced form closer');
      production = this.builder_.build();
      this.builder_ = this.builderStack_.pop();
      break;
    case T.DOT:
      if (goog.isNull(this.builder_) ||
          !(this.builder_ instanceof ListBuilder_)) {
        return new ccc.Error('Unexpected token');
      }
      this.builder_ = new TailBuilder_(this.builder_);
      break;
    case T.OMIT_DATUM:
      this.pushBuilder_(new CommentBuilder_());
      break;
    case T.QUOTE:
      this.pushBuilder_(new WrapperBuilder_('quote'));
      break;
    case T.UNQUOTE:
      this.pushBuilder_(new WrapperBuilder_('unquote'));
      break;
    case T.UNQUOTE_SPLICING:
      this.pushBuilder_(new WrapperBuilder_('unquote-splicing'));
      break;
    case T.QUASIQUOTE:
      this.pushBuilder_(new WrapperBuilder_('quasiquote'));
      break;
    default:
      return new ccc.Error('Invalid token: ' + token.text);
  }

  if (goog.isNull(production) || !goog.isDef(production)) {
    return;
  }

  if (goog.isNull(this.builder_)) {
    return production;
  }

  while (this.builder_.add(production)) {
    production = this.builder_.build();
    this.builder_ = this.builderStack_.pop();
    if (!goog.isDef(production)) {
      return;
    }
    if (goog.isNull(this.builder_)) {
      return production;
    }
  }
};


/**
 * Pushes the current builder onto the builder stack and switches to a new one.
 *
 * @param {!ObjectBuilder_} builder
 */
ccc.parse.Parser.prototype.pushBuilder_ = function(builder) {
  this.builderStack_.push(this.builder_);
  this.builder_ = builder;
};
