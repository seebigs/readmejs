
var utils = require('./utils.js');


var indent = '    ';
var moduleCount = 0;

function dash (term, override) {
    return term || term === 0 ? '-' + (override || term) : '';
}

function getId (data, options, current) {
    var id = '';

    if (data && data._id) {
        id = data._id;
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
        classNames.push(current.class + dash(current.id));
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
        html += '<li><div class="readmejs-nav-file-name readmejs-nav-clickable" data-nav-id="' + file.path + '">' + file.name + '</div></li>';
        moduleCount++;
    });

    return html + '</ul>';
}

function create (api, dest) {
    if (dest) {
        var templatePath = 'templates/default/';
        var template = utils.readFile(templatePath + 'default.html');

        var data = {
            appName: api.info.name,
            appVersion: api.info.version,
            modules: buildModulesHTML(api.modules, {}),
            navbar: buildNavHTML(api.resources),
            title: api.info.name + (api.info.version ? ' ' + api.info.version : '') + ' - documentation'
        };

        utils.cleanDir(dest);
        utils.writeFile(dest + '/index.html', utils.template(template, data));
        utils.writeFile(dest + '/index.css', utils.readFile(templatePath + 'default.css'));
        utils.writeFile(dest + '/index.js', utils.readFile(templatePath + 'default.js'));
    }
}



module.exports = {
    create: create
};