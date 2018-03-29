var each = require('seebigs-each');
var nestedObjectProps = require('./nestedObjectProps');

function memberExpression(node, parseNode, findMatchingNode) {
    var nestedProps = nestedObjectProps(node, node.property.name);
    var memberExpression = findMatchingNode(node, nestedProps.shift());
    var val = parseNode(memberExpression);

    each(nestedProps, function (prop) {
        val = val.properties[prop] || { properties: {} };
    });

    return val;
}

module.exports = memberExpression;
