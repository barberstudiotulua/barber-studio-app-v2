import { createClient } from '@supabase/supabase-js'

// REEMPLAZA CON TUS PROPIOS DATOS DE SUPABASE
const supabaseUrl = 'https://awazceslilvxpxwockvi.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YXpjZXNsaWx2eHB4d29ja3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDk3NDMsImV4cCI6MjA3NTE4NTc0M30.v6EtISWXn_PzQMsvliS8nh5Aws7U4o3lr_K6wIoDPbA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)