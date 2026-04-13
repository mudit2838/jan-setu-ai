import { test, expect } from '@playwright/test';

test.describe('Bharat JanSetu - Full Lifecycle Test', () => {

    // Generate a random mobile to simulate a fresh registration
    const citizenMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    test('E2E Citizen & Official Flow', async ({ page, request }) => {
        test.setTimeout(120000); // 2 Min timeout for slow AI API

        // ----------------------------------------------------------------------
        // STEP 1: CITIZEN REGISTRATION
        // ----------------------------------------------------------------------
        await test.step('Register a new Citizen via Mock OTP', async () => {
            await page.goto('http://localhost:3000/register');
            await expect(page.locator('text=Citizen Registration')).toBeVisible();

            // Setup interceptor for the OTP
            let interceptedOtp = '';
            page.on('response', async response => {
                if (response.url().includes('/api/users/register/initiate') && response.status() === 200) {
                    const body = await response.json();
                    if (body.dev_otp) interceptedOtp = body.dev_otp;
                }
            });

            // Fill form
            await page.fill('input[name="name"]', 'Vikas Sharma (Test)');
            await page.fill('input[name="mobile"]', citizenMobile);
            await page.selectOption('select:first-of-type', { label: 'Lucknow' });
            await page.waitForTimeout(1000);
            await page.selectOption('select:nth-of-type(2)', { label: 'Lucknow' });
            await page.waitForTimeout(1000);
            await page.selectOption('select:nth-of-type(3)', { label: 'Alambagh' });
            await page.fill('input[name="addressLine"]', 'House 42, Automation Sector');
            await page.fill('input[name="pincode"]', '226001');

            await page.click('button:has-text("Register")');

            // Wait for OTP step and type the intercepted OTP
            await expect(page.locator('text=Verify Mobile')).toBeVisible();
            await page.waitForTimeout(1000); // Wait for API to resolve
            await page.fill('input[placeholder="••••••"]', interceptedOtp);
            await page.click('button:has-text("Complete")');

            // Dashboard should load
            await expect(page.locator('text=Citizen Dashboard')).toBeVisible();
        });

        // ----------------------------------------------------------------------
        // STEP 2: CITIZEN LOGS A COMPLAINT
        // ----------------------------------------------------------------------
        await test.step('Citizen files a grievance', async () => {
            await page.click('button:has-text("Report New Issue")');
            await page.fill('input[placeholder="Brief title of your issue..."]', 'Broken Streetlights in Automation Sector');
            await page.fill('textarea[placeholder="Provide detailed information..."]', 'The streetlights have been completely non-functional for 3 weeks creating a safety hazard.');
            // Auto-location is hard to mock, assume backend defaults
            await page.click('button:has-text("Submit Grievance")');

            // It should appear in the My Grievances list
            await expect(page.locator('text=Broken Streetlights')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('text=AI Analysis Complete')).toBeVisible();
        });

        let complaintId = '';

        // ----------------------------------------------------------------------
        // STEP 3: LOGOUT CITIZEN, LOGIN AS OFFICIAL
        // ----------------------------------------------------------------------
        await test.step('Log out and log in as Official', async () => {
            await page.click('button:has-text("Logout")');
            await page.goto('http://localhost:3000/login');

            await page.click('button:has-text("Official / Admin")');
            await page.fill('input[type="email"]', 'local_lucknow_lucknow@up.gov.in'); // Standard seed
            await page.fill('input[type="password"]', 'Official@123'); // Standard seed

            // Intercept official OTP
            let officialOtp = '';
            page.on('response', async response => {
                if (response.url().includes('/api/users/login/initiate') && response.status() === 200) {
                    const body = await response.json();
                    if (body.dev_otp) officialOtp = body.dev_otp;
                }
            });

            await page.click('button:has-text("Send Secure")');
            await expect(page.locator('text=Verification Code')).toBeVisible();
            await page.waitForTimeout(1000);
            await page.fill('input[placeholder="••••••"]', officialOtp);
            await page.click('button:has-text("Login to Portal")');

            await expect(page.locator('text=Official Dashboard')).toBeVisible();
        });

        // ----------------------------------------------------------------------
        // STEP 4: OFFICIAL RESOLVES COMPLAINT
        // ----------------------------------------------------------------------
        await test.step('Official generates AI draft and resolves', async () => {
            // Find the row
            await page.click('text=Broken Streetlights');

            // Modal should open
            await expect(page.locator('text=Grievance Details')).toBeVisible();

            // Update Status Select
            await page.selectOption('select.w-full.border.rounded-xl', 'Resolved');

            // Click AI Auto-Draft
            await page.click('button:has-text("Auto-Draft Response")');

            // Wait for AI to fill textarea (assuming fast API locally)
            await page.waitForTimeout(4000);

            // Upload mock proof image... (Optional, backend accepts empty if local dev bypasses it, but let's assume URL)
            // Since it's a file input, we would attach a file.
            // await page.setInputFiles('input[type="file"]', 'tests/fixtures/proof.jpg');

            // Update
            await page.click('button:has-text("Update Action")');

            // Verify Toast or Modal Closure
            await expect(page.locator('text=Grievance Details')).toBeHidden({ timeout: 10000 });
        });
    });
});
