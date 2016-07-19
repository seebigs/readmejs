
var view = require('./lib/view.js');
var parse = require('./lib/parse.js');
var utils = require('./lib/utils.js');

function readmejs (options) {
    var opt = {
        src: 'src',
        dest: 'docs',
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

    var api = parse(opt.src, opt.app);

    view.create(api, opt.dest);

    // utils.debug(api);

    return api;
}

module.exports = readmejs;

readmejs({
    // src: '../tags/src/javascripts/self_service'
});
