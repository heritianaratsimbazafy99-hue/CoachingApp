# Checklist produit fini

Date de dernière revue : 2026-05-05

## État validé

- Production Vercel : `https://coaching-app-pi-olive.vercel.app/`
- Derniers blocs validés :
  - `2911801` : états globaux loading et 404.
  - `361bfa8` : filtres notifications mobile.
  - `011cd4a` : messagerie coach/coaché.
- QA production récente :
  - Admin : dashboard, utilisateurs, coachs, coachés, cohortes, statistiques.
  - Coach : cockpit, coachés, cohortes, bibliothèque, quiz, assignations, parcours, agenda, notifications, messages.
  - Coaché : accueil, tâches, parcours, agenda, messages, notifications, profil, résultats.
- Résultat QA : aucune redirection login inattendue, aucun overflow horizontal desktop/mobile, aucune erreur console bloquante.

## Vérifications avant livraison

```bash
cd /Users/heritiana/Documents/CoachingApp
git status --short
npm run lint
npm run build
curl -I https://coaching-app-pi-olive.vercel.app/
curl -I https://coaching-app-pi-olive.vercel.app/route-introuvable-codex
```

Résultat attendu :

- `git status --short` sans changement non prévu.
- `npm run lint` sans erreur.
- `npm run build` compile et génère les routes App Router.
- `/` répond `HTTP/2 200`.
- URL introuvable répond `HTTP/2 404` avec la page brandée.

## Variables Vercel

À vérifier dans Vercel > Project Settings > Environment Variables :

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
TRANSACTIONAL_EMAIL_FROM
CRON_SECRET
```

`NEXT_PUBLIC_SITE_URL` doit pointer vers :

```text
https://coaching-app-pi-olive.vercel.app
```

## Diagnostics live

Depuis une session admin, ouvrir :

```text
https://coaching-app-pi-olive.vercel.app/api/admin-diagnostics
```

Résultat attendu :

- `ok: true`
- rôle `admin`
- checks Supabase `OK`
- `email_logs` accessible
- env Supabase, Resend, cron et expéditeur transactionnel à `true`

Vérifier aussi que le cron refuse les appels sans secret :

```bash
cd /Users/heritiana/Documents/CoachingApp
curl -I https://coaching-app-pi-olive.vercel.app/api/cron/calendar-reminders
```

Résultat attendu : `401` sans header `Authorization`.

## QA par rôle

Comptes de test :

```text
Admin   : admin@ecce.mg / Heritiana
Coach   : coach@ecce.mg / Heritiana
Coaché  : coachee@ecce.mg / Heritiana
```

Parcours minimum à rejouer après chaque gros changement :

- Admin : créer utilisateur, changer rôle, consulter cohortes, vérifier statistiques.
- Coach : créer contenu, créer quiz, assigner, ouvrir messagerie, vérifier notifications, ouvrir agenda.
- Coaché : ouvrir tâche, soumettre quiz, consulter résultats, répondre message, vérifier agenda et notifications.

Critères d’acceptation :

- Navigation protégée conforme au rôle.
- États vides compréhensibles.
- Erreurs de formulaire visibles et non bloquantes.
- Actions critiques admin explicites.
- Mobile lisible à 390 px sans scroll horizontal.

## Supabase et RLS

SQL déjà exécutés sur la base réelle :

- `supabase/harden-auth-profile-rls.sql`
- `supabase/fix-messaging-role-helpers.sql`
- `supabase/fix-coach-note-role-helpers.sql`
- `supabase/harden-coach-write-rls.sql`
- `supabase/fix-admin-role-updates.sql`
- `supabase/fix-auth-user-profile-trigger.sql`
- `supabase/enable-transactional-emails.sql`
- `supabase/add-notification-preferences.sql`
- `supabase/enable-messages-realtime.sql`
- `supabase/enable-app-shell-realtime.sql`

Avant toute nouvelle modification SQL :

- lire le fichier SQL complet ;
- confirmer la cible Supabase ;
- exécuter en SQL Editor ;
- relancer `/api/admin-diagnostics` ;
- faire une QA ciblée du rôle touché.

## Emails et cron

Emails transactionnels couverts :

- invitation et réinitialisation utilisateur ;
- message reçu ;
- correction quiz ;
- rappel de parcours ;
- rendez-vous agenda et rappel agenda.

Cron agenda :

- endpoint : `/api/cron/calendar-reminders`
- sécurité : `Authorization: Bearer $CRON_SECRET`
- sans secret : `401 Non autorisé`

Après activation ou changement cron :

- vérifier les logs Vercel ;
- vérifier `email_logs` ;
- confirmer qu’aucun email doublon n’est créé.

## Points à surveiller

- Ajouter un monitoring applicatif externe si le produit sort de la démo privée.
- Rejouer la QA complète après chaque migration RLS.
- Garder les screenshots Playwright temporaires hors repo.
- Mettre à jour cette checklist après chaque bloc produit majeur.
