import fs from 'node:fs';
import path from 'node:path';

const VITEST_CONFIG_FILE = path.join(process.cwd(), 'vitest.config.ts');

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

function readVitestConfig(): string {
  if (!fs.existsSync(VITEST_CONFIG_FILE)) {
    console.error('vitest.config.ts not found.');
    process.exit(1);
  }

  return fs.readFileSync(VITEST_CONFIG_FILE, 'utf8');
}

function extractCurrentThresholds(configContent: string): FileCoverage {
  const thresholdsMatch = configContent.match(/thresholds:\s*{([^}]*)}/);
  if (!thresholdsMatch?.[1]) {
    console.error('Could not find coverage thresholds in vitest.config.ts');
    process.exit(1);
  }

  const thresholdsContent = thresholdsMatch[1];
  const extractNumber = (metric: string): number => {
    const match = thresholdsContent.match(new RegExp(`${metric}:\\s*([\\d.]+)`));
    if (!match?.[1]) {
      console.error(`Could not find ${metric} threshold in vitest.config.ts`);
      process.exit(1);
    }
    return Number(match[1]);
  };

  return {
    lines: { total: 0, covered: 0, skipped: 0, pct: extractNumber('lines') },
    functions: { total: 0, covered: 0, skipped: 0, pct: extractNumber('functions') },
    branches: { total: 0, covered: 0, skipped: 0, pct: extractNumber('branches') },
    statements: { total: 0, covered: 0, skipped: 0, pct: extractNumber('statements') },
  };
}

function updateVitestConfig(configContent: string, coverage: FileCoverage): void {
  const newThresholds = {
    lines: coverage.lines.pct,
    functions: coverage.functions.pct,
    branches: coverage.branches.pct,
    statements: coverage.statements.pct,
  };

  const updatedContent = configContent.replace(
    /thresholds:\s*{[^}]*}/,
    `thresholds: {
        lines: ${newThresholds.lines},
        functions: ${newThresholds.functions},
        branches: ${newThresholds.branches},
        statements: ${newThresholds.statements},
      }`
  );

  fs.writeFileSync(VITEST_CONFIG_FILE, updatedContent);
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
const vitestConfig = readVitestConfig();
const storedThresholds = extractCurrentThresholds(vitestConfig);

printCoverageSummary(currentCoverage.total);

const passed = checkCoverageAgainstThreshold(currentCoverage.total, storedThresholds);

if (passed) {
  console.log('Coverage check passed! ✅');
  // Update thresholds in vitest.config.ts if coverage improved
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;
  let improved = false;

  for (const metric of metrics) {
    if (currentCoverage.total[metric].pct > storedThresholds[metric].pct) {
      improved = true;
      break;
    }
  }

  if (improved) {
    console.log('Coverage improved! Updating thresholds in vitest.config.ts');
    updateVitestConfig(vitestConfig, currentCoverage.total);
  }

  process.exit(0);
} else {
  console.error('Coverage check failed! Coverage must not decrease. ❌');
  process.exit(1);
}
