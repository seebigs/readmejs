var typeOf = require('../typeof');

function parseBinaryExpression(node, parseNode) {
    var ofType = 'Unknown';
    var operator = node.operator;

    var left = parseNode(node.left);
    var right = parseNode(node.right);

    var typeofLeft = left.ofType || typeOf.node(left);
    var typeofRight = right.ofType || typeOf.node(right);

    if (operator === '+') {
        if (typeofLeft === 'Number' && typeofRight === 'Number') {
            ofType = 'Number';
        } else {
            ofType = 'String';
        }
    } else {
        ofType = 'Number';
    }

    return {
        type: node.type,
        ofType: ofType,
    };
}

module.exports = parseBinaryExpression;
