
var esprima = require('esprima');
var path = require('path');
var traverse = require("ast-traverse");

var parseNode = require('./parse_node.js');
var print = require('./print.js');
var resources = require('./resources.js');
var utils = require('./utils.js');


function parseGlobal (exportsOptions, filepath, node, parent, mod, ast) {
    var foundGlobal = false;

    if (node.left) {
        if (node.left.type === 'MemberExpression') {
            var leftProps = [];
            var exp = parseNode.getIdentifier(node.left, leftProps);

            if (exp.object.name === exportsOptions.global) { // we found our export
                leftProps.unshift(exp.property.name);
                leftProps.unshift(exp.object.name);

                if (!mod.name) {
                    mod.name = mod.signature = leftProps.join('.');
                }

                utils.extend(mod, parseNode.getValue(node, parent, ast, mod));

                foundGlobal = true;
            }

        } else if (node.left.type === 'Identifier') {
            if (node.left.name === exportsOptions.global) { // we found our export
                if (!mod.name) {
                    mod.name = mod.signature = node.left.name;
                }

                utils.extend(mod, parseNode.getValue(node, parent, ast, mod));

                foundGlobal = true;
            }

        } else {
            console.log('UNKNOWN GLOBAL');
            // utils.debug(node);
        }
    }

    return foundGlobal; // tell traverer if we found a global assignment
}

function parseModuleExports (exportsOptions, filepath, node, parent, mod, ast) {
    if (utils.getPropertyIfPresent(node, 'left.object.name') === 'module' && utils.getPropertyIfPresent(node, 'left.property.name') === 'exports') {

        if (!mod.name) {
            var nameFromFilepath = filepath.split('/').pop().split('.');
            nameFromFilepath.pop();
            mod.name = nameFromFilepath.join('.');
        }

        // API
        var api = parseNode.getValue(node, parent, as, modt);
        if (api) {
            mod.api.push(api);
        }

        return true; // tell traverer that we found a global assignment
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
            comments: ''
        };

        var moduleComments = parseNode.getComments(parent);
        mod.comments = moduleComments.get('content');
        var nameFromComments = moduleComments.get('module');
        if (nameFromComments) {
            mod.name = mod.signature = nameFromComments;
        }

        var parseTechnique = exportsOptions.global ? parseGlobal : parseModuleExports;
        var isExport = parseTechnique(exportsOptions, filepath, node, parent, mod, ast);
        if (isExport) {
            mod._classname += ' readmejs-module-typeof-' + mod.type;
            app.modules.push(mod);
            return false; // stop traversing children
        }
    }
}


function parse (srcPath, appInfo, options) {
    var app = {
        info: appInfo,
        modules: [],
        resources: { dirs: {}, files: [] }
    };

    var listFiles = utils.listFiles(srcPath);

    if (listFiles.length) {
        listFiles.forEach(function (filepath) {

            var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });

            traverse(ast, { pre: function(node, parent) {
                return parseNodeAsExport(options.exports, filepath, node, parent, app, ast);
            } });

        });

        // build resources and add to app
        // resources.build(app, srcPath);

    } else {
        print.error('No src files matched ' + path.resolve(srcPath));
    }

    return app;
}

module.exports = parse;
