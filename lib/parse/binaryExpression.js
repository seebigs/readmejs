var typeOf = require('../typeof');

function parseBinaryExpression(node, parser) {
    var ofType = 'Unknown';
    var operator = node.operator;

    var left = parser.parseNode(node.left, parser);
    var right = parser.parseNode(node.right, parser);

    var typeOfLeft = left.ofType || typeOf.node(left);
    var typeOfRight = right.ofType || typeOf.node(right);

    if (operator === '+') {
        if (typeOfLeft === 'Number' && typeOfRight === 'Number') {
            ofType = 'Number';
        } else {
            ofType = 'String';
        }
    } else {
        var exceptions = ['Global', 'Unknown'];
        if (exceptions.indexOf(typeOfLeft) === -1 && exceptions.indexOf(typeOfRight) === -1) {
            ofType = 'Number';
        }
    }

    return {
        type: node.type,
        name: '',
        ofType: ofType,
    };
}

module.exports = parseBinaryExpression;
