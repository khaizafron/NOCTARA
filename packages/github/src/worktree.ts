import { exec } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export interface WorktreeInfo {
  branch: string;
  directory: string;
  createdAt: string;
}

export class GitWorktreeManager {
  private baseRepoDir: string;
  private sandboxDir: string;

  constructor(baseRepoDir = process.cwd(), sandboxDir = '.sandbox/worktrees') {
    this.baseRepoDir = path.resolve(baseRepoDir);
    this.sandboxDir = path.resolve(baseRepoDir, sandboxDir);
  }

  private runGit(command: string, cwd = this.baseRepoDir): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(`git ${command}`, { cwd }, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
        if (error) {
          reject(new Error(`Git command failed (${command}): ${stderr?.toString() || error.message}`));
        } else {
          resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
        }
      });
    });
  }

  public async createWorktree(branchName: string): Promise<WorktreeInfo> {
    await fs.mkdir(this.sandboxDir, { recursive: true });
    const targetDir = path.join(this.sandboxDir, branchName.replace(/[^a-zA-Z0-9_-]/g, '_'));

    await this.runGit(`worktree add -b ${branchName} "${targetDir}"`);

    return {
      branch: branchName,
      directory: targetDir,
      createdAt: new Date().toISOString()
    };
  }

  public async getDiff(worktreeDir: string): Promise<string> {
    const { stdout } = await this.runGit('diff', worktreeDir);
    return stdout;
  }

  public async commitAll(worktreeDir: string, message: string): Promise<string> {
    await this.runGit('add .', worktreeDir);
    const { stdout } = await this.runGit(`commit -m "${message}"`, worktreeDir);
    return stdout;
  }

  public async removeWorktree(worktreeDir: string): Promise<void> {
    try {
      await this.runGit(`worktree remove "${worktreeDir}" --force`);
    } catch {
      await fs.rm(worktreeDir, { recursive: true, force: true });
      await this.runGit('worktree prune');
    }
  }
}
