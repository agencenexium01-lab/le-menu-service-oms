# 📋 TODO - Le Menu Service OMS

**Projet:** Système de Gestion des Commandes pour Le Menu Service (Imprimerie)  
**Date:** 17 Juin 2026  
**Version:** 0.1.0 - MVP Backend Complété

---

## ✅ ACCOMPLISSEMENTS

### 🏗️ Architecture & Infrastructure
- [x] Setup complet Next.js + React + TypeScript + Vite
- [x] Configuration Firebase (Auth + Firestore + Storage)
- [x] Middleware d'authentification et d'autorisation
- [x] Système de rôles (client, chef_point, admin, super_admin)
- [x] Routing avec isolation par portail (client/pro/admin)

### 🔐 Authentification & Sécurité
- [x] Authentification Firebase Auth (email/password)
- [x] Fonction registerClientUser()
- [x] Fonction registerStaffUser() (chef_point, admin, super_admin)
- [x] Fonction loginUser()
- [x] Gestion des profils utilisateurs
- [x] Soft delete des utilisateurs (déactivation)
- [x] Vérification des droits d'accès par portail

### 🌟 Intégration Gemini AI
- [x] POST /api/gemini/suggest-price - Suggestion de prix par IA
- [x] POST /api/gemini/ask-guide - Chatbot assistant pour commandes
- [x] POST /api/gemini/analyze-file - Analyse technique des fichiers image

### 🏢 Gestion des Branches (Annexes)
- [x] Fonction getBranches() - Récupérer branches actives
- [x] Fonction createBranch() - Créer une branche
- [x] Fonction updateBranch() - Modifier une branche
- [x] Fonction deleteBranch() - Soft delete branche
- [x] Fonction getBranchById() - Récupérer détails branche
- [x] Seed initial des 3 branches (S1, S2, S3)
- [x] GET /api/branches - Endpoint liste
- [x] POST /api/branches - Endpoint création
- [x] PUT /api/branches/:id - Endpoint modification
- [x] DELETE /api/branches/:id - Endpoint suppression

### 👥 Gestion des Utilisateurs Staff
- [x] Fonction getStaffAccounts() - Lister staff
- [x] Fonction toggleStaffActive() - Activer/désactiver
- [x] Fonction getBranchStaff() - Staff d'une branche
- [x] POST /api/auth/login-staff - Login staff
- [x] GET /api/users/staff - Endpoint liste staff
- [x] POST /api/users/staff - Endpoint création staff
- [x] PUT /api/users/:id/profile - Endpoint modification profil
- [x] PUT /api/users/:id/deactivate - Endpoint désactivation

### 📦 Gestion des Commandes
- [x] Fonction createOrder() - Créer commande client
- [x] Fonction updateOrder() - Mettre à jour commande
- [x] Fonction getOrderById() - Récupérer commande
- [x] Fonction getAllOrders() - Lister avec filtres
- [x] Fonction createManualOrder() - Commande walk-in/manuelle
- [x] Fonction validateOrderPayment() - Valider paiement
- [x] Fonction addOrderStatusHistory() - Historique statuts
- [x] GET /api/orders - Endpoint avec filtres
- [x] POST /api/orders/manual - Endpoint création manuelle
- [x] PUT /api/orders/:id/status - Endpoint statut
- [x] PUT /api/orders/:id/payment-validate - Endpoint paiement

### 💬 Gestion des Devis & Notifications
- [x] Fonction saveQuote() - Créer/modifier devis
- [x] Fonction getQuoteByOrderId() - Récupérer devis
- [x] Fonction addQuote() - Ajouter devis avec notifications
- [x] Fonction respondToQuote() - Accepter/refuser devis
- [x] Fonction createNotification() - Créer notification
- [x] Fonction notifyProsForOrder() - Notifier staff
- [x] Fonction notifyAnnexChefsAndAdmins() - Notifier chefs/admins
- [x] Fonction createNotificationForRole() - Notifier par rôle
- [x] POST /api/notifications/broadcast-role - Endpoint broadcast

### 📊 Rapports & Analytics
- [x] Fonction generateReport() - Générer rapport commandes
- [x] GET /api/reports/orders - Endpoint rapport

### 🎨 Components Frontend
- [x] Navbar.tsx - Navigation principale
- [x] Logo.tsx - Logo Le Menu Service
- [x] Footer.tsx - Pied de page
- [x] AutoLogout.tsx - Déconnexion automatique
- [x] OnlineIndicator.tsx - Indicateur connexion
- [x] Skeleton.tsx - Composant chargement
- [x] NotificationBell.tsx - Cloche notifications
- [x] MaintenanceScreen.tsx - Écran maintenance

### 📱 Interfaces Frontend (Pages)
- [x] app/page.tsx - Page accueil
- [x] app/(auth)/connexion - Page connexion
- [x] app/(auth)/inscription - Page inscription
- [x] app/(auth)/login - Login client
- [x] app/(auth)/register - Enregistrement client
- [x] app/(client)/client - Dashboard client
- [x] app/(pro)/pro - Dashboard pro
- [x] app/admin-setup - Setup admin initial

### 🪝 Hooks React
- [x] useAuth.tsx - Gestion authentification
- [x] useBranches.ts - Gestion branches
- [x] useOrders.ts - Gestion commandes
- [x] useNotifications.ts - Gestion notifications

### ⚙️ Configuration
- [x] vite.config.ts - Configuration Vite + React
- [x] tailwind.config.ts - Configuration Tailwind CSS
- [x] tsconfig.json - Configuration TypeScript
- [x] middleware.ts - Middleware Next.js

---

## 🚀 PROCHAINES ÉTAPES (PRIORITÉ IMMÉDIATE)

### Phase 1: Composants Admin (2-3 jours)
- [ ] Créer `components/admin/BranchManager.tsx`
  - Liste des branches (CRUD UI)
  - Ajouter/éditer/supprimer branche
  - Validation des champs
  - Confirmation avant suppression

- [ ] Créer `components/admin/StaffManager.tsx`
  - Liste du personnel par branche
  - Formulaire création staff
  - Modification profil staff
  - Activation/désactivation comptes
  - Filtrage par branche

- [ ] Créer `components/admin/OrderManualForm.tsx`
  - Formulaire commande manuelle (walk-in)
  - Calcul automatique prix avec IA
  - Validation des dimensions
  - Gestion des fichiers (optionnel)
  - Sélection branche

- [ ] Créer `components/admin/ReportGenerator.tsx`
  - Sélecteur période (date from/to)
  - Filtres par branche, statut, paiement
  - Export PDF/CSV
  - Graphiques statistiques

### Phase 2: Pages Pro Complètes (2-3 jours)
- [ ] Implémenter `app/(pro)/pro/proprietaire/branches/page.tsx`
  - Intégrer BranchManager
  - Full CRUD UI

- [ ] Implémenter `app/(pro)/pro/proprietaire/equipe/page.tsx`
  - Intégrer StaffManager
  - Gestion des rôles

- [ ] Implémenter `app/(pro)/pro/proprietaire/rapports/page.tsx`
  - Intégrer ReportGenerator
  - Dashboards KPI
  - Graphiques avec Chart.js ou Recharts

- [ ] Implémenter `app/(pro)/pro/point/[branchId]/commandes/nouvelle/page.tsx`
  - Intégrer OrderManualForm
  - Preview avant validation
  - Confirmation succès

### Phase 3: Amélioration Client (1-2 jours)
- [ ] Créer `components/client/QuoteViewer.tsx` - Amélioration
  - Affichage devis formaté
  - Boutons accepter/refuser
  - Historique des devis

- [ ] Créer `components/client/OrderTimeline.tsx` - Amélioration
  - Timeline visuelle des statuts
  - Dates estimées livraison
  - Historique complet

### Phase 4: Hooks Manquants (1 jour)
- [ ] Créer `hooks/useStaff.ts`
  - CRUD staff (create, read, update, deactivate)
  - Gestion cache

- [ ] Améliorer `hooks/useBranches.ts`
  - Ajouter CRUD complet
  - Cache + invalidation

- [ ] Améliorer `hooks/useOrders.ts`
  - Ajouter filtres avancés
  - Pagination
  - Real-time subscription

### Phase 5: Améliorations Backend (2-3 jours)

#### Endpoints API Manquants:
- [ ] POST /api/orders/:id/quote - Créer/envoyer devis
- [ ] PUT /api/orders/:id/quote - Modifier devis
- [ ] POST /api/orders/:id/quote-response - Répondre devis (accepter/refuser)
- [ ] GET /api/orders/:id/history - Historique complet commande
- [ ] GET /api/notifications - Lister notifications user
- [ ] PUT /api/notifications/:id/read - Marquer notification lue
- [ ] DELETE /api/notifications/:id - Supprimer notification
- [ ] POST /api/export/orders - Export CSV commandes
- [ ] POST /api/export/reports - Export PDF rapport

#### Améliorations Firestore:
- [ ] Ajouter indexes Firestore pour performances
- [ ] Créer fonction aggregateOrderStats()
- [ ] Créer fonction getClientOrderHistory(clientId)
- [ ] Créer fonction archiveOldOrders()

#### Authentification:
- [ ] Implémenter refresh tokens
- [ ] Ajouter 2FA (optionnel)
- [ ] Récupération mot de passe

### Phase 6: Intégrations Externes (2-3 jours)

#### Email (SendGrid ou Resend):
- [ ] Envoyer confirmation commande au client
- [ ] Envoyer devis par email
- [ ] Notifier staff de nouvelles commandes
- [ ] Rappels avant échéance
- [ ] Templates HTML professionnels

#### SMS (TwilioON Afritech):
- [ ] Notifier clients via SMS
- [ ] Alertes statut commande
- [ ] Confirmations paiement

#### Paiement:
- [ ] Intégration Orange Money (Bénin)
- [ ] Intégration MTN Money
- [ ] Webhook validation paiement
- [ ] Historique transactions

### Phase 7: Tests & QA (2-3 jours)
- [ ] Tests unitaires (Jest + React Testing Library)
  - Fonctions Firestore
  - Hooks React
  - Composants critiques

- [ ] Tests intégration
  - Endpoints API
  - Flux authentification
  - CRUD complet branches/staff/commandes

- [ ] Tests E2E (Cypress/Playwright)
  - Flux client (commander → devis → accepter → paiement)
  - Flux staff (recevoir → traiter → prêt → livrer)
  - Flux admin (gestion branches, staff, rapports)

- [ ] Tests performance
  - Optimisation requêtes Firestore
  - Pagination/virtualisation listes
  - Compression images

### Phase 8: Optimisations & Déploiement (1-2 jours)
- [ ] Optimiser images
- [ ] Lazy loading composants
- [ ] Code splitting
- [ ] Service Worker (offline mode)
- [ ] SEO basic
- [ ] Déployer staging: Vercel/Firebase Hosting
- [ ] Configuration DNS

---

## 🐛 BUGS CONNUS & AMÉLIORATIONS TECHNIQUES

### Sécurité
- [ ] Valider tous les inputs côté serveur
- [ ] Rate limiting sur endpoints publics
- [ ] CORS configuration stricte
- [ ] CSP (Content Security Policy) headers
- [ ] SQL injection prevention (mais pas SQL)
- [ ] XSS protection Firestore rules

### Performance
- [ ] Paginateur pour listes longues
- [ ] Virtualisation listes 1000+ items
- [ ] Mise en cache Redux/Zustand/Context
- [ ] Optimiser render avec React.memo
- [ ] Lazy loading routes
- [ ] Compression Gzip

### UX/UI
- [ ] Améliorer formulaires (validation temps réel)
- [ ] Ajouter toasts/alerts
- [ ] Dark mode (optionnel)
- [ ] Responsive design mobile
- [ ] Accessibilité WCAG 2.1
- [ ] Animations transitions

### Monitoring & Logging
- [ ] Sentry pour error tracking
- [ ] Logs centralisés (Google Cloud Logging)
- [ ] Analytics (Google Analytics ou Plausible)
- [ ] Alertes erreurs critiques

---

## 📚 DOCUMENTATION À COMPLÉTER

- [ ] README.md complet
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Guide setup développement local
- [ ] Architecture decision records (ADR)
- [ ] Firestore data model diagram
- [ ] User flow diagrams
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 📊 STATUT GLOBAL

| Section | % Complet | Détail |
|---------|-----------|---------|
| Backend API | 80% | Endpoints core OK, export/avancé manquants |
| Frontend UI | 40% | Pages de base OK, Admin/Staff UI manquants |
| Authentification | 90% | Login OK, 2FA/reset manquants |
| Notifications | 70% | In-app OK, Email/SMS manquants |
| Tests | 5% | Aucun test unitaire/E2E |
| Documentation | 10% | TODO.md seul, reste manquant |
| Déploiement | 0% | Non configuré |
| **TOTAL** | **40%** | **MVP Backend en cours** |

---

## 🎯 OBJECTIFS IMMÉDIATS (CETTE SEMAINE)

### Jour 1-2: Admin Components
- BranchManager + StaffManager + OrderManualForm complets

### Jour 3-4: Pages Pro
- Implémenter les 4 pages pro manquantes avec composants

### Jour 5-6: Hooks & Tests
- useStaff, useBranches amélioré
- Tests basiques endpoints

### Jour 7: Polish & Optim
- Fixes bugs UI
- Optimisations performance
- Préparation staging

---

## 📞 CONTACTS & RESSOURCES

- **Framework:** Next.js 15, React 19, Vite 6
- **Base de données:** Firebase Firestore
- **IA:** Google Gemini API
- **Hébergement:** Firebase Hosting / Vercel
- **Email:** TBD (SendGrid/Resend)
- **Paiement:** TBD (Orange Money/MTN Money)

---

**Dernière mise à jour:** 17 Juin 2026  
**Responsable:** Team Development  
**Priorité:** 🔴 HAUTE - Backend complet, Frontend urgent
