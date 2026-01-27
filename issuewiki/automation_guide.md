## 실행
python3 automation_growth.py

## 실시간 로그 확인
tail -f output.log (코드가 실행될 때마다 로그가 올라옵니다.)

## 프로세스 확인: 
ps aux | grep automation_growth.py (동작 중인 ID 확인)

## 중단하기:
pkill -f automation_growth.py (실행 중인 모든 자동화 스크립트 강제 종료)


## 가상 머신
https://console.cloud.google.com/compute/instances?onCreate=true&hl=ko&project=project-behind

### 들어가서
연결 - SSH 누르기

### 현재 잘 진행되고 있는지 확인
tmux attach -t mybot
(ps aux | grep python)

### 다시 시동해야할 경우
python3 automation_growth.py

### 봇 자체를 신규로 생성해야할 경우
tmux new -s mybot


# 수정 필요할 경우

1. 1단계: Stop
- 구글 클라우드 콘솔에서 [SSH] 버튼을 눌러 접속
- 현재 봇이 돌고 있는 화면으로
(tmux attach -t mybot)
- 로그가 올라가는 화면이 보이면, 키보드에서 Ctrl + C
- 봇이 멈추고 다시 명령어 입력창($)

2. 2단계: Update
- 코드를 수정하고 저장합니다.
- SSH 창 우측 상단의 [톱니바퀴] > [파일 업로드]를 클릭
- 수정된 automation_growth.py 파일을 업로드
- "파일을 덮어쓰시겠습니까?" 같은 메시지가 나오면 확인(Overwrite)

3. 3단계: Restart
- 업로드가 끝났으면 다시 실행 명령어를 입력
python3 automation_growth.py
- "✅ 연결 성공" 메시지가 뜨고 로그가 다시 찍히는지 확인

요약
들어가서 끈다 (Ctrl+C).
새 파일 올린다.
다시 켠다 (python3 ...).
창 닫는다.
