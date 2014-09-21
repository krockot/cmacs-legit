// Cmacs project. Copyright forever, the universe.

goog.provide('ccc.parse.Scanner');

goog.require('ccc.parse.Token');



/**
 * The set of possible scanner states.
 * @enum {number}
 * @private
 */
var ScannerState_ = {
  // Clean state between top-level forms.
  CLEAN: 0
};



/**
 * Scanner is responsible for transforming an input string into a stream of
 * {@code ccc.parse.Token} objects.
 * @param {string} Input string.
 * @constructor
 * @public
 */
ccc.parse.Scanner = function(input) {
  /** @private {string} */
  this.input_ = input;

  /**
   * The current state of the scanner.
   * @private {ScannerState_}
   */
  this.state_ = ScannerState_.CLEAN;
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
