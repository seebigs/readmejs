
var utils = require('seebigs-utils');


function get (attribute) {

}

function parseValue (splitOnSpaces) {
    var name, type, description = [];

    splitOnSpaces.forEach(function (s) {
        if (s) {
            var typeMatch = s.match(/^\{(.+)\}$/);
            if (typeMatch) {
                type = typeMatch[1];

            } else if (!name) {
                name = s;

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

module.exports = function (commentsStr) {
    // strip leading junk
    commentsStr = commentsStr.replace(/^[* \n\t]+/, '');

    // strip trailing junk
    commentsStr = commentsStr.replace(/[* \n\t]+$/, '');

    var tags = commentsStr.split(/\n \* @/);

    var comment = {
        description: [],
        name: ''
    };

    if (tags[0].charAt(0) === '@') {
        tags[0] = tags[0].substr(1);

    } else if (tags[0] !== '\n') {
        comment.description = tags.shift().split(/\n \* ?/);
    }

    tags.forEach(function (tag) {
        var splitOnSpaces = tag.split(/[* \n\t]+/);
        var label = splitOnSpaces.shift();

        if (label === 'param') {
            comment.params = comment.params || [];
            comment.params.push(parseValue(splitOnSpaces));

        } else if (label === 'return' || label === 'returns') {
            comment.returns = parseValue(splitOnSpaces);

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
};
