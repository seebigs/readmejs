
// var appModulePath = require('app-module-path');
var addParentProperties = require('ast-parents');
var comments = require('./comments.js');
var esprima = require('esprima');
var path = require('path');
var traverse = require('ast-traverse');
var utils = require('seebigs-utils');

var parseNode = require('./parse_node.js');
var print = require('./print.js');
var resolve = require('./resolve.js');
var resources = require('./resources.js');


function addValueByNodeType (node, ast, mod) {
    if (node.type === 'ObjectExpression') {
        var cc = comments.addClosest(node, mod);

        if (cc) {
            mod.labels = getLabels(cc.labels);
        }

        addProperties(mod, node.properties);

    } else if (node.type === 'CallExpression') {
        addCallExpression(node, ast, mod);

    } else if (node.type === 'FunctionExpression') {
        comments.addClosest(node, mod);
        addMethodValue(mod, node.params, node.parent.parent.leadingComments);

    } else if (node.type === 'Literal') {
        comments.addClosest(node, mod);
        addPropertyValue(mod, node, node.parent.parent.leadingComments);

    } else if (node.type === 'Identifier') {
        var b = findMatchingNode(node, node.name);
        if (b.type === 'FunctionDeclaration') {
            comments.addClosest(b, mod);
            addMethodValue(mod, b.params, b.leadingComments);
            addAdditionalProperties(b.parent.body, node.name, b, mod);

        } else if (b.type === 'CallExpression') {
            addValueByNodeType(b, ast, mod);
            addAdditionalProperties(b.parent.parent.parent.body, node.name, b.parent.parent, mod);

        } else if (b.type === 'ObjectExpression') {
            addValueByNodeType(b, ast, mod);
            addAdditionalProperties(b.parent.parent.parent.body, node.name, b.parent.parent, mod);

        } else if (b.type === 'FunctionExpression') {
            comments.addClosest(b, mod);
            addMethodValue(mod, b.params, b.parent.parent.leadingComments);
            addAdditionalProperties(b.parent.parent.parent.body, node.name, b.parent.parent, mod);

        } else {
            console.log('UNKNOWN VAR DECLARATION: ' + b.type);
        }

    } else if (node.type === 'AssignmentExpression') {
        var rightmost = getRightmostAssignment(node);
        addValueByNodeType(rightmost.right, ast, mod);

    } else {
        console.log('UNKNOWN NODE TYPE: ' + node.type);
    }
}

function addCallExpression (node, ast, mod) {
    var calleeName = utils.getPropertyIfPresent(node, 'callee.name');
    if (calleeName === 'require') {
        var resolvedFile = resolve(node.arguments[0].value, process.cwd(), ['my_app/src/entry']);
        Object.assign(mod, parseRequired(resolvedFile, mod));

    } else {
        utils.each(utils.getPropertyIfPresent(node, 'callee.body.body'), function (b) {
            if (b.type === 'ReturnStatement') {
                if (b.argument.type === 'Identifier') {
                    comments.addClosest(b, mod);
                    addAdditionalProperties(bodyNodes, b.argument.name, b, mod);

                } else {
                    addValueByNodeType(b.argument, ast, mod);
                }

                return false; // drop out of loop
            }
        });
    }
}

function addAdditionalProperties (bodyNodes, identifierName, parentNode, mod) {
    var pubProps = [];

    utils.each(bodyNodes, function (pub) {
        if (pub.type === 'ExpressionStatement') {
            var pubExpr = pub.expression;
            if (pubExpr && utils.getPropertyIfPresent(pubExpr, 'left.object.name') === identifierName) {
                var pubVal = pubExpr.right;

                if (pub.leadingComments) {
                    pubVal.leadingComments = pub.leadingComments;
                }

                pubProps.push({
                    key: pubExpr.left && pubExpr.left.property,
                    value: pubVal,
                    parent: parentNode
                });
            }
        }
    });

    addProperties(mod, pubProps);
}

function getLabels (parsedLabels) {
    var labels = [];

    utils.each(parsedLabels, function (properties, type) {
        labels.push({
            _classname: 'readmejs-label',
            type: type,
            properties: properties
        });
    });

    return labels;
}


/* PRIMITIVES */

function addPropertyValue (parsedProp, valNode, leadingComments) {
    parsedProp.type = 'property';
    var parsedComments = comments.parse(leadingComments);
    if (parsedComments) {
        parsedProp.comments = parsedComments.description;
        parsedProp.labels = getLabels(parsedComments.labels);
    }

    if (valNode) {
        var parsedVal = parsePropertyValue(valNode);
        parsedProp.value = JSON.stringify(parsedVal, null, 4);
    }
}

function parsePropertyValue (val) {
    if (val.type === 'Literal') {
        if (val.value && val.value.length > 1000) {
            return val.value.substr(0, 1000) + ' ...';
        }

        return val.value;

    } else if (val.type === 'ObjectExpression') {
        var objProps = {};

        utils.each(val.properties, function (prop) {
            objProps[prop.key.name] = parsePropertyValue(prop.value);
        });

        return objProps;

    } else if (val.type === 'Identifier') {
        var b = findMatchingNode(val, val.name);
        return parsePropertyValue(b);

    } else if (val.type === 'FunctionExpression' || val.type === 'FunctionDeclaration') {
        var params = [];

        utils.each(val.params, function (p) {
            params.push(p.name);
        });

        return 'function ' + (val.id && val.id.name || '') + '(' + params.join(', ') + ') { ... }';

    } else {
        return '[' + val.type + ']';
    }
}


/* OBJECTS */

function addProperties (mod, properties) {
    mod.properties = mod.properties || [];

    utils.each(properties, function (prop) {
        if (prop.key && prop.value) {
            var parsedProp = {
                name: prop.key.name,
                signature: prop.key.name
            };

            if (prop.value.type === 'Identifier') {
                var b = findMatchingNode(prop, prop.value.name);
                if (b.type === 'FunctionDeclaration') {
                    addMethodValue(parsedProp, b.params, b.leadingComments);

                } else if (b.type === 'FunctionExpression') {
                    addMethodValue(parsedProp, b.params, b.parent.parent.leadingComments);

                } else if (b.type === 'CallExpression') {
                    addCallExpression(b, null, parsedProp);

                } else {
                    addPropertyValue(parsedProp, b, b.parent.parent.leadingComments);
                }

            } else if (prop.value.type === 'FunctionExpression') {
                addMethodValue(parsedProp, prop.value.params, prop.value.leadingComments || prop.leadingComments);

            } else {
                addPropertyValue(parsedProp, prop.value, prop.value.leadingComments || prop.leadingComments);
            }

            parsedProp._classname = 'readmejs-property readmejs-property-typeof-' + parsedProp.type;

            mod.properties.push(parsedProp);
        }
    });
}


/* METHODS */

function addMethodValue (parsedObj, paramsNode, leadingComments) {
    parsedObj.type = 'method';

    var parsedComments = comments.parse(leadingComments) || {};
    if (parsedComments.description) {
        parsedObj.comments = parsedComments.description;
    }
    parsedObj.signature += getMehodSignature(paramsNode);
    parsedObj.labels = getLabels(parsedComments.labels);
    parsedObj.params = getMethodParams(paramsNode, parsedComments);
    parsedObj.returns = getMethodReturns(parsedComments.returns);
}

function getMethodParams (paramsNode, parsedComments) {
    var params = [];

    utils.each(paramsNode, function (param) {
        var paramObj = {
            name: param.name
        };

        utils.each(parsedComments.params, function (cmt) {
            if (cmt.name === param.name) {
                paramObj.type = cmt.type;
                paramObj.description = cmt.description;
            }
        });

        paramObj._classname = 'readmejs-param';

        params.push(paramObj);
    });

    return params;
}

function getMehodSignature (params) {
    var sig = '(';

    var hasParams = false;
    utils.each(params, function (p) {
        hasParams = true;
        sig += p.name + ', ';
    });

    if (hasParams) {
        sig = sig.slice(0, -2);
    } else {
        sig += ' ';
    }

    return sig + ')';
}

function getMethodReturns (returns) {
    if (returns) {
        var rets = [];

        utils.each(returns, function (ret) {
            var descArr = [], retObj = {};

            if (ret.type) {
                retObj.type = ret.type;
            }

            if (ret.name) {
                descArr.push(ret.name);
            }

            if (ret.description) {
                descArr.push(ret.description);
            }

            if (descArr.length) {
                retObj.description = descArr.join(' ');
            }

            retObj._classname = 'readmejs-return';

            rets.push(retObj);
        });

        return rets;
    }

    return [{
        _classname: 'readmejs-return',
        description: 'undefined'
    }];
}


/* TERMS */

function leftSide (left, leftProps) {
    if (left.object && left.object.name) {
        return left;
    }

    leftProps.unshift(left.property.name);
    return leftSide(left.object, leftProps);
}


function getRightmostAssignment (node) {
    if (node.type !== 'AssignmentExpression') {
        return node.parent;
    }

    return getRightmostAssignment(node.right);
}


function findMatchingNode (start, match) {
    var p = start.parent;
    var found = false;

    function isMatchingNode (node) {
        if (node.type === 'FunctionDeclaration') {
            if (node.id && node.id.name === match) {
                found = node;
                return false;
            }

        } else if (node.type === 'VariableDeclaration') {
            utils.each(node.declarations, function (d) {
                if (d.id && d.id.name === match) {
                    found = d.init;
                    return false;
                }
            });
        }

    }

    while (p && !found) {
        var bdy = p.body;
        if (bdy) {
            if (Array.isArray(bdy)) {
                utils.each(bdy, isMatchingNode);
            }
        }
        p = p.parent;
    }

    return found;
}


function rightSide (node, ast, modDefaults) {
    var mod = modDefaults || {};

    addValueByNodeType(node.right, ast, mod);

    return mod;
}


/* PARSE */

function parseRequired (ext, mod) {
    var mods = [];

    var ast = esprima.parse(ext.contents, { attachComment: true });

    addParentProperties(ast);

    traverse(ast, { pre: function (node, parent) {
        return parseNodeAsExport(mod, ext.path, node, parent, mods, ast);
    } });

    return mods[0];
}

function parseGlobal (exportsOptions, filepath, node, mod) {
    var foundGlobal = false;

    if (node.left) {
        if (node.left.type === 'MemberExpression') {
            var leftProps = [];
            var exp = leftSide(node.left, leftProps);

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

function parseNodeAsExport (options, filepath, node, parent, collection, ast) {
    if (node.type === 'AssignmentExpression') {
        var mod = {
            _classname: 'readmejs-module',
            name: options.name || '',
            signature: options.signature || '',
            path: filepath,
            type: 'object',
            comments: []
        };

        var parseTechnique = options.exports && options.exports.global ? parseGlobal : parseModuleExports;
        var isExport = parseTechnique(options.exports, filepath, node, mod);
        if (isExport) {
            Object.assign(mod, rightSide(node, ast, mod));
            mod._classname += ' readmejs-module-typeof-' + mod.type;
            collection.push(mod);
            return false; // stop traversing children
        }
    }
}


function newBlankApp (options) {
    return {
        info: options.app,
        api: [],
        lib: [],
        resources: { dirs: {}, files: [] }
    };
}

function parseEntry (options) {
    var mainPath = options.main;

    var app = newBlankApp(options);

    // options.paths.forEach(function (p) {
    //     appModulePath.addPath(path.resolve(p));
    // });
    // console.log( require('so/beautiful') );

    var filepath = path.resolve(mainPath);

    var entryFile;
    var entryFileWithIndex;
    entryFile = utils.readFile(filepath, function () {
        entryFileWithIndex = utils.readFile(filepath + '/index.js');
    });
    entryFile = entryFile || entryFileWithIndex;

    var ast = esprima.parse(entryFile, { attachComment: true });

    addParentProperties(ast);

    traverse(ast, { pre: function (node, parent) {
        return parseNodeAsExport(options, filepath, node, parent, app.api, ast);
    } });

    utils.debug(app);

    return app;
}

function parseLib (options) {
    var libPath = options.lib;

    var app = newBlankApp(options);

    var listFiles = utils.listFiles(libPath, ['js']);

    if (listFiles.length) {
        listFiles.forEach(function (filepath) {

            var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });

            addParentProperties(ast);

            traverse(ast, { pre: function (node, parent) {
                return parseNodeAsExport(options, filepath, node, parent, app.lib, ast);
            } });

        });

        // build resources and add to app
        resources.build(app, libPath);

        // sort lib alpha
        app.lib.sort(function(a, b) {
            return a.name > b.name ? 1 : -1;
        });

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
