import path from 'path';
import test from 'ava';
import execa from 'execa';
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafP = promisify(rimraf);

test.serial.before(async () => {
  await rimrafP('vf-core-service-discovery-e2e-projects');
  await execa('git', ['clone', 'https://github.com/oss6/vf-core-service-discovery-e2e-projects']);
});

test.serial('basic e2e', async (t) => {
  // arrange
  const testExampleDirectory = path.join('vf-core-service-discovery-e2e-projects', 'basic');
  const tsNodeFileName = path.resolve(path.join('node_modules', '.bin', 'ts-node'));
  const cliFileName = path.resolve(path.join('src', 'cli', 'index.ts'));
  const tsConfigFileName = path.resolve('tsconfig.json');

  // act
  const { stdout } = await execa(tsNodeFileName, ['--project', tsConfigFileName, cliFileName, 'run'], {
    cwd: testExampleDirectory,
  });

  // assert
  t.true(stdout.includes('vf-box'));
  t.true(stdout.includes('vf-footer'));
  t.true(stdout.includes('vf-grid'));
});
