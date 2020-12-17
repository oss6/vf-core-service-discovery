import { ProcessingContext } from './types';

export default function getContext(): ProcessingContext {
  return {
    rootDirectory: process.cwd(),
    vfPackagePrefix: '@visual-framework',
  };
}
