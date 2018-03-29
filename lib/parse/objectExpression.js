var each = require('seebigs-each');

function parseObjectExpression(node, parseNode) {
    var objProps = [];
    var objPropsAndVals = {};

    each(node.properties, function (prop) {
        var name = prop.key.name;
        var objVal = parseNode(prop.value) || {};
        objProps.push(name);
        objVal.name = name;
        objPropsAndVals[name] = objVal;
    });

    return {
        type: node.type,
        value: '{ ' + objProps.join(', ') + ' }',
        properties: objPropsAndVals,
    };
}

module.exports = parseObjectExpression;
