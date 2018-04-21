var ParseTree = require('../../parsetree-js'); // FIXME

function matchObjectAndProperty(memberExpression, exportSegments) {
    var prop = exportSegments.pop();
    if (prop) {
        if (memberExpression.type === 'MemberExpression') {
            if (memberExpression.object.type === 'Identifier') {
                return exportSegments.length === 1 &&
                    memberExpression.property.name === prop &&
                    memberExpression.object.name === exportSegments[0];
            } else {
                return memberExpression.property.name === prop &&
                    matchObjectAndProperty(memberExpression.object, exportSegments);
            }
        }
    }
}

function findExportNode(contents, config) {
    var $ = new ParseTree(contents);
    if ($) {
        if (config.exports.type === 'global' && typeof config.exports.value === 'string') {
            var exportSegments = config.exports.value.split('.');
            // what about 'global.thing[2] = ' ?
            var exportNodeValue;
            $('AssignmentExpression').each(function (node) {
                var left = node.left;
                if (left && matchObjectAndProperty(left, [].concat(exportSegments))) {
                    exportNodeValue = node.right;
                }
            });
            return exportNodeValue;
        }
    }
}

module.exports = {
    findExportNode: findExportNode,
};
