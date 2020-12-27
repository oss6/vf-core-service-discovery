# <img src="media/logo.png" title="vf-core-service-discovery" alt="vf-core-service-discovery logo" width="350">

![Build](https://github.com/oss6/vf-core-service-discovery/workflows/Build/badge.svg)
![Codecov](https://img.shields.io/codecov/c/github/oss6/vf-core-service-discovery)
![David](https://img.shields.io/david/oss6/vf-core-service-discovery)
![npm](https://img.shields.io/npm/v/vf-core-service-discovery)
![NPM](https://img.shields.io/npm/l/vf-core-service-discovery)

> :warning: This project is currently in active development; use with caution. Thanks!

`vf-core-service-discovery` is a tool to analyse the usage of [vf-core](https://github.com/visual-framework/vf-core) in your project.

# Table of contents

- [Table of contents](#table-of-contents)
- [Install](#install)
- [Basic usage](#basic-usage)
  * [CLI](#cli)
  * [Module](#module)
- [Features](#features)
- [CLI documentation](#cli-documentation)
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

## CLI

The main usage of `vf-core-service-discovery` is through a CLI.
A simple run of the following command will gather the usage of `vf-core` in the project:

```
$ vf-core-service-discovery run
```

An output example:

<img src="./media/vf-core-service-discovery-demo.gif" width="550" />

## Module

`vf-core-service-discovery` can also be used as a module. A use case for this is if you want to have more control on the process.

```js
import runServiceDiscovery from 'vf-core-service-discovery';

async function run() {
  const discoveryOutput = await runServiceDiscovery({
    forceRun: false,
    forceGitHubAuth: false,
    verbose: true,
    logFile: 'vf-core-service-discovery.log',
    loggingEnabled: true,
  });

  console.log(discoveryOutput);
}

run();
```

# Features

- Get package information such as current version, latest version, and component status.
- Get changelog if current and latest versions are mismatched.
- For each installed component get the dependent files (for now only `.html` files).

# CLI documentation

| Synopsis             | Description               |
|----------------------|---------------------------|
| `run`                  | Run the service discovery |
| `config [key] [value]` | Manage the configuration  |

## `run`

Synopsis: `vf-core-service-discovery run [options]`

### Options

| Option                  | Type    | Default                         | Description                 |
|-------------------------|---------|---------------------------------|-----------------------------|
| `-v`, `--verbose`           | boolean | false                           | Show debug information      |
| `-l`, `--log-file`          | string  | 'vf-core-service-discovery.log' | Log file location           |
| `-f`, `--force`             | boolean | false                           | By-pass the cache           |
| `-g`, `--force-github-auth` | boolean | false                           | Force GitHub authentication |

## `config`

Synopsis: `vf-core-service-discovery config [key] [value] [options]`

### Configuration items

| Key                 | Value  | Default | Description                              |
|---------------------|--------|---------|------------------------------------------|
| `cacheExpiry`       | string | 8h      | Time before the cache expires            |
| `lastInvalidation`  | Date   | null    | Last time the cache has been invalidated |
| `gitHubAccessToken` | string | ''      | GitHub access token                      |
| `vfCoreVersion`     | string | ''      | Latest vf-core release version           |

### Options

| Option             | Type    | Default                         | Description                     |
|--------------------|---------|---------------------------------|---------------------------------|
| `-v`, `--verbose`  | boolean | false                           | Show debug information          |
| `-l`, `--log-file` | string  | 'vf-core-service-discovery.log' | Log file location               |
| `-r`, `--reset`    | boolean | false                           | Reset configuration to defaults |

# Module documentation

## `runServiceDiscovery(options: Options): Promise<Partial<DiscoveryItem>[]>`

```ts
interface Options {
  forceRun: boolean;
  forceGitHubAuth: boolean;
  verbose: boolean;
  loggingEnabled: boolean;
  logFile: string;
}
```

```ts
interface DiscoveryItem {
  name: string;                 // Component name (e.g. @visual-framework/vf-box)
  nameWithoutPrefix: string;    // e.g. vf-box
  version: string;              // Installed version of the component
  packageJson: PackageJson;     // Latest version package.json
  config: ComponentConfig;      // Latest version config
  changelog: ChangelogItem[];   // Changelog between the installed and latest version
  dependents: string[];         // Files that use the component
}
```

## `pipeline.Pipeline`

Defines a pipeline processing discovery items.

### `Pipeline.getInstance()`

Gets the `Pipeline` singleton.

### `addStep(step: PipelineStep): Pipeline`

Adds a step to the pipeline.

```ts
type PipelineStep = (source: Partial<DiscoveryItem>) => Promise<Partial<DiscoveryItem>>;
```

### `run(source: string[], context: PipelineContext): Promise<Partial<DiscoveryItem>[]>`

Runs the pipeline given a source and a context.

```ts
interface PipelineContext {
  rootDirectory: string;    // Root directory to analyse
  vfPackagePrefix: string;  // '@visual-framework'
}
```

## `pipeline.getComponents(context: PipelineContext): Promise<string[]>`

Gets the installed components in the current project.

## `pipeline.getExactVersion(discoveryItem: Partial<DiscoveryItem>, context: PipelineContext): Promise<Partial<DiscoveryItem>>`

Extends the discovery item with the exact version of the installed component from the local lock file.

## `pipeline.getPackageJson(discoveryItem: Partial<DiscoveryItem>): Promise<Partial<DiscoveryItem>>`

Extends the discovery item with the latest package.json of the installed component.

## `pipeline.getConfig(discoveryItem: Partial<DiscoveryItem>): Promise<Partial<DiscoveryItem>>`

Extends the discovery item with the latest component configuration file (YAML or JS).

## `pipeline.getChangelog(discoveryItem: Partial<DiscoveryItem>): Promise<Partial<DiscoveryItem>>`

Extends the discovery item with the changelog between the installed and the latest version.

## `pipeline.getDependents(discoveryItem: Partial<DiscoveryItem>, context: PipelineContext): Promise<Partial<DiscoveryItem>>`

Extends the discovery item with the dependents of the component.

# What's next

1. Find dependents in different types of projects (for a start Angular and React).
2. API documentation.
3. Parallelise processing.
4. Better user experience and interface.

# Contributing

We welcome contributors and maintainers! To contribute please check the [contributing page](CONTRIBUTING.md) out.
