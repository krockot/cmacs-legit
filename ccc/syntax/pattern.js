// The Cmacs Project.

goog.provide('ccc.syntax.Capture');
goog.provide('ccc.syntax.CaptureSet');
goog.provide('ccc.syntax.Match');
goog.provide('ccc.syntax.Pattern');

goog.require('ccc.base');
goog.require('goog.array');
goog.require('goog.object');



/**
 * A Match is the result of a single pattern matching attempt on an input form.
 *
 * @param {boolean} success
 * @param {!ccc.syntax.CaptureSet} captures
 * @constructor
 * @struct
 * @public
 */
ccc.syntax.Match = function(success, captures) {
  /**
   * Indicates whether or not the match operation was successful.
   * @public {boolean}
   */
  this.success = success;

  /**
   * If the match operation was successful, this contains the complete set of
   * data necessary to expand a corresponding, well-formed template.
   *
   * @public {!ccc.syntax.CaptureSet}
   */
  this.captures = captures;
};



/**
 * A Capture holds information about a single pattern variable captured during
 * a syntax pattern matching operation. Captures may represent single values or
 * nested value series with arbitrary depth.
 *
 * @param {!ccc.base.Object} value TODO: This is obviously insufficient.
 * @constructor
 * @struct
 * @public
 */
ccc.syntax.Capture = function(value) {
  this.value = value;
};



/**
 * A CaptureSet is a map from symbol name to {@code ccc.syntax.Capture} objects.
 * This is the output of a successful match operation.
 *
 * @typedef {!Object.<string, !ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.CaptureSet;



/**
 * Syntax pattern which can match an input form and extract data for template
 * expansion.
 *
 * @param {!Object.<string, boolean>} literals The set of input symbol names
 *     which should be matched literally on input forms.
 * @param {!ccc.base.Object} form The pattern form.
 * @constructor
 * @public
 */
ccc.syntax.Pattern = function(literals, form) {
  /** @private {!Object.<string, boolean>} */
  this.literal_ = literals;

  /** @private {!ccc.base.Object} */
  this.form_ = form.cdr();
};


/**
 * The literal token used to represent a pattern repetition or template
 * expansion.
 *
 * @public {string}
 * @const
 */
ccc.syntax.Pattern.ELLIPSIS_NAME = '...';


/**
 * Attempts to match an input form against the pattern, extracting a set of
 * variable captures if successful.
 *
 * @param {!ccc.base.Object} input
 * @return {!ccc.syntax.Match}
 */
ccc.syntax.Pattern.prototype.match = function(input) {
  return new ccc.syntax.Match(false, {});
};

