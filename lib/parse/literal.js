
function parseLiteral(node) {
    if (node.value && node.value.length > 1000) {
        return node.value.substr(0, 1000) + ' ...';
    }

    return {
        type: node.type,
        value: node.value,
    };
}

module.exports = parseLiteral;
