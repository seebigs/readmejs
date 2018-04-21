var each = require('seebigs-each');
var parseArrayExpression = require('./arrayExpression');
var parseBinaryExpression = require('./binaryExpression');
var parseCallExpression = require('./callExpression');
var parseClass = require('./class');
var parseConditionalExpression = require('./conditionalExpression');
var parseFunction = require('./function');
var parseLiteral = require('./literal');
var parseMemberExpression = require('./memberExpression');
var parseMethod = require('./method');
var parseObjectExpression = require('./objectExpression');
var ParseTree = require('../../../parsetree-js'); // FIXME
var $ = new ParseTree();

function getParentNode(node) {
    return node._ && node._._nodeParent;
}

function findMatchingNode(startingNode, match) {
    var p = getParentNode(startingNode);
    var selector = '#' + match;
    var found;

    while (p && !found) {
        p = getParentNode(p);
        if (p) {
            if (p.type === 'FunctionExpression') {
                each(p.params, function (param) {
                    if (param.name === match) {
                        found = p;
                    }
                });
            }
            var $found = $(selector, p);
            $found.each(function (f) {
                if (f.type && f.type.indexOf('Expression') === -1 && f.type.indexOf('Return') === -1) {
                    found = f;
                }
            });
        }
    }

    if (!found) {
        if (match === 'window') {
            found = {
                type: 'GlobalWindow',
            };
        }
    }

    return found;
}

function parseNode(node, parser) {
    if (!node) {
        return { type: 'Unknown' };
    }

    var nodeType = node.type;
    if (nodeType === 'Literal') {
        return parseLiteral(node, parser);

    } else if (nodeType === 'ObjectExpression') {
        return parseObjectExpression(node, parser);

    } else if (nodeType === 'ArrayExpression') {
        return parseArrayExpression(node, parser);

    } else if (nodeType === 'FunctionExpression' || nodeType === 'FunctionDeclaration' || nodeType === 'ArrowFunctionExpression') {
        return parseFunction(node, parser);

    } else if (nodeType === 'ClassDeclaration') {
        return parseClass(node, parser);

    } else if (nodeType === 'MethodDefinition') {
        return parseMethod(node, parser);

    } else if (nodeType === 'CallExpression' || nodeType === 'NewExpression') {
        var parsed = parseCallExpression(node, parser);
        if (nodeType === 'NewExpression') {
            parsed.instanceof = node.callee && node.callee.name;
        }
        return parsed;

    } else if (nodeType === 'BinaryExpression' || nodeType === 'LogicalExpression') {
        return parseBinaryExpression(node, parser);

    } else if (nodeType === 'ConditionalExpression') {
        return parseConditionalExpression(node, parser);

    } else if (nodeType === 'MemberExpression') {
        return parseMemberExpression(node, parser);

    } else if (nodeType === 'ReturnStatement') {
        return parseNode(node.argument, parser);

    } else if (nodeType === 'VariableDeclarator') {
        return parseNode(node.init, parser);

    } else if (nodeType === 'Identifier') {
        var matchingNode = findMatchingNode(node, node.name);
        if (!matchingNode) {
            throw new Error('ReadmeJS: Unable to find node matching `' + node.name + '`');
        }
        return parseNode(matchingNode, parser);

    } else {
        return {
            type: nodeType,
            name: '',
            value: '############################## ' + nodeType + ' ##############################',
        };
    }
}

function Parser(file, config) {
    this.config = config;
    this.file = file;
    this.parseNode = parseNode;
    this.findMatchingNode = findMatchingNode;
}

module.exports = Parser;
