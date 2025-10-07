import { createClient } from '@supabase/supabase-js'

// Ahora, en lugar de escribir las claves aquí, las leemos de las "variables de entorno"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// El resto del código no cambia
export const supabase = createClient(supabaseUrl, supabaseAnonKey)createClient(supabaseUrl, supabaseAnonKey)pabase = createClient(supabaseUrl, supabaseAnonKey)