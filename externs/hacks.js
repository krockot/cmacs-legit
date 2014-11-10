// The Cmacs Project.

// Miscellaneous extern hacks to make the compiler happy.


/**
 * Firefox defines a displayName property on Function objects. Some Closure
 * library code uses this and makes the compiler angry. Extern to pacify.
 *
 * @type {string|undefined}
 */
Function.prototype.displayName;


/**
 * ES6 defines this function and I want to use it.
 *
 * @type {function(*):boolean}
 */
Number.isInteger;
