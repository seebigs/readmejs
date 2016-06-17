var parseComments = require('parse-comments');
var glob = require('glob');
var esprima = require('esprima');
var traverse = require("ast-traverse");

var utils = require('./utils.js');


function debug (obj) {
    console.log(JSON.stringify(obj, null, 4));
    console.log();
    console.log();
}

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

        mod.api.push(api);
    });

    return mod;
}

function addMethodToAPI (api, parsedComments, params) {
    api.type = 'method';
    api.comments = parsedComments.content;

    api.params = [];
    utils.each(params, function (param) {
        var paramObj = {
            name: param.name
        };

        utils.each(parsedComments.params, function (cmt) {
            if (cmt.name === param.name) {
                paramObj = cmt;
            }
        });

        api.params.push(paramObj);
    });

    api.returns = parsedComments.get('return');
}

function addPropertyToAPI (api, parsedComments) {
    api.type = 'property';
    api.comments = parsedComments.content;
}

function addModuleAnnotations (node, mod) {
    var moduleComments = findValidComments(node);
    mod.comments = moduleComments.content;
    mod.name = moduleComments.get('module') || mod.name;
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
        return Array.isArray(this[prop]) ? this[prop][this[prop].length - 1] : this[prop];
    };

    return parsed;
}

function isModuleExports (expr) {
    return utils.getPropertyIfPresent(expr, 'left.object.name') === 'module' && utils.getPropertyIfPresent(expr, 'left.property.name') === 'exports';
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


var app = {
    modules: []
};

glob("src/6*.js", {}, function (er, files) {
// glob("src/**/*.js", {}, function (er, files) {
    files.forEach(function (filepath) {
        var ast = esprima.parse(utils.readFile(filepath), { attachComment: true });

        console.log(filepath);

        // var indent = 0;
        // traverse(ast, {
        //     pre: function(node) {
        //         console.log(Array(indent + 1).join(" ") + node.type + ' ' + node.name);
        //         indent += 4;
        //     },
        //     post: function() {
        //         indent -= 4;
        //     }
        // });
        // return;

        traverse(ast, { pre: function(node, parent, prop, idx) {

            if (node.type === 'ExpressionStatement') {
                var expr = node.expression;
                if (expr.type === 'AssignmentExpression' && isModuleExports(expr)) {

                    var mod = {
                        name: '',
                        path: filepath,
                        comments: '',
                        api: []
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

    console.log('\n');
    debug(app);

});
