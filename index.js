
var view = require('./lib/view.js');
var parseApp = require('./lib/parse_app.js');
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

    var app = parseApp(opt.src, opt.app, opt);

    view.create(app, opt.dest);

    // console.log('\n\n\n\n\n#############################################################################################################################################\n');
    // utils.debug(app);
    // console.log('modules.length = ' + app.modules.length);

    return app;
}

module.exports = readmejs;

readmejs({
    // src: '../tags/src/javascripts/self_service'
    // src: 'src/commonjs'

    // src: 'src/global',
    // exports: {
    //     global: '$'
    // }
});
