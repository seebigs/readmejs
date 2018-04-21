var each = require('seebigs-each');
var files = require('./lib/files');
var parseModule = require('./lib/parse/module');
var settings = require('./lib/settings');
var utils = require('seebigs-utils');

/**
 * Generates documentation files based on source code
 * @param {String|Object} options path to project as String or full options Object
 */
function generate(options) {
    var config = settings.get(options);
    var modulePaths = files.getModulePaths(config);

    var app = {
        name: config.app.name,
        version: config.app.version,
        description: config.app.description,
        modules: [],
    };

    each(modulePaths, function (modPath) {
        var contents = utils.readFile(modPath);
        if (contents) {
            var parsedModule = parseModule(contents, modPath, config);
            console.log();
            console.log(modPath);
            console.log(JSON.stringify(parsedModule, null, 4));
        }
    });

    // console.log();
    // console.log(app);

    // var app = parseApp();
    // var view = getView();
    // view.create();
}

module.exports = {
    generate,
};

// generate();
// generate('../easybars');

generate({
    modules: './parseMe.js',
    exports: {
        value: '$.fn.thing.too',
    }
});

// generate({
//     packagePath: '../im-toolkit',
//     modules: function (files, cwd) {
//         return files.filter(function (file) {
//             var relFile = file.split(cwd + '/')[1];
//             if (relFile.indexOf('node_modules') === -1) {
//                 return relFile.charAt(0) !== '_' && relFile.split('/').length > 1;
//             }
//         });
//     },
// });

// generate({
//     packagePath: '../tags',
//     modules: '../tags/src/javascripts',
// });
