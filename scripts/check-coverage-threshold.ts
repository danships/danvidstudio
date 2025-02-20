import fs from 'node:fs';
import path from 'node:path';

const THRESHOLD_FILE = path.join(process.cwd(), '.coverage-threshold.json');

interface CoverageData {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverage {
  lines: CoverageData;
  statements: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
}

interface CoverageSummary {
  total: FileCoverage;
}

function readCurrentCoverage(): CoverageSummary {
  const coverageFile = path.join(process.cwd(), 'coverage/coverage-summary.json');
  if (!fs.existsSync(coverageFile)) {
    console.error('No coverage report found. Run tests with coverage first.');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
}

function readStoredThresholds(): FileCoverage | null {
  if (!fs.existsSync(THRESHOLD_FILE)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(THRESHOLD_FILE, 'utf8'));
}

function writeNewThresholds(coverage: FileCoverage): void {
  fs.writeFileSync(THRESHOLD_FILE, JSON.stringify(coverage, null, 2));
}

function checkCoverageAgainstThreshold(current: FileCoverage, threshold: FileCoverage): boolean {
  let passed = true;
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;

  for (const metric of metrics) {
    if (current[metric].pct < threshold[metric].pct) {
      console.error(`${metric} coverage decreased: ${threshold[metric].pct}% -> ${current[metric].pct}%`);
      passed = false;
    }
  }

  return passed;
}

function printCoverageSummary(coverage: FileCoverage): void {
  console.log('\nCoverage Summary:');
  console.log('----------------');
  console.log(`Lines: ${coverage.lines.pct}%`);
  console.log(`Statements: ${coverage.statements.pct}%`);
  console.log(`Functions: ${coverage.functions.pct}%`);
  console.log(`Branches: ${coverage.branches.pct}%\n`);
}

// Main execution
const currentCoverage = readCurrentCoverage();
const storedThresholds = readStoredThresholds();

printCoverageSummary(currentCoverage.total);

if (!storedThresholds) {
  console.log('No previous thresholds found. Storing current coverage as baseline.');
  writeNewThresholds(currentCoverage.total);
  process.exit(0);
}

const passed = checkCoverageAgainstThreshold(currentCoverage.total, storedThresholds);

if (passed) {
  console.log('Coverage check passed! ✅');
  // Update thresholds if coverage improved
  writeNewThresholds(currentCoverage.total);
  process.exit(0);
} else {
  console.error('Coverage check failed! Coverage must not decrease. ❌');
  process.exit(1);
}
