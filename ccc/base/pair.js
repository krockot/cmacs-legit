// The Cmacs Project.


goog.provide('ccc.base.Pair');

goog.require('ccc.base.NIL');
goog.require('ccc.base.Object');



/**
 * Pair type.
 *
 * @param {!ccc.base.Object} car
 * @param {!ccc.base.Object} cdr
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Pair = function(car, cdr) {
  /** @private {!ccc.base.Object} */
  this.car_ = car;

  /** @private {!ccc.base.Object} */
  this.cdr_ = cdr;
};
goog.inherits(ccc.base.Pair, ccc.base.Object);


/** @override */
ccc.base.Pair.prototype.toString = function() {
  var str = '(' + this.car_.toString();
  if (this.cdr_.isNil()) {
    return str + ')';
  }
  if (this.cdr_.isPair()) {
    return str + this.cdr_.toStringInner_() + ')';
  }
  return str + ' . ' + this.cdr_.toString() + ')';
};


/**
 * Used by toString to display inner elements of a list.
 *
 * @return {string}
 */
ccc.base.Pair.prototype.toStringInner_ = function() {
  var str = ' ' + this.car_.toString();
  if (this.cdr_.isNil()) {
    return str;
  }
  if (this.cdr_.isPair()) {
    return str + this.cdr_.toStringInner_();
  }
  return str + ' . ' + this.cdr_.toString();
};


/** @override */
ccc.base.Pair.prototype.equal = function(other) {
  return other.isPair() &&
      this.car_.equal(other.car_) &&
      this.cdr_.equal(other.cdr_);
};


/** @override */
ccc.base.Pair.prototype.isPair = function() {
  return true;
};


/**
 * The first element of the pair.
 *
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.prototype.car = function() {
  return this.car_;
};


/**
 * The second element of the pair.
 *
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.prototype.cdr = function() {
  return this.cdr_;
};


/**
 * Creates a nested Pair sequence to represent a list of objects with an
 * optional non-NIL tail.
 *
 * @param {!Array.<!ccc.base.Object>} objects
 * @param {!ccc.base.Object=} opt_tail
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.makeList = function(objects, opt_tail) {
  var list = goog.isDef(opt_tail) ? opt_tail : ccc.base.NIL;
  for (var i = objects.length - 1; i >= 0; --i) {
    list = new ccc.base.Pair(objects[i], list);
  }
  return list;
};


/** @override */
ccc.base.Pair.prototype.compile = function(environment) {
  return this.car_.compile(environment).then(function(compiledHead) {
    if (compiledHead.isSymbol()) {
      var headValue = environment.get(compiledHead.name());
      if (headValue.isTransformer()) {
        return headValue.transform(environment, this.cdr_).then(
            function(transformed) {
          return transformed.compile(environment);
        });
      }
    }
    var compileArgs = function(args) {
      if (args.isNil())
        return goog.Promise.resolve(ccc.base.NIL);
      if (!args.isPair())
        return goog.Promise.reject(new Error('Invalid list expression'));
      return compileArgs(args.cdr_).then(function(cdr) {
        return args.car_.compile(environment).then(function(car) {
          return new ccc.base.Pair(car, cdr);
        });
      });
    };
    return compileArgs(this.cdr_).then(function(compiledArgs) {
      return new ccc.base.Pair(compiledHead, compiledArgs);
    });
  }, null, this);
};


/** @override */
ccc.base.Pair.prototype.eval = function(environment) {
  return this.car_.eval(environment).then(function(head) {
    var evalArgs = function(args) {
      if (args.isNil())
        return goog.Promise.resolve(ccc.base.NIL);
      if (!args.isPair())
        return goog.Promise.reject(new Error('Invalid list exression'));
      return evalArgs(args.cdr_).then(function(cdr) {
        return args.car_.eval(environment).then(function(car) {
          return new ccc.base.Pair(car, cdr);
        });
      });
    };
    return evalArgs(this.cdr_).then(function(args) {
      return head.apply(environment, args);
    });
  }, null, this);
};
