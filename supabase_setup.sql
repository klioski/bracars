-- =============================================
-- BraCars - Script de configuración Supabase
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

-- 1. Tabla de perfiles (extiende auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'employee')) default 'employee'
);

-- Trigger: crear perfil automáticamente al crear usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'employee');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Tabla de autos
create table cars (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  model text not null,
  year int not null,
  price decimal(12,2) not null,
  mileage int default 0,
  color text,
  condition text check (condition in ('excelente', 'bueno', 'regular')) default 'bueno',
  num_owners int default 1,
  has_debts boolean default false,
  debt_amount decimal(12,2),
  theft_report_clean boolean default true,
  tenencia_paid boolean default true,
  has_original_invoice boolean default true,
  invoice_type text check (invoice_type in ('fisica', 'empresarial', 'ninguna')) default 'fisica',
  status text check (status in ('available', 'sold')) default 'available',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Tabla de fotos
create table car_photos (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) on delete cascade not null,
  photo_url text not null,
  "order" int default 0,
  created_at timestamptz default now()
);

-- 4. Tabla de ventas
create table sales (
  id uuid default gen_random_uuid() primary key,
  car_id uuid references cars(id) not null,
  buyer_name text not null,
  sale_price decimal(12,2) not null,
  sale_date date not null,
  notes text,
  sold_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS) - Solo usuarios autenticados
-- =============================================

alter table profiles enable row level security;
alter table cars enable row level security;
alter table car_photos enable row level security;
alter table sales enable row level security;

-- Profiles: cada quien ve los suyos, admin ve todos
create policy "Usuarios ven su perfil" on profiles for select using (auth.uid() = id);
create policy "Admin ve todos los perfiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin actualiza roles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin elimina usuarios" on profiles for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Cars: todos los autenticados pueden ver y modificar
create policy "Empleados ven autos" on cars for select using (auth.uid() is not null);
create policy "Empleados insertan autos" on cars for insert with check (auth.uid() is not null);
create policy "Empleados actualizan autos" on cars for update using (auth.uid() is not null);
create policy "Empleados eliminan autos" on cars for delete using (auth.uid() is not null);

-- Car photos
create policy "Empleados ven fotos" on car_photos for select using (auth.uid() is not null);
create policy "Empleados insertan fotos" on car_photos for insert with check (auth.uid() is not null);
create policy "Empleados eliminan fotos" on car_photos for delete using (auth.uid() is not null);

-- Sales
create policy "Empleados ven ventas" on sales for select using (auth.uid() is not null);
create policy "Empleados insertan ventas" on sales for insert with check (auth.uid() is not null);
create policy "Empleados eliminan ventas" on sales for delete using (auth.uid() is not null);

-- =============================================
-- Storage bucket para fotos
-- =============================================
-- Ejecutar en: Supabase > Storage > New bucket
-- Nombre: car-photos
-- Public: SI (para que las fotos sean accesibles)

insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true);

create policy "Empleados suben fotos" on storage.objects for insert
  with check (bucket_id = 'car-photos' and auth.uid() is not null);

create policy "Fotos públicas" on storage.objects for select
  using (bucket_id = 'car-photos');

create policy "Empleados eliminan fotos" on storage.objects for delete
  using (bucket_id = 'car-photos' and auth.uid() is not null);
