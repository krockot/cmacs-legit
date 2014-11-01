// The Cmacs Project.

// Miscellaneous extern hacks to make the compiler happy.


/**
 * Firefox defines a displayName property on Function objects. Some Closure
 * library code uses this and makes the compiler angry. Extern to pacify.
 *
 * @type {string|undefined}
 */
Function.prototype.displayName;
