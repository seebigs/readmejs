var typeOf = require('../typeof');

function parseConditionalExpression(node, parser) {
    var ofType = 'Unknown';
    var operator = node.operator;

    var consequent = parser.parseNode(node.consequent, parser);
    var alternate = parser.parseNode(node.alternate, parser);

    var typeOfConsequent = consequent.ofType || typeOf.node(consequent);
    var typeOfAlternate = alternate.ofType || typeOf.node(alternate);

    if (typeOfConsequent === typeOfAlternate) {
        ofType = typeOfConsequent;
    }

    return {
        type: node.type,
        name: '',
        ofType: ofType,
    };
}

module.exports = parseConditionalExpression;
