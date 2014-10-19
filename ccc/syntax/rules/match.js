// The Cmacs Project.

goog.provide('ccc.syntax.Match');

goog.require('ccc.syntax.Capture');
goog.require('ccc.syntax.CaptureSet');
goog.require('goog.asserts');
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
 * for each variable into a new higher-order capture. For example, if the input
 * set is:
 *
 * matches: [
 *   { 'a': Capture(NIL), 'b': Capture(#t) },
 *   { 'a': Capture(42), 'b': Capture(#f) }
 * ]
 *
 * Then the joined output Match will be:
 *
 * {
 *   'a': Capture([Capture(NIL), Capture(42)])
 *   'b': Capture([Capture(#t), Capture(#f)])
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



