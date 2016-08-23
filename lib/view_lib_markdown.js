
var fs = require('fs');
var path = require('path');
var utils = require('seebigs-utils');


var listIndent = '  ';

function Text () {
    this.textStr = '';

    this.add = function add (str) {
        this.textStr += '\n' + (str || '');
    };

    this.toString = function toString () {
        return this.textStr;
    };
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

// function resourcesTree (resources, txt, indent) {
//     utils.each(resources.dirs, function (contents, name) {
//         txt.add(indent + '* ' + name);
//         resourcesTree(contents, txt, indent + listIndent);
//     });
//
//     utils.each(resources.files, function (file) {
//         txt.add(indent + '* ' + file.name);
//     });
// }

function generateGlossary (api) {
    var txt = new Text();

    txt.add('**Glossary**');
    txt.add();

    // sort alpha
    api.lib.sort(function(a, b) {
        return a.name > b.name;
    });

    utils.each(api.lib, function (mod) {
        var modDir = mod.path.split('/');
        modDir.pop();
        txt.add(' * [' + mod.name + '](' + modDir.join('/') + ')');
    });

    return txt.toString();
}

function create (api, dest) {
    if (dest) {
        utils.cleanDir(dest + '/lib');
    }

    // discover repo url
    // var repo = '';
    // try {
    //     repo = JSON.parse(fs.readFileSync('package.json', 'utf8')).repository.url;
    //     repo = repo.match(/(?:git\+)?(.+?)(?=\.git$|$)/)[1];
    //     repo += '/tree/master/';
    // } catch (e) {}

    console.log('need README in every folder');

    var docsGlossary = dest + '/lib/README.md';
    utils.writeFile(docsGlossary, generateGlossary(api));
    console.log('\n[readmejs] created docs at: ' + path.resolve(docsGlossary));
}


module.exports = {
    create: create
};
