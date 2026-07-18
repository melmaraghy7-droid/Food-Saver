import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING FOODSAVER AUTHENTICATION SYSTEM TESTS ---');

  try {
    // 1. Clear previous test database data if any by deleting users.json or restarting,
    // but we can also just register a unique email to ensure it registers fresh.
    const testEmail = `volunteer_${Math.random().toString(36).substr(2, 5)}@test.com`;

    // 2. Test Volunteer Registration
    console.log('\n[Test 1] Registering a new volunteer...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Carlos Diaz',
        email: testEmail,
        mobileNumber: '051234567',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'Volunteer'
      })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'Volunteer registration status should be 201');
    assert.ok(regData.user.id, 'Registered user should have a generated ID');
    console.log('✓ Volunteer registered successfully!');

    // 3. Test Admin Registration Attempt (Should Fail)
    console.log('\n[Test 2] Attempting to register as Admin (Should fail)...');
    const adminRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Hacker Admin',
        email: 'hackeradmin@test.com',
        mobileNumber: '051234567',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'Admin'
      })
    });
    const adminRegData = await adminRegRes.json();
    assert.strictEqual(adminRegRes.status, 400, 'Admin registration status should be 400');
    assert.ok(adminRegData.error.includes('Admin registration is not allowed') || adminRegData.error.includes('role'), 'Should display role constraint error message');
    console.log('✓ Admin registration blocked successfully!');

    // 4. Test Volunteer Login & Retrieve Session Cookie
    console.log('\n[Test 3] Logging in as the registered volunteer...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Login status should be 200');
    assert.strictEqual(loginData.redirectUrl, '/dashboard-volunteer.html', 'Volunteer should be redirected to Volunteer Dashboard');
    
    // Extract session cookie
    const setCookieHeader = loginRes.headers.get('set-cookie');
    assert.ok(setCookieHeader, 'Should set foodsaver_session cookie');
    const volunteerCookie = setCookieHeader.split(';')[0];
    console.log('✓ Volunteer login successful and cookie captured!');

    // 5. Test Admin Account Login
    console.log('\n[Test 4] Logging in with Admin credentials...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'Admin@foodwaste.com',
        password: 'admin@123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login status should be 200');
    assert.strictEqual(adminLoginData.redirectUrl, '/dashboard-admin.html', 'Admin should be redirected directly to Admin Dashboard');
    
    const adminSetCookieHeader = adminLoginRes.headers.get('set-cookie');
    const adminCookie = adminSetCookieHeader.split(';')[0];
    console.log('✓ Admin login successful and admin cookie captured!');

    // 6. Test RBAC: Access protection for volunteer accessing Admin Panel (Should redirect to /unauthorized.html)
    console.log('\n[Test 5] Accessing Admin Panel with Volunteer Cookie (Should redirect)...');
    const rbacRes = await fetch(`${BASE_URL}/dashboard-admin.html`, {
      method: 'GET',
      headers: { 'Cookie': volunteerCookie },
      redirect: 'manual' // Prevent node-fetch from automatically following redirects so we can assert redirect header
    });
    assert.strictEqual(rbacRes.status, 302, 'Should return 302 redirect status');
    assert.ok(rbacRes.headers.get('location').includes('unauthorized.html'), 'Should redirect volunteer to unauthorized.html');
    console.log('✓ Access blocked! Volunteer redirected to unauthorized.html successfully.');

    // 7. Test RBAC: Access authorization for Admin accessing Admin Panel (Should serve page, status 200)
    console.log('\n[Test 6] Accessing Admin Panel with Admin Cookie (Should succeed)...');
    const adminRbacRes = await fetch(`${BASE_URL}/dashboard-admin.html`, {
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert.strictEqual(adminRbacRes.status, 200, 'Should allow admin access, status 200');
    console.log('✓ Access granted! Admin dashboard loaded successfully.');

    // 8. Test RBAC: Unauthenticated user accessing Volunteer Panel (Should redirect to /login.html)
    console.log('\n[Test 7] Accessing Volunteer Panel without Cookie (Should redirect to login)...');
    const anonRes = await fetch(`${BASE_URL}/dashboard-volunteer.html`, {
      method: 'GET',
      redirect: 'manual'
    });
    assert.strictEqual(anonRes.status, 302, 'Should return 302 redirect status');
    assert.ok(anonRes.headers.get('location').includes('login.html'), 'Should redirect unauthenticated request to login.html');
    console.log('✓ Access blocked! Guest redirected to login.html successfully.');

    console.log('\n=======================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! AUTHENTICATION WORKED!');
    console.log('=======================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
