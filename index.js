
var view = require('./lib/view_markdown.js');
var parseApp = require('./lib/parse_app.js');

function readmejs (options) {
    var opt = {
        src: 'src',
        dest: 'docs',
        exports: {

        },
        app: {
            name: 'API',
            version: '0.0.0'
        }
    };

    if (typeof options === 'string') {
        opt.src = options;
    } else {
        Object.assign(opt, options);
    }

    var app = parseApp(opt.src, opt.app, opt);

    view.create(app, opt.dest);

    return app;
}

module.exports = readmejs;

readmejs({
    // src: '../tags/src/javascripts/self_service'
    src: 'src/commonjs'

    // src: 'src/global',
    // exports: {
    //     global: '$'
    // }
});
