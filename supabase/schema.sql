-- Ateliê de Costura — schema
-- Todo acesso passa pelo servidor (chave secreta). RLS ligado sem políticas = anon bloqueado.

create extension if not exists pgcrypto;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text unique,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);
create index if not exists clientes_nome_idx on clientes (lower(nome));

create table if not exists ordens (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  cliente_id uuid not null references clientes(id) on delete restrict,
  data_entrada date not null default ((now() at time zone 'America/Fortaleza')::date),
  data_entrega date not null,
  status text not null default 'aberta' check (status in ('aberta','entregue','cancelada')),
  forma_pagamento text,
  data_entrega_efetiva date,
  observacoes text,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ordens_entrega_idx on ordens (data_entrega);
create index if not exists ordens_cliente_idx on ordens (cliente_id);

create table if not exists ordem_itens (
  id uuid primary key default gen_random_uuid(),
  ordem_id uuid not null references ordens(id) on delete cascade,
  peca text not null,
  servico text,
  valor numeric(12,2) not null default 0,
  posicao int not null default 0
);
create index if not exists ordem_itens_ordem_idx on ordem_itens (ordem_id);

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('entrada','saida')),
  fixa boolean not null default false,
  created_at timestamptz not null default now(),
  unique (nome, tipo)
);

create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null,
  valor numeric(12,2) not null check (valor >= 0),
  data date not null default ((now() at time zone 'America/Fortaleza')::date),
  categoria_id uuid references categorias(id) on delete set null,
  forma_pagamento text,
  ordem_id uuid references ordens(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists movimentacoes_data_idx on movimentacoes (data);

-- total da OS sempre igual à soma dos itens
create or replace function recalcula_total_ordem() returns trigger language plpgsql as $$
declare oid uuid;
begin
  oid := coalesce(new.ordem_id, old.ordem_id);
  update ordens set total = coalesce((select sum(valor) from ordem_itens where ordem_id = oid), 0) where id = oid;
  if tg_op = 'UPDATE' and old.ordem_id is distinct from new.ordem_id then
    update ordens set total = coalesce((select sum(valor) from ordem_itens where ordem_id = old.ordem_id), 0) where id = old.ordem_id;
  end if;
  return null;
end $$;

drop trigger if exists ordem_itens_total on ordem_itens;
create trigger ordem_itens_total after insert or update or delete on ordem_itens
  for each row execute function recalcula_total_ordem();

alter table clientes enable row level security;
alter table ordens enable row level security;
alter table ordem_itens enable row level security;
alter table categorias enable row level security;
alter table movimentacoes enable row level security;

-- configurações do sistema (ex.: hash da senha de acesso)
create table if not exists configuracoes (
  chave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);
alter table configuracoes enable row level security;

insert into categorias (nome, tipo, fixa) values
  ('Serviços de costura', 'entrada', false),
  ('Outras entradas', 'entrada', false),
  ('Aluguel', 'saida', true),
  ('Água', 'saida', true),
  ('Luz', 'saida', true),
  ('Internet / Telefone', 'saida', true),
  ('Aviamentos e materiais', 'saida', false),
  ('Manutenção de máquinas', 'saida', false),
  ('Outras despesas', 'saida', false)
on conflict (nome, tipo) do nothing;

-- datas padrão sempre no fuso do ateliê (o servidor do banco roda em UTC)
alter table ordens alter column data_entrada set default ((now() at time zone 'America/Fortaleza')::date);
alter table movimentacoes alter column data set default ((now() at time zone 'America/Fortaleza')::date);
