var each = require('seebigs-each');
var nestedObjectProps = require('./nestedObjectProps');

function memberExpression(node, parser) {
    var nestedProps = nestedObjectProps(node, node.property.name);
    var matchingExpression = parser.findMatchingNode(node, nestedProps.shift());
    var val = parser.parseNode(matchingExpression, parser);

    if (val.properties) {
        each(nestedProps, function (prop) {
            val = val.properties[prop];
        });
    }

    return val;
}

module.exports = memberExpression;
