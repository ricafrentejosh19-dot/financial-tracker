import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gwzzqgtmhznticbpsxty.supabase.co'
const supabaseKey = 'sb_publishable_5wCGtXsgxOnhOs7U0wSbkw_Y8pGNNrz' // from Settings → API

export const supabase = createClient(supabaseUrl, supabaseKey)