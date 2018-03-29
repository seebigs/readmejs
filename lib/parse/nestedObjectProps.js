
function nestedObjectProps(node, firstPropName) {
    var props = [];
    if (firstPropName) {
        props.unshift(firstPropName);
    }

    var obj = node.object;
    if (obj) {
        while (obj.object) {
            props.unshift(obj.property.name);
            obj = obj.object;
        }
        if (obj.name) {
            props.unshift(obj.name);
        }
    }

    return props;
}

module.exports = nestedObjectProps;
