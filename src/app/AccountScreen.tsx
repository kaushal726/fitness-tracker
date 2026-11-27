import { useEffect, useRef, useState } from "react";
import { eraseForMismatch, retryFirstSync, type Gate } from "../sync/engine.ts";
import { devSignInAllowed } from "../sync/config.ts";
import { signInForDevelopment, signInWithGoogle } from "../sync/api.ts";
import { showGoogleButton } from "../sync/googleSignIn.ts";
import { setLocalOnly } from "../sync/localMode.ts";
import { setSession, type Session } from "../sync/session.ts";
import { BrandMark } from "../ui/BrandMark";
import { Button } from "../ui/Button";
import { IconCheck } from "../ui/icons";
import { MadeWithLove } from "../ui/MadeWithLove";
import { useConfirm } from "../ui/Confirm";
import { APP_NAME } from "./brand.ts";
import styles from "./AccountScreen.module.css";

const BUTTON_WIDTH = 300;
const PERKS = ["Your food log is saved to your Google account", "Lose or change your phone and nothing is lost", "Sign in again on any phone to get it all back"];
/** One message for every reason a sign-in can fail. */
const SIGN_IN_FAILED = "That did not work. Check your internet and try again.";
const GOOGLE_FAILED = "Google sign-in could not start. Check your internet and try again.";

/** The steps before the app: signing in, waiting for the account's data, and the two things that can go wrong. */
export function AccountScreen({ gate, otherAccount }: { gate: Exclude<Gate, "open">; otherAccount?: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logo} aria-hidden><BrandMark className={styles.mark} /></span>
        {gate === "signin" && <SignIn />}
        {gate === "loading" && <Loading />}
        {gate === "retry" && <Retry />}
        {gate === "mismatch" && <Mismatch otherAccount={otherAccount} />}
      </div>
      <MadeWithLove />
    </main>
  );
}

function SignIn() {
  const button = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  const finish = async (signIn: () => Promise<Session>) => {
    setBusy(true);
    setError(null);
    try {
      const signedIn = await signIn();
      setLocalOnly(false);
      setSession(signedIn);
    } catch {
      setError(SIGN_IN_FAILED);
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!button.current || devSignInAllowed()) return;
    showGoogleButton(button.current, (idToken) => void finish(() => signInWithGoogle(idToken)), BUTTON_WIDTH).catch(() => setError(GOOGLE_FAILED));
  }, []);

  return (
    <>
      <h1 className={styles.title}>Sign in to {APP_NAME}</h1>
      <p className={styles.lead}>One account for all your food, water and weight.</p>
      <ul className={styles.perks}>
        {PERKS.map((perk) => (
          <li key={perk}><span className={styles.tick} aria-hidden><IconCheck /></span>{perk}</li>
        ))}
      </ul>
      {devSignInAllowed() ? (
        <form className={styles.dev} onSubmit={(e) => { e.preventDefault(); void finish(() => signInForDevelopment(email)); }}>
          <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.test" aria-label="Email for local testing" required />
          <Button variant="primary" size="lg" block type="submit" disabled={busy}>Sign in (local testing)</Button>
        </form>
      ) : (
        <div className={styles.google} ref={button} aria-busy={busy} />
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.skip}>
        <Button size="lg" block onClick={() => setLocalOnly(true)}>Continue without an account</Button>
        <p className={styles.skipNote}>Your data stays on this phone only. You can sign in later from Profile.</p>
      </div>
    </>
  );
}

function Loading() {
  return (
    <>
      <h1 className={styles.title}>Getting your data</h1>
      <p className={styles.lead}>This takes a moment.</p>
      <span className={styles.spinner} aria-hidden />
    </>
  );
}

function Retry() {
  return (
    <>
      <h1 className={styles.title}>Could not reach your account</h1>
      <p className={styles.lead}>Check your internet and try again. Nothing was lost.</p>
      <Button variant="primary" size="lg" block onClick={() => void retryFirstSync()}>Try again</Button>
    </>
  );
}

function Mismatch({ otherAccount }: { otherAccount?: string }) {
  const confirm = useConfirm();
  const signOut = () => setSession(null);
  const erase = async () => {
    const ok = await confirm({ title: "Erase this phone's data?", message: "The other account keeps its own copy. You can get it back by signing in with that account.", confirmLabel: "Erase and continue", danger: true });
    if (ok) await eraseForMismatch();
  };
  return (
    <>
      <h1 className={styles.title}>This phone has another account's data</h1>
      <p className={styles.lead}>Sign in with that account to keep it, or erase it from this phone and continue with this one.</p>
      {otherAccount && <p className={styles.account}>{otherAccount}</p>}
      <div className={styles.actions}>
        <Button variant="primary" size="lg" block onClick={signOut}>Use the other account</Button>
        <Button size="lg" block onClick={() => void erase()}>Erase and continue</Button>
      </div>
    </>
  );
}
