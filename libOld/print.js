

function error (msg, stack) {
    output('READMEJS ERROR:');
    output(msg);
    if (stack) {
        output(stack);
    }
}

function output (msg) {
    console.log(msg);
}

module.exports = {
    error: error
};
