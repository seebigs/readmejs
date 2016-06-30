
var utils = require('./utils.js');


var indent = '    ';

function dash (term, override) {
    return term || term === 0 ? '-' + (override || term) : '';
}

function getId (current) {
    return current.parent + dash(current.id);
}

function getClass (data, options, current) {
    var classNames = [];

    if (options.autoClassName) {
        classNames.push(current.parent + dash(current.item, 'item'));
    }

    if (typeof data === 'object' && data._readmejs_classname) {
        classNames.push(data._readmejs_classname);
    }

    if (current.class) {
        classNames.push(current.class + dash(current.id));
    }

    return classNames.length ? '" class="' + classNames.join(' ') : '';
}

function buildAppHTML (data, options, current) {
    current = current || {
        parent: 'app',
        id: '',
        class: '',
        tab: '',
        item: false
    };

    var html = current.tab + '<div id="' + getId(current) + getClass(data, options, current) + '">';

    if (typeof data === 'object') {
        utils.each(data, function (v, k) {
            if (typeof k !== 'string' || k.indexOf('_readmejs_') !== 0) {
                html += '\n' + buildAppHTML(v, options, {
                    parent: current.parent + dash(current.id),
                    id: k,
                    class: data._readmejs_classname,
                    tab: current.tab + indent,
                    item: true
                });
            }
        });

        html += '\n' + current.tab;

    } else {
        html += data;
    }

    return html + '</div>';
}

function buildNavHTML (data) {
    console.log(data);
    return '';

    var html = '<ul>';

    utils.each(data.modules, function (mod, i) {
        var interfaces = '';

        utils.each(mod.api, function (io) {
            interfaces += '<li>' + io.name + '</li>';
        });

        html += '<li data-module-id="' + i + '"><div class="readmejs-nav-module-name">' + mod.name + '</div><ul class="readmejs-nav-module-api">' + interfaces + '</ul></li>';
    });

    return html + '</ul>';
}

function create (api, dest) {
    if (dest) {
        var appHTML = buildAppHTML(api, {
            autoClassName: false
        });

        // console.log(api);
        // return;

        var templatePath = 'templates/default/';

        var template = utils.readFile(templatePath + 'default.html');
        var data = {
            appHTML: appHTML,
            navbar: buildNavHTML(api._readmejs_dir),
            title: api.info.name + (api.info.version ? ' ' + api.info.version : '') + ' - documentation'
        };

        utils.cleanDir(dest);
        utils.writeFile(dest + '/index.html', utils.template(template, data));
        utils.writeFile(dest + '/index.css', utils.readFile(templatePath + 'default.css'));
    }
}



module.exports = {
    create: create
};
