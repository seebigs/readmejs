
other.stuff = false;

/**
 * Init Dollar
 * @param `selector` description
 * @return a wrapped instance
 */
$ = function (selector, context) {
    $.fn.init(selector, context);
};

/**
 * for instances
 */
$.fn = $.again = $.prototype = {
    foo: 'bar',
    willy: function (wonka) {

    }
};

/**
 * Hello Global Module
 */
$.fn.foo.bar.baz.add = function (selector, context) {
    $.fn.foo = crap;
};

/**
 * meaning of life
 */
$.max = 54;
