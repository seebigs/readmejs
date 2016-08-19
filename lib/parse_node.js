
var utils = require('seebigs-utils');

var comments = require('./comments.js');


function addValueByNodeType (node, ast, mod) {
    if (node.type === 'ObjectExpression') {
        comments.addClosest(node, mod);
        addProperties(mod, node.properties);

    } else if (node.type === 'CallExpression') {
        addCallExpression(utils.getPropertyIfPresent(node, 'callee.body.body'), ast, mod);

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

        } else if (b.type === 'CallExpression') {
            addValueByNodeType(b, ast, mod);

        } else if (b.type === 'ObjectExpression') {
            addValueByNodeType(b, ast, mod);

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

function addCallExpression (bodyNodes, ast, mod) {
    utils.each(bodyNodes, function (b) {
        if (b.type === 'ReturnStatement') {
            if (b.argument.type === 'Identifier') {
                comments.addClosest(b, mod);
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

                addProperties(mod, pubProps);

            } else {
                addValueByNodeType(b.argument, ast, mod);
            }

            return false; // drop out of loop
        }
    });
}


/* PRIMITIVES */

function addPropertyValue (parsedProp, valNode, leadingComments) {
    parsedProp.type = 'property';
    var parsedComments = comments.parse(leadingComments);
    if (parsedComments) {
        parsedProp.comments = parsedComments.description;
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

                } else {
                    addPropertyValue(parsedProp, b, b.parent.parent.leadingComments);
                }

            } else if (prop.value.type === 'FunctionExpression') {
                addMethodValue(parsedProp, prop.value.params, prop.value.leadingComments || prop.leadingComments);

            } else {
                addPropertyValue(parsedProp, prop.value, prop.value.leadingComments);
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
    parsedObj.signature += getMehodSignature(parsedObj.params);
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
        if (p.body) {
            var bdy = p.body;
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


module.exports = {
    leftSide: leftSide,
    rightSide: rightSide
};
