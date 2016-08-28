
var parse = require('./lib/parse.js');
var views = {
    html: require('./lib/view_lib_html.js'),
    markdown: require('./lib/view_lib_markdown.js')
};

/*
fullOptions = {
    lib: 'path/to',
    main: 'path/to/filename.ext',
    dest: 'path/to',
    exports: {
        global: '$'
    },
    app: {
        name: 'NAME',
        version: '1.2.3'
    },
    view: 'html' || { create: fn() }
}
*/

function readmejs (options) {
    var opt = {
        dest: 'docs',
        exports: {},
        app: {}
    };

    if (typeof options === 'string') {
        opt.lib = options;
    } else {
        Object.assign(opt, options);
    }


    /* Build App Object */

    var app;

    if (!opt.lib && !opt.main) {
        // search for entry file
        // package.json
        // index.js
        // opt.main = foundIt
    }

    if (opt.lib) {
        app = parse.lib(opt);
    }

    if (opt.main) {
        app = parse.entry(opt);
    }

    if (!app) {
        console.log('ERROR: Options must contain .lib or .main or both');
        return;
    }


    /* Create View */

    var view = views.markdown;

    if (opt.view) {
        if (typeof opt.view === 'string') {
            view = views[opt.view];
        } else {
            view = opt.view;
        }
    }

    view.create(app, opt);

    return app;
}

module.exports = readmejs;

readmejs({

    lib: 'my_app/src/commonjs',
    // lib: 'my_app/src/comments',

    // lib: 'my_app/src/global',
    // exports: {
    //     global: '$'
    // },

    view: 'html'
});
