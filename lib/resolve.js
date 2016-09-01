/**
 * Bundl's own way to resolve paths to modules
 * Follows Node spec: https://nodejs.org/api/modules.html
 */

var fs = require('fs');
var path = require('path');
var requireResolve = require('require-resolve');

var bundl;

function handleOtherErrors (err, str) {
    if (err && err.code !== 'ENOENT') {
        bundl.log.error(err, 'Error resolving ' + str);
    }
}

function loadLocal (str) {
    var contents;
    var p = str;

    try {
        contents = fs.readFileSync(str, 'utf8');

    } catch (noFile) {
        try {
            contents = fs.readFileSync(str + '.js', 'utf8');
            p = str + '.js';

        } catch (noJS) {
            try {
                contents = fs.readFileSync(str + '/index.js', 'utf8');
                p = str + '/index.js';

            } catch (noDir) {
                handleOtherErrors(noDir, str);
            }
        }
    }

    return {
        contents: contents,
        path: p
    };
}

function loadModule (str, absPaths, filepath) {
    var i, len;
    var mod = {};

    // check provided paths
    for (i = 0, len = absPaths.length; i < len; i++) {
        mod = loadLocal(path.resolve(absPaths[i], str));
        if (mod.contents) {
            break;
        }
    }

    // check node_modules
    if (!mod.contents) {
        mod = requireResolve(str, filepath);

        try {
            mod = {
                contents: fs.readFileSync(mod.src, 'utf8'),
                path: mod.src
            };
        } catch (err) {
            // do nothing
        }

        if (!mod) {
            mod = {};
        }
    }

    return mod;
}


function resolve (str, fromFile, paths, b) {
    bundl = b;

    var dir = path.dirname(fromFile);
    var m = {};

    // resolve local
    if (/^\./.test(str)) {
        m = loadLocal(path.join(dir, str));

    } else if (path.isAbsolute(str)) {
        m = loadLocal(str);
    }

    if (m.contents) {
        return m;
    }

    var absPaths = {};

    absPaths[dir] = 1;

    paths.forEach(function (root) {
        if (path.isAbsolute(root)) {
            absPaths[root] = 1;
        } else {
            absPaths[path.resolve(process.cwd(), root)] = 1;
        }
    });

    return loadModule(str, Object.keys(absPaths), fromFile);
}

module.exports = resolve;
