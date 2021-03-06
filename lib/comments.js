
function parseValue (splitOnSpaces) {
    var name, type, description = [], parsed = {};

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

    if (name) {
        parsed.name = name;
    }

    if (type) {
        parsed.type = type;
    }

    if (description.length) {
        parsed.description = description.join(' ');
    }

    return parsed;
}

function parseComments (commentsStr) {
    var comment = {
        description: [],
        name: ''
    };

    // strip leading junk
    commentsStr = commentsStr.replace(/^[* \n\t]+/, '');

    // strip trailing junk
    commentsStr = commentsStr.replace(/[* \n\t]+$/, '');

    var tags = [];
    var tagsRaw = commentsStr.split('@');

    // strip trailing junk from each entry
    tagsRaw.forEach(function (raw) {
        if (raw) {
            tags.push(raw.replace(/[* \n\t]+$/, ''));
        }
    });

    if (tags.length) {
        // get description
        if (commentsStr.charAt(0) !== '@') {
            comment.description = tags.shift().split(/\n +\* ?/);
        }

        tags.forEach(function (tag) {
            var splitOnSpaces = tag.split('\n')[0].split(/ +/);
            var label = splitOnSpaces.shift();

            if (label === 'param') {
                comment.params = comment.params || [];
                comment.params.push(parseValue(splitOnSpaces));

            } else if (label === 'return' || label === 'returns') {
                comment.returns = comment.returns || [];
                comment.returns.push(parseValue(splitOnSpaces));

            } else if (label === 'module') {
                comment.name = splitOnSpaces[0];

            } else {
                comment.labels = comment.labels || {};
                comment.labels[label] = {
                    name: splitOnSpaces.shift(),
                    description: splitOnSpaces.join(' ')
                };
            }
        });
    }

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
    return cc;
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
