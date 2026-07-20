import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  loginUser,
  registerStaffUser,
  getUserProfile,
  updateUserProfile,
  deactivateUser
} from './lib/firebase/auth';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchById,
  createManualOrder,
  getAllOrders,
  updateOrder,
  validateOrderPayment,
  getOrderById,
  createNotificationForRole,
  generateReport,
  getStaffAccounts
} from './lib/firebase/firestore';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Price suggestion
  app.post('/api/gemini/suggest-price', async (req: express.Request, res: express.Response) => {
    try {
      const { order } = req.body;
      if (!order) {
        return res.status(400).json({ error: 'Les détails de la commande sont requis.' });
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        console.error("Clé GEMINI_API_KEY manquante.");
        return res.status(500).json({ error: 'La clé API de Gemini n\'est pas configurée.' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Tu es un expert en tarification pour l'entreprise "Le Menu Service", spécialisée en impression numérique et reprographie professionnelle à Abomey-Calavi, au Bénin.
Ta mission : proposer une estimation réaliste de prix de base en Francs CFA (XOF) pour une commande d'un client.

Grille tarifaire officielle Le Menu Service :
- 🖨️ Impression Grand Format (bâche, toile) : 2 000 XOF/m²
- 📄 Photocopies & Impression (A5, A4, A3) : 100 XOF/page
- 🎨 Conception Graphique (logo, affiche) : 10 000 XOF (tarif forfaitaire projet)
- 🖼️ Tableau Personnalisé (toile montée) : 15 000 XOF/pièce
- 📜 Kakémono / Roll-up / Pull-up : 15 000 XOF/pièce
- 👕 Impression Textile (T-shirt, maillot) : 3 500 XOF/pièce
- ☕ Impression sur Tasse / Mug : 2 500 XOF/pièce
- 📸 Photo d'Identité (tirage officiel) : 1 500 XOF pour 6 photos standard
- 🏷️ Publicité Autocollants / Vinyles adhésifs : 3 000 XOF/m²
- 📋 Documents & Publications (mémoires, rapports) : 1 500 XOF/page
- 🖥️ Formation Secrétariat Bureautique : 45 000 XOF (tarif forfaitaire session complète)
- 🎭 Formation Graphisme PAO : 60 000 XOF (tarif forfaitaire session complète)
- ✏️ Autre Prestation : Prix de base à partir de 5 000 XOF par devis

Directives de tarification :
1. Pour les dimensions fournies en mètres (m) ou centimètres (cm), calcule l'aire en m² (largeur × hauteur) et multiplie par le prix au m² pour les services concernés.
2. Pour les services forfaitaires ou par pièce/page, multiplie le prix de base par la quantité demandée (nombre d'exemplaires, participants ou pages).
3. Adapte intelligemment le calcul si la description indique des spécificités.

Réponds UNIQUEMENT sous forme de JSON valide : { "suggestedPrice": [nombre entier XOF], "reasoning": "[explication claire et polie en français, maximum 50 mots]" }`;

      const serviceType = order.serviceType || 'autre';
      const width = order.dimensions?.width || 0;
      const height = order.dimensions?.height || 0;
      const unit = order.dimensions?.unit || 'cm';
      const quantity = order.quantity || 1;
      const description = order.description || '';
      const specialNote = order.specialNote || '';

      const prompt = `Voici les détails de la commande d'impression :
- Type de service : ${serviceType}
- Dimensions : ${width} x ${height} ${unit}
- Quantité : ${quantity}
- Description : ${description}
- Note de commande : ${specialNote}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedPrice: {
                type: Type.INTEGER,
                description: 'Le prix de base proposé en Francs CFA (XOF).',
              },
              reasoning: {
                type: Type.STRING,
                description: 'Une explication courte de la tarification en français, maximum 50 mots.',
              },
            },
            required: ['suggestedPrice', 'reasoning'],
          },
        },
      });

      const text = response.text?.trim() || '';
      if (!text) {
        throw new Error("L'API Gemini a retourné une réponse vide.");
      }

      const parsed = JSON.parse(text);
      return res.json(parsed);

    } catch (error: any) {
      console.error('Erreur API Gemini interne:', error);
      return res.status(500).json({ error: error.message || 'La suggestion IA a échoué suite à une erreur interne.' });
    }
  });

  // API Route for Gemini Chatbot / Guide
  app.post('/api/gemini/ask-guide', async (req: express.Request, res: express.Response) => {
    try {
      const { userMessage, currentFormData } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: 'Le message de l\'utilisateur est requis.' });
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        console.error("Clé GEMINI_API_KEY manquante.");
        return res.status(500).json({ error: 'La clé API de Gemini n\'est pas configurée.' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Tu es l'assistant virtuel de "Le Menu Service", une imprimerie grand format à Cotonou, Bénin.
Tu aides les clients à remplir leur formulaire de commande.
Réponds toujours en français, de manière concise (max 3 phrases).
Tu connais ces services : bâche publicitaire, panneau rigide, menu restaurant, autocollant, enseigne, roll-up, flyer.
Si on te demande les prix, tu dis que les prix sont calculés sur devis personnalisé.
Si la question ne concerne pas les commandes ou l'impression, réponds : "Je suis spécialisé dans l'aide aux commandes d'impression. Pour toute autre question, contactez-nous directement."
Contexte de la commande en cours : ${JSON.stringify(currentFormData || {})}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userMessage,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim() || "Désolé, je ne parviens pas à traiter votre demande actuellement.";
      return res.json({ reply });

    } catch (error: any) {
      console.error('Erreur API Gemini chatbot:', error);
      return res.status(500).json({ error: error.message || 'La communication a échoué suite à une erreur interne.' });
    }
  });

  // API Route for Gemini File Analysis
  app.post('/api/gemini/analyze-file', async (req: express.Request, res: express.Response) => {
    try {
      const { fileUrl, fileName, orderDimensions } = req.body;
      if (!fileUrl) {
        return res.status(400).json({ error: 'L\'URL du fichier est requise.' });
      }

      const name = fileName || 'fichier';
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name) || fileUrl.startsWith('data:image/') || fileUrl.includes('image');

      if (!isImage) {
        return res.json({
          status: 'ok',
          issues: [],
          recommendations: ["Fichier PDF reçu. Vérification visuelle recommandée."]
        });
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        console.error("Clé GEMINI_API_KEY manquante.");
        return res.status(550).json({ error: 'La clé API de Gemini n\'est pas configurée.' });
      }

      // Fetch the image and convert to base64
      let base64Data = '';
      let mimeType = 'image/png';

      if (fileUrl.startsWith('data:')) {
        const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      } else {
        try {
          const fetchRes = await fetch(fileUrl);
          if (!fetchRes.ok) {
            throw new Error(`HTTP status ${fetchRes.status}`);
          }
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Data = buffer.toString('base64');
          mimeType = fetchRes.headers.get('content-type') || 'image/png';
        } catch (fetchErr) {
          console.error("Erreur lors de la récupération de l'image:", fetchErr);
          return res.json({
            status: 'warning',
            issues: ["Impossible de charger le fichier pour l'analyse automatique."],
            recommendations: ["Veuillez faire un contrôle visuel manuel."]
          });
        }
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const dimensionsText = orderDimensions 
        ? `${orderDimensions.width} x ${orderDimensions.height} ${orderDimensions.unit || 'm'}`
        : 'non spécifiées';

      const promptString = `Tu es un technicien d'impression grand format. Analyse cette image destinée à être imprimée.
Dimensions commandées : ${dimensionsText}.
Vérifie et signale :
1. La résolution semble-t-elle suffisante pour l'impression (idéal : 72-150 dpi pour grand format) ?
2. Y a-t-il des zones floues ou pixelisées visibles ?
3. L'image semble-t-elle correspondre aux dimensions commandées ou y a-t-il un problème de proportion ?
4. Autres observations techniques importantes.
Réponds en JSON : { "status": "ok"|"warning"|"error", "issues": ["liste des problèmes en français"], "recommendations": ["liste des conseils"] }`;

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const textPart = {
        text: promptString,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "Le statut technique: 'ok' de conformité totale, 'warning' si des soucis mineurs existent, ou 'error' si l'image est inexploitable.",
              },
              issues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "La liste des problèmes techniques trouvés sous forme de phrases courtes en français.",
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "La liste de recommandations techniques pour corriger le tir.",
              },
            },
            required: ['status', 'issues', 'recommendations'],
          },
        },
      });

      const text = response.text?.trim() || '';
      if (!text) {
        throw new Error("L'API Gemini a retourné une réponse vide.");
      }

      const parsed = JSON.parse(text);
      return res.json(parsed);

    } catch (error: any) {
      console.error('Erreur API Gemini analyse fichier:', error);
      return res.status(500).json({ error: error.message || 'L\'analyse du fichier a échoué suite à une erreur interne.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ AUTHENTIFICATION STAFF ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/auth/login-staff
   * Authentification pour le portail professionnel (staff)
   */
  app.post('/api/auth/login-staff', async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
      }

      const firebaseUser = await loginUser(email, password);
      const userProfile = await getUserProfile(firebaseUser.uid);

      if (!userProfile) {
        return res.status(401).json({ error: 'Profil utilisateur non trouvé.' });
      }

      if (userProfile.role === 'client') {
        return res.status(403).json({ error: 'Accès non autorisé. Les clients doivent utiliser le portail client.' });
      }

      if (!userProfile.active) {
        return res.status(403).json({ error: 'Compte désactivé. Contactez l\'administrateur.' });
      }

      return res.json({
        success: true,
        user: {
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role,
          branchId: userProfile.branchId || null
        }
      });
    } catch (error: any) {
      console.error('Erreur login-staff:', error);
      return res.status(401).json({ error: error.message || 'Authentification échouée.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ GESTION DES BRANCHES (SUPER_ADMIN UNIQUEMENT) ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/branches
   * Liste toutes les branches actives
   */
  app.get('/api/branches', async (req: express.Request, res: express.Response) => {
    try {
      const branches = await getBranches();
      return res.json({ success: true, branches });
    } catch (error: any) {
      console.error('Erreur GET /api/branches:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des branches.' });
    }
  });

  /**
   * POST /api/branches
   * Crée une nouvelle branche
   */
  app.post('/api/branches', async (req: express.Request, res: express.Response) => {
    try {
      const { name, shortName, address, phone, active = true, sortOrder } = req.body;

      if (!name || !shortName || !address || !phone) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
      }

      const newBranch = await createBranch({
        name,
        shortName,
        address,
        phone,
        active,
        sortOrder: sortOrder || 1
      });

      return res.status(201).json({ success: true, branch: newBranch });
    } catch (error: any) {
      console.error('Erreur POST /api/branches:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la branche.' });
    }
  });

  /**
   * PUT /api/branches/:id
   * Met à jour une branche
   */
  app.put('/api/branches/:id', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID de branche requis.' });
      }

      await updateBranch(id, updates);
      const updatedBranch = await getBranchById(id);

      return res.json({ success: true, branch: updatedBranch });
    } catch (error: any) {
      console.error('Erreur PUT /api/branches/:id:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la branche.' });
    }
  });

  /**
   * DELETE /api/branches/:id
   * Supprime une branche (soft delete)
   */
  app.delete('/api/branches/:id', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de branche requis.' });
      }

      await deleteBranch(id);
      return res.json({ success: true, message: 'Branche supprimée avec succès.' });
    } catch (error: any) {
      console.error('Erreur DELETE /api/branches/:id:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la branche.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ GESTION DES UTILISATEURS STAFF ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/users/staff
   * Liste tous les comptes staff (chef_point, admin, super_admin)
   */
  app.get('/api/users/staff', async (req: express.Request, res: express.Response) => {
    try {
      const staffMembers = await getStaffAccounts();
      return res.json({ success: true, staffMembers });
    } catch (error: any) {
      console.error('Erreur GET /api/users/staff:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des staff.' });
    }
  });

  /**
   * POST /api/users/staff
   * Crée un nouveau compte staff
   */
  app.post('/api/users/staff', async (req: express.Request, res: express.Response) => {
    try {
      const { email, password, displayName, phone, role, branchId } = req.body;

      if (!email || !password || !displayName || !phone || !role) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
      }

      if (role === 'chef_point' && !branchId) {
        return res.status(400).json({ error: 'Un chef_point doit être assigné à une branche.' });
      }

      const newStaff = await registerStaffUser(email, password, displayName, phone, role, branchId);

      return res.status(201).json({ success: true, staff: newStaff });
    } catch (error: any) {
      console.error('Erreur POST /api/users/staff:', error);
      return res.status(500).json({ error: error.message || 'Erreur lors de la création du compte staff.' });
    }
  });

  /**
   * PUT /api/users/:id/profile
   * Met à jour le profil d'un utilisateur
   */
  app.put('/api/users/:id/profile', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID utilisateur requis.' });
      }

      await updateUserProfile(id, updates);
      const updatedProfile = await getUserProfile(id);

      return res.json({ success: true, user: updatedProfile });
    } catch (error: any) {
      console.error('Erreur PUT /api/users/:id/profile:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
    }
  });

  /**
   * PUT /api/users/:id/deactivate
   * Désactive un compte utilisateur
   */
  app.put('/api/users/:id/deactivate', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID utilisateur requis.' });
      }

      await deactivateUser(id);
      return res.json({ success: true, message: 'Compte désactivé avec succès.' });
    } catch (error: any) {
      console.error('Erreur PUT /api/users/:id/deactivate:', error);
      return res.status(500).json({ error: 'Erreur lors de la désactivation.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ GESTION DES COMMANDES ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/orders
   * Liste les commandes avec filtres optionnels
   * Query params: status, branchId, clientId, isManualOrder, paymentStatus
   */
  app.get('/api/orders', async (req: express.Request, res: express.Response) => {
    try {
      const { status, branchId, clientId, isManualOrder, paymentStatus } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (branchId) filters.branchId = branchId as string;
      if (clientId) filters.clientId = clientId as string;
      if (isManualOrder !== undefined) filters.isManualOrder = isManualOrder === 'true';
      if (paymentStatus) filters.paymentStatus = paymentStatus as 'paid' | 'pending';

      const orders = await getAllOrders(filters);
      return res.json({ success: true, orders });
    } catch (error: any) {
      console.error('Erreur GET /api/orders:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
    }
  });

  /**
   * POST /api/orders/manual
   * Crée une commande manuelle (par staff)
   */
  app.post('/api/orders/manual', async (req: express.Request, res: express.Response) => {
    try {
      const {
        walkInClientName,
        walkInClientPhone,
        walkInClientCompany,
        assignedBranchId,
        serviceType,
        description,
        dimensions,
        quantity,
        manualOrderNote,
        amount,
        staffUid,
        staffName,
        branchName
      } = req.body;

      if (!walkInClientName || !assignedBranchId || !serviceType || !staffUid || !staffName) {
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });
      }

      const orderId = await createManualOrder(
        {
          serviceType: serviceType as any,
          description,
          dimensions: dimensions || { width: 0, height: 0, unit: 'cm' },
          quantity: quantity || 1,
          walkInClientName,
          walkInClientPhone,
          walkInClientCompany,
          manualOrderNote,
          amount
        },
        {
          uid: staffUid,
          name: staffName,
          branchId: assignedBranchId,
          branchName: branchName || 'Branche'
        }
      );

      return res.status(201).json({ success: true, orderId });
    } catch (error: any) {
      console.error('Erreur POST /api/orders/manual:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la commande manuelle.' });
    }
  });

  /**
   * PUT /api/orders/:id/status
   * Met à jour le statut d'une commande
   */
  app.put('/api/orders/:id/status', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'ID commande et statut requis.' });
      }

      await updateOrder(id, { status, adminNotes });
      const updatedOrder = await getOrderById(id);

      return res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error('Erreur PUT /api/orders/:id/status:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
    }
  });

  /**
   * PUT /api/orders/:id/payment-validate
   * Valide le paiement d'une commande
   */
  app.put('/api/orders/:id/payment-validate', async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { staffUid, staffName } = req.body;

      if (!id || !staffUid || !staffName) {
        return res.status(400).json({ error: 'ID commande, staffUid et staffName requis.' });
      }

      await validateOrderPayment(id, staffUid, staffName);
      const updatedOrder = await getOrderById(id);

      return res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error('Erreur PUT /api/orders/:id/payment-validate:', error);
      return res.status(500).json({ error: 'Erreur lors de la validation du paiement.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ NOTIFICATIONS ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/notifications/broadcast-role
   * Envoie une notification à tous les utilisateurs d'un rôle
   */
  app.post('/api/notifications/broadcast-role', async (req: express.Request, res: express.Response) => {
    try {
      const { role, type, title, message, orderId } = req.body;

      if (!role || !type || !title || !message) {
        return res.status(400).json({ error: 'Rôle, type, titre et message requis.' });
      }

      await createNotificationForRole(role, { type, title, message, orderId });

      return res.json({ success: true, message: 'Notifications envoyées.' });
    } catch (error: any) {
      console.error('Erreur POST /api/notifications/broadcast-role:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications.' });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ★ RAPPORTS ★
  // ════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/reports/orders
   * Génère un rapport des commandes pour une période
   * Query params: branchId, startDate, endDate
   */
  app.get('/api/reports/orders', async (req: express.Request, res: express.Response) => {
    try {
      const { branchId = 'all', startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate et endDate requis.' });
      }

      const report = await generateReport(
        branchId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return res.json({ success: true, report });
    } catch (error: any) {
      console.error('Erreur GET /api/reports/orders:', error);
      return res.status(500).json({ error: 'Erreur lors de la génération du rapport.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Serveur full-stack lancé 🎉');
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Réseau:  http://0.0.0.0:${PORT}`);
    console.log(`- API:      http://localhost:${PORT}/api`);
  });
}

startServer();
