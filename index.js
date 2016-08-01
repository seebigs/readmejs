
var view = require('./lib/view.js');
var parse = require('./lib/parse.js');
var utils = require('./lib/utils.js');

function readmejs (options) {
    var opt = {
        src: 'src',
        dest: 'docs',
        exports: {

        },
        app: {
            name: 'API',
            version: ''
        }
    };

    if (typeof options === 'string') {
        opt.src = options;
    } else {
        utils.extend(opt, options);
    }

    var api = parse(opt.src, opt.app, opt);

    view.create(api, opt.dest);

    console.log('\n\n\n\n\n\n\n\n\n###############################################\n');
    // utils.debug(api);

    return api;
}

module.exports = readmejs;

readmejs({
    // src: '../tags/src/javascripts/self_service'
    // src: 'src/commonjs'

    // src: '../dollar-js/src/dollar/fake',
    // exports: {
    //     global: '$'
    // }
});
