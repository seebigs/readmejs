var files = require('../files');
var modules = require('../modules');
var Parser = require('./parser');
var ParseTree = require('../../../parsetree-js'); // FIXME

function parseModule(contents, filepath, config) {
    var exportNodeValue = modules.findExportNode(contents, config);
    var file = files.getFileSummary(filepath, config.packagePath);
    var parser = new Parser(file, config);
    var parsedModule = parser.parseNode(exportNodeValue, parser);
    parsedModule.file = file;
    if (!parsedModule.name) {
        parsedModule.name = files.getNameFromFileSummary(file);
    }

    return parsedModule;
}

module.exports = parseModule;
