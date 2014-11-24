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
 *
 * @return {ccc.Data}
 */
cmacs.Fragment.prototype.getData = function() {
  return this.data_;
};


/**
 * Replaces the data in this fragment.
 *
 * @param {ccc.Data} data
 */
cmacs.Fragment.prototype.setData = function(data) {
  this.data_ = data;
};
