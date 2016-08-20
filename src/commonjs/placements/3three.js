

var junk = require('path/to/junk.js');

/**
 * And man, is it secret
 */
var GLOBAL = 'globalval';

/**
 * Identifier > CallExpression
 * M3
 * @module ModuleThree
 */

var Module3 = (function () {

    /**
     * Actually, it's not secret
     */
    var SECRET = 'secretval';

    /*
     * Description private1
     * @param `foo` bar
     * @return null
     */
    function private1 () {

    }

    /**
     * Description pub1
     *
     * Example: pub1("Gene Wilder")
     *
     * @param {Object} `willy` wonka
     * @return {String} `vanilla` factory
     * @return {String} `chocolate` factory
     */
    var pub1 = function (willy) {

    };

    /**
     * Description galz
     * And more galz
     * @param {Object} `sarah` Beth
     * @param `mary` Jane
     * @return {String} common interests
     */
    function galz (sarah, mary) {

    }

    return {
        pub1: pub1,
        pub2: galz,
        GLOBAL: GLOBAL,
        SECRET: SECRET,
        color: 'red'
    };

})();

/**
 * Extra extra extra...
 * @param long fellow deeds
 */
Module3.extra = function extra (long) {

}

module.exports = Module3;
