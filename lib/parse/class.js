var each = require('seebigs-each');
var ParseTree = require('../../../parsetree-js'); // FIXME
var $ = new ParseTree();

function parseClass(node, parser) {
    var className = node.id && node.id.name || '';
    var init;
    var methods = {};
    var getters = {};
    var properties = {};

    each(node.body && node.body.body, function (bodyNode) {
        if (bodyNode.type === 'MethodDefinition') {
            if (bodyNode.kind === 'constructor') {
                init = parser.parseNode(bodyNode.value, parser);
                init.name = 'constructor';
            } else if (bodyNode.kind === 'method') {
                methods[bodyNode.key.name] = parser.parseNode(bodyNode, parser);
            } else if (bodyNode.kind === 'get') {
                getters[bodyNode.key.name] = parser.parseNode(bodyNode, parser);
            }
        }
    });

    $('MemberExpression#Foo', node._ && node._._nodeParent).each(function (extension) {
        if (extension.property && extension.property.name === 'prototype') {
            var expression = extension._ && extension._._nodeParent;
            if (expression && expression._) {
                var assignment = expression._._nodeParent;
                if (assignment) {
                    var name = expression.property.name;
                    var objVal = parser.parseNode(assignment.right, parser) || {};
                    objVal.name = name;
                    properties[name] = objVal;
                }
            }
        }
    });

    return {
        type: node.type,
        name: className,
        value: 'class ' + className + '(' + ') { ... }',
        superClass: node.superClass && node.superClass.name,
        constructor: init,
        methods: methods,
        getters: getters,
        properties: properties,
    };
}

module.exports = parseClass;
