import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase Admin
let adminApp;
try {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
  } else {
    adminApp = getApp();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/owner/data", async (req, res) => {
    const { password, collection: collectionName } = req.body;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!['quotations', 'test_drives', 'reviews'].includes(collectionName)) {
      return res.status(400).json({ error: "Invalid collection" });
    }

    try {
      const snapshot = await db.collection(collectionName).orderBy('createdAt', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/owner/data/:collection/:id", async (req, res) => {
    const { password } = req.body;
    const { collection: collectionName, id } = req.params;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await db.collection(collectionName).doc(id).delete();
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting ${id} from ${collectionName}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/owner/update/:collection/:id", async (req, res) => {
    const { password, data } = req.body;
    const { collection: collectionName, id } = req.params;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await db.collection(collectionName).doc(id).update(data);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error updating ${id} in ${collectionName}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
