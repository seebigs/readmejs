var extend = require('deep-extend');
var path = require('path');
var utils = require('seebigs-utils');

function getPackageJson(projectPath) {
    var packagePath = path.resolve(projectPath || '', 'package.json');
    var packageJson = utils.readFile(packagePath, function () {});
    if (packageJson) {
        try {
            return JSON.parse(packageJson);
        } catch (e) {
            // do nothing
        }
    }
}

function getDefaultConfig(packageJson) {
    return {
        app: {
            name: packageJson.name || 'API',
            version: packageJson.version || 'latest',
            description: packageJson.description || '',
        },
        dest: './docs',
        modules: packageJson.main || 'index.js',
        exports: {
            type: 'global',
            value: 'module.exports',
        },
    };
}

// settings are auto-detected from package.json in project root unless overridden
function get(options) {
    options = options || {};
    if (typeof options === 'string') {
        options = {
            packagePath: options,
        };
    }
    options.packagePath = options.packagePath || '';
    var packageJson = getPackageJson(options.packagePath) || {};
    var config = extend({}, getDefaultConfig(packageJson), options);
    config.modules = [].concat(config.modules);
    return config;
}

module.exports = {
    get,
};
