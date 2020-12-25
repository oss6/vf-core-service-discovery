# <img src="media/logo.png" title="vf-core-service-discovery" alt="vf-core-service-discovery logo" width="350">

![Build](https://github.com/oss6/vf-core-service-discovery/workflows/Build/badge.svg)
![Codecov](https://img.shields.io/codecov/c/github/oss6/vf-core-service-discovery)
![David](https://img.shields.io/david/oss6/vf-core-service-discovery)
![npm](https://img.shields.io/npm/v/vf-core-service-discovery)
![NPM](https://img.shields.io/npm/l/vf-core-service-discovery)

> :warning: This project is currently in active development; use with caution. Thanks!

`vf-core-service-discovery` is a tool to analyse the usage of [vf-core](https://github.com/visual-framework/vf-core) in your project.

## Install

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

## Basic usage

A simple run of the following command will gather the usage of `vf-core` in the project:

```
$ vf-core-service-discovery run
```

An output example:

<img src="./media/vf-core-service-discovery-demo.gif" width="550" />

## Features

- Get package information such as current version, latest version, and component status.
- Get changelog if current and latest versions are mismatched.
- For each installed component get the dependent files (for now only `.html` files).

## What's next

- Find dependents in different types of projects (for a start Angular and React).
- Better user experience and interface.
- API documentation.

## Contributing

We welcome contributors and maintainers! To contribute please check the [contributing page](CONTRIBUTING.md) out.
