
var path = require('path');
var utils = require('seebigs-utils');


var textStr = '';
var text = {
    add: function add (str) {
        textStr += '\n' + (str || '');
    },
    toString: function toString () {
        return textStr;
    }
};

function addLabels (obj) {
    utils.each(obj.labels, function (label) {
        var labelType = '**' + label.type.charAt(0).toUpperCase() + label.type.substr(1) + '**';

        var labelDetails = '';
        if (label.properties) {
            if (label.properties.name) {
                labelDetails += label.properties.name;
            }

            if (label.properties.description) {
                labelDetails += ' ' + label.properties.description;
            }

            labelDetails = ': *' + labelDetails.trim() + '*';
        }

        text.add();
        text.add(labelType + labelDetails);
    });
}

function addParams (obj) {
    if (obj.params && obj.params.length) {
        text.add();
        text.add('#### Params');
        text.add();
        text.add('Name|Type|Description');
        text.add(':---|:---|:---');

        utils.each(obj.params, function (p) {
            text.add((p.name || '') + '|' + (p.type ? '*' + p.type + '*' : '') + '|' + (p.description || ''));
        });
    }
}

function addReturns (obj) {
    if (obj.type === 'method') {
        text.add();
        text.add('#### Returns');

        if (obj.returns && obj.returns.length) {
            utils.each(obj.returns, function (r) {
                text.add('* ' + (r.type ? '*{' + r.type + '}* ' : '')  + (r.description || ''));
            });
        } else {
            text.add('* undefined');
        }
    }
}

function addValue (obj) {
    if (typeof obj.value !== 'undefined') {
        text.add();
        if (obj.value.charAt(0) === '{') {
            text.add('```');
            text.add(obj.value);
            text.add('```');
        } else {
            text.add(obj.value);
        }
    }
}

function generateText (api) {
    text.add('**' + api.info.name + '**');

    if (api.info.version) {
        text.add('*- Version: ' + api.info.version + '*');
    }

    utils.each(api.modules, function (mod) {
        // utils.debug(mod);
        text.add();
        text.add('---');
        text.add();
        text.add('# # ' + (mod.signature || mod.name));
        text.add();
        text.add('>' + mod.path);
        text.add();

        utils.each(mod.comments, function (comment) {
            text.add('*' + comment + '*');
        });

        addLabels(mod);
        addParams(mod);
        addReturns(mod);
        addValue(mod);

        utils.each(mod.properties, function (prop) {
            text.add();
            text.add('## `.' + prop.signature + '`');

            utils.each(prop.comments, function (cm) {
                if (cm) {
                    text.add('*' + cm + '*');
                }
            });

            addLabels(prop);
            addParams(prop);
            addReturns(prop);
            addValue(prop);
        });
    });

    return text.toString();
}

function create (api, dest) {
    if (dest) {
        utils.cleanDir(dest);

        var outfile = dest + '/README.md';
        utils.writeFile(outfile, generateText(api));

        console.log('readmejs created docs at: ' + path.resolve(outfile));
    }
}


module.exports = {
    create: create
};
