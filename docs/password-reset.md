# MVP password resets

No email service or database migration is required. The login page's **Forgot password?** option directs users to their administrator.

After verifying the requesting user's identity, an administrator with access to the project's environment and database runs this command from the project root:

```sh
npm run user:reset-password -- user@example.com
```

The command prompts the administrator to enter and confirm a chosen password of 12–128 characters. Input is hidden and the password is never printed or passed as a command-line argument. Run it in an interactive terminal; Ctrl+C cancels without changing the account.

It loads the Next.js environment files, stores the password's salted scrypt hash, and revokes all sessions for that user in one transaction. Share the chosen password privately with the account owner. It does not create an account if the email is unknown. Invalid or mismatched passwords leave the account unchanged.

The user signs in and opens **Settings → Change password**, enters the supplied password, and chooses and confirms a new password of 12–128 characters. The app signs them out on all devices and asks them to sign in again. Changing the supplied password is recommended but is not enforced in this MVP.

Run automated checks with `node tests/password-reset.cjs` and `npx tsc --noEmit`.
