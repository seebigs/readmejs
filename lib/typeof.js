
function typeOfLiteral(thing) {
    return Object.prototype.toString.call(thing).split(' ').pop().slice(0, -1);
}

function typeOfNode(node) {
    if (node.type === 'Literal') {
        return typeOfLiteral(node.value);
    } else if (node.type.indexOf('Array') === 0) {
        return 'Array';
    } else if (node.type.indexOf('Object') === 0) {
        return 'Object';
    } else if (node.type.indexOf('Function') === 0) {
        return 'Function';
    } else if (node.ofType) {
        return node.ofType;
    } else {
        throw new Error('need to match typeOf: ' + node.type);
    }
}

module.exports = {
    literal: typeOfLiteral,
    node: typeOfNode,
};
