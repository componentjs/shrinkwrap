var generators = require('generator-supported');

if (generators) {
    module.exports = {
        save: require('./lib/save'),
        install: require('./lib/install')
    };
} else {
    module.exports = {
        save: require('./build/save'),
        install: require('./build/install')
    };
}