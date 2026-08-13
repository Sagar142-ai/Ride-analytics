import express from 'express';
import path from 'path';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { activeDatasetStore } from './server/datasetStore';
import { DataQualityEngine } from './server/dataQuality';
import { AnalyticsEngine } from './server/analyticsEngine';
import { InsightsGenerator } from './server/insightsGenerator';
import { SqlEngine } from './server/sqlEngine';
import { activeRagEngine } from './server/ragEngine';
import { geminiAgentInstance } from './server/geminiAgent';

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes FIRST

  // 1. Health check & App Config
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Ride Analytics Dashboard AI Agent' });
  });

  app.get('/api/config', (req, res) => {
    const appUrl = process.env.APP_URL || 'https://ais-dev-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app';
    res.json({
      appUrl,
      devUrl: 'https://ais-dev-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app',
      sharedUrl: 'https://ais-pre-cps2vthuvk4cikmgobbr57-692365029299.asia-southeast1.run.app'
    });
  });

  // 2. Dataset profile & KPIs
  app.get('/api/dataset/profile', (req, res) => {
    const metadata = activeDatasetStore.getMetadata();
    res.json(metadata);
  });

  app.get('/api/dataset/kpis', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const kpis = AnalyticsEngine.calculateKPIs(records, metadata);
    res.json(kpis);
  });

  app.get('/api/dataset/charts', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const monthly = AnalyticsEngine.getMonthlyTrend(records, metadata);
    const topLocations = AnalyticsEngine.getTopLocations(records, metadata, 5);
    const hourly = AnalyticsEngine.getHourlyDistribution(records, metadata);

    res.json({
      monthly: monthly.map(m => ({
        month: m.monthName,
        trips: m.trips,
        revenue: m.revenue,
        x: m.monthName,
        y: m.trips
      })),
      topLocations: topLocations.map(l => ({
        name: l.location,
        location: l.location,
        count: l.trips,
        trips: l.trips,
        revenue: l.revenue,
        x: l.location,
        y: l.trips
      })),
      hourly: hourly.map(h => ({
        hour: h.hourLabel,
        count: h.trips,
        trips: h.trips,
        avgFare: h.avgFare,
        x: h.hourLabel,
        y: h.trips
      }))
    });
  });

  app.get('/api/report', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const report = InsightsGenerator.generateFullReport(records, metadata);
    res.json(report);
  });

  // 3. Dataset upload (CSV / XLSX)
  app.post('/api/dataset/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const filename = req.file.originalname;
      const isXlsx = filename.endsWith('.xlsx') || filename.endsWith('.xls');
      let records: any[] = [];

      if (isXlsx) {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheet = workbook.SheetNames[0];
        records = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      } else {
        const csvText = req.file.buffer.toString('utf8');
        const parseRes = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
        records = parseRes.data as any[];
      }

      if (!records || records.length === 0) {
        return res.status(400).json({ error: 'Uploaded file contained no valid data rows.' });
      }

      activeDatasetStore.setDataset(filename, records, false);
      const metadata = activeDatasetStore.getMetadata();

      res.json({
        message: 'Dataset uploaded and profiled successfully.',
        metadata
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message || 'Failed to process dataset file.' });
    }
  });

  // 4. Data Quality Report & Auto-Remediation
  app.get('/api/dataset/quality', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const report = DataQualityEngine.evaluateQuality(records, metadata);
    res.json(report);
  });

  app.post('/api/dataset/clean', (req, res) => {
    try {
      const records = activeDatasetStore.getRecords();
      let remediatedCount = 0;

      const cleanedRecords = records.map((row: any) => {
        let modified = false;
        const newRow = { ...row };

        // Fix negative fare amounts
        if (typeof newRow.fare_amount === 'number' && newRow.fare_amount < 0) {
          newRow.fare_amount = Math.abs(newRow.fare_amount);
          modified = true;
        }
        if (typeof newRow.total_amount === 'number' && newRow.total_amount < 0) {
          newRow.total_amount = Math.abs(newRow.total_amount);
          modified = true;
        }
        if (typeof newRow.tip_amount === 'number' && newRow.tip_amount < 0) {
          newRow.tip_amount = Math.abs(newRow.tip_amount);
          modified = true;
        }

        // Fix invalid passenger count
        if (typeof newRow.passenger_count === 'number' && newRow.passenger_count <= 0) {
          newRow.passenger_count = 1;
          modified = true;
        }

        // Fix negative trip distance
        if (typeof newRow.trip_distance === 'number' && newRow.trip_distance < 0) {
          newRow.trip_distance = Math.abs(newRow.trip_distance);
          modified = true;
        }

        if (modified) remediatedCount++;
        return newRow;
      });

      const currentMetadata = activeDatasetStore.getMetadata();
      activeDatasetStore.setDataset(currentMetadata.name, cleanedRecords, currentMetadata.isDemo);
      const newMetadata = activeDatasetStore.getMetadata();
      const newReport = DataQualityEngine.evaluateQuality(cleanedRecords, newMetadata);

      res.json({
        message: 'Dataset anomalies remediated successfully.',
        remediatedCount,
        newQualityScore: newReport.score,
        newReport
      });
    } catch (err: any) {
      console.error('Clean dataset error:', err);
      res.status(500).json({ error: 'Failed to remediate dataset anomalies.' });
    }
  });

  // 5. Paginated Dataset Explorer
  app.get('/api/dataset/records', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = (req.query.search as string || '').toLowerCase();
    const sortBy = req.query.sortBy as string || '';
    const sortOrder = req.query.sortOrder as string || 'asc';

    let filtered = records;
    if (search) {
      filtered = records.filter(r => 
        Object.values(r).some(v => String(v).toLowerCase().includes(search))
      );
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }

    const startIndex = (page - 1) * limit;
    const paginatedRecords = filtered.slice(startIndex, startIndex + limit);

    res.json({
      records: paginatedRecords,
      totalCount: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    });
  });

  // 6. Anomalies API
  app.get('/api/dataset/anomalies', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const anomalies = DataQualityEngine.detectAnomalies(records, metadata);
    res.json(anomalies);
  });

  // 7. Automated AI Insights
  app.get('/api/dataset/insights', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const insights = InsightsGenerator.generateInsights(records, metadata);
    res.json(insights);
  });

  // 8. SQL Query Execution
  app.post('/api/sql/execute', (req, res) => {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL query parameter is required.' });

    const records = activeDatasetStore.getRecords();
    const result = SqlEngine.executeReadOnlyQuery(sql, records);
    res.json(result);
  });

  // 9. AI Analyst Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) return res.status(400).json({ error: 'Message content is required.' });

      const response = await geminiAgentInstance.processQuery(message, history || []);
      res.json(response);
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({ error: err.message || 'AI agent processing failed.' });
    }
  });

  // 10. RAG Documents Endpoints
  app.get('/api/rag/documents', (req, res) => {
    const documents = activeRagEngine.getDocuments();
    const chunkCount = activeRagEngine.getChunksCount();
    res.json({ documents, totalChunks: chunkCount, status: 'Ready' });
  });

  app.post('/api/rag/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No document file uploaded.' });

      const filename = req.file.originalname;
      const content = req.file.buffer.toString('utf8');
      const doc = activeRagEngine.uploadDocument(filename, filename, content, 'general');

      res.json({ message: 'Document indexed successfully.', document: doc });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upload document to RAG.' });
    }
  });

  app.delete('/api/rag/documents/:id', (req, res) => {
    const { id } = req.params;
    const deleted = activeRagEngine.deleteDocument(id);
    if (deleted) res.json({ message: 'Document removed from vector knowledge base.' });
    else res.status(404).json({ error: 'Document not found.' });
  });

  // 11. Full Analytical Report Generation
  app.get('/api/reports/generate', (req, res) => {
    const records = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();
    const report = InsightsGenerator.generateFullReport(records, metadata);
    res.json(report);
  });

  // Reset to Demo Dataset
  const handleReset = (req: express.Request, res: express.Response) => {
    activeDatasetStore.loadSyntheticDataset();
    const metadata = activeDatasetStore.getMetadata();
    res.json({ message: 'Reset to standard Uber TLC demo dataset.', metadata });
  };
  app.post('/api/dataset/reset', handleReset);
  app.post('/api/dataset/reset-demo', handleReset);

  // Vite Middleware handling for Development & Static serving in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
