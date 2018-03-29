
function getThing() {
    // return '_' + aa;
    // return foo.bar.exec();
    // return aa.bb.cc.dd;
    // return 3;
}

var fn = (function (h,q) {
    return function () {
        console.log('hi');
    };
})();

var foo = {
    bar: {
        exec: function (x) {
            return false;
        },
    },
};

var aa = {
    bb: {
        cc: {
            dd: 456
        }
    }
};

// var foo = getThing();

// var foo = function BLAH (x,y = 10) { console.log(); };

$.fn.thing.too = {
    // a: 'hello',
    // b: {
    //     sub: [2,3],
    // },
    c: fn,
    // c: foo.bar.exec(),
    // c: aa.bb.cc.dd,
};
