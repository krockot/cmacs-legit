// The Cmacs Project.

goog.provide('ccc.parse.Parser');

goog.require('ccc.base');
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

  /** @protected {!ccc.base.Object} */
  this.tail_ = ccc.base.NIL;

  /** @protected {!Array.<!ccc.base.Object>} */
  this.elements_ = [];
};


/**
 * Produces a new {@code ccc.base.Object} upon closing the form associated with
 * this builder. If this returns {@code undefined}, no object is produced.
 *
 * @return {!ccc.base.Object|undefined}
 */
ObjectBuilder_.prototype.build = function() {
  throw new Error('You are making a mistake');
};


/**
 * Adds an element to this builder. Returns {@code true} to indicate that
 * the builder should produce an object immediately after this addition.
 * Default implementation always returns {@code false}.
 *
 * @param {!ccc.base.Object} object
 * @return {boolean}
 */
ObjectBuilder_.prototype.add = function(object) {
  this.elements_.push(object);
  return false;
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
  var list = this.tail_;
  for (var i = this.elements_.length - 1; i >= 0; --i) {
    list = new ccc.base.Pair(this.elements_[i], list);
  }
  return list;
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
  goog.asserts.assert(this.tail_ === ccc.base.NIL,
      'Invalid vector builder. Y u do dis?');
  return new ccc.base.Vector(this.elements_);
};


/**
 * @param {!ObjectBuilder_} targetBuilder
 * @constructor
 * @extends {ObjectBuilder_}
 * @private
 */
TailBuilder_ = function(targetBuilder) {
  goog.base(this, targetBuilder.bracketType);

  /** @private {!ObjectBuilder_} */
  this.targetBuilder_ = targetBuilder;
};
goog.inherits(TailBuilder_, ObjectBuilder_);


/** @override */
TailBuilder_.prototype.build = function() {
  if (this.elements_.length == 0) {
    throw new Error('Missing tail element after dot');
  }
  if (this.targetBuilder_.elements_.length == 0) {
    throw new Error('Unexpected token');
  }
  if (this.elements_.length > 1) {
    throw new Error('Unexpected object ' + this.elements_[1].toString());
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
CommentBuilder_ = function() {
  goog.base(this, -1);
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
 * @param {string} symbolName
 * @extends {ObjectBuilder_}
 * @private
 */
WrapperBuilder_ = function(symbolName) {
  goog.base(this, -1);

  /** @private {string} */
  this.symbolName_ = symbolName;
};
goog.inherits(WrapperBuilder_, ObjectBuilder_);


WrapperBuilder_.prototype.build = function() {
  return new ccc.base.Pair(
      new ccc.base.Symbol(this.symbolName_),
      new ccc.base.Pair(this.elements_[0], ccc.base.NIL));
};


WrapperBuilder_.prototype.add = function(object) {
  this.elements_.push(object);
  return true;
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

  /**
   * The last token that was successfully processed.
   * @private {ccc.parse.Token}
   */
  this.lastToken_ = null;
};


/** @override */
ccc.parse.Parser.prototype.readObject = function() {
  return this.tokenReader_.readToken().then(function(token) {
    try {
      var result = this.processToken_(token);
      this.lastToken_ = token;
      if (goog.isDef(result)) {
        return result;
      }
    } catch (e) {
      var message = e.message;
      if (goog.isNull(token))
        token = this.lastToken_;
      if (!goog.isNull(token)) {
        message = '[Line ' + token.line + ', Col ' + token.column + '] ' +
            message + ' near "' + token.text + '"';
      }
      return goog.Promise.reject(new Error(message));
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
      throw new Error('Unexpected end of input');
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
        throw new Error('Unexpected "' + this.lastToken_.text + '"');
      }
      if (this.builder_.bracketType != token.data.type) {
        throw new Error('Unbalanced "' + token.text + '"');
      }
      goog.asserts.assert(this.builderStack_.length > 0);
      production = this.builder_.build();
      this.builder_ = this.builderStack_.pop();
      break;
    case T.DOT:
      if (goog.isNull(this.builder_) ||
          !(this.builder_ instanceof ListBuilder_)) {
        throw new Error('Unexpected token');
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
      throw new Error('Invalid token: ' + token.text);
  }

  if (goog.isNull(production)) {
    return;
  }

  if (goog.isNull(this.builder_)) {
    return production;
  }

  while (this.builder_.add(production)) {
    var production = this.builder_.build();
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
