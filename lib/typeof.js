
function typeOfLiteral(thing) {
    return Object.prototype.toString.call(thing).split(' ').pop().slice(0, -1);
}

function typeOfNode(node) {
    var nodeType = node.type;
    if (nodeType.indexOf('Literal') > -1) {
        return typeOfLiteral(node.value);
    } else if (nodeType.indexOf('Array') === 0) {
        return 'Array';
    } else if (nodeType.indexOf('Object') === 0) {
        return 'Object';
    } else if (nodeType.indexOf('Function') > -1) {
        return 'Function';
    } else if (nodeType.indexOf('Global') === 0) {
        return 'Global';
    } else if (node.ofType) {
        return node.ofType;
    } else if (nodeType === 'Unknown') {
        return nodeType;
    } else {
        throw new Error('need to match typeOf: ' + nodeType);
    }
}

module.exports = {
    literal: typeOfLiteral,
    node: typeOfNode,
};
