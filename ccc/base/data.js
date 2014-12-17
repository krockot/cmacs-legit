// The Cmacs Project.

goog.provide('ccc.base.data');

goog.require('ccc.base');
goog.require('ccc.core');


/**
 * Procedures for dealing with general data or primitive types which don't
 * warrant their own distinct definitions file.
 */
ccc.base.registerProcedures({
  'eq?': {
    args: [null, null],
    impl: ccc.eq
  },

  'eqv?': {
    args: [null, null],
    impl: ccc.eqv
  },

  'equal?': {
    args: [null, null],
    impl: ccc.equal
  },

  'not': {
    args: [null],
    impl: function(x) { return x === false; }
  },

  'boolean?': {
    args: [null],
    impl: function(x) { return x === true || x === false; }
  },

  'symbol?': {
    args: [null],
    impl: ccc.isSymbol
  },

  'symbol->string': {
    args: [ccc.isSymbol],
    impl: function(symbol) {
      return symbol.name();
    }
  },

  'gensym': {
    args: [],
    impl: /** @this {ccc.Library.ProcedureContext} */ function() {
      while (true) {
        var name = '#\0' + (Math.random() * 1e9 >>> 0).toString();
        if (goog.isNull(this.environment.get(name))) {
          this.environment.setValue(name, ccc.UNSPECIFIED);
          return new ccc.Symbol(name);
        }
      }
    }
  },

  'error': {
    args: [ccc.isString],
    impl: function(message) {
      return new ccc.Error(message);
    }
  },

  'force': {
    args: [ccc.isPromise],
    thunk: true,
    impl: /** @this {ccc.Library.ProcedureContext} */ function(promise) {
      return promise.force(this.environment, this.continuation);
    }
  },
});
