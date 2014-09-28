// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Pair');

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
