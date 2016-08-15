
var utils = require('seebigs-utils');


function pathToDirTree (_dir, filepath, srcPath) {
    var pathArray = filepath.split(srcPath)[1].split('/');
    pathArray.shift();

    addPropIfNotPresent(_dir, pathArray);

    function addPropIfNotPresent (obj, dirs) {
        var prop = dirs.shift();
        if (prop) {
            if (dirs.length) {
                dirs.forEach(function (d) {
                    obj.dirs[prop] = obj.dirs[prop] || { dirs: {}, files: [] };
                    addPropIfNotPresent(obj.dirs[prop], dirs);
                });
            } else {
                obj.files.push({
                    name: prop,
                    path: filepath
                });
            }
        }
    }
}

function build (app, srcPath) {
    utils.each(app.modules, function (mod) {
        pathToDirTree(app.resources, mod.path, srcPath);
    });
}

module.exports = {
    build: build
};
