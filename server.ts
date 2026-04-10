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
if (getApps().length === 0) {
  // Use the project ID from the config if available, otherwise let it pick up from environment
  const initOptions: any = {};
  if (firebaseConfig.projectId) {
    initOptions.projectId = firebaseConfig.projectId;
  }
  initializeApp(initOptions);
}

const adminApp = getApp();
console.log(`Admin SDK initialized for project: ${adminApp.options.projectId || 'default-project'}`);

// Try to initialize Firestore with the named database, fallback to (default) if it fails
let db: any;
let currentDbId = firebaseConfig.firestoreDatabaseId || '(default)';

function initializeFirestore(databaseId: string) {
  try {
    console.log(`Attempting to initialize Firestore with database ID: ${databaseId}`);
    return getFirestore(adminApp, databaseId);
  } catch (error) {
    console.error(`Failed to initialize Firestore with database ID ${databaseId}:`, error);
    return getFirestore(adminApp);
  }
}

db = initializeFirestore(currentDbId);

// Helper to execute Firestore operations with automatic fallback
async function executeFirestore<T>(operation: (database: any) => Promise<T>): Promise<T> {
  try {
    return await operation(db);
  } catch (error: any) {
    // If NOT_FOUND (5) or PERMISSION_DENIED (7), try fallback to (default)
    const isNotFoundError = error.message && (error.message.includes('NOT_FOUND') || error.message.includes('5'));
    const isPermissionError = error.message && (error.message.includes('PERMISSION_DENIED') || error.message.includes('7'));
    
    if ((isNotFoundError || isPermissionError) && currentDbId !== '(default)') {
      console.error(`Dynamic fallback to (default) due to error: ${error.message}`);
      try {
        const fallbackDb = getFirestore(adminApp, '(default)');
        const result = await operation(fallbackDb);
        
        // Update global state for future requests
        db = fallbackDb;
        currentDbId = '(default)';
        console.log("Fallback to (default) successful. Global db instance updated.");
        return result;
      } catch (fallbackError: any) {
        console.error("Fallback to (default) also failed:", fallbackError.message);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// Test Firestore connection and handle potential PERMISSION_DENIED or NOT_FOUND errors
async function testFirestore() {
  try {
    // We try a simple read to verify permissions
    console.log(`Testing Firestore connection to database: ${currentDbId}...`);
    await executeFirestore(async (database) => {
      const snapshot = await database.collection('vehicles').limit(1).get();
      console.log(`Firestore connection successful. Found ${snapshot.size} vehicles.`);
    });
  } catch (error: any) {
    console.error(`Firestore connection test failed:`, error.message);
  }
}
async function startServer() {
  // Test Firestore connection and handle potential PERMISSION_DENIED errors before starting
  await testFirestore();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      projectId: adminApp.options.projectId,
      databaseId: currentDbId,
      currentDbId: db.id || '(default)',
      time: new Date().toISOString()
    });
  });

  app.get("/api/owner/status", async (req, res) => {
    try {
      const snapshot: any = await executeFirestore(database => database.collection('vehicles').limit(1).get());
      res.json({ 
        status: "connected", 
        databaseId: currentDbId,
        vehicleCount: snapshot.size
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: "error", 
        message: error.message,
        databaseId: currentDbId
      });
    }
  });

  app.post("/api/owner/data", async (req, res) => {
    const { password, collection: collectionName, data } = req.body;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!['quotations', 'test_drives', 'reviews', 'vehicles'].includes(collectionName)) {
      return res.status(400).json({ error: "Invalid collection" });
    }

    try {
      if (data) {
        // Add data if provided
        console.log(`Adding data to ${collectionName} in database ${currentDbId}:`, data);
        const docRef: any = await executeFirestore(database => 
          database.collection(collectionName).add({
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          })
        );
        return res.json({ id: docRef.id, success: true });
      } else {
        // Fetch data if no data provided
        console.log(`Fetching data from ${collectionName} in database ${currentDbId}`);
        const snapshot: any = await executeFirestore(database => 
          database.collection(collectionName).orderBy('createdAt', 'desc').get()
        );
        const result = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        return res.json(result);
      }
    } catch (error: any) {
      console.error(`Error processing ${collectionName} in database ${currentDbId}:`, error);
      res.status(500).json({ error: error.message || "Internal server error", databaseId: currentDbId });
    }
  });

  app.delete("/api/owner/data/:collection/:id", async (req, res) => {
    const { password: bodyPassword } = req.body || {};
    const { password: queryPassword } = req.query;
    const password = bodyPassword || queryPassword;
    const { collection: collectionName, id } = req.params;

    console.log(`DELETE request for ${collectionName}/${id}`);

    if (password !== '2122011') {
      console.warn("Unauthorized DELETE attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      console.log(`Attempting to delete document ${id} from collection ${collectionName} in database: ${currentDbId}`);
      await executeFirestore(database => database.collection(collectionName).doc(id).delete());
      console.log(`Successfully deleted ${id} from ${collectionName}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting ${id} from ${collectionName}:`, error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.patch("/api/owner/data/:collection/:id", async (req, res) => {
    const { password: bodyPassword, status } = req.body || {};
    const { password: queryPassword } = req.query;
    const password = bodyPassword || queryPassword;
    const { collection: collectionName, id } = req.params;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await executeFirestore(database => database.collection(collectionName).doc(id).update({ status }));
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error updating ${id} in ${collectionName}:`, error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/owner/update/:collection/:id", async (req, res) => {
    const { password, data } = req.body;
    const { collection: collectionName, id } = req.params;

    if (password !== '2122011') {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await executeFirestore(database => database.collection(collectionName).doc(id).update(data));
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error updating ${id} in ${collectionName}:`, error);
      res.status(500).json({ error: error.message || "Internal server error" });
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
