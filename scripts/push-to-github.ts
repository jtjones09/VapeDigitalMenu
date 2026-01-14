// Script to push code to GitHub using the integration
import { getGitHubAccessToken, getUncachableGitHubClient } from '../server/github';
import { execSync } from 'child_process';

async function main() {
  const repoOwner = 'jtjones09';
  const repoName = 'VapeDigitalMenu';
  
  try {
    console.log('Getting GitHub access token...');
    const accessToken = await getGitHubAccessToken();
    
    console.log('Getting GitHub client...');
    const octokit = await getUncachableGitHubClient();
    
    // Check if repo exists, if not create it
    try {
      await octokit.repos.get({ owner: repoOwner, repo: repoName });
      console.log(`Repository ${repoOwner}/${repoName} exists.`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`Creating repository ${repoName}...`);
        await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'MenuBoard - Digital Menu Platform for shops',
          private: false,
        });
        console.log('Repository created!');
      } else {
        throw error;
      }
    }
    
    // Configure git with the access token
    const remoteUrl = `https://x-access-token:${accessToken}@github.com/${repoOwner}/${repoName}.git`;
    
    console.log('Configuring git remote...');
    try {
      execSync(`git remote add github "${remoteUrl}"`, { stdio: 'pipe' });
    } catch {
      execSync(`git remote set-url github "${remoteUrl}"`, { stdio: 'pipe' });
    }
    
    console.log('Pushing to GitHub...');
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main';
    execSync(`git push -u github ${branch}`, { stdio: 'inherit' });
    
    console.log(`\nSuccess! Code pushed to https://github.com/${repoOwner}/${repoName}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
