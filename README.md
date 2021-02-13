# <img src="media/logo.png" title="vf-core-service-discovery" alt="vf-core-service-discovery logo" width="350">

[![Build](https://github.com/oss6/vf-core-service-discovery/workflows/Build/badge.svg)](https://github.com/oss6/vf-core-service-discovery/actions)
[![Codecov](https://img.shields.io/codecov/c/github/oss6/vf-core-service-discovery)](https://codecov.io/github/oss6/vf-core-service-discovery)
[![David](https://img.shields.io/david/oss6/vf-core-service-discovery)](https://david-dm.org/oss6/vf-core-service-discovery)
[![npm](https://img.shields.io/npm/v/vf-core-service-discovery)](https://www.npmjs.com/package/vf-core-service-discovery)
[![license](https://img.shields.io/npm/l/vf-core-service-discovery)](https://github.com/oss6/vf-core-service-discovery/blob/master/LICENSE)

> :warning: This project is currently in active development; use with caution. Thanks!

`vf-core-service-discovery` is a tool to analyse the usage of [vf-core](https://github.com/visual-framework/vf-core) in your project.

# Table of contents

- [Table of contents](#table-of-contents)
- [Install](#install)
- [Basic usage](#basic-usage)
  * [CLI](#basic-usage-cli)
  * [Module](#basic-usage-module)
- [Features](#features)
- [CLI documentation](#cli-documentation)
  * [`run`](#cli-documentation-run)
    - [Options](#cli-documentation-run-options)
  * [`config`](#cli-documentation-config)
    - [Configuration items](#cli-documentation-config-configuration-items)
    - [Options](#cli-documentation-config-options)
- [Module documentation](#module-documentation)
- [What's next](#whats-next)
- [Contributing](#contributing)

# Install


Install the package using `npm` or `yarn` as follows:

```
$ npm i vf-core-service-discovery
```

```
$ yarn add vf-core-service-discovery
```

or globally

```
$ npm i -g vf-core-service-discovery
```

```
$ yarn global add vf-core-service-discovery
```

# Basic usage



## <a name="basic-usage-cli"></a>CLI



The main usage of `vf-core-service-discovery` is through a CLI.
A simple run of the following command will gather the usage of `vf-core` in the project:

```
$ vf-core-service-discovery run
```

An output example:

<img src="./media/vf-core-service-discovery-demo.gif" width="550" />

## <a name="basic-usage-module"></a>Module


`vf-core-service-discovery` can also be used as a module. A use case for this is if you want to have more control on the process.

```js
import ServiceDiscovery from 'vf-core-service-discovery';

async function run() {
  const serviceDiscovery = ServiceDiscovery.getInstance();

  await serviceDiscovery.setup({
    forceRun: false,
    verbose: true,
    logFile: 'test.log',
    loggingEnabled: true,
    profile: false,
  });

  const items = await serviceDiscovery.run(true);

  console.log(items);
}

run();
```

# Features


- Get package information such as current version, latest version, and component status.
- Get changelog if current and latest versions are mismatched.
- For each installed component get the dependent files (for now only `.html` files).

# CLI documentation


| Synopsis             | Description               |
|----------------------|---------------------------|
| `run`                  | Run the service discovery |
| `config [key] [value]` | Manage the configuration  |

## <a name="cli-documentation-run"></a>`run`

Synopsis: `vf-core-service-discovery run [options]`

### <a name="cli-documentation-run-options"></a> Options

| Option                  | Type    | Default                         | Description                 |
|-------------------------|---------|---------------------------------|-----------------------------|
| `-v`, `--verbose`           | boolean | `false`                           | Show debug information      |
| `-l`, `--log-file`          | string  | `'vf-core-service-discovery.log'` | Log file location           |
| `-f`, `--force`             | boolean | `false`                           | By-pass the cache           |
| `-p`, `--profile`             | boolean | `false`                         | Profile the service discovery           |
| `-r`, `--reporters`             | array | `['cli']`                       | The reporters to use (cli and json)     |
| `-d`, `--disabled`             | array | `[]`                       | List of disabled steps (from getConfig, getChangelog getDependents)     |
| `-o`, `--only-outdated` | boolean | `false` | Display only outdated components |
| `-m`, `--format` | string | `''` | Specifies the formatting for the results |

#### Custom formatting

If you would like to use your own formatting for displaying the results in the CLI you can specify the `--format` option.
The following tokens are used for displaying specific information for each discovery item:

- `%name`: component name
- `%usedVersion`: the version installed by your project
- `%latestVersion`: the package's latest version
- `%changelog(...)`: the changelog if applicable (i.e. if used version != latest version)
- `%changelog(...%version...)`: the version of a changelog item
- `%changelog(...%changes(...)...)`: the changes of a changelog item
- `%changes(...$change...)`: the actual change in a changelog item
- `$dependents(...)`: the dependents
- `$dependents(...$depenent...)`: the dependent item

**Examples**

```
$ vf-core-service-discovery --format "%name (%usedVersion, %latestVersion)"
$ ...
$ vf-box (1.5.6, 1.6.0)
$ vf-card (2.1.4, 2.1.4)
```

```
$ vf-core-service-discovery --format "%name\nChangelog\n%changelog(%version\n%changes(> %change)\n)"
$ vf-box
$ Changelog
$ 2.3.0
$ > updates font size for title/heading> makes sure the text is black inside the `--easy` variant.

$ vf-grid
$ Changelog
$ 1.4.0
$ > fixes flexbox fallback grid when there are items on two or more rows> fixes widths on flexbox fallback grid.
$ 1.3.0
$ > makes the layout something that can now use 'extends' within nunjucks
```

## <a name="cli-documentation-config"></a>`config`

Synopsis: `vf-core-service-discovery config [key] [value] [options]`

### <a name="cli-documentation-config-configuration-items"></a>Configuration items

| Key                 | Value  | Default | Description                              |
|---------------------|--------|---------|------------------------------------------|
| `cacheExpiry`       | string | `'8h'`      | Time before the cache expires            |
| `lastInvalidation`  | Date   | `null`    | Last time the cache has been invalidated |
| `vfCoreVersion`     | string | `''`      | Latest vf-core release version           |

### <a name="cli-documentation-config-options"></a>Options

| Option             | Type    | Default                         | Description                     |
|--------------------|---------|---------------------------------|---------------------------------|
| `-v`, `--verbose`  | boolean | `false`                           | Show debug information          |
| `-l`, `--log-file` | string  | `'vf-core-service-discovery.log'` | Log file location               |
| `-r`, `--reset`    | boolean | `false`                           | Reset configuration to defaults |

# Module documentation

Check the module documentation here: https://oss6.github.io/vf-core-service-discovery.

# What's next

1. Find dependents in different types of projects (for a start Angular and React).
2. API documentation using TypeDoc.
3. Add performance tests.

# Contributing

We welcome contributors and maintainers! To contribute please check the [contributing page](CONTRIBUTING.md) out.
