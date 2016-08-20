

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
 * @class PubOne with classical inheritance
 *
 * @extends Factory with new stuff
 * @param {Object} `willy` wonka
 * @return {String} `vanilla` factory
 * @return {String} `chocolate` factory
 */
var pub1 = function (willy) {

};

/**
 * Description galz
 * @hottness Active
 * @param {Object} `sarah` Beth
 * @param {String} `mary` Jane
 * @return {String} common interests
 */
function galz (sarah, mary) {

}

/**
 * ObjectExpression
 * M2
 * @module ModuleTwo
 */
module.exports = {
    pub1: pub1,
    pub2: galz,
    SECRET: SECRET,
    flag: true,

    /**
     * Sorry to define this here
     * @emotion sad
     */
    obj: {
        pub1: pub1,
        pub2: galz,
        SECRET: SECRET,
        flag: true
    }
};
