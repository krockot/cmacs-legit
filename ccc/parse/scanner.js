// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Scanner');

goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenType');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');



/**
 * The set of characters we treat as line terminators.
 *
 * @private {string}
 * @const
 */
var LINE_TERMINATORS_ = '\n\v\f\r\x85\u2028\u2029';



/**
 * The result of a single transition step.
 *
 * @typedef {{
 *   token: (!ccc.parse.TokenType|undefined),
 *   state: (!Transition_|undefined),
 *   terminate: boolean,
 *   advance: boolean,
 *   discard: boolean
 * }}
 * @private
 */
var TransitionResult_;



/**
 * A state transition function.
 *
 * @typedef {function(string):!TransitionResult_}
 * @private
 */
var Transition_;



/**
 * A match function for a single transition rule to match an input character.
 *
 * @typedef {function(string):boolean}
 * @private
 */
var MatchFunction_;



/**
 * A single transition rule used in the construction of state transition
 * functions.
 *
 * @typedef {{
 *   match: MatchFunction_,
 *   token: (ccc.parse.TokenType|undefined),
 *   state: (string|undefined),
 *   advance: (boolean|undefined),
 *   discard: (boolean|undefined)
 * }}
 */
var TransitionRule_;



/**
 * The start state of the scanner. This construction hides all the details
 * of intermediate states between start and termination.
 *
 * @type {!Transition_}
 * @private
 * @const
 */
var START_STATE_ = (function() {
  /**
   * Generator for a single-character match function.
   *
   * @param {string} c The character to match.
   * @return {!MatchFunction_}
   */
  var single = function(c) {
    return function(x) {
      return c == x;
    };
  };

  /**
   * Generator for a function to match any character in a set.
   *
   * @param {string} chars A string containing all possible matching characters.
   * @return {!MatchFunction_}
   */
  var any = function(chars) {
    var charSet = {};
    for (var i = 0; i < chars.length; ++i) {
      charSet[chars.charAt(i)] = true;
    }
    return function(x) {
      return goog.object.containsKey(charSet, x);
    };
  };

  /** @type {!MatchFunction_} */
  var eof = function(x) { return x.length == 0; };

  /** @type {!MatchFunction_} */
  var lineEnding = any(LINE_TERMINATORS_);

  /** @type {!MatchFunction_} */
  var space = any(' \t\f\r\n\v\x85\xa0\u2028\u2029\u202f\u3000\u2000\u2001' +
      '\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b');

  /** @type {!MatchFunction_} */
  var delimiter = (function() {
    var special = any('()[]|;"\'');
    return function(x) {
      return eof(x) || space(x) || special(x);
    };
  }());

  /** @type {!MatchFunction_} */
  var digit = any('0123456789');

  /** @type {!MatchFunction_} */
  var hex = any('0123456789abcdefABCDEF');

  /** @type {!MatchFunction_} */
  var whatever = function(x) { return x.length == 1; };

  /* Shorthand for token types within this scope. */
  var T = ccc.parse.TokenType;

  /**
   * Namespace in which to keep all our state transition functions.
   *
   * @type {!Object.<string, !Transition_>}
   */
  var S = {};

  /**
   * Constructs and returns a new Transition_ which behaves according to the
   * given set of transition rules. The transition will throw an error if used
   * with an input that is unmatched by all given rules.
   *
   * Rules which emit a token also implicitly transition back to clean state.
   *
   * @param {string} name The name of the state.
   * @param {!Array.<!TransitionRule_>} rules The list of rules for this state.
   */
  var D = function(name, rules) {
    var fn = function(input) {
      var match = goog.array.find(rules, function(rule) {
        return rule.match(input);
      });
      if (goog.isNull(match)) {
        throw new Error('Unexpected \'' + input + '\' character in input.');
      }
      return {
        state: goog.isDef(match.state) ? S[match.state] : undefined,
        token: match.token,
        terminate: false,
        advance: goog.isDef(match.advance) ? match.advance : true,
        discard: !!match.discard
      };
    };
    fn.__name__ = name;
    S[name] = fn;
  };

  // Clean state between tokens.
  D('clean', [
    { match: space, discard: true },
    { match: eof, state: 'success' },
    { match: any('(['), token: T.OPEN_LIST },
    { match: any(')]'), token: T.CLOSE_FORM },
    { match: single('\''), token: T.QUOTE },
    { match: single('`'), token: T.QUASIQUOTE },
    { match: single(';'), state: 'eatComment', discard: true },
    { match: single('#'), state: 'hash' },
    { match: single('"'), state: 'stringLiteral' },
    { match: single('|'), state: 'quotedSymbol' },
    { match: single(','), state: 'unquote' },
    { match: single('.'), state: 'dot' },
    { match: any('-+'), state: 'sign' },
    { match: digit, state: 'decimalLiteral' },
    { match: whatever, state: 'symbol' }
  ]);

  // Final state. Should only be reachable on EOF in a clean state.
  S['success'] = function(unused) {
    return { advance: false, terminate: true };
  };
  S['success'].__name__ = 'success';

  // Chew up input until we reach an officially sanctioned line terminator.
  // {@see http://www.unicode.org/reports/tr14/tr14-32.html}
  D('eatComment', [
    { match: lineEnding, state: 'clean', discard: true },
    { match: eof, state: 'clean', advance: false },
    { match: whatever, discard: true }
  ]);

  // Reached when reading a '#' from a clean state.
  D('hash', [
    { match: single(';'), token: T.OMIT_DATUM },
    { match: any('(['), token: T.OPEN_VECTOR },
    { match: any('tT'), state: 'hashT' },
    { match: any('fF'), state: 'hashF' },
    { match: single('?'), state: 'hash?' },
    { match: single('\\'), state: 'charLiteral' },
    { match: any('bB'), state: 'binaryLiteralStart' },
    { match: any('oO'), state: 'octalLiteralStart' },
    { match: any('xX'), state: 'hexLiteralStart' }
  ]);
  D('hashT', [
    { match: delimiter, advance: false, token: T.TRUE }
  ]);
  D('hashF', [
    { match: delimiter, advance: false, token: T.FALSE }
  ]);
  D('hash?', [
    { match: delimiter, advance: false, token: T.UNSPECIFIED }
  ]);

  // Things that happen between double quotes.
  D('stringLiteral', [
    { match: single('\"'), token: T.STRING_LITERAL },
    { match: single('\\'), state: 'stringEscape' },
    { match: whatever }
  ]);
  D('stringEscape', [
    { match: single('x'), state: 'strEscape8Bit1' },
    { match: single('u'), state: 'strEscape16Bit1' },
    { match: whatever, state: 'stringLiteral' }
  ]);
  D('strEscape8Bit1', [{ match: hex, state: 'strEscape8Bit2' }]);
  D('strEscape8Bit2', [{ match: hex, state: 'stringLiteral' }]);
  D('strEscape16Bit1', [{ match: hex, state: 'strEscape16Bit2' }]);
  D('strEscape16Bit2', [{ match: hex, state: 'strEscape16Bit3' }]);
  D('strEscape16Bit3', [{ match: hex, state: 'strEscape16Bit4' }]);
  D('strEscape16Bit4', [{ match: hex, state: 'stringLiteral' }]);

  // Things that happen between symbol quotations (|).
  D('quotedSymbol', [
    { match: single('|'), token: T.SYMBOL },
    { match: single('\\'), state: 'quotedSymbolEscape' },
    { match: whatever }
  ]);
  D('quotedSymbolEscape', [
    { match: single('x'), state: 'qsEscape8Bit1' },
    { match: single('u'), state: 'qsEscape16Bit1' },
    { match: whatever, state: 'quotedSymbol' }
  ]);
  D('qsEscape8Bit1', [{ match: hex, state: 'qsEscape8Bit2' }]);
  D('qsEscape8Bit2', [{ match: hex, state: 'quotedSymbol' }]);
  D('qsEscape16Bit1', [{ match: hex, state: 'qsEscape16Bit2' }]);
  D('qsEscape16Bit2', [{ match: hex, state: 'qsEscape16Bit3' }]);
  D('qsEscape16Bit3', [{ match: hex, state: 'qsEscape16Bit4' }]);
  D('qsEscape16Bit4', [{ match: hex, state: 'quotedSymbol' }]);

  // A popular default state to enter when input is otherwise uninteresting.
  D('symbol', [
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever }
  ]);

  // Ambiguous unquote state. Either this is ,@ or it's treated as a standalone
  // unquote regardless of whatever follows it.
  D('unquote', [
    { match: single('@'), token: T.UNQUOTE_SPLICING },
    { match: whatever, advance: false, token: T.UNQUOTE },
    { match: eof, advance: false, token: T.UNQUOTE }
  ]);

  // Ambiguous dot state. This may be the start of a numeric literal or symbol,
  // or it may be a cons expression.
  D('dot', [
    { match: digit, state: 'decimalLiteralFraction' },
    { match: delimiter, token: T.DOT },
    { match: whatever, state: 'symbol' }
  ]);

  // Sign characters may be standalone symbols or the beginnings of a numeric
  // literal.
  D('sign', [
    { match: digit, state: 'decimalLiteral' },
    { match: single('.'), state: 'decimalLiteralFractionStart' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we already have at least one decimal digit scanned,
  // but we haven't yet reached a decimal point.
  D('decimalLiteral', [
    { match: digit },
    { match: any('eE'), state: 'exponentStart' },
    { match: single('.'), state: 'decimalLiteralFraction' },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we have a decimal point but no leading digits; in order
  // for this to become a real numeric literal we must read at least one digit
  // immediately. This state is reachable from a clean ".", "-.", or "+." input.
  D('decimalLiteralFractionStart', [
    { match: digit, state: 'decimalLiteralFraction' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we've already scanned at least one fractional digit.
  D('decimalLiteralFraction', [
    { match: digit },
    { match: any('eE'), state: 'exponentStart' },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // We've read an [eE] from a possible numeric literal.
  D('exponentStart', [
    { match: any('-+'), state: 'exponentStartDigit' },
    { match: digit, state: 'exponent' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // We've read [eE] and [-+] so now we must either read a digit or this isn't
  // a numeric literal.
  D('exponentStartDigit', [
    { match: digit, state: 'exponent' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A real exponent. Scan only digits up to delimiter or fall back to symbol.
  D('exponent', [
    { match: digit },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // Immediately following a #[bB] we require a sign or digit.
  D('binaryLiteralStart', [
    { match: any('-+'), state: 'binaryLiteralDigit' },
    { match: any('01'), state: 'binaryLiteral' }
  ]);
  D('binaryLiteralDigit', [
    { match: any('01'), state: 'binaryLiteral' }
  ]);
  D('binaryLiteral', [
    { match: any('01') },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

  // Immediately following a #[oO] we require a sign or digit.
  D('octalLiteralStart', [
    { match: any('-+'), state: 'octalLiteralDigit' },
    { match: any('01234567'), state: 'octalLiteral' },
  ]);
  D('octalLiteralDigit', [
    { match: any('01234567'), state: 'octalLiteral' }
  ]);
  D('octalLiteral', [
    { match: any('01234567') },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

  // Immediately following a #[xX] we require a sign or digit.
  D('hexLiteralStart', [
    { match: any('-+'), state: 'hexLiteralDigit' },
    { match: hex, state: 'hexLiteral' },
  ]);
  D('hexLiteralDigit', [
    { match: hex, state: 'hexLiteral' }
  ]);
  D('hexLiteral', [
    { match: hex },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

  // Immediately following a "#\". We'll build some kind of character
  // literal here.
  D('charLiteral', [
    { match: single('n'), state: 'cl-n' },
    { match: single('s'), state: 'cl-s' },
    { match: whatever, token: T.CHAR_LITERAL }
  ]);

  // #\n, #\newline, or error.
  D('cl-n', [
    { match: single('e'), state: 'cl-ne' },
    { match: delimiter, advance: false, token: T.CHAR_LITERAL }
  ]);
  D('cl-ne', [{ match: single('w'), state: 'cl-new' }]);
  D('cl-new', [{ match: single('l'), state: 'cl-newl' }]);
  D('cl-newl', [{ match: single('i'), state: 'cl-newli' }]);
  D('cl-newli', [{ match: single('n'), state: 'cl-newlin' }]);
  D('cl-newlin', [{ match: single('e'), state: 'cl-newline' }]);
  D('cl-newline', [{
    match: delimiter, advance: false, token: T.CHAR_LITERAL
  }]);

  // #\s, #\space, or error.
  D('cl-s', [
    { match: single('p'), state: 'cl-sp' },
    { match: delimiter, advance: false, token: T.CHAR_LITERAL }
  ]);
  D('cl-sp', [{ match: single('a'), state: 'cl-spa' }]);
  D('cl-spa', [{ match: single('c'), state: 'cl-spac' }]);
  D('cl-spac', [{ match: single('e'), state: 'cl-space' }]);
  D('cl-space', [{ match: delimiter, advance: false, token: T.CHAR_LITERAL }]);

  return S['clean'];
}());



/**
 * Scanner is responsible for transforming an input string into a stream of
 * {@code ccc.parse.Token} objects.
 *
 * @param {string} input Input string.
 * @constructor
 * @public
 */
ccc.parse.Scanner = function(input) {
  /** @private {string} */
  this.input_ = input;

  /**
   * The current state of the scanner.
   * @private {!Transition_}
   */
  this.state_ = START_STATE_;

  /**
   * The current line number within the input.
   * @private {number}
   */
  this.line_ = 1;

  /**
   * The current column within the input.
   * @private {number}
   */
  this.column_ = 1;

  /**
   * The current absolute index into the input.
   * @private {number}
   */
  this.index_ = 0;

  /**
   * The index within the input where the current token started, or null
   * if there is no current token.
   * @private {?number}
   */
  this.tokenIndex_ = null;

  /**
   * The line number on which the current token started, if any.
   * @private {number}
   */
  this.tokenLine_ = 1;

  /**
   * The column at which the current token started, if any.
   * @private {number}
   */
  this.tokenColumn_ = 1;

  /**
   * Indicates if the last character read was a CR. How gross.
   * @private {boolean}
   */
  this.readCRLast_ = false;
};


/**
 * Attempts to fetch the next available token from the input.
 *
 * @return {ccc.parse.Token} token The next token in the stream, or
 *     {@code null} if no more tokens are left.
 * @public
 */
ccc.parse.Scanner.prototype.getNextToken = function() {
  try {
    while (true) {
      var c = this.input_.charAt(this.index_);
      var result = this.state_(c);
      if (result.terminate) {
        return null;
      }
      // State transition if necessary
      var oldState = this.state_;
      if (goog.isDef(result.state)) {
        this.state_ = result.state;
      }
      // Either the input should be advanced or the state should change
      // (or both). If neither happens, we have a problem.
      goog.asserts.assert(result.advance || this.state_ != oldState ||
          goog.isDef(result.token), 'Probably stuck in an infinite loop.');
      // Advance the input if it's called for.
      if (result.advance) {
        // If we had a CR but not an LF, insert a newline for the CR.
        // This needs to be done before a potential token position capture since
        // the line adjustment was deferred in the last round.
        if (this.readCRLast_ && c != '\n') {
          this.line_++;
          this.column_ = 1;
        }
        this.readCRLast_ = false;
        // Mark the start of a new token's text if necessary.
        if (!result.discard && goog.isNull(this.tokenIndex_)) {
          this.tokenIndex_ = this.index_;
          this.tokenLine_ = this.line_;
          this.tokenColumn_ = this.column_;
        }
        this.index_++;
        // If it's a newline, add a newline (unless it's CR)
        if (LINE_TERMINATORS_.indexOf(c) >= 0) {
          if (c == '\r') {
            this.readCRLast_ = true;
          } else {
            this.line_++;
            this.column_ = 1;
          }
        } else {
          this.column_++;
        }
      }
      // Finally emit a token if we need to.
      if (goog.isDef(result.token)) {
        goog.asserts.assert(!goog.isNull(this.tokenIndex_),
            'Trying to emit an empty token: ' + result.token);
        var token = new ccc.parse.Token(result.token,
            this.input_.substring(this.tokenIndex_, this.index_),
            this.tokenLine_,
            this.tokenColumn_);
        this.state_ = START_STATE_;
        this.tokenIndex_ = null;
        return token;
      }
    }
  } catch (e) {
    throw new Error('Error (Line ' + this.line_ + ', Col ' + this.column_ +
        '): ' + e.message);
  }
};
