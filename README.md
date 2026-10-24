# Ateliê de Costura — Ajustes e Reformas

Sistema de gestão do ateliê: ordens de serviço, agenda de entregas e controle de caixa.
Next.js 16 + Supabase (Postgres).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A senha inicial é a `ATELIE_SENHA` do `.env.local`; depois de trocada em **Opções → Senha**, passa a valer a senha guardada (criptografada) no banco.

## Banco de dados

O schema está em `supabase/schema.sql`. Para aplicar (é seguro rodar de novo):

```bash
npm run db:setup
```

## Publicar na Vercel

1. Suba o código para `github.com/williamfmarinho/atelie-costura` (o `.gitignore` já exclui `.env.local` e `supabase.txt`).
2. Na Vercel: **Add New → Project → importe o repositório**.
3. Em **Environment Variables**, cadastre:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ATELIE_SENHA` (senha inicial, usada só enquanto não for trocada em Opções)
   - `SESSION_SECRET` (texto aleatório longo)
4. Deploy.

Datas e horas usam sempre o fuso de Fortaleza (`America/Fortaleza`), independente do servidor.

Todas as consultas ao banco rodam no servidor com a chave secreta; o navegador nunca recebe chaves.
As tabelas têm RLS ligado sem políticas, então a chave pública não acessa nada.
