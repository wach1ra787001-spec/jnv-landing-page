const baseUrl = process.env.SECURITY_TEST_BASE_URL || 'http://localhost:3000'
const userAToken = process.env.SECURITY_TEST_USER_A_TOKEN
const userBToken = process.env.SECURITY_TEST_USER_B_TOKEN

if (!userAToken || !userBToken) {
  console.error('Set SECURITY_TEST_USER_A_TOKEN and SECURITY_TEST_USER_B_TOKEN for the two-user authorization matrix.')
  process.exitCode = 2
  process.exit()
}

const cases = [
  { name: 'unauthenticated is rejected', path: '/api/security/sessions', expected: 401 },
  { name: 'User A can read own sessions', path: '/api/security/sessions', token: userAToken, expected: 200 },
  { name: 'User B can read own sessions', path: '/api/security/sessions', token: userBToken, expected: 200 },
]

for (const testCase of cases) {
  const response = await fetch(new URL(testCase.path, baseUrl), {
    headers: testCase.token ? { Authorization: `Bearer ${testCase.token}` } : undefined,
  })
  const passed = response.status === testCase.expected
  console.log(`${passed ? 'PASS' : 'FAIL'} ${testCase.name}: expected ${testCase.expected}, received ${response.status}`)
  if (!passed) process.exitCode = 1
}

console.log('Cross-user resource cases must be added per route with IDs from the isolated User A/User B fixtures before production sign-off.')
