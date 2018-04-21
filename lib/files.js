var each = require('seebigs-each');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

function getFileSummary(modPath, packagePath) {
    var file = modPath.replace(path.resolve(packagePath) + '/', '').split('/');
    return {
        name: file.pop(),
        root: packagePath,
        path: file,
    };
}

function getModulePaths(config) {
    var paths = {};
    var globOptions = {
        absolute: true,
        cwd: config.packagePath || '',
        nodir: true,
    };
    each(config.modules, function (mod) {
        var matched = [];
        if (typeof mod === 'function') {
            matched = mod(glob.sync('**', globOptions), path.resolve(globOptions.cwd));
            console.log('ReadmeJS modules:', matched);
            if (!matched || matched.length < 1) {
                throw new Error('When options.modules is a function it must return an Array of file paths');
            }
        } else {
            matched = glob.sync(mod, globOptions);
        }
        if (!matched.length) {
            try {
                if (fs.statSync(path.resolve(globOptions.cwd, mod)).isDirectory()) {
                    matched = glob.sync(mod + '/**/*.js', globOptions);
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

function getNameFromFileSummary(file) {
    return file.name.split('.')[0];
}

module.exports = {
    getFileSummary,
    getModulePaths,
    getNameFromFileSummary,
};
