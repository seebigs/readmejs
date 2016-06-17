

var cache = {};

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
 * @param {Object} `sarah` Beth
 * @param {String} `mary` Jane
 * @return {String} common interests
 */
function galz (sarah, mary) {

}

/**
 * This is not very good
 * Just throw it away
 * @module two
 */
module.exports = {
    pub1: pub1,
    pub2: galz,
    SECRET: SECRET,
    color: 'red'
};
