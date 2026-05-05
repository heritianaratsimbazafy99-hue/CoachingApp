# Mini-audit sécurité

Date : 2026-05-05

## Périmètre

- Next.js App Router : proxy, route handlers, server actions.
- Supabase : service role, RLS, Storage, SQL de durcissement.
- Production : disponibilité Vercel, diagnostics admin, cron protégé.

## Résumé

Aucun secret exposé dans le repo, `.env*` est ignoré, les routes privées sont
protégées par rôle et les diagnostics live sont réservés aux admins.

Un durcissement a été appliqué pendant cette revue : la route de téléchargement
des documents ne redirige plus vers une URL externe stockée en base. Elle ne
sert désormais que des références Storage contrôlées, puis des URLs signées
Supabase.

## Contrôles effectués

- `src/proxy.ts` protège `/admin`, `/coach` et `/coachee` par rôle.
- `src/lib/auth/session.ts` centralise `requireUser` et `requireRole`.
- Les server actions sensibles appellent `requireRole` avant mutation.
- `src/lib/supabase/admin.ts` crée le client service role uniquement côté serveur.
- `.gitignore` ignore `.env*`, `.vercel`, `.next`, `*.pem`.
- `/api/admin-diagnostics` vérifie la session et le rôle admin avant de révéler
  les statuts d'environnement.
- `/api/cron/calendar-reminders` exige `Authorization: Bearer $CRON_SECRET`.
- `supabase/schema.sql` active RLS sur les tables applicatives principales.
- Les correctifs RLS récents utilisent majoritairement `(select auth.uid())` et
  des helpers `security definer` pour éviter la récursion.

## Correctif appliqué

Avant :

```ts
return NextResponse.redirect(new URL(content.file_url));
```

Après :

```ts
if (!storageReference) {
  return notFound();
}
```

Impact :

- réduit le risque de redirection ouverte via `file_url` ;
- garde les liens externes dans le champ prévu `external_url` ;
- conserve les téléchargements document via Storage signé pendant 5 minutes.

## Vérifications live recommandées

```bash
cd /Users/heritiana/Documents/CoachingApp
npm run lint
npm run build
curl -I https://coaching-app-pi-olive.vercel.app/
curl -I https://coaching-app-pi-olive.vercel.app/api/cron/calendar-reminders
```

Résultat attendu :

- production `/` en `HTTP/2 200` ;
- cron sans secret en `HTTP/2 401` ;
- diagnostics admin en `ok: true` depuis une session admin.

## SQL Supabase optionnel

Pour une revue RLS live complète, exécuter le fichier existant en SQL Editor :

```bash
cd /Users/heritiana/Documents/CoachingApp
cat supabase/audit-security-rls.sql
```

Chaque result set doit être vide ou expliqué, sauf la section listant les
policies à optimiser si elles sont déjà couvertes par un correctif plus récent.
