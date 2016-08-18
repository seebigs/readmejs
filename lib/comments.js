
var utils = require('seebigs-utils');


function parseValue (splitOnSpaces) {
    var name, type, description = [];

    splitOnSpaces.forEach(function (s) {
        if (s) {
            var typeMatch = s.match(/^\{(.+)\}$/);
            if (typeMatch) {
                type = typeMatch[1];

            } else if (!name) {
                if (s.charAt(0) === '`') {
                    name = s.substring(1, s.length - 1);
                } else {
                    name = s;
                }

            } else {
                description.push(s);
            }
        }
    });

    return {
        name: name,
        type: type,
        description: description.join(' ')
    };
}

function parseComments (commentsStr) {
    // strip leading junk
    commentsStr = commentsStr.replace(/^[* \n\t]+/, '');

    // strip trailing junk
    commentsStr = commentsStr.replace(/[* \n\t]+$/, '');

    var tags = commentsStr.split(/\n +\* +@/);

    var comment = {
        description: [],
        name: ''
    };

    if (tags[0].charAt(0) === '@') {
        tags[0] = tags[0].substr(1);

    } else if (tags[0] !== '\n') {
        var desc = tags.shift();
        comment.description = desc.split(/\n +\* ?/);
    }

    tags.forEach(function (tag) {
        var splitOnSpaces = tag.split(/[* \n\t]+/);
        var label = splitOnSpaces.shift();

        if (label === 'param') {
            comment.params = comment.params || [];
            comment.params.push(parseValue(splitOnSpaces));

        } else if (label === 'return' || label === 'returns') {
            comment.returns = comment.returns || [];
            comment.returns.push(parseValue(splitOnSpaces));

        } else if (label === 'module' || label === 'class') {
            comment.name = splitOnSpaces[0];

        } else {
            var addToDescription = '@' + label;
            splitOnSpaces.forEach(function (s) {
                if (s) {
                    addToDescription += ' ' + s;
                }
            });
            comment.description.push(addToDescription);
        }
    });

    return comment;
}

function parseLeadingComments (leadingComments) {
    var c = leadingComments[leadingComments.length - 1].value;
    if (c && c.indexOf('*\n') === 0) {
        return parseComments(c);
    }
}

function findClosestComments (node) {
    if (node) {
        var commentsArr = node.leadingComments;
        if (commentsArr) {
            return parseLeadingComments(commentsArr);

        } else {
            return findClosestComments(node.parent);
        }
    }
}


function addClosest (node, parsedObj) {
    var cc = findClosestComments(node);
    if (cc) {
        parsedObj.comments = cc.description;
        if (cc.name) {
            parsedObj.name = parsedObj.signature = cc.name;
        }
    }
}

function parse (leadingComments) {
    if (leadingComments && leadingComments.length) {
        return parseLeadingComments(leadingComments);
    }
}

module.exports = {
    addClosest: addClosest,
    parse: parse
};
