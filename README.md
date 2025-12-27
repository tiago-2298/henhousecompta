# Hen House Manager - Ultimate Edition

Application de gestion Pro pour FiveM avec Caisse Tactile, Back-office, Pointeuse et Analytics.

## Fonctionnalités

### Interface Employé
- **Caisse Tactile**: Grille de produits avec images, panier latéral en temps réel
- **Pointeuse**: Système de clock-in/clock-out avec historique des shifts
- **Feedback Audio**: Sons pour chaque action (ajout produit, vente, erreur)
- **Notifications Toast**: Feedback visuel immédiat

### Interface Admin
- **Dashboard Analytics**:
  - Graphiques CA sur 7 jours (Recharts)
  - Top 5 produits (Camembert)
  - KPIs en temps réel
- **Gestion Produits**: CRUD complet avec gestion des stocks
- **Gestion Staff**: Vue des employés en service, heures travaillées
- **Notifications Discord**: Webhooks pour ventes, shifts et stocks

### API FiveM
- Edge Function sécurisée avec token
- Actions: `banking_transfer`, `setjob`
- Header requis: `X-HenHouse-Token: SECRET_SUPER_SECURISE_123`

## Comptes de Démarrage

**Admin**
- Username: `patron`
- Password: `henhouse2025`

**Employé**
- Username: `vendeur`
- Password: `1234`

## Architecture

### Base de Données (Supabase)
- `users`: Utilisateurs avec roles et taux horaire
- `shifts`: Historique des prises de service
- `products`: Catalogue produits avec stocks
- `sales` & `sale_items`: Ventes et détails
- `discord_webhooks`: Configuration des notifications

### Design
- Glassmorphism moderne
- Palette: Dark #0f1115, Accent Orange #ff6a2b
- Responsive et immersif

## Développement

```bash
npm install
npm run dev
```

## Production avec Docker

```bash
docker build -t henhouse-manager .
docker run -p 3000:3000 henhouse-manager
```

## API FiveM

Endpoint: `https://your-project.supabase.co/functions/v1/fivem-webhook`

Exemple:
```lua
PerformHttpRequest('https://your-project.supabase.co/functions/v1/fivem-webhook', function(err, text, headers)
    print(text)
end, 'POST', json.encode({
    action = 'banking_transfer',
    data = {
        user_id = 'fivem_id',
        amount = 100,
        product_ids = {}
    }
}), {
    ['Content-Type'] = 'application/json',
    ['X-HenHouse-Token'] = 'SECRET_SUPER_SECURISE_123'
})
```

## Configuration Discord Webhooks

Les webhooks Discord se configurent via la table `discord_webhooks` :
- `event_type`: 'sales', 'shifts', 'stock', 'all'
- `url`: URL du webhook Discord
- `is_active`: true/false

## Technologies

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Database + Edge Functions)
- Recharts (Analytics)
- Lucide Icons
