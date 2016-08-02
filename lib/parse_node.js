
var parseComments = require('parse-comments');
var traverse = require("ast-traverse");

var utils = require('./utils.js');


/* COMMENTS */

function getComments (node) {
    var commentsArr = node.leadingComments;
    if (commentsArr) {
        var c = commentsArr[commentsArr.length - 1].value;
        if (c && c.indexOf('*\n') === 0) {
            return parseValidComments(c);
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


/* PRIMITIVES */

function addPropertyValue (parsedProp, parsedComments, val) {
    parsedProp.type = 'property';

    if (parsedComments) {
        parsedProp.comments = parsedComments.get('content');
    }

    if (val) {
        var parsedVal = parsePropertyValue(val);
        parsedProp.value = JSON.stringify(parsedVal, null, 4);
    }
}

function parsePropertyValue (val) {
    if (val.type === 'Literal') {
        return val.value;

    } else if (val.type === 'ObjectExpression') {
        var objProps = {};

        utils.each(val.properties, function (prop) {
            objProps[prop.key.name] = parsePropertyValue(prop.value);
        });

        return objProps;

    } else if (val.type === 'Identifier') {
        findMatchingNode(val, function (b) {

        });

    } else if (val.type === 'FunctionExpression') {
        //

    } else {
        return '[' + val.type + ']';
    }
}


/* OBJECTS */

function addProperties (parsedValue, properties, parsedComments, traverseFrom) {
    parsedValue.properties = parsedValue.properties || [];

    utils.each(properties, function (prop) {
        if (prop.key && prop.value) {
            var parsedProp = {
                name: prop.key.name,
                signature: prop.key.name
            };

            if (prop.value.type === 'Identifier') {
                var b = findMatchingNode(prop, prop.value.name);
                if (b.type === 'FunctionDeclaration') {
                    addMethodValue(parsedProp, b.params, parsedComments);

                } else if (b.type === 'FunctionExpression') {
                    addMethodValue(parsedProp, b.params, parsedComments);

                } else {
                    addPropertyValue(parsedProp, getComments(b.parent.parent), b);
                }

            } else if (prop.value.type === 'FunctionExpression') {
                addMethodValue(parsedProp, prop.value.params, parsedComments);

            } else {
                addPropertyValue(parsedProp, null, prop.value);
            }

            parsedProp._classname = 'readmejs-property readmejs-property-typeof-' + parsedProp.type;

            parsedValue.properties.push(parsedProp);
        }
    });
}


/* METHODS */

function addMethodValue (parsedValue, paramsNode, parsedComments) {
    parsedValue.type = 'method';
    parsedValue.comments = parsedComments.get('content');
    parsedValue.params = getMethodParams(paramsNode, parsedComments);
    parsedValue.signature += getMehodSignature(parsedValue.params);
    parsedValue.returns = parsedComments.get('return');
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
    }

    return sig + ')';
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

    while (p && !found) {
        if (p.body) {
            var bdy = p.body;
            Array.isArray(bdy) && utils.each(bdy, function (b) {
                if (b.type === 'FunctionDeclaration') {
                    if (b.id && b.id.name === match) {
                        found = b;
                        return false;
                    }

                } else if (b.type === 'VariableDeclaration') {
                    utils.each(b.declarations, function (d) {
                        if (d.id && d.id.name === match) {
                            found = d.init;
                            return false;
                        }
                    });
                }

            });
        }
        p = p.parent;
    }

    return found;
}


function addValueByNodeType (node, ast, parsedValue) {
    if (node.type === 'ObjectExpression') {
        addProperties(parsedValue, node.properties, getComments(node.parent), ast);

    } else if (node.type === 'CallExpression') {
        var bodyNodes = utils.getPropertyIfPresent(node, 'callee.body.body');
        utils.each(bodyNodes, function (b) {
            if (b.type === 'ReturnStatement') {
                if (b.argument.type === 'Identifier') {
                    var pubProps = [];

                    utils.each(bodyNodes, function (pub) {
                        if (pub.type === 'ExpressionStatement') {
                            var pubExpr = pub.expression;
                            if (pubExpr && utils.getPropertyIfPresent(pubExpr, 'left.object.name') === b.argument.name) {
                                var pubVal = pubExpr.right;

                                if (pub.leadingComments) {
                                    pubVal.leadingComments = pub.leadingComments;
                                }

                                pubProps.push({
                                    key: pubExpr.left && pubExpr.left.property,
                                    value: pubVal,
                                    parent: b
                                });
                            }
                        }
                    });

                    addProperties(parsedValue, pubProps, getComments(node.parent), ast);

                } else {
                    addValueByNodeType(b.argument, ast, parsedValue);
                }
            }
        });

    } else if (node.type === 'FunctionExpression') {
        addMethodValue(parsedValue, node.params, getComments(node.parent));

    } else if (node.type === 'Literal') {
        addPropertyValue(parsedValue, getComments(node.parent), node);

    } else if (node.type === 'AssignmentExpression') {
        var rightmost = getRightmostAssignment(node);
        return rightSide(rightmost, ast, parsedValue);

    } else if (node.type === 'Identifier') {
        var b = findMatchingNode(node, node.name);
        if (b.type === 'FunctionDeclaration') {
            addMethodValue(parsedValue, b.params, getComments(b));

        } else if (b.type === 'CallExpression') {
            addValueByNodeType(b, ast, parsedValue);

        } else if (b.type === 'ObjectExpression') {
            addValueByNodeType(b, ast, parsedValue);

        } else {
            console.log('UNKNOWN VAR DECLARATION');
        }

    } else {
        console.log('UNKNOWN NODE TYPE');
    }
}

function rightSide (node, ast, defaults) {
    var parsedValue = defaults || {};

    if (node.type === 'AssignmentExpression') {
        addValueByNodeType(node.right, ast, parsedValue);

    } else {
        console.log('UNKNOWN EXPORT');
    }

    return parsedValue;
}

module.exports = {
    getComments: getComments,
    leftSide: leftSide,
    rightSide: rightSide
};
