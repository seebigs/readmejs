
var esprima = require('esprima');
var path = require('path');
var traverse = require('ast-traverse');
var utils = require('seebigs-utils');

var addParentProperties = require('ast-parents');
var parseNode = require('./parse_node.js');
var print = require('./print.js');
var resources = require('./resources.js');


function parseGlobal (exportsOptions, filepath, node, mod) {
    var foundGlobal = false;

    if (node.left) {
        if (node.left.type === 'MemberExpression') {
            var leftProps = [];
            var exp = parseNode.leftSide(node.left, leftProps);

            if (exp.object.name === exportsOptions.global) { // we found our export
                leftProps.unshift(exp.property.name);
                leftProps.unshift(exp.object.name);

                if (!mod.name) {
                    mod.name = mod.signature = leftProps.join('.');
                }

                foundGlobal = true;
            }

        } else if (node.left.type === 'Identifier') {
            if (node.left.name === exportsOptions.global) { // we found our export
                if (!mod.name) {
                    mod.name = mod.signature = node.left.name;
                }

                foundGlobal = true;
            }

        } else {
            console.log('UNKNOWN GLOBAL');
        }
    }

    return foundGlobal; // tell traverser if we found a global assignment
}

function parseModuleExports (exportsOptions, filepath, node, mod) {
    if (utils.getPropertyIfPresent(node, 'left.object.name') === 'module' && utils.getPropertyIfPresent(node, 'left.property.name') === 'exports') {
        if (!mod.name) {
            var nameFromFilepath = filepath.split('/').pop().split('.');
            nameFromFilepath.pop();
            mod.name = mod.signature = nameFromFilepath.join('.');
        }

        return true; // tell traverser that we found a module.exports
    }
}

function parseNodeAsExport (exportsOptions, filepath, node, parent, app, ast) {
    if (node.type === 'AssignmentExpression') {
        var mod = {
            _classname: 'readmejs-module',
            name: '',
            signature: '',
            path: filepath,
            type: 'object',
            comments: []
        };

        var parseTechnique = exportsOptions.global ? parseGlobal : parseModuleExports;
        var isExport = parseTechnique(exportsOptions, filepath, node, mod);
        if (isExport) {
            Object.assign(mod, parseNode.rightSide(node, ast, mod));
            mod._classname += ' readmejs-module-typeof-' + mod.type;
            app.lib.push(mod);
            return false; // stop traversing children
        }
    }
}


function parseEntry (options) {
    console.log('parseEntry Coming Soon');
}

function parseLib (options) {
    var libPath = options.lib;

    var app = {
        info: options.app,
        api: [],
        lib: [],
        resources: { dirs: {}, files: [] }
    };

    var listFiles = utils.listFiles(libPath, ['js']);

    if (listFiles.length) {
        listFiles.forEach(function (filepath) {

            var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });

            addParentProperties(ast);

            traverse(ast, { pre: function (node, parent) {
                return parseNodeAsExport(options.exports, filepath, node, parent, app, ast);
            } });

        });

        // sort lib alpha
        app.lib.sort(function(a, b) {
            return a.name > b.name ? 1 : -1;
        });

        // build resources and add to app
        resources.build(app, libPath);

    } else {
        print.error('No lib files matched ' + path.resolve(libPath));
    }

    // utils.debug(app);

    return app;
}

module.exports = {
    entry: parseEntry,
    lib: parseLib
};
