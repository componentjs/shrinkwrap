var fs = require('fs');
var path = require('path');
var glob = require('glob');
var semver = require('semver');
var consoler = require('component-consoler');

module.exports = function(program, cb) {

    var remoteComponents = program.in;

    glob(remoteComponents + '/**/component.json', function(err, files) {
        if (err) {
            consoler.error(err);
            if (cb) return cb(err);
            process.exit(1);
        }
        var dependencies = {};
        var multiVersions = {}; // same dependency in different versions

        files.forEach(function(filePath) {
            var componentJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            var relatativePath = path.relative(remoteComponents, filePath);
            var pathArray = relatativePath.split('/'); // [component, model 0.1.6]
            var userOrOrg = pathArray[0];
            var repoName = pathArray[1];
            var reference = pathArray[2]; // version or branch
            var repoUrl = userOrOrg + '/' + repoName; // component/model
            var hash = componentJson.resolved; // commit hash

            if (!dependencies[repoUrl]) dependencies[repoUrl] = {};
            if (!multiVersions[repoUrl]) {
                multiVersions[repoUrl] = {
                    multi: false,
                    versions: []
                };
            }
            multiVersions[repoUrl].versions.push(reference);
            if (Object.keys(dependencies[repoUrl]).length > 0) {
                multiVersions[repoUrl].multi = true;
            }
            dependencies[repoUrl][reference] = {
                version: reference,
                resolved: hash
            };
        });
        var warned = false;
        for (var dep in dependencies) {
            var data = dependencies[dep];
            for (var versionKey in data) {
                var versionItem = data[versionKey];
                if (versionItem.resolved == null) {
                    
                    if (versionItem.resolved === undefined && !warned) {
                        consoler.warn('save', 'your component version do not support shrinkwrapping in strict mode and for branches');
                        warned = true;
                    }
                    
                    var valid = semver.valid(versionItem.version);
                    var message = 'no hash found for ' + dep + '@' + versionItem.version;
                   
                    if (program.strict || !valid) {
                        if (cb) return  cb(new Error(message));
                        consoler.error('save', message);
                        process.exit(1);
                    } else if (program.verbose) {
                        consoler.log('save', message);
                    }
                }
            }
        }

        var amount = Object.keys(dependencies).length;
        if (program.out == null) {
            return cb(null, {
                dependencies: dependencies,
                meta: multiVersions
            });
        } else {
            var fileOutput = JSON.stringify(dependencies, null, 2);
            var outFile = program.out;
            fs.writeFileSync(outFile, fileOutput, 'utf8');
            consoler.log('save', 'wrote %s with %s dependencies', outFile, amount);
            for (var repoUrl in multiVersions) {
                var obj = multiVersions[repoUrl];
                if (obj.multi === true) {
                    consoler.log('save', 'dependency %s has multiple versions: %s', repoUrl, obj.versions);
                }
            }
            return cb();
        }
    });
};