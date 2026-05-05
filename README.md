# Coaching Platform

Application SaaS de coaching branchée à Supabase réel avec Next.js 16, React, TypeScript, Tailwind CSS v4, Vercel et Resend.

## Checklist produit fini

La checklist de livraison, QA production, variables Vercel, diagnostics, cron,
emails et RLS est maintenue dans :

```text
docs/launch-checklist.md
```

## Modules inclus

- Auth Supabase : login, register, mot de passe oublié, redirection par rôle.
- Admin : dashboard, création d'utilisateurs, gestion des rôles, coachs, cohortes, statistiques globales.
- Coach : cockpit, coachés, profil détaillé, cohortes, bibliothèque, quiz, assignations, résultats, corrections, messagerie, agenda, paramètres.
- Coaché : dashboard, tâches, lecture contenu, quiz interactif, résultats, messages, agenda, profil.
- Supabase SQL : tables, enums, index, triggers `updated_at`, fonctions métier, RLS policies.

## Installation locale

```bash
cd /Users/heritiana/Documents/CoachingApp
npm install
```

## Variables d'environnement

Créer ou vérifier le fichier `.env.local` :

```bash
cd /Users/heritiana/Documents/CoachingApp
touch .env.local
```

Contenu attendu :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://coaching-app-pi-olive.vercel.app
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY
RESEND_API_KEY=VOTRE_RESEND_KEY
TRANSACTIONAL_EMAIL_FROM="CoachingApp <noreply@votre-domaine.tld>"
CRON_SECRET=UN_SECRET_LONG_ET_UNIQUE
```

## Supabase Auth

Dans Supabase Dashboard :

1. Aller dans `Authentication`.
2. Aller dans `URL Configuration`.
3. Configurer `Site URL` :

```text
https://coaching-app-pi-olive.vercel.app
```

4. Configurer `Redirect URLs` :

```text
http://localhost:3000/**
https://coaching-app-pi-olive.vercel.app/**
```

## SQL Supabase

Dans Supabase Dashboard :

1. Aller dans `SQL Editor`.
2. Ouvrir le fichier local :

```bash
cd /Users/heritiana/Documents/CoachingApp
cat supabase/schema.sql
```

3. Copier tout le contenu de `supabase/schema.sql`.
4. Coller dans Supabase SQL Editor.
5. Cliquer sur `Run`.

## Donner le rôle admin à un utilisateur

Remplacer l'UUID par celui de votre utilisateur :

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where id = 'c9165972-c4a2-4157-b74f-391570f2bdc5';
```

Vérifier :

```sql
select
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data
from auth.users
where id = 'c9165972-c4a2-4157-b74f-391570f2bdc5';
```

Rôles possibles :

```text
admin
coach
coachee
```

## Créer un utilisateur depuis l'admin

La page `/admin/users` permet de créer un compte Supabase Auth avec :

- nom complet ;
- email ;
- rôle initial ;
- mot de passe temporaire.

Le compte est confirmé immédiatement et synchronisé avec `public.profiles`.

## Lancement local

```bash
cd /Users/heritiana/Documents/CoachingApp
npm run dev
```

Ouvrir :

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/register
http://localhost:3000/forgot-password
http://localhost:3000/admin
http://localhost:3000/coach
http://localhost:3000/coachee
```

## Build local

```bash
cd /Users/heritiana/Documents/CoachingApp
npm run build
```

Résultat attendu :

```text
Compiled successfully
Route (app)
```

## Push GitHub

```bash
cd /Users/heritiana/Documents/CoachingApp
git status
git add .
git commit -m "Build Coaching Platform V1 demo"
git push
```

## Déploiement Vercel

Après `git push`, Vercel redéploie automatiquement depuis GitHub.

Vérifier dans Vercel :

1. Aller dans le projet `CoachingApp`.
2. Aller dans `Settings`.
3. Aller dans `Environment Variables`.
4. Vérifier :

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
TRANSACTIONAL_EMAIL_FROM
CRON_SECRET
```

5. Aller dans `Deployments`.
6. Attendre le statut `Ready`.

Tester en production :

```text
https://coaching-app-pi-olive.vercel.app/login
https://coaching-app-pi-olive.vercel.app/register
https://coaching-app-pi-olive.vercel.app/admin
https://coaching-app-pi-olive.vercel.app/coach
https://coaching-app-pi-olive.vercel.app/coachee
```

## Structure du projet

```text
src/app
src/components/app
src/components/auth
src/components/coaching
src/components/ui
src/lib
src/services
src/types
src/utils
supabase/schema.sql
```

## Notes produit

Les anciennes données de départ restent centralisées dans :

```text
src/lib/demo-data.ts
```

Les services Supabase réels sont dans :

```text
src/services/coaching-service.ts
```

La checklist de lancement décrit les contrôles à rejouer avant livraison.
