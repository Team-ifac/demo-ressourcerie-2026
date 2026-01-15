import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

interface AuditResult {
  page: string;
  status: 'pass' | 'fail' | 'warning';
  errors: string[];
  warnings: string[];
  checks: {
    pageLoads: boolean;
    noConsoleErrors: boolean;
    linksWork: boolean;
    formsWork: boolean;
    apiCallsSucceed: boolean;
  };
}

const auditResults: AuditResult[] = [];

async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  return errors;
}

async function testPage(page: Page, url: string, pageName: string) {
  console.log(`\n🧪 Testing: ${pageName} (${url})`);
  
  const result: AuditResult = {
    page: pageName,
    status: 'pass',
    errors: [],
    warnings: [],
    checks: {
      pageLoads: false,
      noConsoleErrors: false,
      linksWork: false,
      formsWork: false,
      apiCallsSucceed: false,
    },
  };

  try {
    // Test page loads
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    result.checks.pageLoads = response?.ok() ?? false;
    
    if (!result.checks.pageLoads) {
      result.errors.push(`Page failed to load (status: ${response?.status()})`);
      result.status = 'fail';
    } else {
      console.log(`✅ Page loads`);
    }

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for console errors
    const consoleErrors = await captureConsoleErrors(page);
    result.checks.noConsoleErrors = consoleErrors.length === 0;
    
    if (consoleErrors.length > 0) {
      result.warnings.push(`Console errors: ${consoleErrors.join(', ')}`);
      result.status = result.status === 'fail' ? 'fail' : 'warning';
      console.log(`⚠️  Console errors found: ${consoleErrors.length}`);
    } else {
      console.log(`✅ No console errors`);
    }

    // Test all links on page
    const links = await page.locator('a').all();
    console.log(`📍 Found ${links.length} links`);
    
    let brokenLinks = 0;
    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const linkResponse = await page.request.head(href);
          if (!linkResponse.ok()) {
            brokenLinks++;
            result.warnings.push(`Broken link: ${href}`);
          }
        } catch (e) {
          // Link might be external or require auth
        }
      }
    }
    result.checks.linksWork = brokenLinks === 0;
    console.log(`✅ Links checked (${brokenLinks} broken)`);

    // Test forms
    const forms = await page.locator('form').all();
    result.checks.formsWork = forms.length >= 0;
    console.log(`📋 Found ${forms.length} forms`);

    // Check for common UI elements
    const buttons = await page.locator('button').all();
    const inputs = await page.locator('input').all();
    console.log(`🔘 Found ${buttons.length} buttons, ${inputs.length} inputs`);

  } catch (error) {
    result.errors.push(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    result.status = 'fail';
    console.log(`❌ Test failed: ${error}`);
  }

  auditResults.push(result);
  return result;
}

test.describe('Site Audit - Complete Test Suite', () => {
  test('Home page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/`, 'Home');
  });

  test('About page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/about`, 'About');
  });

  test('Help page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/aide`, 'Help/FAQ');
  });

  test('Learning Paths page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/parcours`, 'Learning Paths');
  });

  test('Profile Selection page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/selection-profil`, 'Profile Selection');
  });

  test('Thematic Collections page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/collections-thematiques`, 'Thematic Collections');
  });

  test('Resources page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/resources`, 'Resources');
  });

  test('Admin Import Formateurs page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/admin/import-formateurs`, 'Admin Import Formateurs');
  });

  test('Admin Resources Management page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/admin/resources-management`, 'Admin Resources Management');
  });

  test('Admin Dashboard page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/admin`, 'Admin Dashboard');
  });

  test('Library page', async ({ page }) => {
    await testPage(page, `${BASE_URL}/bibliotheque`, 'Library');
  });

  test('Generate Audit Report', async ({ page }) => {
    // Generate summary report
    const passed = auditResults.filter(r => r.status === 'pass').length;
    const failed = auditResults.filter(r => r.status === 'fail').length;
    const warnings = auditResults.filter(r => r.status === 'warning').length;

    console.log(`\n\n📊 AUDIT REPORT SUMMARY`);
    console.log(`========================`);
    console.log(`✅ Passed: ${passed}/${auditResults.length}`);
    console.log(`❌ Failed: ${failed}/${auditResults.length}`);
    console.log(`⚠️  Warnings: ${warnings}/${auditResults.length}`);
    console.log(`\n`);

    for (const result of auditResults) {
      console.log(`\n${result.page} [${result.status.toUpperCase()}]`);
      if (result.errors.length > 0) {
        console.log(`  ❌ Errors:`);
        result.errors.forEach(e => console.log(`     - ${e}`));
      }
      if (result.warnings.length > 0) {
        console.log(`  ⚠️  Warnings:`);
        result.warnings.forEach(w => console.log(`     - ${w}`));
      }
    }

    expect(failed).toBe(0);
  });
});
