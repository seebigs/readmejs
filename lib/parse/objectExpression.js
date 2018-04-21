var each = require('seebigs-each');

function parseObjectExpression(node, parser) {
    var objProps = [];
    var objPropsAndVals = {};

    each(node.properties, function (prop) {
        var name = prop.key.name;
        var objVal = parser.parseNode(prop.value, parser) || {};
        objProps.push(name);
        objVal.name = name;
        objPropsAndVals[name] = objVal;
    });

    return {
        type: node.type,
        name: '',
        value: '{ ' + objProps.join(', ') + ' }',
        properties: objPropsAndVals,
    };
}

module.exports = parseObjectExpression;
