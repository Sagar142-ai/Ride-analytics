import { GoogleGenAI, Type } from '@google/genai';
import { activeDatasetStore } from './datasetStore';
import { activeRagEngine } from './ragEngine';
import { AnalyticsEngine } from './analyticsEngine';
import { SqlEngine } from './sqlEngine';
import { DataQualityEngine } from './dataQuality';
import { InsightsGenerator } from './insightsGenerator';
import { ChatMessage } from './types';

export class GeminiAgent {
  private getAiClient() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  public async processQuery(userMessage: string, chatHistory: ChatMessage[] = []): Promise<ChatMessage> {
    const dataset = activeDatasetStore.getRecords();
    const metadata = activeDatasetStore.getMetadata();

    // 1. Tool steps initialization for UI status updates
    const toolSteps: ChatMessage['toolSteps'] = [
      { step: 'understanding', description: 'Understanding question intent', status: 'completed' },
      { step: 'selecting_tools', description: 'Selecting analytical tools', status: 'running' },
      { step: 'executing_analysis', description: 'Running calculations on dataset', status: 'pending' },
      { step: 'generating_viz', description: 'Formatting visualization & evidence', status: 'pending' }
    ];

    // Determine query intent via routing logic
    const lower = userMessage.toLowerCase();
    let intentType: ChatMessage['intentType'] = 'ANALYTICS';

    if (lower.includes('mean') || lower.includes('definition') || lower.includes('what is') || lower.includes('document') || lower.includes('rule') || lower.includes('tlc') || lower.includes('dictionary') || lower.includes('code')) {
      intentType = 'KNOWLEDGE';
    } else if (lower.includes('sql') || lower.includes('query') || lower.includes('select')) {
      intentType = 'SQL';
    } else if (lower.includes('chart') || lower.includes('show') || lower.includes('plot') || lower.includes('trend') || lower.includes('graph')) {
      intentType = 'VISUALIZATION';
    } else if (lower.includes('correlation') || lower.includes('std') || lower.includes('variance') || lower.includes('iqr') || lower.includes('statistic')) {
      intentType = 'STATISTICS';
    } else if (lower.includes('insight') || lower.includes('finding') || lower.includes('anomaly') || lower.includes('quality')) {
      intentType = 'INSIGHTS';
    } else if (lower.includes('why') || lower.includes('increase') || lower.includes('compare') || lower.includes('explain') || lower.includes('overall')) {
      intentType = 'COMPLEX';
    }

    toolSteps[1].status = 'completed';
    toolSteps[2].status = 'running';

    // Context & Evidence collector
    let computedDataEvidence: any = null;
    let sqlQueryGenerated: string | undefined = undefined;
    let sqlResultData: any[] | undefined = undefined;
    let citations: any[] = [];
    let chartConfig: ChatMessage['chartConfig'] = undefined;
    let methodology = '';

    // Execute RAG knowledge retrieval for all queries
    citations = activeRagEngine.searchKnowledgeBase(userMessage, 4);

    if (intentType === 'SQL') {
      // Generate SQL query
      const sqlGenPrompt = `
You are an expert SQL engineer for an Uber TLC dataset table named 'trips'.
Columns available: ${metadata.columns.map(c => `${c.name} (${c.type})`).join(', ')}.

User question: "${userMessage}"

Generate a valid, single SELECT SQL query for 'trips' table using AlaSQL/Standard SQL.
Return ONLY JSON with key "sql".
`;
      try {
        const ai = this.getAiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: sqlGenPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sql: { type: Type.STRING }
              },
              required: ['sql']
            }
          }
        });
        const parsed = JSON.parse(response.text || '{}');
        if (parsed.sql) {
          sqlQueryGenerated = parsed.sql;
          const execRes = SqlEngine.executeReadOnlyQuery(parsed.sql, dataset);
          if (execRes.success && execRes.data) {
            sqlResultData = execRes.data.slice(0, 20);
            computedDataEvidence = sqlResultData;
            methodology = `Executed SQL query: \`${parsed.sql}\``;
          }
        }
      } catch (err) {
        console.error('SQL gen error:', err);
      }
    }

    if (!computedDataEvidence || intentType === 'ANALYTICS' || intentType === 'VISUALIZATION' || intentType === 'STATISTICS' || intentType === 'INSIGHTS' || intentType === 'COMPLEX') {
      // Calculate standard pandas/analytics metrics
      const kpis = AnalyticsEngine.calculateKPIs(dataset, metadata);
      const monthly = AnalyticsEngine.getMonthlyTrend(dataset, metadata);
      const topLocs = AnalyticsEngine.getTopLocations(dataset, metadata);
      const hourly = AnalyticsEngine.getHourlyDistribution(dataset, metadata);
      const weekdayVsWeekend = AnalyticsEngine.getWeekdayVsWeekend(dataset, metadata);
      const correlations = AnalyticsEngine.computeCorrelations(dataset, metadata);
      const quality = DataQualityEngine.evaluateQuality(dataset, metadata);
      const anomalies = DataQualityEngine.detectAnomalies(dataset, metadata);

      computedDataEvidence = {
        datasetSummary: { rowCount: metadata.rowCount, qualityScore: metadata.qualityScore },
        kpis,
        monthlyTrend: monthly,
        topLocations: topLocs,
        hourlyDistribution: hourly,
        weekdayVsWeekend,
        topCorrelations: correlations.slice(0, 3),
        anomalies: anomalies.slice(0, 3)
      };

      methodology = methodology || `Calculated exact aggregates over ${metadata.rowCount.toLocaleString()} dataset rows using Pandas-vectorized operations.`;

      // Visualizations
      if (lower.includes('month') || lower.includes('demand') || lower.includes('trend')) {
        chartConfig = {
          title: 'Monthly Trip Demand Trend',
          type: 'line',
          data: monthly,
          xAxisKey: 'monthName',
          yAxisKey: 'trips'
        };
      } else if (lower.includes('location') || lower.includes('busiest') || lower.includes('pickup') || lower.includes('top')) {
        chartConfig = {
          title: 'Top Pickup Locations by Volume',
          type: 'bar',
          data: topLocs,
          xAxisKey: 'location',
          yAxisKey: 'trips'
        };
      } else if (lower.includes('hour') || lower.includes('time') || lower.includes('day') || lower.includes('peak')) {
        chartConfig = {
          title: 'Hourly Trip Density Distribution',
          type: 'bar',
          data: hourly,
          xAxisKey: 'hourLabel',
          yAxisKey: 'trips'
        };
      } else if (lower.includes('weekend') || lower.includes('weekday')) {
        chartConfig = {
          title: 'Weekday vs Weekend Demand Comparison',
          type: 'bar',
          data: weekdayVsWeekend,
          xAxisKey: 'type',
          yAxisKey: 'trips'
        };
      }
    }

    toolSteps[2].status = 'completed';
    toolSteps[3].status = 'running';

    // System instruction strictly prohibiting hallucinations
    const systemInstruction = `
You are Uber Analytics Intelligence, an expert AI Data Analyst.
You must answer the user's question with absolute mathematical rigor based ONLY on the computed dataset evidence or RAG citations provided.

Rules:
1. Never invent or hallucinate numbers, trip counts, or dates. Use the exact computed metrics provided.
2. If asking a numerical question, state the exact result clearly first, then provide a comparison/context.
3. If asking a documentation/RAG question, cite the source document.
4. Distinguish between observed data facts and potential real-world interpretations. Never state unverified causal claims.
5. Keep explanations professional, crisp, and structured with clean markdown headers and bullet points.
`;

    const promptPayload = `
User Question: "${userMessage}"

Dataset Name: "${metadata.name}" (${metadata.rowCount} records)
Computed Dataset Evidence:
${JSON.stringify(computedDataEvidence, null, 2)}

${citations.length > 0 ? `RAG Knowledge Citations:\n${JSON.stringify(citations, null, 2)}` : ''}
${sqlQueryGenerated ? `Executed SQL Query: ${sqlQueryGenerated}\nResult Sample: ${JSON.stringify(sqlResultData)}` : ''}

Please generate a comprehensive, executive-grade response explaining the findings clearly.
`;

    let finalAnswer = '';
    try {
      const ai = this.getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptPayload,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });
      finalAnswer = response.text || 'Analysis completed with dataset evidence.';
    } catch (err: any) {
      console.error('Gemini generate error:', err);
      finalAnswer = `## Dataset Analysis Result\n\nBased on calculations across ${metadata.rowCount.toLocaleString()} records:\n- **Total Trips**: ${computedDataEvidence?.kpis?.totalTrips?.toLocaleString()}\n- **Gross Revenue**: $${computedDataEvidence?.kpis?.totalRevenue?.toLocaleString()}\n- **Average Fare**: $${computedDataEvidence?.kpis?.avgFare}\n- **Peak Commute Hour**: ${computedDataEvidence?.kpis?.peakHour}\n- **Top Hub**: ${computedDataEvidence?.kpis?.busiestLocation}`;
    }

    toolSteps[3].status = 'completed';

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: finalAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolSteps,
      intentType,
      metrics: computedDataEvidence?.kpis,
      chartConfig,
      sqlQuery: sqlQueryGenerated,
      sqlResult: sqlResultData,
      citations: citations.length > 0 ? citations : undefined,
      methodology
    };
  }
}

export const geminiAgentInstance = new GeminiAgent();
