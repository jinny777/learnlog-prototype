-- series 테이블
create table if not exists series (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  goal int not null default 5,
  color text not null default '#EEEDFE',
  text_color text not null default '#3C3489',
  created_at timestamptz default now()
);

-- logs 테이블
create table if not exists logs (
  id uuid default gen_random_uuid() primary key,
  series_id uuid references series(id) on delete set null,
  tag text not null default '마케팅',
  title text not null,
  source text,
  log_date text,
  published boolean not null default false,
  points jsonb not null default '[]',
  memo text,
  image_url text,
  reference_url text,
  created_at timestamptz default now()
);

-- 이미지 스토리지 버킷 (Storage > New bucket 에서 직접 만들거나 아래 SQL 실행)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 스토리지 공개 읽기 정책
create policy "공개 이미지 읽기"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "인증된 사용자 이미지 업로드"
  on storage.objects for insert
  with check ( bucket_id = 'images' );

-- RLS 활성화 (필요시)
-- alter table logs enable row level security;
-- alter table series enable row level security;

-- 샘플 데이터
insert into series (id, name, goal, color, text_color) values
  ('00000000-0000-0000-0000-000000000001', '그로스 해킹 A-Z', 5, '#EEEDFE', '#3C3489'),
  ('00000000-0000-0000-0000-000000000002', '린 스타트업 독서', 4, '#E1F5EE', '#085041')
on conflict (id) do nothing;

insert into logs (tag, title, source, log_date, published, series_id, points, memo) values
  ('마케팅', '그로스 해킹 — 퍼널 분석 기초', '인프런',
   (now() - interval '1 day')::text, true,
   '00000000-0000-0000-0000-000000000001',
   '["AARRR 퍼널의 각 단계별 역할과 지표 설정 방법","활성화율이 리텐션보다 먼저 해결되어야 하는 이유","코호트 분석으로 이탈 구간을 찾는 실전 방법"]',
   '클라이언트 제안서에 바로 쓸 수 있는 내용. 다음 달 콘텐츠 시리즈로 묶으면 좋겠다.'),
  ('독서', '린 스타트업 — 3장 검증된 학습', '독서 모임',
   (now() - interval '3 days')::text, false,
   '00000000-0000-0000-0000-000000000002',
   '["MVP는 최소 기능이 아니라 최소 학습 도구","허영 지표 vs 실행 지표의 차이","피벗의 기준: 전략 변경이지 실패가 아님"]',
   '독자들이 공감할 만한 창업 착각 시리즈로 이어갈 수 있겠다.'),
  ('마케팅', '그로스 해킹 — 리텐션 전략', '인프런',
   (now() - interval '5 days')::text, true,
   '00000000-0000-0000-0000-000000000001',
   '["리텐션 루프 설계 방법","알림 전략의 올바른 사용법","D7·D30 리텐션 벤치마크"]',
   'SaaS 클라이언트 케이스에 딱 맞는 내용.');
