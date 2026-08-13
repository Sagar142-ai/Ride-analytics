import { RagDocument, RagChunk, SearchCitation } from './types';

// Default pre-populated Uber & Kaggle Dataset Knowledge Base
const DEFAULT_DOCUMENTS: { doc: RagDocument; content: string }[] = [
  {
    doc: {
      id: 'doc-uber-dict-01',
      filename: 'uber_data_dictionary.pdf',
      title: 'Uber TLC Ride-Hailing Data Dictionary',
      chunkCount: 8,
      uploadedAt: new Date().toISOString(),
      fileSize: 14200,
      type: 'data_dictionary'
    },
    content: `
# Uber TLC Ride-Hailing Data Dictionary & Technical Documentation

## 1. Pickup Datetime (pickup_datetime)
The date and time when the meter was engaged or when the passenger pickup was initiated. Represented in UTC or EST timezone in YYYY-MM-DD HH:MM:SS format.

## 2. Dispatch Base Code (dispatch_base_code)
The TLC (Taxi & Limousine Commission) base license number that dispatched the trip. Common NYC Uber bases include:
- B02512: Unter LLC (Uber Black & UberX)
- B02598: Hinter LLC (UberX & UberXL)
- B02617: Weiter LLC (Uber Pool & UberX)
- B02682: Schmecken LLC (Uber SUV)
- B02764: Weiter LLC (Uber Select & Comfort)

## 3. Pickup Location & Dropoff Location
Geographical location names or TLC zone identifiers representing pickup and dropoff points. Popular high-volume NYC hubs include Midtown Manhattan, JFK Airport, LaGuardia Airport, Financial District, Williamsburg, and SoHo.

## 4. Fare Amount & Total Amount Calculation
- Base Fare: Initial flag drop fare charged at the start of the trip.
- Distance Rate: $2.85 per mile in Metropolitan NYC zone.
- Surge Multiplier: Dynamic pricing factor (e.g., 1.2x to 2.5x) applied during high-demand hours or severe weather.
- Total Amount: Computed as (Fare Amount + Tip Amount + $2.75 TLC Surcharge & Congestion Fee).

## 5. Surge Multiplier Policy
Surge pricing automatically activates when ride requests significantly exceed available driver supply in a specific geographic hexagon zone. Surge multipliers scale from 1.0x (normal) up to 3.5x or higher during severe storms or major events.
`
  },
  {
    doc: {
      id: 'doc-kaggle-rules-02',
      filename: 'kaggle_uber_dataset_overview.txt',
      title: 'Kaggle NYC Uber Trips Dataset Overview & Methodology',
      chunkCount: 5,
      uploadedAt: new Date().toISOString(),
      fileSize: 9800,
      type: 'dataset_doc'
    },
    content: `
# Kaggle NYC Uber Trips Dataset Guide

## Dataset Background
This dataset contains data on over 4.5 million Uber pickups in New York City from January to June 2014, and 14.3 million Uber pickups from January to June 2015. Updated releases cover 2020-2026 TLC ride-hailing records.

## Key Analytical Use Cases
1. Demand Forecasting: Identifying peak pickup hours (typically 7 AM - 9 AM and 5 PM - 8 PM on weekdays).
2. Spatial Heatmaps: Analyzing pickup density across Manhattan vs Outer Boroughs vs Airports.
3. Surge Sensitivity Analysis: Evaluating how surge pricing impacts customer demand and driver earnings.
4. Seasonality: Observing trip demand acceleration in early summer (June) driven by tourism and outdoor activities.

## Data Quality & Cleaning Notes
- Missing Dropoff Locations: Early Uber API records only logged pickup locations for passenger privacy.
- Negative Fares: Represent administrative refunds, promotional credits, or cancelled trip adjustments.
- Outlier Distances: Trips over 100 miles usually represent out-of-state highway trips (e.g. NYC to Philadelphia or Hamptons).
`
  }
];

export class RagEngine {
  private documents: Map<string, RagDocument> = new Map();
  private chunks: RagChunk[] = [];

  constructor() {
    this.initializeDefaultKnowledge();
  }

  private initializeDefaultKnowledge() {
    DEFAULT_DOCUMENTS.forEach(item => {
      this.documents.set(item.doc.id, item.doc);
      this.ingestContent(item.doc.id, item.doc.filename, item.content);
    });
  }

  public getDocuments(): RagDocument[] {
    return Array.from(this.documents.values());
  }

  public getChunksCount(): number {
    return this.chunks.length;
  }

  public uploadDocument(title: string, filename: string, content: string, type: RagDocument['type'] = 'general'): RagDocument {
    const id = `doc-${Date.now()}`;
    const doc: RagDocument = {
      id,
      filename,
      title,
      chunkCount: 0,
      uploadedAt: new Date().toISOString(),
      fileSize: content.length,
      type
    };

    const newChunks = this.ingestContent(id, filename, content);
    doc.chunkCount = newChunks.length;
    this.documents.set(id, doc);
    return doc;
  }

  public deleteDocument(id: string): boolean {
    if (this.documents.has(id)) {
      this.documents.delete(id);
      this.chunks = this.chunks.filter(c => c.documentId !== id);
      return true;
    }
    return false;
  }

  private ingestContent(docId: string, filename: string, content: string): RagChunk[] {
    const sections = content.split(/\n#{1,3}\s+/);
    const addedChunks: RagChunk[] = [];

    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');
      const sectionTitle = lines[0].replace(/^#+\s*/, '').trim();

      // Chunk long text
      const maxChunkLength = 400;
      if (trimmed.length <= maxChunkLength) {
        const chunk: RagChunk = {
          id: `chunk-${docId}-${idx}-0`,
          documentId: docId,
          documentName: filename,
          section: sectionTitle,
          page: Math.floor(idx / 3) + 1,
          content: trimmed
        };
        addedChunks.push(chunk);
        this.chunks.push(chunk);
      } else {
        const words = trimmed.split(' ');
        let currentChunk = '';
        let chunkSubIdx = 0;

        for (const w of words) {
          if ((currentChunk + ' ' + w).length > maxChunkLength) {
            const chunk: RagChunk = {
              id: `chunk-${docId}-${idx}-${chunkSubIdx}`,
              documentId: docId,
              documentName: filename,
              section: sectionTitle,
              page: Math.floor(idx / 3) + 1,
              content: currentChunk.trim()
            };
            addedChunks.push(chunk);
            this.chunks.push(chunk);
            currentChunk = w;
            chunkSubIdx++;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + w;
          }
        }
        if (currentChunk.trim()) {
          const chunk: RagChunk = {
            id: `chunk-${docId}-${idx}-${chunkSubIdx}`,
            documentId: docId,
            documentName: filename,
            section: sectionTitle,
            page: Math.floor(idx / 3) + 1,
            content: currentChunk.trim()
          };
          addedChunks.push(chunk);
          this.chunks.push(chunk);
        }
      }
    });

    return addedChunks;
  }

  public searchKnowledgeBase(query: string, topK = 3): SearchCitation[] {
    if (!query || this.chunks.length === 0) return [];

    const rawLower = query.toLowerCase();
    // Clean query words (length > 1)
    const keywords = rawLower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length > 1);

    if (keywords.length === 0) {
      // Fallback: Return top default chunks
      return this.chunks.slice(0, topK).map(chunk => ({
        documentName: chunk.documentName,
        section: chunk.section || 'General Overview',
        snippet: chunk.content.substring(0, 300) + (chunk.content.length > 300 ? '...' : ''),
        relevanceScore: 0.85
      }));
    }

    const scored = this.chunks.map(chunk => {
      const text = (chunk.content + ' ' + (chunk.section || '') + ' ' + chunk.documentName).toLowerCase();
      let matchScore = 0;

      keywords.forEach(kw => {
        if (text.includes(kw)) matchScore += 3;

        // Substring / prefix matching
        if (kw.length >= 3) {
          const prefix = kw.substring(0, Math.min(4, kw.length));
          if (text.includes(prefix)) matchScore += 1;
        }

        // Exact boundary match
        try {
          const regex = new RegExp(`\\b${kw}\\b`, 'gi');
          const matches = text.match(regex);
          if (matches) matchScore += matches.length * 4;
        } catch {
          // ignore regex errors
        }
      });

      // Section title bonus match
      if (chunk.section) {
        const secLower = chunk.section.toLowerCase();
        keywords.forEach(kw => {
          if (secLower.includes(kw)) matchScore += 5;
        });
      }

      return {
        chunk,
        score: matchScore
      };
    });

    // Sort by score
    const sorted = scored.sort((a, b) => b.score - a.score);

    // Pick top K matches (if highest score is 0, still return top relevant chunks with lower baseline score)
    const topMatches = sorted.slice(0, topK);

    return topMatches.map((item, idx) => {
      let relScore = item.score > 0 
        ? Math.min(0.99, Number((0.70 + item.score * 0.04).toFixed(2)))
        : Math.max(0.60, Number((0.75 - idx * 0.05).toFixed(2)));

      return {
        documentName: item.chunk.documentName,
        section: item.chunk.section || 'General',
        snippet: item.chunk.content.substring(0, 350) + (item.chunk.content.length > 350 ? '...' : ''),
        relevanceScore: relScore
      };
    });
  }
}

export const activeRagEngine = new RagEngine();
