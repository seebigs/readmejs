

var junk = require('path/to/junk.js');

var GLOBAL = 'globalval';

module.exports = (function () {

    var SECRET = 'secretval';

    function private1 () {

    }

    var pub1 = function () {

    };

    function galz (sarah, mary) {

    }

    return {
        pub1: pub1,
        pub2: galz,
        GLOBAL: GLOBAL,
        SECRET: SECRET,
        color: 'red',
        lazy: function (punks) { alert(punks); }
    };

})();
