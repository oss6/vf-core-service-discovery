import fs from 'fs';
import http from 'isomorphic-git/http/node';
import git from 'isomorphic-git';

export async function cloneRepository(url: string, directory: string): Promise<void> {
  return await git.clone({
    fs,
    http,
    dir: directory,
    url,
    singleBranch: true,
    depth: 1,
  });
}
