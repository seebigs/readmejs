var parseFunction = require('./function');

function parseMethod(node, parser) {
    var fnName = node.key.name;
    var params = parseFunction(node.value, parser).params;
    var paramNames = params.reduce(function (accum, current) {
        accum.push(current.name)
        return accum;
    }, []);

    return {
        type: node.type,
        name: fnName,
        value: fnName + '(' + paramNames.join(', ') + ') { ... }',
        params: params,
    };
}

module.exports = parseMethod;
