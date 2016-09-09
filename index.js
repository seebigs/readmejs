
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
        app: {},
        paths: []
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

    if (opt.main) {
        var apiApp = parse.entry(opt);
    }

    if (opt.lib) {
        var libApp = parse.lib(opt);
    }

    if (!libApp && !apiApp) {
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

    if (apiApp) {
        view.createApi(apiApp, opt);
    }

    if (libApp) {
        view.createLib(libApp, opt);
    }

    return {
        api: apiApp,
        lib: libApp
    };
}

module.exports = readmejs;

readmejs({

    lib: 'my_app/src/commonjs',
    // lib: 'my_app/src/comments',

    // lib: 'my_app/src/global',
    // exports: {
    //     global: '$'
    // },

    main: 'my_app/src/entry',
    paths: [
        'my_app/src/entry'
    ],

    view: 'html'

});
