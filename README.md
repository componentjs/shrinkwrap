# shrinkwrapper for component 1.1.x

Lock down component dependency versions

This tool can be used like the [npm shrinkwrap tool](https://docs.npmjs.com/cli/shrinkwrap).

## Install

`npm install component-shrinkwrapper`

## Usage CLI

### write shrinkwrap

    component-shrinkwrapper --save --in components --out compoennt-shrinkwrap.json`

### install from shrinkwrap

    component-shrinkwrapper --install --in component-shrinkwrap.json --out components` 

you can omit the --in and --out args in this case, because it's the default

### Usage API

```js
var shrinkwrapper = require('component-shrinkwrapper');
shrinkwrapper.save(options, cb);
shrinkwrapper.install(options, cb);
```

#### shrinkwrapper.save(options, cb)

__options.out__: if this property is null, the result will not be written to a file

__cb(err, result)__: result is only available if `options.out` is null

#### shrinkwrapper.install(options, cb)

## Example workflow

1. install your components via component CLI oder component resolver
2. locate the directory where all the remote components are installed, in this case: `components`
3. run `component-shrinkwrap --save --in components --out compoennt-shrinkwrap.json`
4. `component-shrinkwrap-json` file contains all your remote dependencies, even transitive and components with multiple versions
5. run `component-shrikwrap --install --in component-shrinkwrap.json --out components-deshrinkwrapped` 
6. you get installed all the components from the shrinkwrap file

## strict mode

### support
The strict mode is only supported with component >= `1.1.x`.
If you're using the API you need 
- component-resolver >= `1.3.x`
- component-remotes >= `1.2.x` 
- component-downloader >= `1.2.x`

You can enable the script mode by using the arg `--strict`.

### branches
The srict mode is neccessary if some components using a branch instead of version.
Sometimes you see dependencies like `master` or `my-hacky-branch`.

In this case you may get a different version after some time if you reinstall the component.
component-shrinkwrap will enable the strict mode automatically if the version is invalid semver 
and use the commit hash instead for installing components.


### versions/tags
You can enforce the strict mode for all versions, even if they are valid semvers.
In some fancy cases this can make sense, because versions on GitHub can be delted and re-created
with a different hash.

### renaming
In strict mode component install the components into `USER/REPO/COMMIT-HASH`.
The shrinkwrap rename the `COMMIT-HASH` directory into the origin reference,
wich is either a semver or the branch.