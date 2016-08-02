
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
        parsedProp.value = typeof val.raw ? val.raw : (typeof val.value ? val.value : void 0);
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
                var p = prop.parent;
                var found = false;

                while (p && !found) {
                    if (p.body) {
                        var bdy = p.body;
                        Array.isArray(bdy) && utils.each(bdy, function (b) {
                            if (b.type === 'FunctionDeclaration') {
                                if (b.id && b.id.name === prop.value.name) {
                                    addMethodValue(parsedProp, b.params, parsedComments);
                                    found = true;
                                    return false;
                                }

                            } else if (b.type === 'VariableDeclaration') {
                                utils.each(b.declarations, function (d) {
                                    if (d.id && d.id.name === prop.value.name) {
                                        if (d.init.type === 'FunctionExpression') {
                                            addMethodValue(parsedProp, d.init.params, parsedComments);
                                        } else {
                                            addPropertyValue(parsedProp, getComments(b), d.init);
                                        }
                                        found = true;
                                        return false;
                                    }
                                });
                            }
                        });
                    }

                    p = p.parent;
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

function getIdentifier (left, leftProps) {
    if (left.object && left.object.name) {
        return left;
    }

    leftProps.unshift(left.property.name);
    return getIdentifier(left.object, leftProps);
}

function getRightmostAssignment (node, parent) {
    if (node.type !== 'AssignmentExpression') {
        return parent;
    }

    return getRightmostAssignment(node.right, node);
}

/*
{
    name
    signature
    type
    comments

    properties (includes methods)

    params
    returns

    value
}
*/

function getValue (node, parent, ast, defaults) {
    var parsedComments = getComments(parent);
    var parsedValue = defaults || {};

    if (node.type === 'AssignmentExpression') {
        var right = node.right; // || node.init;

        if (right.type === 'ObjectExpression') {
            addProperties(parsedValue, right.properties, parsedComments, ast);

        } else if (right.type === 'CallExpression') {
            console.log('CallExpression');
            // utils.debug(node);

        } else if (right.type === 'FunctionExpression') {
            // utils.debug(node);
            addMethodValue(parsedValue, right.params, parsedComments);

        } else if (right.type === 'Identifier') {
            console.log('Identifier');
            // utils.debug(node);

        } else if (right.type === 'Literal') {
            addPropertyValue(parsedValue, parsedComments, right);

        } else if (right.type === 'AssignmentExpression') {
            var rightmost = getRightmostAssignment(right, node);
            return getValue(rightmost, parent, ast, defaults);

        } else {
            console.log('UNKNOWN RIGHT-SIDE!');
            utils.debug(right);
        }

    } else if (node.type === 'FunctionDeclaration') {
        console.log('FunctionDeclaration');

    } else {
        console.log('UNKNOWN EXPORT!');
        utils.debug(node.type);
    }

    return parsedValue;
}

module.exports = {
    getComments: getComments,
    getIdentifier: getIdentifier,
    getValue: getValue
};
