
/**
 * Trigger this junk
 * @param {String} eventName to be triggered
 * @return {dollar} instance of dollar
 */

$.fn.trigger = function trigger (eventName) {
    return this[0].click();
};
