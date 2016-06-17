
var fs = require('fs');

module.exports = (function () {

    var hasProp = Object.prototype.hasOwnProperty;

    function each (collection, iteratee, thisArg) {
        if (collection) {
            if (typeof collection.length !== 'undefined') {
                for (var i = 0, len = collection.length; i < len; i++) {
                    if (iteratee.call(thisArg, collection[i], i, collection) === false) {
                        return;
                    }
                }

            } else {
                for (var prop in collection) {
                    if (hasProp.call(collection, prop)) {
                        if (iteratee.call(thisArg, collection[prop], prop, collection) === false) {
                            return;
                        }
                    }
                }
            }
        }
    }

    function exists (thing) {
        return typeof thing !== 'undefined' && thing !== '' && thing !== null;
    }

    function getPropertyIfPresent (object, path, rest) {
        if (!object) { return void 0; }

        if (path.indexOf('.') !== -1) {
            path = path.split('.');
            return getPropertyIfPresent(object, path.shift(), path);

        } else {
            if(!rest || rest.length === 0) {
                return object[path];
            } else {
                if(!object.hasOwnProperty(path) || !exists(object[path])) {
                    return void 0;
                }
                return getPropertyIfPresent(object[path], rest.shift(), rest);
            }
        }
    }

    function readFile (filepath) {
        try {
            return fs.readFileSync(filepath, 'utf8');

        } catch (err) {
            console.log(err);
        }
    }

    return {
        each: each,
        getPropertyIfPresent: getPropertyIfPresent,
        readFile: readFile
    };

})();
