
var utils = require('seebigs-utils');


function pathToDirTree (_dir, mod, srcPath) {
    var pathArray = mod.path.split(srcPath)[1].split('/');
    pathArray.shift();

    addPropIfNotPresent(_dir, pathArray);

    function addPropIfNotPresent (obj, dirs) {
        var prop = dirs.shift();
        if (prop) {
            if (dirs.length) {
                obj.dirs[prop] = obj.dirs[prop] || { dirs: {}, files: [] };
                addPropIfNotPresent(obj.dirs[prop], dirs);

            } else {
                obj.files.push({
                    filename: prop,
                    path: mod.path,
                    module: mod.name
                });
            }
        }
    }
}

function build (app, srcPath) {
    utils.each(app.lib, function (mod) {
        pathToDirTree(app.resources, mod, srcPath);
    });
}

module.exports = {
    build: build
};
