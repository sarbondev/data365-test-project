/**
 * Default categories are now created per-user during registration
 * (see src/auth/auth.service.ts → seedDefaultCategoriesForUser).
 *
 * This file is kept as a no-op so existing tooling that calls
 * `prisma db seed` doesn't break.
 */
async function main() {
  console.log(
    'ℹ️ Skipping global seed — default categories are seeded per user on registration.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
