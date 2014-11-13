// The Cmacs Project.

goog.provide('ccc.parse.DataReader');



/**
 * Data reader interface.
 *
 * @interface
 */
ccc.parse.DataReader = function() {};


/**
 * Reads a new {@code ccc.Data} object from the underlying stream. If no data
 * objects are currently available, {@code read} returns {@code undefined}. If
 * the underlying input stream has been terminated this returns {@code null}.
 * If a parsing error occurred this returns a {@code ccc.Error}.
 *
 * @return {(?ccc.Data|!ccc.Error|undefined)}
 */
ccc.parse.DataReader.prototype.read = function() {};
