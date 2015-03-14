var fs = require('fs');
var path = require('path');
var co = require('co');
var Downloader = require('component-downloader');
var consoler = require('component-consoler');
var semver = require('semver');

module.exports = function(program, cb) {

    var remoteComponents = program.out || 'components';

    var downloader = Downloader({
      concurrency: 5, // 5 files at a time
      verbose: true,
      dir: remoteComponents
    });

    var download = co(function*() {
        var dependencies;
        if (typeof program.in === 'object') {
            dependencies = program.in;
        } else {
            var content = fs.readFileSync(program.in, 'utf8');
            dependencies = JSON.parse(content);
        }
        
        var conflicts = [];
        var downloads = [];

        for (var repoUrl in dependencies) {
            var entry = dependencies[repoUrl];
            for (var refKey in entry) {
                var reference = entry[refKey].version;
                var originRef = null;
                
                var hash = entry[refKey].resolved;
                var valid = semver.valid(reference);
                if (!valid || program.strict) {
                    // this looks like a branch, so we need 
                    // a commit hash here to be safe
                    if (hash == null) {
                        conflicts.push({
                            repo: repoUrl,
                            ref: reference,
                            message: 'invalid semver and no hash was provided'
                        });
                    } else {
                        originRef = reference;
                        reference = hash;
                    } 
                }

                downloads.push({
                    repo: repoUrl,
                    ref: reference,
                    rename: originRef
                });
            }
        }
        if (conflicts.length > 0) {
            if (cb) return cb(conflicts);
            consoler.error('%s problem(s) found', conflicts.length);
            conflicts.forEach(function(conflict) {
                consoler.error('%s@%s: %s', conflict.repo, conflict.ref, conflict.message);
            });
            process.exit(1);
        }

        for (var i=0; i<downloads.length; i++) {
            var item = downloads[i];
            yield* downloader(item.repo, item.ref);
            if (item.rename) {
                var oldPath = path.join(remoteComponents, item.repo, item.ref);
                var newPath = path.join(remoteComponents, item.repo, item.rename);
                consoler.log('install', 'rename to', item.rename);
                fs.renameSync(oldPath, newPath);
            }
        }
        cb();
    });

    download();
};