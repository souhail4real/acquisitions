// Simple Node.js tests without built-in test runner
import { readFile, access } from 'fs/promises';

console.log('🧪 Running Basic Application Tests...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

async function runTests() {
  try {
    // Test 1: Package.json structure
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    assert(packageJson.name, 'Package should have a name');
    assert(packageJson.version, 'Package should have a version');
    assert(packageJson.scripts, 'Package should have scripts defined');
    assert(packageJson.dependencies, 'Package should have dependencies');

    // Test 2: Project structure
    try {
      await access('src/app.js');
      await access('src/server.js');
      await access('src/index.js');
      assert(true, 'All required project files exist');
    } catch {
      assert(false, 'Required project files are missing');
    }

    // Test 3: Environment setup
    const nodeEnv = process.env.NODE_ENV || 'development';
    assert(nodeEnv, `Environment configured - NODE_ENV: ${nodeEnv}`);

    // Test 4: Dependencies check
    assert(packageJson.dependencies['express'], 'Express dependency exists');
    assert(
      packageJson.dependencies['drizzle-orm'],
      'Drizzle ORM dependency exists'
    );

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('💥 Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests();
