import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vgssefefbabmrnznyscf.supabase.co";
const supabasePublishableKey = "sb_publishable_HGzqclmvLC5KRBRJBSUnQQ_zk9kmg51";
const rememberKey = "rala-go-remember";

const storage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    const remember = window.localStorage.getItem(rememberKey) === "true";
    const target = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    other.removeItem(key);
    target.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setRememberPreference(remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) window.localStorage.setItem(rememberKey, "true");
  else window.localStorage.removeItem(rememberKey);
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, storage }
});
