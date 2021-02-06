# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
