
var esprima = require('esprima');
var glob = require('glob');
var parseComments = require('parse-comments');
var path = require('path');
var traverse = require("ast-traverse");

var print = require('./print.js');
var utils = require('./utils.js');


function apiFromModuleProps (mod, props, traverseFrom) {
    utils.each(props, function (prop) {
        var api = {
            name: prop.key.name,
            signature: prop.key.name
        };

        if (prop.value.type === 'Identifier') {
            traverse(traverseFrom, { pre: function (n, p) {
                if (n.id && n.id.name === prop.value.name) {

                    if (n.type === 'FunctionDeclaration') {
                        addMethodToAPI(api, findValidComments(n), n.params);

                    } else if (n.type === 'VariableDeclarator') {
                        if (n.init.type === 'FunctionExpression') {
                            addMethodToAPI(api, findValidComments(p), n.init.params);

                        } else {
                            addPropertyToAPI(api, findValidComments(p));
                        }

                    }
                }
            }});

        } else if (prop.value.type === 'FunctionExpression') {
            addMethodToAPI(api, findValidComments(prop.value), prop.value.params);

        } else {
            var val = prop.value.value;
            api.type = 'literal';
            api.value = typeof val === 'string' ?  '"' + val + '"' : val;
        }

        api._classname = 'readmejs-api readmejs-api-' + api.type;

        mod.api.push(api);
    });

    return mod;
}

function addMethodToAPI (api, parsedComments, paramsNode) {
    api.type = 'method';
    api.comments = parsedComments.get('content');

    api.params = getMethodParams(parsedComments, paramsNode);

    api.signature += getMehodSignature(api.params);

    api.returns = parsedComments.get('return');
}

function getMethodParams (parsedComments, paramsNode) {
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
    }

    return sig + ')';
}

function addPropertyToAPI (api, parsedComments) {
    api.type = 'property';
    api.comments = parsedComments.get('content');
}

function addModuleAnnotations (node, mod) {
    var moduleComments = findValidComments(node);
    mod.comments = moduleComments.get('content');
    mod.name = moduleComments.get('module') || mod.name;
}

function buildApiFromExportsExpression (expr, parent, mod, ast) {
    var right = expr.right || expr.init;

    if (right) {
        if (right.type === 'ObjectExpression') {
            apiFromModuleProps(mod, right.properties, ast);

        } else if (right.type === 'CallExpression') {
            var bodyNodes = utils.getPropertyIfPresent(right, 'callee.body.body');
            utils.each(bodyNodes, function (b) {
                if (b.type === 'ReturnStatement') {
                    if (b.argument.type === 'ObjectExpression') {
                        apiFromModuleProps(mod, b.argument.properties, ast);

                    } else if (b.argument.type === 'Identifier') {
                        var props = [];

                        utils.each(bodyNodes, function (pub) {
                            if (pub.type === 'ExpressionStatement') {
                                var pubExpr = pub.expression;
                                if (pubExpr && utils.getPropertyIfPresent(pubExpr, 'left.object.name') === b.argument.name) {
                                    var pubVal = pubExpr.right;

                                    if (pub.leadingComments) {
                                        pubVal.leadingComments = pub.leadingComments;
                                    }

                                    props.push({
                                        key: pubExpr.left && pubExpr.left.property,
                                        value: pubVal
                                    });
                                }
                            }
                        });

                        apiFromModuleProps(mod, props, ast);
                    }
                }
            });

        } else if (right.type === 'FunctionExpression') {
            console.log('FNEXPR');
            // utils.debug(expr);

            var name = right.id && right.id.name || 'anonymous';
            var api = {
                name: name,
                signature: name,
                type: 'function'
            };

            var parsedComments = findValidComments(parent);

            api.comments = parsedComments.get('content');

            api.params = getMethodParams(parsedComments, right.params);

            api.signature += getMehodSignature(api.params);

            api.returns = parsedComments.get('return');

            api._classname = 'readmejs-api readmejs-api-' + api.type;

            mod.api.push(api);


        } else if (right.type === 'Identifier') {
            traverse(ast, { pre: function (n, p) {
                if (n.id && n.id.name === right.name) {
                    addModuleAnnotations(p, mod);
                    buildApiFromExportsExpression(n, p, mod, ast);
                }
            }});

        } else {
            console.log('UNKNOWN EXPORT RIGHT-SIDE!');
            utils.debug(expr);

            var api = {
                name: name,
                signature: name,
                type: 'function'
            };

            var parsedComments = findValidComments(parent);


        }

    } else if (expr.type === 'FunctionDeclaration') {
        var api = {
            name: expr.id.name,
            signature: expr.id.name,
            type: 'function'
        };

        var parsedComments = findValidComments(expr);

        api.comments = parsedComments.get('content');

        api.params = getMethodParams(parsedComments, expr.params);

        api.signature += getMehodSignature(api.params);

        api.returns = parsedComments.get('return');

        api._classname = 'readmejs-api readmejs-api-' + api.type;

        mod.api.push(api);

        traverse(ast, { pre: function (n, p) {
            if (n.type === 'AssignmentExpression' && utils.getPropertyIfPresent(n, 'left.object.name') === api.name) {
                utils.debug(n);
                buildApiFromExportsExpression(n, p, mod, ast);
            }
        }});

    } else {
        console.log('UNKNOWN EXPORT!');
        // utils.debug(expr);
    }
}

function findValidComments (node) {
    var commentsArr = node.leadingComments;
    if (commentsArr) {
        var comments = commentsArr[commentsArr.length - 1].value;
        if (comments && comments.indexOf('*\n') === 0) {
            return parseValidComments(comments);
        }
    }

    return { get: function(){} };
}

function parseValidComments (comments) {
    var parsed = parseComments('/*' + comments + '*/')[0];

    parsed.content = parsed.comment.content.replace(/\n$/, '');

    parsed.get = function (prop) {
        if (prop === 'content') {
            var c = this.comment.content.replace(/\n$/, '');
            return c.split('\n');
        }

        return Array.isArray(this[prop]) ? this[prop][this[prop].length - 1] : this[prop];
    };

    return parsed;
}

function pathToDirTree (_dir, filepath, srcPath) {
    var pathArray = filepath.split(srcPath)[1].split('/');
    pathArray.shift();

    addPropIfNotPresent(_dir, pathArray);

    function addPropIfNotPresent (obj, dirs) {
        var prop = dirs.shift();
        if (prop) {
            if (dirs.length) {
                dirs.forEach(function (d) {
                    obj.dirs[prop] = obj.dirs[prop] || { dirs: {}, files: [] };
                    addPropIfNotPresent(obj.dirs[prop], dirs);
                });
            } else {
                obj.files.push({
                    name: prop,
                    path: filepath
                });
            }
        }
    }
}

function parseLeftSide (left, leftProps) {
    if (left.object && left.object.name) {
        return left;
    }

    leftProps.unshift(left.property.name);
    return parseLeftSide(left.object, leftProps);
}

function parseGlobal (node, parent, app, ast, filepath, exportsOptions) {
    if (node.left) {
        var leftProps = [];
        var exp = parseLeftSide(node.left, leftProps);

        if (exp.object.name === exportsOptions.global) {
            leftProps.unshift(exp.property.name);
            leftProps.unshift(exp.object.name);

            // left: leftProps.join('.'),
            // right: node.right.type

            var mod = {
                name: '',
                path: filepath,
                comments: '',
                api: []
            };

            // Module Annotations
            addModuleAnnotations(parent, mod);
            if (!mod.name) {
                mod.name = leftProps.join('.');
            }

            // API
            buildApiFromExportsExpression(node, parent, mod, ast);

            app.modules.push(mod);

            return true; // tell traverer that we found a global assignment
        }
    }
}

function parseModuleExports (node, parent, app, ast, filepath) {
    if (utils.getPropertyIfPresent(node, 'left.object.name') === 'module' && utils.getPropertyIfPresent(node, 'left.property.name') === 'exports') {
        var mod = {
            name: '',
            path: filepath,
            comments: '',
            api: [],
            _id: filepath,
            _classname: 'readmejs-module'
        };

        // Module Annotations
        addModuleAnnotations(parent, mod);
        if (!mod.name) {
            var nameFromFilepath = filepath.split('/').pop().split('.');
            nameFromFilepath.pop();
            mod.name = nameFromFilepath.join('.');
        }

        // API
        buildApiFromExportsExpression(node, parent, mod, ast);

        app.modules.push(mod);
    }
}



function parseAPI (srcPath, appInfo, options) {
    var app = {
        info: appInfo,
        modules: [],
        resources: { dirs: {}, files: [] }
    };

    var listFiles = utils.listFiles(srcPath);

    if (listFiles.length) {
        listFiles.forEach(function (filepath) {

            var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });

            if (options.exports.global) {
                traverse(ast, { pre: function (node, parent) {
                    if (node.type === 'AssignmentExpression') {
                        var ref = parseGlobal(node, parent, app, ast, filepath, options.exports);
                        if (ref) {
                            return false; // stop traversing children
                        }
                    }
                } });

            } else {
                traverse(ast, { pre: function(node, parent) {
                    if (node.type === 'AssignmentExpression') {
                        parseModuleExports(node, parent, app, ast, filepath);
                    }
                } });
            }
        });

        // build resources
        utils.each(app.modules, function (mod) {
            pathToDirTree(app.resources, mod.path, srcPath);
        });

    } else {
        print.error('No src files matched ' + path.resolve(srcPath));
    }

    return app;
}


module.exports = parseAPI;
