-- Thư Gửi Dịu Dàng: admin-only authoring, public approved templates,
-- and public card lookup by an unguessable share slug.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.card_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'Thiệp cảm ơn',
  summary text not null default '',
  hero_title text not null,
  hero_body text not null,
  cover_image_url text not null default '',
  theme_key text not null default 'moon-garden',
  accent_color text not null default '#c78191',
  story jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thank_you_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  recipient_name text not null,
  recipient_image_url text not null default '',
  occasion text not null default '',
  headline text not null,
  message text not null,
  from_name text not null default '',
  template_id uuid references public.card_templates (id) on delete set null,
  template_snapshot jsonb not null,
  music_url text not null default '',
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.card_templates
  (slug, name, category, summary, hero_title, hero_body, cover_image_url, theme_key, accent_color, story, status)
values
  (
    'vuon-trang-mo', 'Vườn Trăng Mơ', 'Dịu dàng',
    'Một khu vườn nhỏ nở hoa dưới ánh trăng hồng.',
    'Có một điều dịu dàng muốn gửi bạn',
    'Chạm vào phong thư, rồi cùng mình đi qua một câu chuyện bé xinh nhé.',
    '/templates/moon-garden.svg', 'moon-garden', '#d593a8',
    jsonb_build_array(
      jsonb_build_object('title', 'Từ một điều rất nhỏ', 'body', 'Có những ngày bình thường bỗng trở nên ấm áp chỉ vì bạn đã ở đó.', 'imageUrl', '/templates/petal-note.svg', 'surprise', 'Một chiếc lá thư tay'),
      jsonb_build_object('title', 'Bạn làm mọi thứ sáng hơn', 'body', 'Cảm ơn vì sự tử tế, những lần lắng nghe và cả những niềm vui bạn mang đến.', 'imageUrl', '/templates/moon-garden.svg', 'surprise', 'Một bầu trời sao'),
      jsonb_build_object('title', 'Mong niềm vui tìm đến bạn', 'body', 'Hy vọng những điều tốt đẹp sẽ quay lại với bạn, thật nhiều và thật lâu.', 'imageUrl', '/templates/moon-garden.svg', 'surprise', 'Lời chúc cuối')
    ),
    'approved'
  ),
  (
    'thu-mua-ha', 'Thư Mùa Hạ', 'Tươi sáng',
    'Nắng mật ong, hoa nhỏ và một lời cảm ơn thật trong veo.',
    'Một chút nắng dành riêng cho bạn',
    'Mỗi lần chạm xuống là một mảnh ký ức ấm áp đang chờ.',
    '/templates/summer-letter.svg', 'summer-letter', '#d59662',
    jsonb_build_array(
      jsonb_build_object('title', 'Ngày ấy dịu dàng hơn', 'body', 'Có bạn đồng hành, những việc khó cũng nhẹ tênh đi một chút.', 'imageUrl', '/templates/summer-letter.svg', 'surprise', 'Một ô nắng nhỏ'),
      jsonb_build_object('title', 'Những điều mình nhớ', 'body', 'Mình nhớ sự nhiệt thành, những câu hỏi han và năng lượng tích cực của bạn.', 'imageUrl', '/templates/petal-note.svg', 'surprise', 'Một tấm bưu thiếp'),
      jsonb_build_object('title', 'Gửi bạn một mùa thật đẹp', 'body', 'Cảm ơn bạn đã là một phần đáng quý trong câu chuyện này.', 'imageUrl', '/templates/summer-letter.svg', 'surprise', 'Một lời chúc')
    ),
    'approved'
  ),
  (
    'buu-thiep-sao', 'Bưu Thiếp Sao', 'Mộng mơ',
    'Một chuyến du hành chậm qua những vì sao và lời tri ân.',
    'Gửi bạn từ một góc trời lấp lánh',
    'Cuộn thật chậm nhé, những điều bất ngờ đang trôi giữa các vì sao.',
    '/templates/starlit-postcard.svg', 'starlit-postcard', '#a993c6',
    jsonb_build_array(
      jsonb_build_object('title', 'Một ngôi sao đã ghé qua', 'body', 'Trong rất nhiều cuộc gặp gỡ, mình may mắn vì đã gặp được bạn.', 'imageUrl', '/templates/starlit-postcard.svg', 'surprise', 'Một chòm sao mới'),
      jsonb_build_object('title', 'Ánh sáng bạn để lại', 'body', 'Sự chân thành của bạn ở lại trong những khoảnh khắc mà mình luôn muốn nhớ.', 'imageUrl', '/templates/petal-note.svg', 'surprise', 'Một lời nhắn bí mật'),
      jsonb_build_object('title', 'Hẹn gặp ở những điều vui', 'body', 'Chúc bạn luôn có đủ dịu dàng, can đảm và những người tốt bên cạnh.', 'imageUrl', '/templates/starlit-postcard.svg', 'surprise', 'Một điều ước')
    ),
    'approved'
  ),
  (
    'hoa-no-tham', 'Hoa Nở Thầm', 'Bản nháp',
    'Một bản nháp hoa giấy cho những lời cảm ơn thân mật.',
    'Lời cảm ơn được gói bằng cánh hoa',
    'Một câu chuyện mới đang chờ được chăm chút.',
    '/templates/petal-note.svg', 'moon-garden', '#bc8b9a',
    jsonb_build_array(
      jsonb_build_object('title', 'Một cánh hoa đầu tiên', 'body', 'Câu chuyện sẽ bắt đầu từ những điều giản dị nhất.', 'imageUrl', '/templates/petal-note.svg', 'surprise', 'Bản nháp')
    ),
    'draft'
  )
on conflict (slug) do nothing;

create index if not exists thank_you_cards_status_created_idx
  on public.thank_you_cards (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists card_templates_set_updated_at on public.card_templates;
create trigger card_templates_set_updated_at
  before update on public.card_templates
  for each row execute function public.set_updated_at();

drop trigger if exists thank_you_cards_set_updated_at on public.thank_you_cards;
create trigger thank_you_cards_set_updated_at
  before update on public.thank_you_cards
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.app_admins enable row level security;
alter table public.card_templates enable row level security;
alter table public.thank_you_cards enable row level security;

revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;
drop policy if exists "admins can read their own membership" on public.app_admins;
create policy "admins can read their own membership"
  on public.app_admins for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.card_templates from anon, authenticated;
grant select on public.card_templates to anon, authenticated;
grant insert, update, delete on public.card_templates to authenticated;
drop policy if exists "public sees approved templates" on public.card_templates;
create policy "public sees approved templates"
  on public.card_templates for select to anon
  using (status = 'approved');
drop policy if exists "admins see all templates" on public.card_templates;
create policy "admins see all templates"
  on public.card_templates for select to authenticated
  using (status = 'approved' or (select public.is_admin()));
drop policy if exists "admins create templates" on public.card_templates;
create policy "admins create templates"
  on public.card_templates for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "admins update templates" on public.card_templates;
create policy "admins update templates"
  on public.card_templates for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
drop policy if exists "admins delete templates" on public.card_templates;
create policy "admins delete templates"
  on public.card_templates for delete to authenticated
  using ((select public.is_admin()));

revoke all on public.thank_you_cards from anon, authenticated;
grant select, insert, update, delete on public.thank_you_cards to authenticated;
drop policy if exists "admins read cards" on public.thank_you_cards;
create policy "admins read cards"
  on public.thank_you_cards for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "admins create cards" on public.thank_you_cards;
create policy "admins create cards"
  on public.thank_you_cards for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "admins update cards" on public.thank_you_cards;
create policy "admins update cards"
  on public.thank_you_cards for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
drop policy if exists "admins delete cards" on public.thank_you_cards;
create policy "admins delete cards"
  on public.thank_you_cards for delete to authenticated
  using ((select public.is_admin()));

create or replace function public.get_thank_you_card(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'slug', card.slug,
    'recipient_name', card.recipient_name,
    'recipient_image_url', card.recipient_image_url,
    'occasion', card.occasion,
    'headline', card.headline,
    'message', card.message,
    'from_name', card.from_name,
    'template_snapshot', card.template_snapshot,
    'music_url', card.music_url
  )
  from public.thank_you_cards as card
  where card.slug = p_slug and card.status = 'published'
  limit 1;
$$;

revoke all on function public.get_thank_you_card(text) from public;
grant execute on function public.get_thank_you_card(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thankyou-assets',
  'thankyou-assets',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload card assets" on storage.objects;
create policy "admins upload card assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'thankyou-assets' and (select public.is_admin()));
drop policy if exists "admins read card assets" on storage.objects;
create policy "admins read card assets"
  on storage.objects for select to authenticated
  using (bucket_id = 'thankyou-assets' and (select public.is_admin()));
drop policy if exists "admins update card assets" on storage.objects;
create policy "admins update card assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'thankyou-assets' and (select public.is_admin()))
  with check (bucket_id = 'thankyou-assets' and (select public.is_admin()));
drop policy if exists "admins delete card assets" on storage.objects;
create policy "admins delete card assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'thankyou-assets' and (select public.is_admin()));
