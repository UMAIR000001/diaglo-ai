import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const results = [];

try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  results.push('✅ Page loaded');

  // === WELCOME SCREEN ===
  const pageTitle = await page.locator('h1').textContent();
  results.push('Welcome heading: ' + pageTitle);

  // Check for key welcome screen elements
  const welcomeText = await page.locator('body').textContent();
  const welcomeChecks = [
    ['Title contains "Welcome to Diaglo AI"', /welcome to diaglo ai/i],
    ['Motto text present', /culturally aware diabetes care assistant/i],
    ['Trust card explains privacy', /your privacy matters/i],
    ['Trust card explains data collection', /medical and lifestyle information/i],
    ['CTA button "Get Started" visible', /get started/i],
    ['Footer mentions "Secure"', /secure/i],
  ];
  for (const [name, regex] of welcomeChecks) {
    const found = regex.test(welcomeText);
    results.push(`Welcome - "${name}": ${found ? '✅' : '❌'}`);
  }

  // Click "Get Started" CTA — navigates to /auth since no session yet
  const getStartedBtn = page.getByRole('button', { name: /get started/i });
  if (await getStartedBtn.isVisible()) {
    await getStartedBtn.click();
    await page.waitForTimeout(500);
    results.push('✅ Clicked "Get Started" — navigating to auth');
  } else {
    results.push('❌ "Get Started" button not found');
  }

  // === AUTH: Sign up with test credentials ===
  const testEmail = `smoke-${Date.now()}@diaglo-test.com`;
  const testPassword = 'test123456';

  // Check we're on the auth page
  const authHeading = await page.locator('h1').textContent();
  results.push('Auth heading: ' + authHeading);

  // Switch to signup mode if on login
  const signupToggle = page.getByRole('button', { name: /sign up/i });
  if (await signupToggle.isVisible()) {
    await signupToggle.click();
    await page.waitForTimeout(300);
    results.push('✅ Switched to signup mode');
  }

  // Fill credentials
  await page.getByLabel('Email').fill(testEmail);
  await page.getByLabel('Password').fill(testPassword);
  results.push('✅ Filled email and password');

  // Submit signup
  const createBtn = page.getByRole('button', { name: /create account/i });
  await createBtn.click();
  await page.waitForTimeout(1500);
  results.push('✅ Submitted signup form');

  // Check if we got redirected (no email confirmation) or see a message
  const currentUrl = page.url();
  results.push('URL after signup: ' + currentUrl);

  // If still on auth with a success message, email confirmation may be required
  const successMsg = await page.locator('text=/check your email/i').isVisible().catch(() => false);
  if (successMsg) {
    // Email confirmation required — try logging in with the same creds
    // (Supabase may still allow login if email confirm is not strictly enforced)
    const loginToggle = page.getByRole('button', { name: /sign in/i });
    if (await loginToggle.isVisible()) {
      await loginToggle.click();
      await page.waitForTimeout(300);
    }
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.click();
    await page.waitForTimeout(1500);
    results.push('🔄 Attempted sign-in after signup');
  }

  // Verify we landed on onboarding step 1
  const afterAuthUrl = page.url();
  results.push('URL after auth flow: ' + afterAuthUrl);

  // === STEP 1: Age, Gender, Height, Weight ===
  // Use label-based locators to avoid picking up hidden inputs (e.g. agent chat)
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Height').fill('170');
  await page.getByLabel('Weight').fill('72');
  results.push('✅ Filled Age, Height, Weight');

  // Select gender
  const genderBtn = page.getByRole('radio', { name: 'Male', exact: true });
  if (await genderBtn.isVisible()) {
    await genderBtn.click();
    results.push('✅ Gender selected: Male');
  }

  // Click Next
  const nextBtn = page.getByRole('button', { name: /next/i });
  await nextBtn.click();
  await page.waitForTimeout(400);
  results.push('✅ Step 1 completed (Age/Gender/Height/Weight)');

  // === STEP 2: Diabetes type, Medications, Symptoms, Health Conditions ===
  const h2 = await page.locator('h1').textContent();
  results.push('Step2 heading: ' + h2);

  // Select diabetes type
  const select = page.locator('select');
  if (await select.isVisible()) {
    await select.selectOption('type2');
    results.push('✅ Diabetes type selected');
  }

  // Fill medications
  const textareas = page.locator('textarea');
  if (await textareas.count() > 0) {
    await textareas.first().fill('Metformin 500mg twice daily');
    results.push('✅ Medications filled');
  }

  // Select symptoms
  const symptomBtn = page.getByRole('checkbox').filter({ hasText: 'Fatigue' }).first();
  if (await symptomBtn.isVisible()) {
    await symptomBtn.click();
    results.push('✅ Symptom selected: Fatigue');
  }

  // Select health condition
  const conditionBtn = page.getByRole('checkbox').filter({ hasText: 'Hypertension' }).first();
  if (await conditionBtn.isVisible()) {
    await conditionBtn.click();
    results.push('✅ Condition selected');
  }

  // Click Next
  const nextBtn2 = page.getByRole('button', { name: /next/i });
  await nextBtn2.click();
  await page.waitForTimeout(400);
  results.push('✅ Step 2 completed (Medical Baseline)');

  // === STEP 3: Activity Level, Sleep, Water, Diet ===
  const h3 = await page.locator('h1').textContent();
  results.push('Step3 heading: ' + h3);

  const pageText = await page.locator('body').textContent();

  const fieldChecks = [
    ['Activity Level', /activity/i],
    ['Sleep Hours', /sleep hours/i],
    ['Sleep Quality', /sleep quality/i],
    ['Water Intake', /water/i],
    ['Dietary Preferences', /diet|nutrition/i],
  ];

  for (const [name, regex] of fieldChecks) {
    const found = regex.test(pageText);
    results.push(`Field "${name}": ${found ? '✅' : '❌'}`);
  }

  // Count chip buttons
  const allBtns = page.locator('button');
  const btnCount = await allBtns.count();
  results.push('Total buttons: ' + btnCount);

  let chipCount = 0;
  const chipKeywords = ['sedentary', 'lightly', 'active', 'very active', 'extremely', 'excellent', 'fair', 'poor', 'good', 'vegan', 'vegetarian', 'omnivore', 'pescatarian', 'carnivore', 'keto', 'paleo', 'mediterranean', 'balanced', 'low-carb', 'fasting', 'restrictions'];
  for (let i = 0; i < btnCount; i++) {
    const txt = ((await allBtns.nth(i).textContent()) || '').toLowerCase();
    if (chipKeywords.some(k => txt.includes(k))) chipCount++;
  }
  results.push(`Chip buttons found: ${chipCount} (expect ~15-20): ${chipCount >= 10 ? '✅' : '❌'}`);

  // Interact with a chip
  const activeChip = page.getByRole('radio').filter({ hasText: /active/i }).first();
  if (await activeChip.isVisible()) {
    await activeChip.click();
    results.push('✅ Clicked activity level chip: ' + (await activeChip.textContent()));
  }

  // Check sliders
  const sliders = page.locator('input[type="range"]');
  const sliderCount = await sliders.count();
  results.push(`Sliders found: ${sliderCount} (expect 2): ${sliderCount >= 2 ? '✅' : '❌'}`);

  // Interact with sleep quality chip
  const qualityChip = page.getByRole('radio').filter({ hasText: /good|excellent|fair|poor/i }).first();
  if (await qualityChip.isVisible()) {
    await qualityChip.click();
    results.push('✅ Clicked sleep quality chip: ' + (await qualityChip.textContent()));
  }

  // Select dietary preference
  const dietChip = page.getByRole('checkbox').filter({ hasText: /balanced/i }).first();
  if (await dietChip.isVisible()) {
    await dietChip.click();
    results.push('✅ Selected dietary preference');
  }

  // Check progress shows step 3/4
  const stepIndicator = /step\s*3\s*(of|\/)\s*4/i.test(pageText);
  results.push(`Progress shows Step 3/4: ${stepIndicator ? '✅' : '❌'}`);

  // Click Next to go to Step 4
  const nextBtn3 = page.getByRole('button', { name: /next/i });
  await nextBtn3.click();
  await page.waitForTimeout(500);
  results.push('✅ Clicked Next on Step 3');

  // === STEP 4: Review & Submit ===
  const h4 = await page.locator('h1').textContent();
  results.push('Step4 heading: ' + h4);

  const step4Text = await page.locator('body').textContent();
  const reviewChecks = [
    ['Personal Info section', /personal info/i],
    ['Medical Baseline section', /medical baseline/i],
    ['Lifestyle section', /lifestyle/i],
    ['Shows age', /30\s*years/i],
    ['Shows height', /170\s*cm/i],
    ['Shows weight', /72\s*kg/i],
    ['Shows diabetes type', /type 2/i],
    ['Shows activity level', /active/i],
    ['Shows submit button', /submit/i],
    ['Shows back button', /back/i],
  ];

  for (const [name, regex] of reviewChecks) {
    const found = regex.test(step4Text);
    results.push(`Step4 - "${name}": ${found ? '✅' : '❌'}`);
  }

  // Check progress shows step 4/4
  const step4Indicator = /step\s*4\s*(of|\/)\s*4/i.test(step4Text);
  results.push(`Progress shows Step 4/4: ${step4Indicator ? '✅' : '❌'}`);

  console.log(results.join('\n'));
} catch (err) {
  console.error('❌ ERROR: ' + err.message);
  results.push('❌ Test failed: ' + err.message);
  console.log(results.join('\n'));
} finally {
  await browser.close();
}