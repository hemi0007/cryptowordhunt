#!/usr/bin/env node

/**
 * Script to prepare ChainWords for deployment to Hostinger
 * 
 * This script:
 * 1. Builds the application
 * 2. Prepares necessary files for production
 * 3. Creates a deployment package
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to run shell commands
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, { cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) console.error(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
};

// Main function
async function main() {
  try {
    console.log('🚀 Starting Hostinger deployment preparation...');
    
    // Step 1: Install dependencies
    console.log('\n📦 Installing dependencies...');
    await runCommand('npm ci');
    
    // Step 2: Build the project
    console.log('\n🏗️ Building project...');
    await runCommand('npm run build');
    
    // Step 3: Create a package.json specifically for production
    console.log('\n📄 Creating production package.json...');
    const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
    
    // Simplify package.json for production
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: 'ChainWords - Crypto Word Search Game',
      main: 'index.js',
      type: 'module',
      scripts: {
        start: 'node index.js'
      },
      dependencies: packageJson.dependencies
    };
    
    // Write production package.json to dist folder
    await fs.writeFile(
      path.join(rootDir, 'dist', 'package.json'),
      JSON.stringify(prodPackageJson, null, 2)
    );
    
    // Step 4: Create .env.example file for reference
    console.log('\n🔑 Creating .env.example file...');
    const envExample = `# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Node Environment
NODE_ENV=production

# Port Configuration (optional)
PORT=8080
`;
    await fs.writeFile(path.join(rootDir, 'dist', '.env.example'), envExample);
    
    // Step 5: Create deployment instructions
    console.log('\n📝 Creating deployment instructions...');
    const deploymentReadme = `# ChainWords Deployment

This folder contains the production build of ChainWords.

## Deployment Steps for Hostinger

1. Upload all these files to your Hostinger hosting environment
2. Create a .env file based on .env.example with your actual credentials
3. Install dependencies: \`npm install\`
4. Start the application: \`npm start\`

For process management, it's recommended to use PM2:
\`\`\`
npm install -g pm2
pm2 start index.js --name chainwords
pm2 save
pm2 startup
\`\`\`

## Troubleshooting

- If you encounter CORS issues, make sure your Supabase project has the correct origins configured
- For database connection issues, verify your SUPABASE_URL and SUPABASE_KEY environment variables
`;
    await fs.writeFile(path.join(rootDir, 'dist', 'README.md'), deploymentReadme);
    
    // Step 6: Create a deployment archive
    console.log('\n📦 Creating deployment archive...');
    await runCommand('cd dist && zip -r ../chainwords-deploy.zip .');
    
    console.log('\n✅ Deployment preparation complete!');
    console.log('📁 Deployment files are in the dist/ directory');
    console.log('📦 Deployment archive: chainwords-deploy.zip');
    console.log('\nTo deploy, upload chainwords-deploy.zip to your Hostinger server and follow the instructions in dist/README.md');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
    process.exit(1);
  }
}

// Run the script
main();