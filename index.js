
var parse = require('./lib/parse.js');
var views = {
    html: require('./lib/view_lib_html.js'),
    markdown: require('./lib/view_lib_markdown.js')
};


function entry (options) {
    var opt = {
        app: {},
        dest: 'docs',
        paths: []
    };

    if (typeof options === 'string') {
        opt.src = options;
    } else {
        Object.assign(opt, options);
    }


    /* Build App Object */

    var app;

    if (!opt.src) {
        // search for entry file
        // package.json
        // index.js
        // opt.main = foundIt
    }

    var apiApp = parse.entry(opt);


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

    return apiApp;
}

function lib (options) {
    var opt = {
        app: {},
        dest: 'docs',
        exports: {}
    };

    if (typeof options === 'string') {
        opt.src = options;
    } else {
        Object.assign(opt, options);
    }


    /* Build App Object */

    var app;

    if (opt.src) {
        var libApp = parse.lib(opt);
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

    if (libApp) {
        view.createLib(libApp, opt);
    }

    return libApp;
}


module.exports = {
    entry: entry,
    lib: lib
};




entry({

    app: {
        name: 'Demo',
        version: '1.2.3'
    },

    src: 'my_app/src/entry',
    paths: [
        'my_app/src/entry'
    ],

    view: 'html'

});

lib({

    app: {
        name: 'Demo Source',
        version: '1.2.3'
    },

    // src: 'my_app/src/commonjs',
    // src: 'my_app/src/comments',

    src: 'my_app/src/global',
    exports: {
        global: '$'
    },

    view: 'html'

});
