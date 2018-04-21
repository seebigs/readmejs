var each = require('seebigs-each');

function parseFunction(node, parser) {
    var params = [];
    var paramNames = [];
    var fnName = node.id && node.id.name || '';

    each(node.params, function (p) {
        var param = {
            name: p.name,
        };

        if (p.type === 'AssignmentPattern') {
            param.name = p.left.name;
            param.default = parser.parseNode(p.right, parser);
        }

        paramNames.push(param.name);
        params.push(param);
    });

    return {
        type: node.type,
        name: fnName,
        value: 'function ' + fnName + '(' + paramNames.join(', ') + ') { ... }',
        params: params,
    };
}

module.exports = parseFunction;
