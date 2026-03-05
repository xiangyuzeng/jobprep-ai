-- Profiles: extends Supabase auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Resumes: user's uploaded master resumes
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  original_filename text,
  parsed_data jsonb,
  storage_path text,
  created_at timestamptz default now()
);

-- Tailored resumes: AI-tailored versions for specific JDs
create table tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  resume_id uuid references resumes(id) on delete cascade not null,
  job_description text,
  company_name text,
  job_title text,
  jd_analysis jsonb,
  skill_gap jsonb,
  tailored_data jsonb,
  match_score int,
  keyword_matches jsonb,
  cover_letter text,
  pdf_path text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Interview boards: generated interview prep boards
create table interview_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  company_name text not null,
  role text not null,
  round_type text not null,
  language text default 'en',
  job_description text,
  interviewer_info text,
  board_type text,
  qtypes jsonb,
  modules jsonb,
  total_questions int,
  status text default 'pending',
  modules_completed int default 0,
  modules_total int default 0,
  created_at timestamptz default now()
);

-- Board progress: per-user progress tracking
create table board_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  board_id uuid references interview_boards(id) on delete cascade not null,
  completed_cards int[] default '{}',
  updated_at timestamptz default now(),
  unique(user_id, board_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table resumes enable row level security;
alter table tailored_resumes enable row level security;
alter table interview_boards enable row level security;
alter table board_progress enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Resumes: users can CRUD their own resumes
create policy "Users can view own resumes" on resumes
  for select using (auth.uid() = user_id);
create policy "Users can insert own resumes" on resumes
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own resumes" on resumes
  for delete using (auth.uid() = user_id);

-- Tailored resumes: users can CRUD their own
create policy "Users can view own tailored resumes" on tailored_resumes
  for select using (auth.uid() = user_id);
create policy "Users can insert own tailored resumes" on tailored_resumes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own tailored resumes" on tailored_resumes
  for update using (auth.uid() = user_id);
create policy "Users can delete own tailored resumes" on tailored_resumes
  for delete using (auth.uid() = user_id);

-- Interview boards: users can CRUD their own
create policy "Users can view own boards" on interview_boards
  for select using (auth.uid() = user_id);
create policy "Users can insert own boards" on interview_boards
  for insert with check (auth.uid() = user_id);
create policy "Users can update own boards" on interview_boards
  for update using (auth.uid() = user_id);
create policy "Users can delete own boards" on interview_boards
  for delete using (auth.uid() = user_id);

-- Board progress: users can CRUD their own
create policy "Users can view own progress" on board_progress
  for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on board_progress
  for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on board_progress
  for update using (auth.uid() = user_id);

-- Storage bucket for resume files
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false);

-- Storage policies
create policy "Users can upload their own resumes" on storage.objects
  for insert with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view their own resumes" on storage.objects
  for select using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can download their own PDFs" on storage.objects
  for select using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Service role can upload PDFs" on storage.objects
  for insert with check (bucket_id = 'pdfs');
