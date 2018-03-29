var parseArrayExpression = require('./arrayExpression');
var parseBinaryExpression = require('./binaryExpression');
var parseCallExpression = require('./callExpression');
var parseFunction = require('./function');
var parseLiteral = require('./literal');
var parseMemberExpression = require('./memberExpression');
var parseObjectExpression = require('./objectExpression');
var ParseTree = require('../../../parsetree-js'); // FIXME

function getParentNode(node) {
    return node._ && node._._nodeParent;
}

function findMatchingNode(start, match) {
    var $ = new ParseTree();
    var p = getParentNode(start);
    var selector = '#' + match;
    var found;

    while (p && !found) {
        p = getParentNode(p);
        var $found = $(selector, p);
        $found.each(function (f) {
            if (f.type && f.type.indexOf('Expression') === -1) {
                found = f;
            }
        });
    }

    return found;
}

function parseNode(node) {
    var nodeType = node.type;
    if (nodeType === 'Literal') {
        return parseLiteral(node);

    } else if (nodeType === 'ObjectExpression') {
        return parseObjectExpression(node, parseNode);

    } else if (nodeType === 'ArrayExpression') {
        return parseArrayExpression(node, parseNode);

    } else if (nodeType === 'FunctionExpression' || nodeType === 'FunctionDeclaration') {
        return parseFunction(node, parseNode);

    } else if (nodeType === 'CallExpression') {
        return parseCallExpression(node, parseNode, findMatchingNode);

    } else if (nodeType === 'BinaryExpression') {
        return parseBinaryExpression(node, parseNode);

    } else if (nodeType === 'MemberExpression') {
        return parseMemberExpression(node, parseNode, findMatchingNode);

    } else if (nodeType === 'VariableDeclarator') {
        return parseNode(node.init);

    } else if (nodeType === 'Identifier') {
        var matchingNode = findMatchingNode(node, node.name);
        if (!matchingNode) {
            throw new Error('Unable to find node matching `' + node.name + '`');
        }
        return parseNode(matchingNode);

    } else {
        return {
            type: nodeType,
            value: '{' + nodeType + '}',
        };
    }
}

module.exports = parseNode;
