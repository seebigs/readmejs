

var junk = require('path/to/junk.js');

/**
 * This is the best
 * It's really something
 * @module six
 */

module.exports = (function () {

    var pub = {};

    /**
     * Actually, it's not secret
     */
    pub.SECRET = 'secretval';

    /**
     * Description private1
     * @param `foo` bar
     * @return null
     */
    function private1 (a, b, c) {

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
    pub.pub1 = function (willy) {

    };

    pub.pub2 = private1;

    return pub;

})();
