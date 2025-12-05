import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase environment variables are not set. Database features will not work.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type { User } from "@supabase/supabase-js"
