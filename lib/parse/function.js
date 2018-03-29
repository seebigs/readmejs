var each = require('seebigs-each');

function parseFunction(node, parseNode) {
    var params = [];
    var paramNames = [];
    var fnName = node.id && node.id.name || '';

    each(node.params, function (p) {
        var param = {
            name: p.name,
        };

        if (p.type === 'AssignmentPattern') {
            param.name = p.left.name;
            param.default = parseNode(p.right);
        }

        paramNames.push(param.name);
        params.push(param);
    });

    return {
        type: node.type,
        value: 'function ' + fnName + '(' + paramNames.join(', ') + ') { ... }',
        params: params,
    };
}

module.exports = parseFunction;
