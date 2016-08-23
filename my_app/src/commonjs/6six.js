
/**
 * Identifier > FunctionExpression
 * M6
 * @extends OtherModule but does not modify
 * @param {String} a for the money
 * @param {String} b for the show
 * @returns {Number} 8675309
 * @module ModuleSix
 */
var moduleFn = function (a, b) {

};

/**
 * and this is a crazy extension
 * @param c {Animal} cat
 * @param d {Animal} dog
 */
moduleFn.go = function go (c, d) {

};

/**
 * how long
 */
moduleFn.time = '123';

/**
 * This should probably be ignored
 */
module.exports = moduleFn;
