// The Cmacs Project.

goog.provide('ccc.parse.ObjectReader');

goog.require('ccc.base.Object');



/**
 * Object reader interface.
 *
 * {@code ObjectReader} consumers should call {@code readObject} when they
 * want a new Object from the underlying stream. If no more Objects are
 * available, {@code readObject} returns {@code null}.
 *
 * @interface
 * @public
 */
ccc.parse.ObjectReader = function() {};


/**
 * @type {function():!goog.Promise.<!ccc.base.Object>}
 * @public
 */
ccc.parse.ObjectReader.prototype.readObject;
