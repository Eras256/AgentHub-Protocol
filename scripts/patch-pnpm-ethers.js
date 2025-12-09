// Script to patch ethers package.json in pnpm store for @thirdweb-dev/react compatibility
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const pnpmPath = path.join(rootDir, 'node_modules/.pnpm');

function patchEthersPackage(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Only patch ethers v6
    if (packageJson.version && packageJson.version.startsWith('6.')) {
      if (!packageJson.exports) {
        packageJson.exports = {};
      }
      
      if (!packageJson.exports['./lib/utils']) {
        // Add ./lib/utils export
        packageJson.exports['./lib/utils'] = {
          "import": "./lib.esm/utils/index.js",
          "default": "./lib.commonjs/utils/index.js"
        };
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Find ethers packages in .pnpm
function findEthersInPnpm() {
  const packages = [];
  
  if (!fs.existsSync(pnpmPath)) {
    return packages;
  }
  
  try {
    // Use find command or PowerShell equivalent
    const entries = fs.readdirSync(pnpmPath);
    
    for (const entry of entries) {
      if (entry.includes('ethers@')) {
        const ethersDir = path.join(pnpmPath, entry, 'node_modules/ethers');
        const packageJsonPath = path.join(ethersDir, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          packages.push(packageJsonPath);
        }
      }
    }
  } catch (e) {
    console.log('Error searching .pnpm:', e.message);
  }
  
  return packages;
}

// Find all ethers packages recursively in .pnpm
function findAllEthersPackages(dir, maxDepth = 3, currentDepth = 0) {
  const packages = [];
  
  if (currentDepth >= maxDepth || !fs.existsSync(dir)) {
    return packages;
  }
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Check if this directory contains ethers
        const ethersPackageJson = path.join(fullPath, 'node_modules/ethers/package.json');
        if (fs.existsSync(ethersPackageJson)) {
          packages.push(ethersPackageJson);
        }
        
        // Recursively search
        if (entry.name.startsWith('@') || entry.name.includes('ethers')) {
          packages.push(...findAllEthersPackages(fullPath, maxDepth, currentDepth + 1));
        }
      }
    }
  } catch (e) {
    // Skip on error
  }
  
  return packages;
}

// Main execution
console.log('Searching for ethers packages in .pnpm...');
let ethersPackages = findEthersInPnpm();

// Also search recursively for any ethers packages
if (fs.existsSync(pnpmPath)) {
  const recursivePackages = findAllEthersPackages(pnpmPath);
  ethersPackages = [...new Set([...ethersPackages, ...recursivePackages])];
}

// Try the specific path from the error message
const specificPath = path.join(rootDir, 'node_modules/.pnpm/@thirdweb-dev+react@4.9.4_@_403480ac73b2e7d765bbff0cdedbf477/node_modules/ethers/package.json');
if (fs.existsSync(specificPath) && !ethersPackages.includes(specificPath)) {
  ethersPackages.push(specificPath);
}

if (ethersPackages.length === 0) {
  console.log('⚠️  No ethers packages found');
  console.log('   You may need to run: pnpm install');
} else {
  let patchedCount = 0;
  for (const packagePath of ethersPackages) {
    if (patchEthersPackage(packagePath)) {
      patchedCount++;
      console.log(`✅ Patched: ${path.relative(rootDir, packagePath)}`);
    }
  }
  
  if (patchedCount > 0) {
    console.log(`\n✅ Successfully patched ${patchedCount} ethers package(s)`);
  } else {
    console.log('✅ All ethers packages already patched or are v5');
  }
}

