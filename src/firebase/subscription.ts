/**
 * Subscription read/write (mock — no payment gateway; just writes the doc). docs/09.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Plan, Subscription } from '../types/user';
import { db } from './config';

export async function getSubscription(uid: string): Promise<Subscription | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return (snap.data().subscription as Subscription | undefined) ?? null;
}

/** Mock "purchase" — write the chosen plan. Plus/Pro get a 30-day renewsAt stamp. */
export async function setPlan(uid: string, plan: Plan): Promise<Subscription> {
  const renewsAt =
    plan === 'free'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subscription: Subscription = { plan, renewsAt, status: 'active' };
  await setDoc(doc(db, 'users', uid), { subscription }, { merge: true });
  return subscription;
}
