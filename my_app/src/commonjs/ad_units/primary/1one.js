

var junk = require('path/to/junk.js');

/**
 * And man, is it secret
 */
var GLOBAL = 'globalval';

/**
 * You should never see this!
 * @module WRONG
 */

/**
 * CallExpression
 * M1
 * @module ModuleOne
 * @api public
 */

module.exports = (function () {

    /**
     * Actually, it's not secret
     */
    var SECRET = 'secretval';

    /*
     * FunctionDeclaration
     * @param `foo` bar
     * @return null
     */
    function private1 () {

    }

    /**
     *
     * Example: pub1("Gene Wilder")
     * @param {Object} `willy` wonka
     * @return {String} vanilla factory
     * @return {String} chocolate factory
     */
    var pub1 = function (willy) {

    };

    /**
     * FunctionDeclaration
     * @param {Object} `sarah` Beth
     * @param {String} `mary` Jane
     * @return {String} common interests
     */
    function galz (sarah, mary) {

    }

    return {
        pub1: pub1,
        pub2: galz,
        GLOBAL: GLOBAL,
        SECRET: SECRET,
        number: 54
    };

})();
