# shrinkwrapper for component 1.1.x

Lock down component dependency versions

This tool can be used like the [npm shrinkwrap tool](https://docs.npmjs.com/cli/shrinkwrap).

## Install

`npm install component-shrinkwrap`

## Usage CLI

### write shrinkwrap

    component-shrinkwrap --save --in components --out compoennt-shrinkwrap.json`

### install from shrinkwrap

    component-shrinkwrap --install --in component-shrinkwrap.json --out components` 

you can omit the --in and --out args in this case, because it's the default

### Usage API

```js
var shrinkwrap = require('component-shrinkwrap');
shrinkwrap.save(options, cb);
shrinkwrap.install(options, cb);
```

#### shrinkwrap.save(options, cb)

__options.out__: if this property is null, the result will not be written to a file

__cb(err, result)__: result is only available if `options.out` is null

#### shrinkwrap.install(options, cb)


## strict mode

### support
The strict mode is only supported with component >= `1.1.x`.
If you're using the API you need 
- component-resolver >= `1.3.x`
- component-remotes >= `1.2.x` 
- component-downloader >= `1.2.x`

You can enable the script mode by using the arg `--strict`.

### branches
For branches the srict mode is enabled automatically, it's necessary if some components using a branch instead of a semver.
Sometimes you see dependencies like `master` or `my-hacky-branch`.

In this case you may get a different version after some time if you reinstall the component.
component-shrinkwrap will enable the strict mode automatically if the version is invalid semver 
and use the commit hash instead the version for installing components.


### versions/tags
You can enforce the strict mode for all versions, even if they are valid semvers.
In some fancy cases this can make sense, because versions on GitHub can be delted and re-created
with a different hash.

### renaming
In strict mode component install the components into `USER/REPO/COMMIT-HASH`.
The shrinkwrap rename the `COMMIT-HASH` directory into the origin reference,
wich is either a semver or the branch.


## Example workflow

1. install your components via component CLI or component resolver
2. locate the directory where all the remote components are installed, in this case: `components`
3. run `component-shrinkwrap --save --in components --out component-shrinkwrap.json`
4. `component-shrinkwrap.json` file contains all your remote dependencies, even transitive and components with multiple versions
5. run `component-shrinkwrap --install --in component-shrinkwrap.json --out components-unwrapped` 
6. you get installed all the components from the shrinkwrap file

## Avoid a messy components directory

If you want to update your dependencies via `component-pin` or via `component-install`
you can just rerwrite your shrinkwrap file.  
Because component can install multiple versions of the same dependency and use a flat hierarchy 
(npm use a different strategy) it will never overwrite or delete old (and outdated) dependencies.

This can cause that your __components__ directory become a really mess.
To aovid this issue you can delete the __components__ directory before updating a component.

If you use branches or `*` instead of semver, it can happen that some other
dependencies will update as well and get breaking changes.
