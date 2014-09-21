// Cmacs project. Copyright forever, the universe.


/**
 * @typedef {function(...)}
 */
chrome.EventListener;


/**
 * API event.
 * @constructor
 */
chrome.Event = function() {};


/**
 * @param {!chrome.EventListener} listener
 */
chrome.Event.prototype.addListener = function(listener) {};


/**
 * @param {!chrome.EventListener} listener
 */
chrome.Event.prototype.removeListener = function(listener) {};


/**
 * namespace
 * @const
 */
chrome.app = {}


/**
 * namespace
 * @const
 */
chrome.app.runtime = {}


/**
 * @type {!chrome.Event}
 */
chrome.app.runtime.onLaunched;
