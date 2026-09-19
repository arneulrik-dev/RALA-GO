import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vgssefefbabmrnznyscf.supabase.co";
const supabasePublishableKey = "sb_publishable_HGzqclmvLC5KRBRJBSUnQQ_zk9kmg51";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
