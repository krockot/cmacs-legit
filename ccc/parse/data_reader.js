// The Cmacs Project.

goog.provide('ccc.parse.DataReader');

goog.require('goog.Promise');



/**
 * Data reader interface.
 *
 * {@code DataReader} consumers should call {@code read} when they want a new
 * Data object from the underlying stream. If no more Data objects are available
 * {@code read} returns {@code null}.
 *
 * {@code readSyntax} can be used to read Data objects wrapped in Syntax objects
 * for additional context.
 *
 * @interface
 */
ccc.parse.DataReader = function() {};


/**
 * @type {function():!goog.Promise.<ccc.Data, !ccc.Error>}
 */
ccc.parse.DataReader.prototype.read;


/**
 * @type {function():!goog.Promise.<!ccc.Syntax, !ccc.Error>}
 */
ccc.parse.DataReader.prototype.readSyntax;
