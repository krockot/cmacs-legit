// The Cmacs Project.

goog.provide('ccc.Thread');

goog.require('ccc.Error');
goog.require('goog.Timer');



/**
 * A thread abstraction which can be used to control or query the state of a
 * running thunk series. A single thread is started from an entry point
 * ({@code ccc.ThreadEntryPoint}), which is any function that takes a
 * {@code ccc.Continuation} and returns a {@code Thunk}.
 *
 * Entry points are commonly obtained by calling one of either
 * {@code ccc.expand}, {@code ccc.compile}, or {@code ccc.eval}.
 *
 * @param {ccc.ThreadEntryPoint} entryPoint
 * @param {!ccc.ThreadOptions=} opt_options
 * @constructor
 */
ccc.Thread = function(entryPoint, opt_options) {
  /** @private {ccc.ThreadEntryPoint} */
  this.entryPoint_ = entryPoint;

  /** @private {!ccc.ThreadOptions} */
  this.options_ = (goog.isDef(opt_options)
    ? opt_options
    : /** @type {!ccc.ThreadOptions} */ ({}));

  if (!goog.isDef(this.options_.thunksPerSlice))
    this.options_.thunksPerSlice = ccc.Thread.DEFAULT_THUNKS_PER_SLICE_;
  if (!goog.isDef(this.options_.sliceDelay))
    this.options_.sliceDelay = ccc.Thread.DEFAULT_SLICE_DELAY_;

  /** @private {boolean} */
  this.running_ = false;

  /** @private {?ccc.Data} */
  this.result_ = null;

  /** @private {?function(ccc.Data)} */
  this.callback_ = null;

  /** @private {number} */
  this.thunkCounter_ = 0;

  /** @private {number} */
  this.startTime_ = 0;

  /** @private {number} */
  this.age_ = 0;
}


/**
 * Run the thread.
 *
 * @param {function(ccc.Data)} callback
 */
ccc.Thread.prototype.run = function(callback) {
  if (this.running_)
    throw new Error('Thread already running');
  if (!goog.isNull(this.result_))
    throw new Error('Thread can only be run once');
  this.callback_ = callback;
  this.running_ = true;
  this.startTime_ = Date.now();
  this.runSlice_(this.entryPoint_(goog.bind(this.runContinuation_, this)));
};


/**
  * The default number of synchronous thunks per slice.
  *
  * @private {number}
  */
ccc.Thread.DEFAULT_THUNKS_PER_SLICE_ = 5000;


/**
 * The default delay between scheduled slices, in milliseconds.
 *
 * @private {number}
 */
ccc.Thread.DEFAULT_SLICE_DELAY_ = 0;


/**
 * Indicates if the thread is still running.
 *
 * @return {boolean}
 */
ccc.Thread.prototype.running = function() {
  return this.running_;
};


/**
 * Returns the result of the thread if it's finished running, or {@code null}
 * otherwise.
 *
 * @return {?ccc.Data}
 */
ccc.Thread.prototype.result = function() {
  return this.result_;
};


/**
 * The continuation which will ultimately receive the result of this thread's
 * execution.
 *
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Thread.prototype.runContinuation_ = function(result) {
  this.running_ = false;
  this.result_ = result;
  this.age_ = Date.now() - this.startTime_;
  goog.asserts.assert(!goog.isNull(this.callback_));
  this.callback_(result);
  return ccc.Thread.HALTING_THUNK_;
};


/**
 * Executes a single thread slice and schedules the next one if necessary.
 *
 * @param {ccc.Thunk} thunk
 * @private
 */
ccc.Thread.prototype.runSlice_ = function(thunk) {
  var thunksRemaining = this.options_.thunksPerSlice;
  while (thunksRemaining-- && thunk !== ccc.Thread.HALTING_THUNK_) {
    thunk = thunk();
    this.thunkCounter_++;
  }
  if (thunk !== ccc.Thread.HALTING_THUNK_) {
    goog.Timer.callOnce(goog.bind(this.runSlice_, this, thunk),
        this.options_.sliceDelay);
  }
};


/**
 * The halting thunk.
 *
 * @private {ccc.Thunk}
 */
ccc.Thread.HALTING_THUNK_ = function() {
  return ccc.Thread.HALTING_THUNK_;
};



/**
 * Any function which takes a {@code ccc.Continuation} and returns a
 * {@code ccc.Thunk} can be treated as an entry point.
 *
 * @typedef {function(!ccc.Continuation):ccc.Thunk}
 */
ccc.ThreadEntryPoint;



/**
 * Set of options which may be used to configure a new thread.
 *
 * @typedef {{
 *   thunksPerSlice: (number|undefined),
 *   sliceDelay: (number|undefined)
 * }}
 */
ccc.ThreadOptions;
