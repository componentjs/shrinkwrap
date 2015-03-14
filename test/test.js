var resolve = require('component-resolver');

var co = require('co');
var rimraf = require('rimraf');
var join = require('path').join;
var fs = require('fs');
var shrinkwrapper = require('..');
var exec = require('child_process').exec;

var componentsOut = join(process.cwd(), 'components');
var deshrinked = join(process.cwd(), 'deshrinked');

var options = {
  install: true,
  out: componentsOut
};

describe('shrinkwrap API', function() {
  beforeEach(function (done) {
    rimraf(componentsOut, done);
  });
    
    describe('save shrinkwrap form compoennts', function() {
      it('should save a component with its dependencies', function(done) {
        var tree = resolve({
          dependencies: {
            'component/each': '0.2.5'
          }
        }, options, function(err) {
            if (err) return done(err);
            // setup, install component/type with 3 dependencies
            var dir = join(componentsOut, 'component', 'type', '1.0.0');
            // now do shrinkwrap
            shrinkwrapper.save({
                in: componentsOut
            }, function(err, result) {
                if (err) return done(err);
                result.dependencies.should.exist;
                Object.keys(result.dependencies).length.should.equal(4);
                done();
            });
            
        });
      });

      it('should save 2 versions of the same component', function(done) {
        var tree = resolve({
          dependencies: {
            'component/to-function': '2.0.3',
            'component/each': '0.2.5'
          }
        }, options, function(err) {
            if (err) return done(err);
            // setup, install component/type with 3 dependencies
            var dir = join(componentsOut, 'component', 'type', '1.0.0');
            // now do shrinkwrap
            shrinkwrapper.save({
                in: componentsOut
            }, function(err, result) {
                if (err) return done(err);
                result.dependencies.should.exist;
                Object.keys(result.dependencies).length.should.equal(4);

                var metaItem = result.meta['component/to-function'];
                metaItem.multi.should.be.true;
                metaItem.versions.should.containDeep(['2.0.3','2.0.5']);
                done();
            });
        });
      });

      it('should save hash in for branches', function(done) {

        // this is the latest commit hash
        var latestHash = '699bcd524a39442e4bec52710ae38dfc36992be9';
        var tree = resolve({
          dependencies: {
            'timaschew/model': 'test-shrinkwrap'
          }
        }, options, function(err) {
            if (err) return done(err);
            // setup, install component/type with 3 dependencies
            var dir = join(componentsOut, 'timaschew', 'model', 'test-shrinkwrap');
            // now do shrinkwrap
           shrinkwrapper.save({
                in: componentsOut
            }, function(err, result) {
                if (err) return done(err);
                result.dependencies.should.exist;
                var data = result.dependencies['timaschew/model']['test-shrinkwrap'];
                data.version.should.equal('test-shrinkwrap');
                data.resolved.should.equal(latestHash);
                done();
            });
        });
      });

      it.skip('should save hash in strict mode for valid semvers', function(done) {

      });

      it.skip('should fail if no hash is available for a branch', function(done) {
        
      });

      it.skip('should fail in strict mode if no hash is available', function(done) {
        
      });
  });

  describe('should install from the shrinkwrap file', function() {
    it('should install correct dependencies and versions', function(done) {
        var shrinkwrap = {
            "component/each": {
                "0.2.5": {
                  "version": "0.2.5"
                }
              },
              "component/emitter": {
                "1.1.3": {
                  "version": "1.1.3"
                }
              }
        };
        
        shrinkwrapper.install({
            in: shrinkwrap
        }, function(err) {
            if (err) return done(err);
            var dirs = fs.readdirSync(join(componentsOut, 'component'));
            dirs.should.containDeep(['each','emitter']);
            dirs.length.should.equal(2);
            done();
            });
          });

      it('should use the hash for branches', function(done) {
        var shrinkwrap = {
            "timaschew/model": {
                "test-shrinkwrap": {
                  "version": "test-shrinkwrap",
                  "resolved": "d9953fcfd5c0524f5d77f7d0b568b82a14815abb" // this is not the latest commit hash
                }
              }
        };
        
        shrinkwrapper.install({
            in: shrinkwrap
        }, function(err) {
            if (err) return done(err);
            var dir = join(componentsOut, 'timaschew', 'model', 'test-shrinkwrap');
            var componentJson = JSON.parse(fs.readFileSync(join(dir, 'component.json')));
            componentJson.version.should.equal('0.1.4');
            done();
        });
      });


      it('should use the hash in strict mode for valid semvers', function(done) {
        // the version don't exist, but the shrinkwrapper should ignore it in strict mode
        // but it should still rename it to the version
        var shrinkwrap = {
            "timaschew/model": {
                "999.999.999": {
                  "version": "999.999.999",
                  "resolved": "dacec05614157a45197e94d09b71612f7b391fbe"
                }
              }
        };
        shrinkwrapper.install({
            in: shrinkwrap,
            strict: true
        }, function(err) {
            if (err) return done(err);
            var dir = join(componentsOut, 'timaschew', 'model', '999.999.999');
            var componentJson = JSON.parse(fs.readFileSync(join(dir, 'component.json')));
            componentJson.version.should.equal('0.1.3');
            done();
        });
      });

      it('should fail if the hash is not available for a branch', function(done) {
        var shrinkwrap = {
            "timaschew/model": {
                "test-shrinkwrap": {
                  "version": "test-shrinkwrap"
                }
              }
        };
        
        shrinkwrapper.install({
            in: shrinkwrap
        }, function(err) {
            err.should.exist;
            firstError = err[0];
            firstError.should.exist;
            firstError.message.should.match(/no hash was provided/);
            done();
        });
      });

      it('should fail if the hash is not available in strict mode', function(done) {
        var shrinkwrap = {
            "timaschew/model": {
                "test-shrinkwrap": {
                  "version": "test-shrinkwrap"
                }
              }
        };
        shrinkwrapper.install({
            in: shrinkwrap,
            strict: true
        }, function(err) {
            err.should.exist;
            firstError = err[0];
            firstError.should.exist;
            firstError.message.should.match(/no hash was provided/);
            done();
        });
      });

  });

});


describe.skip('shrinkwrap CLI', function() {
  beforeEach(function (done) {
    done();
    rimraf(componentsOut, done);
  });

  it('should save from components', function() {

  });

  it.skip('should install from shrinkwrap file', function() {

  });
});