const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gknekrinduyperczholoam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbmVrcmluZHV5cGNyemhvbG9hbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI4MDk2MzQwLCJleHAiOjE4ODU4NjMxNDB9.0UJzKsLVk3HCMI5yt59GH0fFqg2K1vKfBKQNPZvf5nU';

console.log('URL:', supabaseUrl);
console.log('Key (first 50 chars):', supabaseKey.substring(0, 50));

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('\n=== 테스트 1: 간단한 SELECT 쿼리 ===');
    const { data: testData, error: testError } = await supabase
      .from('reports')
      .select('id, title')
      .limit(1);
    
    console.log('SELECT DATA:', testData);
    console.log('SELECT ERROR:', testError);

    if (testError) {
      console.log('\n❌ 기본 쿼리도 실패. 네트워크 문제.');
      return;
    }

    console.log('\n=== 테스트 2: RPC 호출 ===');
    const { data, error } = await supabase.rpc('curious_report', {
      p_report_id: '94dc5719-5c9b-4afc-91f3-3842d797a8c9',
      p_device_hash: 'test-device-' + Date.now()
    });
    
    console.log('RPC DATA:', JSON.stringify(data, null, 2));
    console.log('RPC ERROR:', error);
    
  } catch (e) {
    console.error('Exception:', e);
  }
}

test();
