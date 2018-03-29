var each = require('seebigs-each');
var ParseTree = require('parsetree-js');
var nestedObjectProps = require('./nestedObjectProps');
var typeOf = require('../typeof');

function callExpression(node, parseNode, findMatchingNode) {
    console.log(node);
    var $ = new ParseTree();
    var ofType = 'Unknown';
    var matchingNode;
    var identifierName = node.callee.name || node.callee.property && node.callee.property.name;
    if (identifierName) {
        var nestedProps = nestedObjectProps(node.callee, identifierName);
        matchingNode = findMatchingNode(node, nestedProps.shift());
        if (matchingNode.type !== 'FunctionDeclaration') {
            matchingNode = matchingNode.init;
            each(nestedProps, function (prop) {
                each(matchingNode.properties, function (p) {
                    if (p.key.name === prop) {
                        matchingNode = p.value;
                    }
                });
            });
        }
    } else {
        here
    }

    $('ReturnStatement', matchingNode.body).each(function (retExample) {
        var arg = retExample.argument || {};
        var parsed = parseNode(arg);
        ofType = typeOf.node(parsed);
    });

    return {
        type: 'ReturnValue',
        ofType: ofType,
        from: identifierName,
    };
}

module.exports = callExpression;
