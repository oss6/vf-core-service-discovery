# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.0-beta.4](https://github.com/oss6/vf-core-service-discovery/compare/v0.1.0-beta.3...v0.1.0-beta.4) (2021-02-26)


### Features

* add formatters for cli-reporter (closes [#34](https://github.com/oss6/vf-core-service-discovery/issues/34)) ([67108bf](https://github.com/oss6/vf-core-service-discovery/commits/67108bfecde92ef8429985998b08957f5c3c25a5))
* add versions visual comparison ([d4c9847](https://github.com/oss6/vf-core-service-discovery/commits/d4c98471650ee9c77d5d0f0c51a7c451e24ee927))


### Bug Fixes

* cache invalidation ([3041cfe](https://github.com/oss6/vf-core-service-discovery/commits/3041cfed97f6726a123aa438f0deec3a61f283df))


### Refactoring

* use single cache file (closes [#38](https://github.com/oss6/vf-core-service-discovery/issues/38)) ([defe9fc](https://github.com/oss6/vf-core-service-discovery/commits/defe9fcbeb057f242fb82e312764a1683b48f1ac))


### Docs

* add module docs from TypeDoc ([4a5606c](https://github.com/oss6/vf-core-service-discovery/commits/4a5606c438c1d243cb384148a5eeb758a9126111))
* make default values preformatted ([501e09c](https://github.com/oss6/vf-core-service-discovery/commits/501e09c62845f5220b3ab24928b8727fb80c7be1))


### Others

* bump version ([a2d329b](https://github.com/oss6/vf-core-service-discovery/commits/a2d329b1de34932425e529b8b580cbbbc3f8e1b3))
* remove docs from readme and point to docs ([95d7258](https://github.com/oss6/vf-core-service-discovery/commits/95d72582fc48c1c49dfa340c6ab0f81cc190fbce))

## [0.1.0-beta.3](https://github.com/oss6/vf-core-service-discovery/compare/v0.1.0-beta.2...v0.1.0-beta.3) (2021-02-08)


### Features

* add option to disable optional pipeline steps (closes [#30](https://github.com/oss6/vf-core-service-discovery/issues/30)) ([79b55e8](https://github.com/oss6/vf-core-service-discovery/commits/79b55e8f2cc59c323a08387ff35649ef5255ec08))
* add outdated only option (closes [#33](https://github.com/oss6/vf-core-service-discovery/issues/33)) ([3e82889](https://github.com/oss6/vf-core-service-discovery/commits/3e8288945d91470afbde35b8cc24cd5090c69060))
* add profiling option (closes [#29](https://github.com/oss6/vf-core-service-discovery/issues/29)) ([987ccb0](https://github.com/oss6/vf-core-service-discovery/commits/987ccb06a67cc38008e2af8a37728e5a85de0081))
* refactor cli reporter and add json reporter (closes [#31](https://github.com/oss6/vf-core-service-discovery/issues/31)) ([842abed](https://github.com/oss6/vf-core-service-discovery/commits/842abed6ec17bd0886c71ec8498bc91cf7c2f992))


### Refactoring

* add cache for project exact version (closes [#28](https://github.com/oss6/vf-core-service-discovery/issues/28)) ([4d47eed](https://github.com/oss6/vf-core-service-discovery/commits/4d47eed0935f75e0974ae02b93e10732bcf60e34))


### Tests

* fix configuration, get exact version tests ([77a5a8e](https://github.com/oss6/vf-core-service-discovery/commits/77a5a8e5f935ace0d982ca0c5e0c69a3a1da3b03))
* fix getExactVersion tests ([dd464ca](https://github.com/oss6/vf-core-service-discovery/commits/dd464ca7af99813d760de469cef357306d8aef3c))


### Others

* add huskyrc ([1c7fe88](https://github.com/oss6/vf-core-service-discovery/commits/1c7fe88c7d583532ec438984e3d56626922feb71))
* add nycrc config ([bddb97c](https://github.com/oss6/vf-core-service-discovery/commits/bddb97c77dcc5fa5bb57016eb3bad802228287f5))


### Docs

* add new features documentation ([173e90c](https://github.com/oss6/vf-core-service-discovery/commits/173e90c324459232d0c3fc4cf4b16b9bdb3692f5))
* amend documentation ([2089ed7](https://github.com/oss6/vf-core-service-discovery/commits/2089ed74d53bf318ee52b0669a297e71b86afea3))

## [0.1.0-beta.2](https://github.com/oss6/vf-core-service-discovery/compare/v0.1.0-beta.1...v0.1.0-beta.2) (2021-02-06)


### Refactoring

* pipeline processing (closes [#24](https://github.com/oss6/vf-core-service-discovery/issues/24), closes [#26](https://github.com/oss6/vf-core-service-discovery/issues/26)) ([ea5cf2a](https://github.com/oss6/vf-core-service-discovery/commits/ea5cf2a21137cb60377090eeb922248674bbabaa))
* use non-blocking fs functions (closes [#25](https://github.com/oss6/vf-core-service-discovery/issues/25)) ([42a6433](https://github.com/oss6/vf-core-service-discovery/commits/42a643333ad0533d1fb45ed1cd505d8f3b0b6274))

## 0.1.0-beta.1

### Added

- `tools` path in component search

### Changed

- Removed GitHub authentication

## 0.1.0-beta.0

### Added

- Expose pipeline service and steps.
- API documentation.

### Changed

- Exposed `runServiceDiscovery` as a service class `ServiceDiscovery`.

## 0.1.0-alpha.2

### Changed

- rimraf in dependencies instead of devDependencies.

## 0.1.0-alpha.1

### Added

- Force run option (cache invalidation).
- Option to specify the log file location.

### Changed

- Use GitHub API to retrieve vf-core latest release version.
- Split commands: run and config.

## 0.1.0-alpha.0

### Added

- Get used and latest component version.
- Get component config.
- Get dependents for each installed component.
