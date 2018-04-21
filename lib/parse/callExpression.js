var each = require('seebigs-each');
var ParseTree = require('../../../parsetree-js'); // FIXME
var modules = require('../modules');
var nestedObjectProps = require('./nestedObjectProps');
var resolve = require('seebigs-resolve');
var typeOf = require('../typeof');

function isRequire(node) {
    return node.callee && node.callee.name === 'require';
}

function parseRequire(node, parser) {
    if (node.callee && node.callee.name === 'require') {
        var resolved = resolve(node.arguments[0].value, parser.config.packagePath);
        var exportsNode = modules.findExportNode(resolved.contents, parser.config);
        return parser.parseNode(exportsNode, parser);
    }
    return node;
}

function callExpression(node, parser) {
    var $ = new ParseTree();
    var ofType = 'Unknown';
    var matchingNode;

    if (isRequire(node)) {
        return parseRequire(node, parser);
    }

    var identifierName = node.callee.name || node.callee.property && node.callee.property.name;
    if (identifierName) {
        var nestedProps = nestedObjectProps(node.callee, identifierName);
        matchingNode = parser.findMatchingNode(node, nestedProps.shift());
        if (matchingNode) {
            if (matchingNode.type !== 'FunctionDeclaration') {
                matchingNode = matchingNode.init;
                if (matchingNode) {
                    if (isRequire(matchingNode)) {
                        return parseRequire(matchingNode, parser);
                    }

                    each(nestedProps, function (prop) {
                        each(matchingNode.properties, function (p) {
                            if (p.key.name === prop) {
                                matchingNode = p.value;
                            }
                        });
                    });
                }
            }
        }
    } else {
        matchingNode = node.callee;
    }

    if (matchingNode) {
        $('ReturnStatement', matchingNode.body).each(function (retExample) {
            if (matchingNode.body === retExample._._nodeParent) {
                var arg = retExample.argument || {};
                var parsed = parser.parseNode(arg, parser);
                ofType = typeOf.node(parsed);
            }
        });
    }

    return {
        type: 'ReturnValue',
        name: '',
        ofType: ofType,
        from: identifierName,
    };
}

module.exports = callExpression;
