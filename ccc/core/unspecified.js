// The Cmacs Project.

goog.provide('ccc.Unspecified');

goog.require('ccc.Object');



/**
 * The type of the global UNSPECIFIED object. Like {@code ccc.Nil}, this
 * type exists for the sake of annotation. Always use the
 * {@code ccc.UNSPECIFIED} constant if an instance is required.
 *
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Unspecified = function() {};
goog.inherits(ccc.Unspecified, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is UNSPECIFIED.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isUnspecified = function(data) {
  return data === ccc.UNSPECIFIED;
};


/** @override */
ccc.Unspecified.prototype.toString = function() { return '#?'; };



/**
 * The global UNSPECIFIED [AKA #?] object.
 *
 * @public {!ccc.Unspecified}
 * @const
 */
ccc.UNSPECIFIED = new ccc.Unspecified();
