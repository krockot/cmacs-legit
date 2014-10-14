// The Cmacs Project.

goog.provide('ccc.syntax.Capture');
goog.provide('ccc.syntax.CaptureSet');
goog.provide('ccc.syntax.Match');
goog.provide('ccc.syntax.Pattern');

goog.require('ccc.base');
goog.require('goog.array');
goog.require('goog.object');



/**
 * A Match is the result of a single pattern matching attempt on an input form.
 *
 * @param {boolean} success
 * @param {!ccc.syntax.CaptureSet=} opt_captures
 * @constructor
 * @struct
 * @public
 */
ccc.syntax.Match = function(success, opt_captures) {
  /**
   * Indicates whether or not the match operation was successful.
   * @public {boolean}
   */
  this.success = success;

  /**
   * If the match operation was successful, this contains the complete set of
   * data necessary to expand a corresponding, well-formed template.
   *
   * @public {!ccc.syntax.CaptureSet}
   */
  this.captures = goog.isDef(opt_captures) ? opt_captures : {};
};


/**
 * Merges a capture set into this match's own. There should be no overlapping
 * capture names between the two sets.
 *
 * @param {!ccc.syntax.CaptureSet} captures
 * @public
 */
ccc.syntax.Match.prototype.mergeCaptures = function(captures) {
  var newKeys = goog.object.getKeys(captures);
  for (var i = 0; i < newKeys.length; ++i) {
    var key = newKeys[i];
    if (goog.object.containsKey(this.captures, key))
      throw new Error('Duplicate pattern variable name: ' + key);
    this.captures[key] = captures[key];
  }
};


/**
 * Joins a list of matches together. Every match in the list should have an
 * identical set of capture variables. The output Match combines the captures
 * for each variable into a new higher-rank capture. For example, if the input
 * set is:
 *
 * matches: [
 *   { 'a': Capture(NIL, 0), 'b': Capture(#t, 0) },
 *   { 'a': Capture(42, 0), 'b': Capture(#f, 0) }
 * ]
 *
 * Then the joined output Match will be:
 *
 * {
 *   'a': Capture([Capture(NIL, 0), Capture(42, 0)], 1)
 *   'b': Capture([Capture(#t, 0), Capture(#f, 0)], 1)
 * }
 *
 * @param {!Array.<!ccc.syntax.Match>} matches
 * @return {!ccc.syntax.Match}
 * @public
 */
ccc.syntax.Match.joinMatches = function(matches) {
  goog.asserts.assert(matches.length > 0);
  var newMatch = new ccc.syntax.Match(true);
  goog.object.forEach(matches[0].captures, function(capture, name) {
    newMatch.captures[name] = new ccc.syntax.Capture(goog.array.map(matches,
        function(match) {
          goog.asserts.assert(goog.object.containsKey(match.captures, name));
          return match.captures[name];
        }));
  });
  return newMatch;
};



/**
 * A Capture holds information about a single pattern variable captured during
 * a syntax pattern matching operation. Captures may represent single values or
 * nested value series with arbitrary depth.
 *
 * @param {!ccc.base.Object|!Array.<!ccc.syntax.Capture>} contents The contents
 *     of this new capture. May either be a single base Object or a collection
 *     of equal-rank captures.
 * @constructor
 * @public
 */
ccc.syntax.Capture = function(contents) {
  /** @private {number} */
  this.rank_ = 0;

  /** @private {!ccc.base.Object|!Array.<!ccc.syntax.Capture>} */
  this.contents_ = contents;

  if (contents instanceof Array) {
    if (contents.length > 0) {
      var baseRank = contents[0].rank_;
      goog.array.forEach(contents, function(capture) {
        goog.asserts.assert(capture.rank_ == baseRank);
      });
      this.rank_ = baseRank + 1;
    } else {
      goog.asserts.assert(this.rank_ > 0);
    }
  } else {
    goog.asserts.assert(this.rank_ == 0);
  }
};


/**
 * Indicates if another Capture is equivalent to this one.
 *
 * @param {!ccc.syntax.Capture} other
 * @return {boolean}
 * @private
 */
ccc.syntax.Capture.prototype.equal = function(other) {
  if (this.rank_ !== other.rank_)
    return false;
  if (!(this.contents_ instanceof Array) && !(other.contents_ instanceof Array))
    return this.contents_.equal(other.contents_);
  if (this.contents_.length !== other.contents_.length)
    return false;
  goog.asserts.assert(this.contents_ instanceof Array);
  return goog.array.every(this.contents_, function(capture, i) {
    return capture.equal(other.contents_[i]);
  });
};



/**
 * A CaptureSet is a map from symbol name to {@code ccc.syntax.Capture} objects.
 * This is the output of a successful match operation.
 *
 * @typedef {!Object.<string, !ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.CaptureSet;



/**
 * Syntax pattern which can match an input form and extract data for template
 * expansion.
 *
 * @param {!Object.<string, boolean>} literals The set of input symbol names
 *     which should be matched literally on input forms.
 * @param {!ccc.base.Object} form The pattern form.
 * @constructor
 * @public
 */
ccc.syntax.Pattern = function(literals, form) {
  /** @private {!Object.<string, boolean>} */
  this.literals_ = literals;

  /** @private {!ccc.base.Object} */
  this.form_ = form;
};


/**
 * The literal token used to represent a pattern repetition or template
 * expansion.
 *
 * @public {string}
 * @const
 */
ccc.syntax.Pattern.ELLIPSIS_NAME = '...';


/**
 * Attempts to match an input form against the pattern, extracting a set of
 * variable captures if successful.
 *
 * @param {!ccc.base.Object} input
 * @return {!ccc.syntax.Match}
 */
ccc.syntax.Pattern.prototype.match = function(input) {
  return this.matchPattern_(input, this.form_);
};


/**
 * Attempts to match an input form against a pattern form, extracting a set of
 * variable captures if successful.
 *
 * @param {!ccc.base.Object} input
 * @param {!ccc.base.Object} pattern
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchPattern_ = function(input, pattern) {
  if (pattern.isSymbol())
    return this.matchSymbol_(input, /** @type {!ccc.base.Symbol} */ (pattern));
  if (pattern.isVector()) {
    if (!input.isVector())
      return new ccc.syntax.Match(false);
    return this.matchVector_(/** @type {!ccc.base.Vector} */ (input),
        /** @type {!ccc.base.Vector} */ (pattern));
  }
  if (pattern.isPair()) {
    if (!input.isPair() && !input.isNil())
      return new ccc.syntax.Match(false);
    return this.matchList_(input, /** @type {!ccc.base.Pair} */ (pattern));
  }
  if (pattern.isString())
    return new ccc.syntax.Match(input.isString() && input.eq(pattern));
  if (pattern.isChar())
    return new ccc.syntax.Match(input.isChar() && input.eq(pattern));
  if (pattern.isNumber())
    return new ccc.syntax.Match(input.isNumber() && input.eq(pattern));
  if (pattern.isNil())
    return new ccc.syntax.Match(input.isNil());
  if (pattern.isTrue())
    return new ccc.syntax.Match(input.isTrue());
  if (pattern.isFalse())
    return new ccc.syntax.Match(input.isUnspecified());
  if (pattern.isUnspecified())
    return new ccc.syntax.Match(input.isUnspecified());
  return new ccc.syntax.Match(false);
};


/**
 * Matches a symbol pattern against an input form. This is either a literal
 * match, which can fail, or an unopinionated capture (i.e. any input matches
 * the non-literal symbol case.)
 *
 * @param {!ccc.base.Object} input
 * @param {!ccc.base.Symbol} symbol
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchSymbol_ = function(input, symbol) {
  if (goog.object.containsKey(this.literals_, symbol.name())) {
    return new ccc.syntax.Match(input.isSymbol() &&
        input.name() == symbol.name());
  }
  var match = new ccc.syntax.Match(true);
  match.captures[symbol.name()] = new ccc.syntax.Capture(input);
  return match;
};


/**
 * Matches a vector pattern against an input vector.
 *
 * @param {!ccc.base.Vector} input
 * @param {!ccc.base.Vector} pattern
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchVector_ = function(input, pattern) {
  if (pattern.size() == 0)
    return new ccc.syntax.Match(input.size() == 0);
  var lastPatternElement = pattern.get(pattern.size() - 1);
  var repeatLast = lastPatternElement.isSymbol() &&
      lastPatternElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME;
  if (repeatLast && pattern.size() == 1)
    throw new Error('Invalid ellipsis placement.');

  var match = new ccc.syntax.Match(true);
  for (var i = 0; i < pattern.size(); ++i) {
    var patternElement = pattern.get(i);
    // The current element should never be an ellipsis.
    if (patternElement.isSymbol() &&
        patternElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
      throw new Error('Invalid ellipsis placement');
    }
    if (i == pattern.size() - 2 && repeatLast) {
      var tailMatch = this.matchVectorTail_(input, i, patternElement);
      if (!tailMatch.success)
        return tailMatch;
      match.mergeCaptures(tailMatch.captures);
      return match;
    }
    var elementMatch = this.matchPattern_(/** @type {!ccc.base.Object} */ (
        input.get(i)), patternElement);
    if (!elementMatch.success)
      return elementMatch;
    match.mergeCaptures(elementMatch.captures);
  }
  return match;
};


/**
 * Matches a pattern against each remaining item in an input vector. Returns a
 * cumulative {@code ccc.syntax.Match} object.
 *
 * @param {!ccc.base.Vector} input
 * @param {number} startIndex
 * @param {!ccc.base.Object} elementPattern
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchVectorTail_ = function(
    input, startIndex, elementPattern) {
  if (input.size() == startIndex)
    return this.matchEmptyTail_(elementPattern);
  var matches = [];
  for (var i = startIndex; i < input.size(); ++i) {
    var inputElement = /** @type {!ccc.base.Object} */ (input.get(i));
    var elementMatch = this.matchPattern_(inputElement, elementPattern);
    if (!elementMatch.success)
      return elementMatch;
    matches.push(elementMatch);
  }
  return ccc.syntax.Match.joinMatches(matches);
};


/**
 * Matches a list pattern against an input list.
 *
 * @param {!ccc.base.Object} input
 * @param {!ccc.base.Pair} pattern
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchList_ = function(input, pattern) {
  var match = new ccc.syntax.Match(true);
  var inputElement = /** @type {!ccc.base.Object} */ (input);
  var patternElement = /** @type {!ccc.base.Object} */ (pattern);
  var matchTail = false;
  while (patternElement.isPair()) {
    var nextPattern = patternElement.cdr();
    if (nextPattern.isPair() && nextPattern.car().isSymbol() &&
        nextPattern.car().name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
      if (!nextPattern.cdr().isNil())
        throw new Error('Invalid ellipsis placement');
      matchTail = true;
      break;
    }
    if (!inputElement.isPair())
      break;
    var elementMatch = this.matchPattern_(inputElement.car(),
        patternElement.car());
    if (!elementMatch.success)
      return elementMatch;
    match.mergeCaptures(elementMatch.captures);
    patternElement = patternElement.cdr();
    inputElement = inputElement.cdr();
  }

  if (matchTail) {
    var tailMatch = this.matchListTail_(inputElement, patternElement.car());
    if (!tailMatch.success)
      return tailMatch;
    match.mergeCaptures(tailMatch.captures);
    return match;
  }

  var remainderMatch = this.matchPattern_(inputElement, patternElement);
  if (!remainderMatch.success)
    return remainderMatch;
  match.mergeCaptures(remainderMatch.captures);
  return match;
};


/**
 * Matches a pattern against each remaining item in an input list. Returns a
 * cumulative {@code ccc.syntax.Match} object.
 *
 * @param {!ccc.base.Object} input
 * @param {!ccc.base.Object} elementPattern
 * @return {!ccc.syntax.Match}
 * @private
 */
ccc.syntax.Pattern.prototype.matchListTail_ = function(input, elementPattern) {
  if (input.isNil())
    return this.matchEmptyTail_(elementPattern);
  var matches = [];
  while (input.isPair()) {
    var elementMatch = this.matchPattern_(input.car(), elementPattern);
    if (!elementMatch.success)
      return elementMatch;
    matches.push(elementMatch);
    input = input.cdr();
  }
  if (!input.isNil())
    return new ccc.syntax.Match(false);
  return ccc.syntax.Match.joinMatches(matches);
};


/**
 * Extracts a match of empty captures for all non-literal symbols in a pattern.
 * Useful when a (PATTERN ...) matches against NIL or the end of an input
 * vector.
 *
 * @param {!ccc.base.Object} pattern
 * @return {!ccc.syntax.Match}
 */
ccc.syntax.Pattern.prototype.matchEmptyTail_ = function(pattern) {
  var match = new ccc.syntax.Match(true);
  if (pattern.isSymbol() &&
      !goog.object.containsKey(this.literals_, pattern.name())) {
    match.captures[pattern.name()] = new ccc.syntax.Capture([]);
    return match;
  }
  if (pattern.isVector()) {
    var repeatLast = false;
    if (pattern.size() > 1) {
      var lastElement = pattern.get(pattern.size() - 1);
      if (lastElement.isSymbol() &&
          lastElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
        repeatLast = true;
      }
    }
    for (var i = 0; i < pattern.size() - (repeatLast ? 1 : 0); ++i) {
      var current = pattern.get(i);
      if (current.isSymbol() &&
          current.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
        throw new Error('Invalid ellipsis placement');
      }
      match.mergeCaptures(this.matchEmptyTail_(pattern.get(i)).captures);
    }
    if (repeatLast) {
      var lastCaptures = this.matchEmptyTail_(pattern.get(i)).captures;
      var newCaptures = {};
      goog.object.forEach(lastCaptures, function(capture, name) {
        newCaptures[name] = new ccc.syntax.Capture([capture]);
      });
      match.mergeCaptures(newCaptures);
    }
    return match;
  }
  if (pattern.isPair()) {
    while (pattern.isPair()) {
      var current = pattern.car();
      if (current.isSymbol() &&
          current.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
        throw new Error('Invalid ellipsis placement');
      }
      var next = pattern.cdr();
      if (next.isPair() && next.car().isSymbol() &&
          next.car().name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
        if (!next.cdr().isNil())
          throw new Error('Invalid ellipsis placement');
        var lastCaptures = this.matchEmptyTail_(current).captures;
        var newCaptures = {};
        goog.object.forEach(lastCaptures, function(capture, name) {
          newCaptures[name] = new ccc.syntax.Capture([capture]);
        });
        match.mergeCaptures(newCaptures);
        return match;
      }
      match.mergeCaptures(this.matchEmptyTail_(current).captures);
      pattern = pattern.cdr();
    }
    match.mergeCaptures(this.matchEmptyTail_(pattern).captures);
    return match;
  }
  return match;
};
