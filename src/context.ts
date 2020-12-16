import { ProcessingContext } from './definitions';

export default function getContext(): ProcessingContext {
  return {
    rootDirectory: process.cwd(),
    vfPackagePrefix: '@visual-framework'
  };
}
