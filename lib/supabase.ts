"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iohyczenmqoyrjxdcykz.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaHljemVubXFveXJqeGRjeWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTM4NzgsImV4cCI6MjA5NjY2OTg3OH0.2uFC1mtlzA_kUxyNG0z57VD7MsC1wktA-B9unT4y9s8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseClient() {
  return supabase
}
