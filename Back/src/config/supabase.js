const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
// 백엔드에서는 권한 검증(RLS)을 우회할 수 있는 Service Role Key 사용을 권장합니다.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 Key가 환경 변수에 없습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase
