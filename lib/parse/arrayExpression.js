var each = require('seebigs-each');

function parseArrayExpression(node, parseNode) {
    var arrVals = [];

    each(node.elements, function (element) {
        arrVals.push(parseNode(element));
    });

    return {
        type: node.type,
        value: '[ ' + arrVals.length + ' ]',
        elements: arrVals,
    };
}

module.exports = parseArrayExpression;
