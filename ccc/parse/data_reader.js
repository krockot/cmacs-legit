// The Cmacs Project.

goog.provide('ccc.parse.DataReader');

goog.require('ccc.Data');
goog.require('goog.Promise');



/**
 * Data reader interface.
 *
 * {@code DataReader} consumers should call {@code read} when they want a new
 * Data object from the underlying stream. If no more Data objects are available
 * {@code read} returns {@code null}.
 *
 * @interface
 * @public
 */
ccc.parse.DataReader = function() {};


/**
 * @type {function():!goog.Promise.<!ccc.Data>}
 * @public
 */
ccc.parse.DataReader.prototype.read;
