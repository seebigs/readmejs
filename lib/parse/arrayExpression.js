var each = require('seebigs-each');

function parseArrayExpression(node, parser) {
    var arrVals = [];

    each(node.elements, function (element) {
        arrVals.push(parser.parseNode(element, parser));
    });

    return {
        type: node.type,
        name: '',
        value: '[ ' + arrVals.length + ' ]',
        elements: arrVals,
    };
}

module.exports = parseArrayExpression;
