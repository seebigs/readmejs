var each = require('seebigs-each');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

function getModulePaths(config) {
    var paths = {};
    var globOptions = {
        absolute: true,
        cwd: config.packagePath || '',
        nodir: true,
    };
    each(config.modules, function (mod) {
        var matched = glob.sync(mod, globOptions);
        if (!matched.length) {
            try {
                if (fs.statSync(path.resolve(globOptions.cwd, mod)).isDirectory()) {
                    matched = glob.sync(mod + '/**', globOptions);
                }
            } catch (e) {
                // do nothing
            }
        }
        each(matched, function (matchedPath) {
            paths[matchedPath] = 1;
        });
    });
    return Object.keys(paths);
}

module.exports = {
    getModulePaths,
};
