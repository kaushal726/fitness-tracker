import { signOutSafely, useSyncStatus } from "../../sync/engine.ts";
import { forgetGoogleAccount } from "../../sync/googleSignIn.ts";
import { savedText } from "../../sync/savedText.ts";
import { syncConfigured } from "../../sync/config.ts";
import { setLocalOnly } from "../../sync/localMode.ts";
import { useSession } from "../../sync/session.ts";
import { useConfirm } from "../../ui/Confirm";
import { IconCloud, IconSignOut } from "../../ui/icons";
import { SettingsGroup, SettingsRow } from "../../ui/SettingsList";
import { useToast } from "../../ui/Toast";

/** One message for every reason the account could not be updated before signing out. */
const NOT_SAVED = "Could not save everything to your account. Check your internet and try again.";

/** Who is signed in, whether everything is saved to the account, and the way out. Nothing shows when there is no account to sign in to. */
export function AccountSection() {
  const session = useSession();
  const status = useSyncStatus();
  const confirm = useConfirm();
  const toast = useToast();
  if (!syncConfigured()) return null;
  // Not signed in: the data is on this phone only, and signing in is one tap away.
  if (!session) {
    return (
      <SettingsGroup label="Account">
        <SettingsRow icon={<IconCloud />} tone="blue" title="Sign in with Google" subtitle="Back up your data, and get it on any phone" onClick={() => setLocalOnly(false)} />
      </SettingsGroup>
    );
  }

  const signOut = async () => {
    const ok = await confirm({ title: "Sign out?", message: "Your data stays in your account and is taken off this phone. Sign in again to get it back.", confirmLabel: "Sign out" });
    if (!ok) return;
    if (await signOutSafely()) forgetGoogleAccount();
    else toast(NOT_SAVED, { tone: "error" });
  };

  return (
    <SettingsGroup label="Account">
      <SettingsRow icon={<IconCloud />} tone="blue" title={session.user.email} subtitle={savedText(status, Date.now())} />
      <SettingsRow icon={<IconSignOut />} title="Sign out" subtitle="Your data stays in your account" onClick={() => void signOut()} />
    </SettingsGroup>
  );
}
