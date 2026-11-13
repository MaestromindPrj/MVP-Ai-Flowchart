# MVP password resets

No email service or database migration is required. The login page's **Forgot password?** option directs users to their administrator.

After verifying the requesting user's identity, an administrator with access to the project's environment and database runs this command from the project root:

```sh
npm run user:reset-password -- user@example.com
```

The command loads the Next.js environment files, generates a random password, stores its salted scrypt hash, and revokes all sessions for that user in one transaction. It prints the new password only after the transaction succeeds. Share it privately with the account owner; do not run this command in shared CI logs. It does not create an account if the email is unknown.

The user signs in and opens **Settings → Change password**, enters the supplied password, and chooses and confirms a new password of 12–128 characters. The app signs them out on all devices and asks them to sign in again. Changing the supplied password is recommended but is not enforced in this MVP.

Run automated checks with `node tests/password-reset.cjs` and `npx tsc --noEmit`.
