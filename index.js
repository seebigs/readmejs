var each = require('seebigs-each');
var files = require('./lib/files');
var findExportNode = require('./lib/findExportNode');
var parseNode = require('./lib/parse/node');
var ParseTree = require('../parsetree-js'); // FIXME
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
            var $ = new ParseTree(contents);
            if ($) {
                var exportNodeValue = findExportNode($, config);
                var parsedModule = parseNode(exportNodeValue);

                console.log();
                console.log(JSON.stringify(parsedModule, null, 4));

                // var parsed = parseModule($, config);
                // if (parsed) {
                //     app.modules.push(parsed);
                // }
            }
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
    // packagePath: '../easybars',
    // modules: 'test/specs',
    // modules: ['my_app/**/*.js', 'lib']
    modules: './parseMe.js',
    exports: {
        value: '$.fn.thing.too',
    }
});

// generate({
//     src: '../im-toolkit',
// });

// generate({
//     src: '../dollar-js',
// });
