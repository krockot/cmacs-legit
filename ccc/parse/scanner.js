// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Scanner');

goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenType');
goog.require('goog.asserts');
goog.require('goog.object')



/**
 * The result of a single transition step.
 *
 * @typedef {{
 *   token: (!ccc.parse.Token|undefined),
 *   state: (!Transition_|undefined),
 *   advance: boolean,
 *   terminate: boolean
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
 *   state: (!Transition_|undefined),
 *   passive: (boolean|undefined)
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
  var space = any(' \t\f\r\n\v\xa0\u2029\u202f\u3000\u2000\u2001\u2002' +
      '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b');

  /** @type {!MatchFunction_} */
  var delimiter = (function() {
    var special = any('()[]|;');
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
   * @param {!Array.<!TransitionRule_>} rules The list of rules for this state.
   * @return {!Transition_}
   */
  var makeState = function(rules) {
    // TODO(krockot): Implement.
    return function(input) {
      return {
        advance: true,
        state: S['clean'],
        terminate: false
      };
    };
  };

  /**
   * Constructs a series of states which match a strict sequence.
   * Returns the first constructed state in the sequence. If the full sequence
   * is matched by this series, the given result will be used to emit a token
   * and/or transition the state.
   *
   * @param {!Array.<!MatchFunction_>} sequence The sequence of matching
   *     functions to apply.
   * @param {!{
   *    token: (ccc.parse.TokenType|undefined),
   *    state: (!Transition_|undefined)
   *  }} result
   */
  var makeSequencedStates = function(sequence, result) {
    // TODO(krockot): Implement.
    return makeState([]);
  };

  // Clean state between tokens.
  S['clean'] = makeState([
    { match: space },
    { match: eof, state: S['success'] },
    { match: any('(['), token: T.OPEN_LIST },
    { match: any(')]'), token: T.CLOSE_FORM },
    { match: single('\''), token: T.QUOTE },
    { match: single('`'), token: T.QUASIQUOTE },
    { match: single(';'), state: S['eatComment'] },
    { match: single('#'), state: S['hash'] },
    { match: single('"'), state: S['stringLiteral'] },
    { match: single('|'), state: S['quotedSymbol'] },
    { match: single(','), state: S['unquote'] },
    { match: single('.'), state: S['dot'] },
    { match: any('-+'), state: S['sign'] },
    { match: digit, state: S['decimalLiteral'] },
    { match: whatever, state: S['symbol'] }
  ]);

  // Final state. Should only be reachable on EOF in a clean state.
  S['success'] = function(unused) {
    return { advance: false, terminate: true };
  };

  // Chew up input until we reach an officially sanctioned line terminator.
  // {@see http://www.unicode.org/reports/tr14/tr14-32.html}
  S['eatComment'] = makeState([
    { match: any('\n\v\f\r\x85\u2028\u2029'), state: S['clean'] },
    { match: whatever }
  ]);

  // Reached when reading a '#' from a clean state.
  S['hash'] = makeState([
    { match: single(';'), token: T.OMIT_DATUM },
    { match: any('(['), token: T.OPEN_VECTOR },
    { match: any('tT'), state: S['hashT'] },
    { match: any('fF'), state: S['hashF'] },
    { match: single('?'), state: S['hash?'] },
    { match: single('\\'), state: S['charLiteral'] },
    { match: any('dD'), state: S['forcedDecimalLiteralStart'] },
    { match: any('bB'), state: S['binaryLiteralStart'] },
    { match: any('oO'), state: S['octalLiteralStart'] },
    { match: any('xX'), state: S['hexLiteralStart'] }
  ]);
  S['hashT'] = makeState([
    { match: delimiter, passive: true, token: T.TRUE }
  ]);
  S['hashF'] = makeState([
    { match: delimiter, passive: true, token: T.FALSE }
  ]);
  S['hash?'] = makeState([
    { match: delimiter, passive: true, token: T.UNSPECIFIED }
  ]);

  // Things that happen between double quotes.
  S['stringLiteral'] = makeState([
    { match: single('\"'), token: T.STRING_LITERAL },
    { match: single('\\'), state: S['stringEscape'] },
    { match: whatever }
  ]);
  S['stringEscape'] = makeState([
    { match: single('x'), state: S['stringEscape8BitCode'] },
    { match: single('u'), state: S['stringEscape16BitCode'] },
    { match: whatever, state: S['stringLiteral'] }
  ]);
  S['stringEscape8BitCode'] = makeSequencedStates([hex, hex],
      { state: S['stringLiteral'] });
  S['stringEscape16BitCode'] = makeSequencedStates([hex, hex, hex, hex],
      { state: S['stringLiteral'] });

  // Things that happen between symbol quotations (|).
  S['quotedSymbol'] = makeState([
    { match: single('|'), token: T.QUOTED_SYMBOL },
    { match: single('\\'), state: S['quotedSymbolEscape'] },
    { match: whatever }
  ]);
  S['quotedSymbolEscape'] = makeState([
    { match: single('x'), state: S['quotedSymbolEscape8BitCode'] },
    { match: single('u'), state: S['quotedSymbolEscape16BitCode'] },
    { match: whatever, state: S['quotedSymbol'] }
  ]);
  S['quotedSymbolEscape8BitCode'] = makeSequencedStates([hex, hex],
      { state: S['quotedSymbol'] });
  S['quotedSymbolEscape16BitCode'] = makeSequencedStates([hex, hex, hex, hex],
      { state: S['quotedSymbol'] });

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
};


/**
 * Attempts to fetch the next available token from the input.
 * @return {ccc.parse.Token} token The next token in the stream, or
 *     {@code null} if no more tokens are left.
 * @public
 */
ccc.parse.Scanner.prototype.getNextToken = function() {
  return null;
};
