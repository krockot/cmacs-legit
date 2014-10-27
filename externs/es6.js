// The Cmacs Project.

/**
 * @fileoverview Externs needed for ES6 features which aren't yet supported by
 * the Closure compiler.
 */



/**
 * The ES6 Symbol type.
 *
 * NOTE: This is not really used anywhere. It's just to make the compiler happy.
 * The real Symbol must be provided by the JS runtime and has a typeof 'symbol'.
 *
 * @constructor
 */
function Symbol() {}


/**
 * @param {string} name
 * @return {!Symbol}
 */
Symbol.for = function(name) {};


/**
 * @param {!Symbol} symbol
 * @return {string}
 */
Symbol.keyFor = function(symbol) {};



/**
 * This type alias for Symbol allows type specifiers to use what will presumably
 * be the builtin type name for symbols when cc supports them.
 *
 * @typedef {!Symbol}
 */
var symbol;
