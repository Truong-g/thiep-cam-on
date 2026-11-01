alter table public.thank_you_cards
  add column if not exists recipient_image_url text not null default '';

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
