Running `vf-core-service-discovery` in a directory will:

- Get package-lock.json or yarn.lock contents and look for all `vf` components and their versions
- Scan the directory recursively for HTML files
- Get all distinct tokens that start with `vf-`
- Get latest versions and YAML config of the found components
- Get the merged changelogs for all outdated components (with visual feedback?)

Add -f option to force invalidation.
