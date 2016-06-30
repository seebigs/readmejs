
var view = require('./lib/view.js');
var parse = require('./lib/parse.js');
var utils = require('./lib/utils.js');

function debug (obj) {
    console.log();
    console.log(JSON.stringify(obj, null, 4));
    console.log();
    console.log();
}

function readmejs (options) {
    var opt = {
        src: 'src',
        dest: 'docs',
        app: {
            name: 'My Beautiful App',
            version: '- v5.11.0'
        }
    };

    if (typeof options === 'string') {
        opt.src = options;
    } else {
        utils.extend(opt, options);
    }

    var api = parse(opt.src, opt.app);

    view.create(api, opt.dest);

    // debug(api);

    return api;
}

module.exports = readmejs;

readmejs();
