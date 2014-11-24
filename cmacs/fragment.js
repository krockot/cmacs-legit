// The Cmacs Project.

goog.provide('cmacs.Fragment');

goog.require('ccc.core');



/**
 * A program fragment. Each fragment consists of a single top-level program
 * datum along with (probably) some editor metadata.
 *
 * @param {ccc.Data} data The program data to wrap.
 * @constructor
 */
cmacs.Fragment = function(data) {
  /** @private {ccc.Data} */
  this.data_ = data;
};


/**
 * Retrieves the program data for this fragment.
 */
cmacs.Fragment.prototype.data = function() {
  return this.data_;
};
