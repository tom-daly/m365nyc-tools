#!/usr/bin/env node
/**
 * Deploys the static export to Azure Static Web Apps from a workstation.
 *
 * Deploys run from here rather than from CI because the site serves attendee
 * photos out of public/users/, which is generated locally from ingest/raw and is
 * never committed to this public repo. A CI deploy would ship a build with every
 * avatar silently replaced by a gradient.
 *
 * The deployment token is read from Azure at run time via the az CLI, so no
 * credential is ever written to disk or to the repo.
 */
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const RESOURCE_GROUP = 'm365nyc-raffle-rg';
const APP_NAME = 'm365nyc-raffle';

const fail = (message) => {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: 'utf8', shell: true, ...options });

const main = () => {
  const outDirectory = path.join(process.cwd(), 'out');

  if (!existsSync(outDirectory)) {
    fail('No out/ directory. Run `npm run build` first.');
  }

  // Mirrors the CI guard. The prune step should have handled this already, but
  // this is the last checkpoint before ~340MB of personal photos would go public.
  if (existsSync(path.join(outDirectory, 'originals-backup'))) {
    fail('out/originals-backup exists — refusing to deploy. Re-run `npm run build`.');
  }

  if (!existsSync(path.join(outDirectory, 'users'))) {
    console.warn('⚠️ out/users is missing — avatars will render as gradients.');
    console.warn('   Run `npm run optimize:images` to build it from ingest/raw.\n');
  }

  console.log('🔑 Fetching the deployment token from Azure...');
  let token;
  try {
    token = run('az', [
      'staticwebapp',
      'secrets',
      'list',
      '-n',
      APP_NAME,
      '-g',
      RESOURCE_GROUP,
      '--query',
      'properties.apiKey',
      '-o',
      'tsv',
    ]).trim();
  } catch {
    fail(`Could not read the deployment token. Is the az CLI installed and \`az login\` current?`);
  }

  if (!token) {
    fail(`Azure returned an empty deployment token for ${APP_NAME}.`);
  }

  console.log('🚀 Deploying out/ to Azure Static Web Apps...\n');
  try {
    execFileSync(
      'npx',
      [
        '--yes',
        '@azure/static-web-apps-cli',
        'deploy',
        'out',
        '--deployment-token',
        token,
        '--env',
        'production',
      ],
      { stdio: 'inherit', shell: true }
    );
  } catch {
    fail('Deployment failed. See the SWA CLI output above.');
  }
};

main();
