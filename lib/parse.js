
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
            name: prop.key.name
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
            api.type = 'literal';
            api.value = prop.value.value;
        }

        api._readmejs_classname = 'api';

        mod.api.push(api);
    });

    return mod;
}

function addMethodToAPI (api, parsedComments, params) {
    api.type = 'method';
    api.comments = parsedComments.get('content');

    api.params = [];
    utils.each(params, function (param) {
        var paramObj = {
            name: param.name
        };

        utils.each(parsedComments.params, function (cmt) {
            if (cmt.name === param.name) {
                paramObj.type = cmt.type;
                paramObj.description = cmt.description;
            }
        });

        paramObj._readmejs_classname = 'param';

        api.params.push(paramObj);
    });

    api.returns = parsedComments.get('return');
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

function buildApiFromExportsExpression (expr, mod, ast) {
    var right = expr.right || expr.init;

    if (right.type === 'ObjectExpression') {
        apiFromModuleProps(mod, right.properties, ast);

    } else if (right.type === 'CallExpression') {
        utils.each(utils.getPropertyIfPresent(right, 'callee.body.body'), function (b) {
            if (b.type === 'ReturnStatement') {
                if (b.argument.type === 'ObjectExpression') {
                    apiFromModuleProps(mod, b.argument.properties, ast);

                } else if (b.argument.type === 'Identifier') {
                    var props = [];

                    traverse(ast, { pre: function (n, p) {
                        if (n.type === 'AssignmentExpression' && utils.getPropertyIfPresent(n, 'left.object.name') === 'pub') {
                            var val = n.right;

                            if (p.leadingComments) {
                                val.leadingComments = p.leadingComments;
                            }

                            props.push({
                                key: n.left && n.left.property,
                                value: val
                            });
                        }
                    }});

                    apiFromModuleProps(mod, props, ast);
                }
            }
        });

    } else if (right.type === 'Identifier') {
        traverse(ast, { pre: function (n, p) {
            if (n.id && n.id.name === right.name) {
                addModuleAnnotations(p, mod);
                buildApiFromExportsExpression(n, mod, ast);
            }
        }});
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

function isModuleExports (expr) {
    return utils.getPropertyIfPresent(expr, 'left.object.name') === 'module' && utils.getPropertyIfPresent(expr, 'left.property.name') === 'exports';
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

function pathToDirTree (_dir, filepath) {
    addPropIfNotPresent(_dir, filepath.split('/'));

    console.log(filepath);

    // src: {
    //     dirs: [
    //         ad_units: {
    //             dirs: [
    //                 primary: {
    //                     dirs: [],
    //                     files: [
    //                         4
    //                     ]
    //                 }
    //             ],
    //             files: [
    //                 3
    //             ]
    //         }
    //     ],
    //     files: [
    //         5,
    //         6
    //     ]
    // }

    function addPropIfNotPresent (obj, dirs) {
        var prop = dirs.shift();
        if (prop) {
            if (dirs.length > 1) {
                console.log(prop);

                // obj[prop] = obj[prop] || { dirs: [], files: [] };
                obj.dirs.push(prop)
                addPropIfNotPresent(obj[prop], dirs);
            } else {
                // console.log('else...');
                // console.log(obj);
                // console.log(prop);
                // console.log(dirs);
                // console.log();
                // obj._files_.push(prop);
                console.log(prop);
            }
        }
        // return obj[prop] = obj[prop] || {};
    }
}



function parseAPI (srcPath, appInfo) {
    // srcPath += '/**/*.js';

    var app = {
        _readmejs_dir: {},
        info: appInfo,
        modules: []
    };

    // var files = glob.sync(srcPath, {});

    var listFiles = utils.listFiles(srcPath);

    if (listFiles.length) {
        listFiles.forEach(function (filepath) {
            console.log();
            pathToDirTree(app._readmejs_dir, filepath);
            utils.debug(app._readmejs_dir);
            return;

            var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });
            traverse(ast, { pre: function(node, parent, prop, idx) {

                if (node.type === 'ExpressionStatement') {
                    var expr = node.expression;
                    if (expr.type === 'AssignmentExpression' && isModuleExports(expr)) {

                        var mod = {
                            name: '',
                            path: filepath,
                            comments: '',
                            api: [],
                            _readmejs_classname: 'module'
                        };

                        // Module Annotations
                        addModuleAnnotations(node, mod);
                        if (!mod.name) {
                            var nameFromFilepath = filepath.split('/').pop().split('.');
                            nameFromFilepath.pop();
                            mod.name = nameFromFilepath.join('.');
                        }

                        // API
                        buildApiFromExportsExpression(expr, mod, ast);

                        app.modules.push(mod);
                    }
                }

            }});
        });

    } else {
        print.error('No src files matched ' + path.resolve(srcPath));
    }

    return app;
}


module.exports = parseAPI;
