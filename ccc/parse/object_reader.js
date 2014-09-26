// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.ObjectReader');

goog.require('ccc.base.Object');



/**
 * Generic Object reader interface.
 *
 * @interface
 */
ccc.parse.ObjectReader = function() {};


/**
 * Attempts to fetch the next available {@code ccc.base.Object} from the input.
 * Returns {@code null} if there are no more objects available.
 *
 * @type {function():ccc.base.Object}
 * @public
 */
ccc.parse.ObjectReader.prototype.readObject;
