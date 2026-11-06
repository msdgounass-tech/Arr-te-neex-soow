// Configuration du site.
// Renseignez l'URL et la clé publique (anon / publishable) de votre projet Supabase
// pour passer en production. Ces deux valeurs sont publiques par conception :
// la sécurité est assurée par les règles RLS du fichier supabase/schema.sql.
// Laissées vides, le site fonctionne en MODE DÉMONSTRATION (données dans ce navigateur).
export const CONFIG = {
  SUPABASE_URL: 'https://ejutptsipygbnobkrowt.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_PgdoHL0wEIOvmsKFfZqBHg_-SSHfew3',
  // Adresse publique du site (pour les liens de suivi envoyés sur WhatsApp). Vide = adresse courante.
  SITE_URL: 'https://arret-nekh-soow.vercel.app/',
};
