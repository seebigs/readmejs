
var fs = require('fs');
var path = require('path');
var utils = require('seebigs-utils');


var indent = '    ';

function dash (term, override) {
    return term || term === 0 ? '-' + (override || term) : '';
}

function getId (data, options, current) {
    var id = '';

    if (data && data.path) {
        id = data.path;
    }

    if (!data && options.autoId) {
        id = current.parent + dash(current.id);
    }

    return id ? ' id="' + id + '"' : '';
}

function getClass (data, options, current) {
    var classNames = [];

    if (options.autoClassName) {
        classNames.push(current.parent + dash(current.item, 'item'));
    }

    if (typeof data === 'object' && data._classname) {
        classNames.push(data._classname);
    }

    if (current.class) {
        classNames.push(current.class.split(' ').shift() + dash(current.id));
    }

    return classNames.length ? ' class="' + classNames.join(' ') + '"' : '';
}

function buildModulesHTML (data, options, current) {
    current = current || {
        parent: 'app',
        id: '',
        class: '',
        tab: '',
        item: false
    };

    var html = current.tab + '<div' + getId(data, options, current) + getClass(data, options, current) + '>';

    if (typeof data === 'object') {

        if (current.id === 'params' && data.length) {
            html += '\n' + current.tab + indent + '<div class="readmejs-params-headers">\n' +
                current.tab + indent + indent + '<div class="readmejs-param-header-name">Name</div>\n' +
                current.tab + indent + indent + '<div class="readmejs-param-header-type">Type</div>\n' +
                current.tab + indent + indent + '<div class="readmejs-param-header-description">Description</div>\n' +
            current.tab + indent + '</div>';
        }

        if (!Array.isArray(data) || data.length) {
            utils.each(data, function (v, k) {
                if (typeof k !== 'string' || k.indexOf('_') !== 0) {
                    html += '\n' + buildModulesHTML(v, options, {
                        parent: current.parent + dash(current.id),
                        id: k,
                        class: data._classname,
                        tab: current.tab + indent,
                        item: true
                    });
                }
            });

            html += '\n' + current.tab;
        }

    } else if (typeof data !== 'undefined') {
        html += data;
    }

    return html + '</div>';
}

function buildNavHTML (data) {
    var html = '<ul>';

    utils.each(data.dirs, function (dir, name) {
        html += '<li><div class="readmejs-nav-dir-name readmejs-nav-clickable">' + name + '</div><div class="readmejs-nav-dir-contents">' + buildNavHTML(dir) + '</li>';
    });

    data.files.forEach(function (file) {
        html += '<li><div class="readmejs-nav-file-name readmejs-nav-clickable" data-nav-id="' + file.path + '">' + file.filename + '</div></li>';
    });

    return html + '</ul>';
}

function createLib (app, options) {
    var dest = options.dest + '/lib';
    if (dest) {
        var templatePath = path.join(path.dirname(fs.realpathSync(__filename)), '../templates/html/lib/');
        var template = utils.readFile(templatePath + 'default.html');

        var data = {
            appName: app.info.name,
            appVersion: app.info.version,
            modules: buildModulesHTML(app.lib, {}),
            navbar: buildNavHTML(app.resources),
            title: (app.info.name || '') + (app.info.version ? ' ' + app.info.version : '') + ' - Lib Documentation'
        };

        utils.cleanDir(dest);

        var outfile = dest + '/index.html';
        utils.writeFile(outfile, utils.template(template, data));
        utils.writeFile(dest + '/index.css', utils.readFile(templatePath + 'default.css'));
        utils.writeFile(dest + '/index.js', utils.readFile(templatePath + 'default.js'));

        console.log('\n[readmejs] created docs at: ' + path.resolve(outfile));
    }
}

function createApi (app, options) {
    var dest = options.dest + '/api';
    if (dest) {
        var templatePath = path.join(path.dirname(fs.realpathSync(__filename)), '../templates/html/api/');
        var template = utils.readFile(templatePath + 'default.html');

        var data = {
            appName: app.info.name,
            appVersion: app.info.version,
            api: buildModulesHTML(app.api, {}),
            title: (app.info.name || '') + (app.info.version ? ' ' + app.info.version : '') + ' - API Documentation'
        };

        utils.cleanDir(dest);

        var outfile = dest + '/index.html';
        utils.writeFile(outfile, utils.template(template, data));
        utils.writeFile(dest + '/index.css', utils.readFile(templatePath + 'default.css'));
        utils.writeFile(dest + '/index.js', utils.readFile(templatePath + 'default.js'));

        console.log('\n[readmejs] created docs at: ' + path.resolve(outfile));
    }
}



module.exports = {
    createApi: createApi,
    createLib: createLib
};
