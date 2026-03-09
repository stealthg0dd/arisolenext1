import { supabase } from "@/lib/supabase";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a unique 6-character referral code (client-side fallback).
 * Prefer using the Supabase RPC ensure_referral_code for persistence.
 */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

/**
 * Ensures the user has a referral code. Creates one via RPC if missing.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc("ensure_referral_code", {
    p_user_id: userId
  });

  if (error) {
    throw error;
  }

  return data as string;
}

/**
 * Fetches the user's referral code (or generates via RPC if missing).
 */
export async function getReferralCode(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (profile?.referral_code) {
    return profile.referral_code;
  }

  return ensureReferralCode(userId);
}

/**
 * Applies a referral code for a new user. Adds reward point to referrer.
 */
export async function applyReferralCode(
  newUserId: string,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("apply_referral_code", {
    p_new_user_id: newUserId,
    p_code: code.trim().toUpperCase()
  });

  if (error) {
    return false;
  }

  return data === true;
}
