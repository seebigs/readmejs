

var junk = require('path/to/junk.js');

/**
 * CallExpression
 * M5
 * @module ModuleFive
 */

module.exports = (function () {

    var pub = {};

    /**
     * Description private1
     * @param `a` aar
     * @param `b` bar
     * @param `c` car
     * @return null
     */
    function private1 (a, b, c) {
        pub.SECRET = 'newval';
    }

    /**
     * Actually, it's not secret
     */
    pub.SECRET = 'secretval';

    /**
     * Description pub1
     *
     * Example: pub1("Gene Wilder")
     *
     * @param {Object} `willy` wonka
     * @return {String} `vanilla` factory
     * @return {String} `chocolate` factory
     */
    pub.pub1 = function (willy) {
        pub.pub1 = function (override) {

        };
    };

    pub.pub2 = private1;

    pub.pub1 = function (later) {

    };

    return pub;

})();
