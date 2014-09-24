// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Scanner');

goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenType');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object')



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
  var whatever = function(x) { return true; };

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
  var makeState = function(name, rules) {
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

  /**
   * Constructs a series of states which match a strict sequence.
   * Returns the first constructed state in the sequence. If the full sequence
   * is matched by the series, the given result will be used to emit a token
   * and/or transition the state.
   *
   * @param {string} name The name of the initial state.
   * @param {!Array.<!MatchFunction_>} sequence The sequence of matching
   *     functions to apply in-order over the input.
   * @param {!{
   *    token: (ccc.parse.TokenType|undefined),
   *    state: (string|undefined)
   *  }} result The token and/or state to use upon successful match.
   */
  var makeStateSequence = function(name, sequence, result) {
    goog.asserts.assert(sequence.length > 1,
        'makeStateSequence excepts at least 2 sequence elements.');
    var parts = sequence.map(function(fn, index) {
      return {
        result: {
          terminate: false,
          advance: true,
          discard: false
        },
        transition: function(input) {
          if (fn(input)) {
            return parts[index].result;
          }
          throw new Error('Unexpected \'' + input + '\' character in input.');
        }
      };
    });
    parts[0].transition.__name__ = name;
    var numParts = parts.length;
    for (var i = 0; i < numParts - 1; ++i) {
      parts[i].result.state = parts[i + 1].transition;
    }
    var lastPart = parts[numParts - 1];
    lastPart.result.state =
        goog.isDef(result.state) ? S[result.state] : undefined;
    lastPart.result.token = result.token;
    S[name] = parts[0].transition;
  };

  // Clean state between tokens.
  makeState('clean', [
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
  makeState('eatComment', [
    { match: lineEnding, state: 'clean', discard: true },
    { match: eof, state: 'clean', advance: false },
    { match: whatever, discard: true }
  ]);

  // Reached when reading a '#' from a clean state.
  makeState('hash', [
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
  makeState('hashT', [
    { match: delimiter, advance: false, token: T.TRUE }
  ]);
  makeState('hashF', [
    { match: delimiter, advance: false, token: T.FALSE }
  ]);
  makeState('hash?', [
    { match: delimiter, advance: false, token: T.UNSPECIFIED }
  ]);

  // Things that happen between double quotes.
  makeState('stringLiteral', [
    { match: single('\"'), token: T.STRING_LITERAL },
    { match: single('\\'), state: 'stringEscape' },
    { match: whatever }
  ]);
  makeState('stringEscape', [
    { match: single('x'), state: 'stringEscape8BitCode' },
    { match: single('u'), state: 'stringEscape16BitCode' },
    { match: whatever, state: 'stringLiteral' }
  ]);
  makeStateSequence('stringEscape8BitCode', [hex, hex],
      { state: 'stringLiteral' });
  makeStateSequence('stringEscape16BitCode', [hex, hex, hex, hex],
      { state: 'stringLiteral' });

  // Things that happen between symbol quotations (|).
  makeState('quotedSymbol', [
    { match: single('|'), token: T.QUOTED_SYMBOL },
    { match: single('\\'), state: 'quotedSymbolEscape' },
    { match: whatever }
  ]);
  makeState('quotedSymbolEscape', [
    { match: single('x'), state: 'quotedSymbolEscape8BitCode' },
    { match: single('u'), state: 'quotedSymbolEscape16BitCode' },
    { match: whatever, state: 'quotedSymbol' }
  ]);
  makeStateSequence('quotedSymbolEscape8BitCode', [hex, hex],
      { state: 'quotedSymbol' });
  makeStateSequence('quotedSymbolEscape16BitCode', [hex, hex, hex, hex],
      { state: 'quotedSymbol' });

  // A popular default state to enter when input is otherwise uninteresting.
  makeState('symbol', [
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever }
  ]);

  // Ambiguous unquote state. Either this is ,@ or it's treated as a standalone
  // unquote regardless of whatever follows it.
  makeState('unquote', [
    { match: single('@'), token: T.UNQUOTE_SPLICING },
    { match: whatever, advance: false, token: T.UNQUOTE }
  ]);

  // Ambiguous dot state. This may be the start of a numeric literal or symbol,
  // or it may be a cons expression.
  makeState('dot', [
    { match: digit, state: 'decimalLiteralFraction' },
    { match: delimiter, token: T.DOT },
    { match: whatever, state: 'symbol' }
  ]);

  // Sign characters may be standalone symbols or the beginnings of a numeric
  // literal.
  makeState('sign', [
    { match: digit, state: 'decimalLiteral' },
    { match: single('.'), state: 'decimalLiteralFractionStart' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we already have at least one decimal digit scanned,
  // but we haven't yet reached a decimal point.
  makeState('decimalLiteral', [
    { match: digit },
    { match: any('eE'), state: 'exponentStart' },
    { match: single('.'), state: 'decimalLiteralFraction' },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we have a decimal point but no leading digits; in order
  // for this to become a real numeric literal we must read at least one digit
  // immediately. This state is reachable from a clean ".", "-.", or "+." input.
  makeState('decimalLiteralFractionStart', [
    { match: digit, state: 'decimalLiteralFraction' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A state in which we've already scanned at least one fractional digit.
  makeState('decimalLiteralFraction', [
    { match: digit },
    { match: any('eE'), state: 'exponentStart' },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // We've read an [eE] from a possible numeric literal.
  makeState('exponentStart', [
    { match: any('-+'), state: 'exponentStartDigit' },
    { match: digit, state: 'exponent' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // We've read [eE] and [-+] so now we must either read a digit or this isn't
  // a numeric literal.
  makeState('exponentStartDigit', [
    { match: digit, state: 'exponent' },
    { match: delimiter, advance: false, token: T.SYMBOL },
    { match: whatever, state: 'symbol' }
  ]);

  // A real exponent. Scan only digits up to delimiter or fall back to symbol.
  makeState('exponent', [
    { match: digit },
    { match: delimiter, advance: false, token: T.NUMERIC_LITERAL },
    { match: whatever, state: 'symbol' }
  ]);

  // Immediately following a #[bB] we require a sign or digit.
  makeState('binaryLiteralStart', [
    { match: any('-+'), state: 'binaryLiteralDigit' },
    { match: any('01'), state: 'binaryLiteral' }
  ]);
  makeState('binaryLiteralDigit', [
    { match: any('01'), state: 'binaryLiteral' }
  ]);
  makeState('binaryLiteral', [
    { match: any('01') },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

  // Immediately following a #[oO] we require a sign or digit.
  makeState('octalLiteralStart', [
    { match: any('-+'), state: 'octalLiteralDigit' },
    { match: any('01234567'), state: 'octalLiteral' },
  ]);
  makeState('octalLiteralDigit', [
    { match: any('01234567'), state: 'octalLiteral' }
  ]);
  makeState('octalLiteral', [
    { match: any('01234567') },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

  // Immediately following a #[xX] we require a sign or digit.
  makeState('hexLiteralStart', [
    { match: any('-+'), state: 'hexLiteralDigit' },
    { match: hex, state: 'hexLiteral' },
  ]);
  makeState('hexLiteralDigit', [
    { match: hex, state: 'hexLiteral' }
  ]);
  makeState('hexLiteral', [
    { match: hex },
    { match: delimiter, token: T.NUMERIC_LITERAL }
  ]);

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
