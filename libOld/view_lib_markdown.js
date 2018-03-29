
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

function addLabels (obj, txt) {
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

        txt.add();
        txt.add(labelType + labelDetails);
    });
}

function addParams (obj, txt) {
    if (obj.params && obj.params.length) {
        txt.add();
        txt.add('#### Params');
        txt.add();
        txt.add('Name|Type|Description');
        txt.add(':---|:---|:---');

        utils.each(obj.params, function (p) {
            txt.add((p.name || '') + '|' + (p.type ? '*' + p.type + '*' : '') + '|' + (p.description || ''));
        });
    }
}

function addReturns (obj, txt) {
    if (obj.type === 'method') {
        txt.add();
        txt.add('#### Returns');

        if (obj.returns && obj.returns.length) {
            utils.each(obj.returns, function (r) {
                txt.add('* ' + (r.type ? '*{' + r.type + '}* ' : '')  + (r.description || ''));
            });
        } else {
            txt.add('* undefined');
        }
    }
}

function addValue (obj, txt) {
    if (typeof obj.value !== 'undefined') {
        txt.add();
        if (obj.value.charAt(0) === '{') {
            txt.add('```');
            txt.add(obj.value);
            txt.add('```');
        } else {
            txt.add(obj.value);
        }
    }
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

function generateText (mod) {
    var txt = new Text();

    txt.add('---');
    txt.add();
    txt.add('# # ' + (mod.signature || mod.name));
    txt.add();
    txt.add('>' + mod.path);
    txt.add();

    utils.each(mod.comments, function (comment) {
        txt.add('*' + comment + '*');
    });

    addLabels(mod, txt);
    addParams(mod, txt);
    addReturns(mod, txt);
    addValue(mod, txt);

    utils.each(mod.properties, function (prop) {
        txt.add();
        txt.add('## `.' + prop.signature + '`');

        utils.each(prop.comments, function (cm) {
            if (cm) {
                txt.add('*' + cm + '*');
            }
        });

        addLabels(prop, txt);
        addParams(prop, txt);
        addReturns(prop, txt);
        addValue(prop, txt);
    });

    txt.add();

    return txt;
}

function generateReadmeFiles (app, path) {
    var readmeMap = {};

    utils.each(app.lib, function (mod) {
        var dir = mod.path.split('/');
        var filename = dir.pop();
        dir = dir.join('/');

        readmeMap[dir] = readmeMap[dir] || '';
        readmeMap[dir] += generateText(mod);
    });

    utils.each(readmeMap, function (contents, dest) {
        utils.writeFile(dest + '/README.md', contents);
    });
}

function generateGlossary (app, dest, options) {
    if (app.lib.length) {
        var txt = new Text();

        txt.add('# Glossary');
        txt.add();
        txt.add('Name|Path');
        txt.add(':---|:---');

        utils.each(app.lib, function (mod) {
            var modDir = mod.path.split('/');
            modDir.pop(); // drop filename
            txt.add('[' + mod.name + '](' + modDir.join('/') + ')|' + mod.path);
        });

        txt.add();

        utils.writeFile(dest, txt.toString());
    }
}

function create (app, options) {
    var dest = options.dest;
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

    generateReadmeFiles(app, options.lib);

    var docsGlossary = dest + '/lib/README.md';
    generateGlossary(app, docsGlossary, options);
    console.log('\n[readmejs] created docs at: ' + path.resolve(docsGlossary));
}


module.exports = {
    create: create
};
