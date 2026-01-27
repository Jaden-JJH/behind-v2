import os
import json
import random
import time
# import requests
import psycopg2
from datetime import datetime
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env.local')

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

# 페르소나 로드
with open("ai_personas.json", "r", encoding="utf-8") as f:
    AI_PERSONAS = json.load(f)

# 환경 변수 로드

def get_db_connection():
    # 개별 파라미터로 연결 (가장 안정적)
    return psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        cursor_factory=RealDictCursor
    )

# 연결 테스트
try:
    conn = get_db_connection()
    print("✅ 드디어 연결에 성공했습니다!")
    conn.close()
except Exception as e:
    print(f"❌ 여전히 오류 발생: {e}")

def run_automation_step():
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # (1) 대상 게시글 무작위 선정 (활성 상태인 것 중 하나)
        cur.execute("SELECT id, title, preview, thumbnail, view_count FROM public.issues WHERE status = 'active' ORDER BY RANDOM() LIMIT 1")
        issue = cur.fetchone()
        if not issue: 
            print("활동할 게시글이 없습니다.")
            return

        # (2) 조회수 업데이트 (비정기 규칙: 한 번에 2~120회 상승)
        new_views = random.randint(2, 120)
        cur.execute("UPDATE public.issues SET view_count = view_count + %s WHERE id = %s", (new_views, issue['id']))

        # # 3. 썸네일 URL 파싱 로직 (중요!)
        # # [{"thumbnail": "url"}] 형태 대응
        # actual_img_url = None
        # if issue['thumbnail']:
        #     try:
        #         # 텍스트가 JSON 형태인 경우 파싱
        #         thumb_data = json.loads(issue['thumbnail'])
        #         if isinstance(thumb_data, list) and len(thumb_data) > 0:
        #             actual_img_url = thumb_data[0].get('thumbnail')
        #         else:
        #             actual_img_url = issue['thumbnail'] # 그냥 URL인 경우
        #     except:
        #         actual_img_url = issue['thumbnail']
                
        
        # (4) 중복 방지 페르소나 선택 로직 강화
        # 최근에 어떤 기사에서든 댓글을 달았던 최신 유저 5명을 가져옵니다. (글로벌 중복 방지)
        cur.execute("SELECT user_id FROM public.comments ORDER BY created_at DESC LIMIT 5")
        recent_user_ids = [str(row['user_id']) for row in cur.fetchall()]

        # 현재 이 기사에 이미 댓글을 단 유저들도 가져옵니다. (기사별 중복 방지)
        cur.execute("SELECT user_id FROM public.comments WHERE issue_id = %s", (issue['id'],))
        issue_user_ids = [str(row['user_id']) for row in cur.fetchall()]

        # 제외 대상 합치기 (최근 활동자 + 해당 기사 참여자)
        exclude_ids = set(recent_user_ids + issue_user_ids)

        # 제외 대상을 뺀 나머지 유저들만 후보로 선정
        available_personas = [p for p in AI_PERSONAS if p['user_id'] not in exclude_ids]

        # 만약 후보가 너무 적으면 그냥 해당 기사 참여자만 제외하고 다시 선정
        if not available_personas:
            available_personas = [p for p in AI_PERSONAS if p['user_id'] not in issue_user_ids]

        if not available_personas:
            print(f"⏩ 게시글 '{issue['title']}'에는 더 이상 참여할 페르소나가 없습니다.")
            return

        persona = random.choice(available_personas)
        
        # (5) 기존 댓글 맥락 가져오기 (대화 형성용)
        cur.execute("SELECT user_nick, body FROM public.comments WHERE issue_id = %s ORDER BY created_at DESC LIMIT 3", (issue['id'],))
        prev_comments = cur.fetchall()
        context = "\n".join([f"{c['user_nick']}: {c['body']}" for c in prev_comments])

        # (5) Gemini를 이용한 댓글 생성 (이미지 포함)
        prompt = f"""
        너는 커뮤니티 유저 '{persona['nickname']}'이야. 
        성격/말투: {persona['persona_style']}


        [참고할 실제 커뮤니티 댓글 스타일]
        - "저게 가능함?"
        - "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ"
        - "주작이잖아 ㅅㅂ"
        - "인증해"
        - "걍 그렇네.. 난 별로인듯"
        - "오 정보 감사요"
        - "미쳤네"
        - "이거 3년 전에도 비슷한 사건 있었음"
        - "나라가 왜 이 모양인가… 책임질 놈들은 다 도망가고"
        - "~~ 때문에 나라가 망한다"
        - "지들 이익만 챙기네"
        - "법과 질서를 바로 세워야 한다"
        - "대한민국부터 챙기자..."
        - "눈치 보느라 할 말도 못 하네 에휴"
        - "범죄자들 다 처벌해라"
        - "외국인 먼저 챙겨주는 정부 믿을 수 있냐"
        - "이런 게 진짜 매국노지 ㅋㅋㅋ"
        - "자주국방 강화해야 한다"
        - "이 새끼들은 반역자야"
        - "공정이 어디 있어? 요즘 세상."
        - "윤가야 특정 집단만 보호해주는 게 정의냐"
        - "국가 정체성이 먼저다"
        - "다들 정신 차려야 한다"
        - "요새 언론이 편향 보도 너무 심하다. 이게 중국 아니면 뭐냐"
        - "이래서 보수 지지율이 올라갈 수 밖에 없는거다 이 좌좀 좌빨 배급견들아"
        - "좌파 언론 믿는 게 웃긴 일이지"
        - "우리 아이들 안전이 우선이지요"
        - "나라를 팔아먹는 정책만 하는거지 진짜 답답하다 ㅅㅂ"
        - "한심한놈들ㅉㅉ"
        - "이게나라냐????"
        - "지금정부가 추진하는 정첵은 너무 안이하게 나라를 운영하러는 것같고, 안보떔에 국민들불안만 키우고 있다봅니다"
        - "ㅋㅋㅋ 매번 이런식으로 두루뭉술하게 넘어가니까 똑같은일 계속 터지는거임. 책임질놈 하나 없고 국민만 호구됨"
        - "금리 동결이라는데 체감은 전혀 모르겠고 ㅋㅋ 마트 한번 가보면 답 나옴. 기사만 보면 경제 좋아진줄 알겠다"
        - "부동산 기사마다 안정이라는데 내 주변 집산사람 한명도없음"
        - "맞긴 한데 이 정도로 욕먹을 일인지는 모르겠음. 연예인도 사람임"
        - "이해는 가는데 더 극단적으로 갈까봐 걱정됨"
        
        
        게시글 제목: {issue['title']}
        게시글 요약: {issue['preview']}
        최근 대화내용:
        {context}
        
        지침:
        1. 한 문장에서 두 문장 정도로 말해 (무조건 맞춤법이 모두 맞을 필요는 없어. 적절히 틀린것도 섞어줘.)
        2. 공손하지 마. 커뮤니티 반말이나 편한 말투를 써.
        3. 이미지 분석가가 되지 마. 사진 속 사물의 정확한 명칭이나 상태를 구구절절 묘사하면 AI 티가 나니까 절대 금지야.
        4. [중요] 설명이나 서론 없이 '댓글 내용'만 출력해.'설명'이나 '감상평'이 아니라 그냥 '커뮤니티 댓글' 한 줄만 출력해.
        """
        
        # content_parts = [prompt]
        
        # # 이미지 처리 (URL이 있는 경우)
        # if actual_img_url and actual_img_url.startswith('http'):
        #     try:
        #         img_res = requests.get(actual_img_url, timeout=5)
        #         if img_res.status_code == 200:
        #             content_parts.append({'mime_type': 'image/jpeg', 'data': img_res.content})
        #     except: pass

        # try:
        #     # 이미지 포함 시도
        #     response = model.generate_content(content_parts)
        #     ai_comment = response.text.strip()
        # except Exception:
        #     # 이미지 처리 오류 발생 시 텍스트로만 재시도
        #     response = model.generate_content([prompt])
        #     ai_comment = response.text.strip()
        

        # 이미지 다운로드 로직 삭제 및 텍스트 전용 생성으로 변경
        try:
            response = model.generate_content(prompt)
            ai_comment = response.text.strip()
        except Exception as e:
            print(f"⚠️ AI 생성 오류: {e}")
            return # 에러 시 이번 턴은 건너뜀

        # (6) DB에 댓글 삽입
        cur.execute("""
            INSERT INTO public.comments (issue_id, user_id, user_nick, body, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (issue['id'], persona['user_id'], persona['nickname'], ai_comment))
        
        # (7) 댓글 수 카운트 업데이트
        cur.execute("UPDATE public.issues SET comment_count = comment_count + 1 WHERE id = %s", (issue['id'],))

        conn.commit()
        # print(f"✅ [{persona['nickname']}] : {ai_comment} (조회수 +{new_views})")
        # 현재 시간과 게시글 제목을 포함하여 상세 출력
        now = datetime.now().strftime('%H:%M:%S')
        print(f"[{now}] 📌 게시글: {issue['title']}")
        print(f"         ㄴ 👤 {persona['nickname']}: {ai_comment} (조회수 +{new_views})")
        print("-" * 50)

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

# --- 실행부 ---
print("🤖 커뮤니티 자동화 에이전트 가동 시작... (무한 실행 모드)")
while True:  # 무한 반복
    run_automation_step()
    # 비정기적 휴식 (1분 ~ 20분 사이 랜덤)
    wait = random.randint(3600, 10800)
    print(f"💤 {wait}초간 대기 후 다음 활동...")
    time.sleep(wait)

# # 무한 루프 (테스트를 위해 3번만 실행하려면 range(3)으로 수정하세요)
# print("🤖 커뮤니티 자동화 에이전트 가동 시작...")
# for _ in range(5): 
#     run_automation_step()
#     # 비정기적 휴식 (30초~2분 사이 랜덤)
#     wait = random.randint(60, 1200)
#     print(f"💤 {wait}초간 대기 후 다음 활동...")
#     time.sleep(wait)