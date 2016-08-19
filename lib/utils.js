
var del = require('del');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

module.exports = (function () {

    var arrSlice = Array.prototype.slice;
    var hasProp = Object.prototype.hasOwnProperty;

    function cleanDir (path) {
        try {
            del.sync(path);

        } catch (err) {
            console.log(err);
        }
    }

    function debug (obj) {
        console.log();
        console.log(JSON.stringify(obj, null, 4));
        console.log();
        console.log();
    }

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

    // mutates first argument
    // ignores undefined values
    function extend () {
        var ret = arguments[0];

        each(arrSlice.call(arguments, 1), function (ext) {
            each(ext, function (val, key) {
                if (typeof val !== 'undefined') {
                    ret[key] = val;
                }
            });
        }, this);

        return ret;
    }

    function getPropertyIfPresent (object, path, rest) {
        if (!object) {
            return void 0;
        }

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

    function listFiles (dir, list) {
        list = list || [];

        var dirs = [];
        var files = [];

        each(fs.readdirSync(dir), function (item) {
            var path = dir + '/' + item;
            if (fs.statSync(path).isDirectory()) {
                dirs.push(path);
            } else {
                files.push(path);
            }
        });

        each(dirs, function (d) {
            listFiles(d, list);
        });

        each(files, function (f) {
            list.push(f);
        });

        return list;
    }

    function readFile (filepath) {
        try {
            return fs.readFileSync(filepath, 'utf8');

        } catch (err) {
            console.log(err);
            console.log('Attempting to resolve: ' + path.resolve(filepath));
        }
    }

    /* eslint-disable */
    // stripped down from John Resig's micro templating: http://ejohn.org/blog/javascript-micro-templating/
    function template (str, data) {
        // escape single quotes (that aren't already escaped)
        str = str.replace(/([^\\])\'/g, "$1\\'");
        // replace consecutive spaces and line breaks
        str = str.replace(/[\s\t\r\n\f]+/g, ' ');
        // replace macros with data values
        str = str.replace(/\{\{(.*?)\}\}/g, "',$1,'");

        // Introduce the data as local variables using with(obj){}
        var templateFn = new Function("obj", "var p=[];with(obj){p.push('" + str + "');}return p.join('');");

        return data ? templateFn(data) : templateFn;
    }
    /* eslint-enable */

    function writeFile (dest, contents, success, error) {
        if (typeof success !== 'function') {
            success = function () {};
        }

        if (typeof error !== 'function') {
            error = function (e) {
                console.log(e);
            };
        }

        mkdirp(path.dirname(dest), function (err) {
            if (err) {
                error(err);
            } else {
                // write dest file
                fs.writeFile(dest, contents, function (err) {
                    if (err) {
                        error(err);
                    } else {
                        success(contents);
                    }
                });
            }
        });
    }

    return {
        cleanDir: cleanDir,
        debug: debug,
        each: each,
        extend: extend,
        getPropertyIfPresent: getPropertyIfPresent,
        listFiles: listFiles,
        readFile: readFile,
        template: template,
        writeFile: writeFile
    };

})();
