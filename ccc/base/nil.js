// The Cmacs Project.

goog.provide('ccc.Nil');

goog.require('ccc.Object');



/**
 * The type of the global NIL object. This really only exists for setting type
 * constraints in annotations. There is no good reason to construct new
 * objects of this type beyond the global {@code ccc.NIL} constant.
 *
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Nil = function() {};
goog.inherits(ccc.Nil, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is NIL.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isNil = function(data) {
  return data === ccc.NIL;
};


/** @override */
ccc.Nil.prototype.toString = function() { return '()'; };


/**
 * The global NIL [AKA ()] object.
 *
 * @public {!ccc.Nil}
 * @const
 */
ccc.NIL = new ccc.Nil();
