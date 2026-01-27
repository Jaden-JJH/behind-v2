import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# ==============================================================================
# [1] 설정 영역: 아래 리스트에 추가하고 싶은 페르소나를 입력하세요.
# ==============================================================================
new_personas_to_add = [
    # 예시 (복사해서 쓰세요):
    # {"nick": "닉네임", "style": "말투 및 성격 설명"},
    
    {"nick": "추가할닉네임1", "style": "여기에 성격을 적으세요"},
    {"nick": "추가할닉네임2", "style": "여기에 성격을 적으세요"},
    
    # ... 계속 추가 가능
]

# ==============================================================================
# [2] 시스템 로직 (여기서부터는 수정할 필요 없습니다)
# ==============================================================================

# 1. 환경 변수 로드
load_dotenv(dotenv_path='.env.local')
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ [오류] .env.local 파일을 찾을 수 없거나 키가 없습니다.")
    exit()

try:
    supabase: Client = create_client(url, key)
    print(f"✅ Supabase 연결 성공")
except Exception as e:
    print(f"❌ Supabase 연결 실패: {e}")
    exit()

# 2. 기존 페르소나 파일 로드
FILE_NAME = "ai_personas.json"
if os.path.exists(FILE_NAME):
    with open(FILE_NAME, "r", encoding="utf-8") as f:
        created_ai_list = json.load(f)
    print(f"📂 기존 페르소나 {len(created_ai_list)}명을 로드했습니다.")
else:
    created_ai_list = []
    print("📂 기존 파일이 없어 새로 시작합니다.")

if not new_personas_to_add:
    print("⚠️ 추가할 페르소나가 없습니다. 스크립트를 종료합니다.")
    exit()

print(f"🚀 {len(new_personas_to_add)}명의 새로운 페르소나 생성을 시작합니다...")

# 3. 유저 생성 루프
# 이메일 중복 방지를 위해 (기존 인원 수 + 1)부터 번호 매김
start_idx = len(created_ai_list) + 1 
success_count = 0

for i, p in enumerate(new_personas_to_add):
    # 이메일 자동 생성: ai_bot_{번호}@gmail.com
    current_num = start_idx + i
    email = f"ai_bot_{current_num}@gmail.com"
    
    try:
        # Auth 유저 생성
        user = supabase.auth.admin.create_user({
            "email": email,
            "password": "password2026!", # 비밀번호 공통
            "user_metadata": {"nickname": p['nick']},
            "email_confirm": True
        })
        user_id = user.user.id
        
        # 리스트에 추가
        created_ai_list.append({
            "idx": current_num, # 관리용 번호
            "user_id": user_id,
            "nickname": p['nick'],
            "persona_style": p['style']
        })
        print(f"  [OK] {p['nick']} (No.{current_num})")
        success_count += 1
        
    except Exception as e:
        print(f"  [Fail] {p['nick']} 생성 실패: {e}")

# 4. 파일 저장
if success_count > 0:
    with open(FILE_NAME, "w", encoding="utf-8") as f:
        json.dump(created_ai_list, f, ensure_ascii=False, indent=2)
    print(f"\n✨ 저장 완료! 현재 총 페르소나 수: {len(created_ai_list)}명")
    
    # ==============================================================================
    # [3] 후속 작업 안내 (SQL 자동 생성)
    # ==============================================================================
    print("\n" + "="*60)
    print("🚨 [중요] 아래 SQL을 복사해서 Supabase SQL Editor에서 실행하세요!")
    print("   (Auth 유저 정보를 Public 테이블로 동기화하는 작업입니다)")
    print("="*60)
    
    sql_script = """
    INSERT INTO public.users (id, email, nickname, created_at, updated_at)
    SELECT 
        id, 
        email, 
        (raw_user_meta_data->>'nickname')::text,
        created_at, 
        updated_at
    FROM auth.users
    WHERE email LIKE 'ai_bot_%@gmail.com'
    ON CONFLICT (id) DO UPDATE 
    SET 
        nickname = EXCLUDED.nickname,
        updated_at = EXCLUDED.updated_at;
    """
    print(sql_script)
    print("="*60)

else:
    print("\n⚠️ 생성된 유저가 없어 파일을 저장하지 않았습니다.")


'''
🛠️ 사용 방법 (3단계)
1. 파일 열기: add_new_personas.py 파일을 엽니다.
2. 리스트 수정: 맨 위 new_personas_to_add 리스트 안에 추가하고 싶은 캐릭터들을 적습니다.

3. 실행: 터미널에서 python3 add_new_personas.py를 실행합니다.

4. 실행이 끝나면?
화면에 출력된 SQL 쿼리문을 그대로 복사해서, Supabase SQL Editor에 붙여넣고 실행하면 public.users 테이블 동기화까지 완벽하게 끝납니다.
'''