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

  // Click "Get Started" CTA to navigate to onboarding
  const getStartedBtn = page.getByRole('button', { name: /get started/i });
  if (await getStartedBtn.isVisible()) {
    await getStartedBtn.click();
    await page.waitForTimeout(500);
    results.push('✅ Clicked "Get Started" — navigating to onboarding');
  } else {
    results.push('❌ "Get Started" button not found');
  }

  // === STEP 1: Age, Gender, Height, Weight ===
  const inputs1 = page.locator('input');
  const inputCount1 = await inputs1.count();
  results.push('Step1 inputs: ' + inputCount1);

  // Fill Age (first input, type=number)
  if (inputCount1 >= 1) await inputs1.nth(0).fill('30');
  if (inputCount1 >= 2) await inputs1.nth(1).fill('170'); // height
  if (inputCount1 >= 3) await inputs1.nth(2).fill('72');  // weight

  // Select gender
  const genderBtn = page.getByRole('radio').first();
  if (await genderBtn.isVisible()) {
    await genderBtn.click();
    results.push('✅ Gender selected: ' + (await genderBtn.textContent()));
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