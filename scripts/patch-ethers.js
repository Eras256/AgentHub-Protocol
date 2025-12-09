// Script to patch ethers package.json to add ./lib/utils export for @thirdweb-dev/react compatibility
const fs = require('fs');
const path = require('path');

// Find all ethers package.json files (including in .pnpm)
function findEthersPackages(rootDir) {
  const packages = [];
  
  function searchDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check if this is an ethers package
          const packageJsonPath = path.join(fullPath, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              if (packageJson.name === 'ethers' && packageJson.version) {
                packages.push(packageJsonPath);
              }
            } catch (e) {
              // Not a valid package.json, continue
            }
          }
          
          // Recursively search (but limit depth for performance)
          if (entry.name !== 'node_modules' || dir === rootDir) {
            searchDir(fullPath);
          }
        }
      }
    } catch (e) {
      // Permission denied or other error, skip
    }
  }
  
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    searchDir(nodeModulesPath);
  }
  
  return packages;
}

function patchEthersPackage(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Only patch ethers v6 (v5 already has ./lib/utils)
    if (packageJson.version && packageJson.version.startsWith('6.')) {
      // Initialize exports if it doesn't exist
      if (!packageJson.exports) {
        packageJson.exports = {};
      }
      
      // Check if ./lib/utils export already exists
      if (!packageJson.exports['./lib/utils']) {
        // For ethers v6, add ./lib/utils export pointing to ./utils
        if (packageJson.exports['./utils']) {
          packageJson.exports['./lib/utils'] = packageJson.exports['./utils'];
        } else {
          // Fallback: point to utils index
          packageJson.exports['./lib/utils'] = {
            "import": "./lib.esm/utils/index.js",
            "default": "./lib.commonjs/utils/index.js"
          };
        }
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Main execution
const rootDir = path.join(__dirname, '..');
const ethersPackages = findEthersPackages(rootDir);

if (ethersPackages.length === 0) {
  console.log('⚠️  No ethers packages found');
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

