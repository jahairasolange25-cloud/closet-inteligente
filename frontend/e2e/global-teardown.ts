export default async function globalTeardown(): Promise<void> {
  console.log('[E2E Teardown] All E2E tests completed.');
  // Temp files and test users are cleaned per-fixture. Nothing global to tear down.
}
