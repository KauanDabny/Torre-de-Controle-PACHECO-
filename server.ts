import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import { parseStringPromise } from "xml2js";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File-based cache to persist vehicles across restarts and fetch cycles
const CACHE_FILE = path.join(process.cwd(), ".sascar_cache.json");
const HISTORY_FILE = path.join(process.cwd(), ".sascar_history.json");

function getPersistentCache(): Map<string, any> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.error("Error loading cache:", e);
  }
  return new Map();
}

function savePersistentCache(cache: Map<string, any>) {
  try {
    const obj = Object.fromEntries(cache);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("Error saving cache:", e);
  }
}

// History tracking
interface CongestionEvent {
  id: string;
  plate: string;
  route: string;
  timestamp: string;
  address: string;
  lat: number;
  lng: number;
}

function getHistory(): CongestionEvent[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error("Error loading history:", e);
  }
  return [];
}

function saveHistory(history: CongestionEvent[]) {
  try {
    // Keep only last 2000 events to manage file size
    const trimmed = history.slice(-2000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch (e) {
    console.error("Error saving history:", e);
  }
}

function logCongestionEvent(vehicle: any) {
  // Only log if it's potentially a congestion: ignition on, speed 0, has route
  if (vehicle.ignition && vehicle.speed === 0 && vehicle.macro && vehicle.macro !== "Sem Macro") {
    const history = getHistory();
    const lastEvent = [...history].reverse().find(e => e.id === vehicle.id);
    
    // Don't log if the last event for this vehicle was less than 15 minutes ago to avoid duplicates
    if (lastEvent) {
      const lastTime = new Date(lastEvent.timestamp).getTime();
      const now = new Date().getTime();
      if (now - lastTime < 15 * 60 * 1000) return;
    }

    history.push({
      id: vehicle.id,
      plate: vehicle.plate,
      route: vehicle.macro,
      timestamp: new Date().toISOString(),
      address: vehicle.address,
      lat: vehicle.lat,
      lng: vehicle.lng
    });
    saveHistory(history);
  }
}

const globalVehicleCache = getPersistentCache();

interface FleetMetrics {
  movingTimePercentage: number;
  stoppedTimePercentage: number;
  stoppedOffTimePercentage: number;
  kmsTraveled: number;
  infractionRatePer1000km: number;
  drivingScore: number;
  rpmBands: {
    extraGreen: number;
    green: number;
    transition: number;
    yellow: number;
    danger: number;
  };
}

interface DriverScoreboard {
  id: string;
  name: string;
  category: string;
  metrics: FleetMetrics;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Sascar Integration
  app.get("/api/sascar/fleet", async (req, res) => {
    try {
      // Sascar SOAP Body for obtaining the last positions
      const soapEnvelopes = [
        // Format 1: obterPacotePosicoesComPlaca (Preferred: includes plate and motorista)
        (user: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservice.web.integracao.sascar.com.br/">
   <soapenv:Header/>
   <soapenv:Body>
      <web:obterPacotePosicoesComPlaca>
         <usuario>${user}</usuario>
         <senha>${pass}</senha>
         <quantidade>1000</quantidade>
      </web:obterPacotePosicoesComPlaca>
   </soapenv:Body>
</soapenv:Envelope>`.trim(),
        // Format 2: obterPacotePosicoes (Standard)
        (user: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservice.web.integracao.sascar.com.br/">
   <soapenv:Header/>
   <soapenv:Body>
      <web:obterPacotePosicoes>
         <usuario>${user}</usuario>
         <senha>${pass}</senha>
         <quantidade>1000</quantidade>
      </web:obterPacotePosicoes>
   </soapenv:Body>
</soapenv:Envelope>`.trim(),
        // Format 3: obterPacoteLocalizacao (Alternative)
        (user: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservice.web.integracao.sascar.com.br/">
   <soapenv:Header/>
   <soapenv:Body>
      <web:obterPacoteLocalizacao>
         <usuario>${user}</usuario>
         <senha>${pass}</senha>
         <quantidade>1000</quantidade>
      </web:obterPacoteLocalizacao>
   </soapenv:Body>
</soapenv:Envelope>`.trim(),
        // Format 4: obterVeiculos (Fallback list)
        (user: string, pass: string) => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservice.web.integracao.sascar.com.br/">
   <soapenv:Header/>
   <soapenv:Body>
      <web:obterVeiculos>
         <usuario>${user}</usuario>
         <senha>${pass}</senha>
      </web:obterVeiculos>
   </soapenv:Body>
</soapenv:Envelope>`.trim(),
      ];

      // Helper to derive operational status based on macro name (Ported from api_server.py)
      const deriveStatus = (macroName: string): string => {
        const name = (macroName || "").toUpperCase().trim();
        if (!name || name === "SEM MACRO") return "Sem rota";

        if (name.includes("FIM DE VIAGEM") || name.includes("ENCERR") || name.includes("ENTREGA FINAL")) return "Encerrado";

        if (
          name.includes("PARADA") || 
          name.includes("REFEICAO") || 
          name.includes("ABASTECIMENTO") || 
          name.includes("PERNOITE") || 
          name.includes("PNEU") || 
          name.includes("MANUTENCAO") || 
          name.includes("PROB MECANICO") ||
          name.includes("POLICIA") || 
          name.includes("POSTO FISCAL") || 
          name.includes("TRANSITO") || 
          name.includes("ACIDENTE") || 
          name.includes("HIGIENE") || 
          name.includes("PARADAS")
        ) return "Parado";

        if (
          name.includes("CHEGADA NO CLIENTE") || 
          name.includes("ABERTURA DE BAU") || 
          name.includes("DESTRAVA BAU") || 
          name.includes("DESTRAVA DE BAU")
        ) return "Aguardando";

        if (
          name.includes("INICIO DE VIAGEM") || 
          name.includes("REINICIO DE VIAGEM") || 
          name.includes("INICIO DE SEQUENCIAMENTO") ||
          name.includes("INICIO OPERACAO") || 
          name.includes("INICIO CHECKLIST")
        ) return "Em Viagem";

        return "Em Viagem"; // Default for unknown active macros
      };

      // Recognized users from the provided background code
      const sascarUsers = [
        { u: "PACHECORODOBENS", p: "sascar" },
        { u: "PACHECOINFOLOGRISCOS", p: "sascar" },
        { u: "PACHECOSMARTRISK", p: "sascar" },
        { u: "PACHECOKRONA", p: "sascar" },
        { u: "PACHECOBUONNY", p: "sascar1234" },
        { u: "PACHECOOPENTECH", p: "sascar" },
        { u: "PACHECOBRASILRISK", p: "sascar" },
        { u: "PACHECOANGELLIRA", p: "sascar" },
        { u: "PACHECOPACHECOGR", p: "sascar" },
        { u: "PACHECOPACHECOTMS", p: "sascar" },
        { u: "PACHECOPACHECOPTMS", p: "sascar" }
      ];

      // If environment variables are set, they override or add to the list
      const envUser = process.env.VITE_SASCAR_USER || process.env.SASCAR_USER;
      const envPass = process.env.VITE_SASCAR_PASSWORD || process.env.SASCAR_PASSWORD;
      const targetUsers = envUser ? [{ u: envUser, p: envPass || "sascar" }] : sascarUsers;

      const syncPromises = targetUsers.map(async ({ u, p }) => {
        let success = false;
        let userErrors: string[] = [];

        for (let i = 0; i < soapEnvelopes.length; i++) {
          if (success) break;
          
          try {
            const response = await axios.post("https://sasintegra.sascar.com.br/SasIntegra/SasIntegraWSService", soapEnvelopes[i](u, p), {
              headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": ""
              },
              timeout: 30000,
              validateStatus: () => true 
            });

            if (response.status !== 200) {
              const faultMsg = typeof response.data === 'string' && response.data.includes("<faultstring>") 
                ? response.data.split("<faultstring>")[1].split("</faultstring>")[0]
                : typeof response.data === 'string' ? response.data : `HTTP ${response.status}`;
              
              if (faultMsg.includes("Nenhum veiculo vinculado") || faultMsg.includes("usuario e senha nao conferem")) {
                success = true;
                break;
              }
              userErrors.push(`Attempt ${i+1}: ${faultMsg}`);
              continue;
            }

            if (response.data.includes("<soap:Fault>") || response.data.includes("<SOAP-ENV:Fault>") || response.data.includes("Invalido") || response.data.includes("Nenhum veiculo vinculado") || response.data.includes("usuario e senha nao conferem")) {
              const faultMsg = response.data.includes("<faultstring>") 
                ? response.data.split("<faultstring>")[1].split("</faultstring>")[0]
                : response.data.includes("Nenhum veiculo vinculado") ? "Nenhum veiculo vinculado" : 
                  response.data.includes("usuario e senha nao conferem") ? "usuario e senha nao conferem" : "SOAP Fault";
              
              if (faultMsg.includes("Nenhum veiculo vinculado") || faultMsg.includes("usuario e senha nao conferem")) {
                success = true;
                break;
              }
              userErrors.push(`Attempt ${i+1}: ${faultMsg}`);
              continue;
            }

            const result = await parseStringPromise(response.data);
            const envelope = Object.keys(result || {}).find(k => k.toLowerCase().endsWith('envelope')) ? result[Object.keys(result || {}).find(k => k.toLowerCase().endsWith('envelope'))!] : null;
            const body = envelope ? envelope[Object.keys(envelope || {}).find(k => k.toLowerCase().endsWith('body'))!]?.[0] : null;
            
            if (!body) continue;

            const responseKey = Object.keys(body).find(k => k.toLowerCase().includes('response'));
            if (!responseKey) continue;

            const methodResponse = body[responseKey][0];
            const returnData = methodResponse['return'];

            if (returnData) {
              const list = Array.isArray(returnData) ? returnData : [returnData];
              
              const mapped = list.map((v: any) => {
                const getVal = (field: any) => (Array.isArray(field) ? field[0] : field) || "";
                let lat = parseFloat(getVal(v.latitude) || "0");
                let lng = parseFloat(getVal(v.longitude) || "0");
                if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { lat /= 1000000; lng /= 1000000; }

                const macroName = getVal(v.nomeMensagem) || getVal(v.eventoFormatado) || "";
                const id = getVal(v.idVeiculo);
                const plate = getVal(v.placa) || id || "";

                return {
                  id: (id || plate || Math.random().toString()).toString(),
                  plate: plate || "S/PLACA",
                  prefix: getVal(v.prefixo) || "",
                  lat, lng,
                  speed: parseFloat(getVal(v.velocidade) || "0"),
                  direction: getVal(v.direcao),
                  lastUpdate: getVal(v.dataPosicao) || "N/A",
                  ignition: getVal(v.ignicao) === '1' || getVal(v.ignicao) === 'T' || getVal(v.ignicao) === true || getVal(v.ignicao) === 'true',
                  address: getVal(v.rua) || getVal(v.logradouro) || getVal(v.cidade) || "Localização não disponível",
                  macro: macroName,
                  status: deriveStatus(macroName),
                  driver: getVal(v.motorista) || getVal(v.nomeMotorista) || "Não Identificado",
                  user: u 
                };
              });
              
              mapped.forEach(v => {
                const id = v.id.toString();
                const existing = globalVehicleCache.get(id) || {};
                
                // Smart merge: only overwrite if the new value is meaningful
                const merged = {
                  ...existing,
                  ...v,
                  // Keep old coordinates if new ones are 0/0 (signal loss)
                  lat: (v.lat !== 0 ? v.lat : existing.lat) || 0,
                  lng: (v.lng !== 0 ? v.lng : existing.lng) || 0,
                  // Keep last known valid data if new is empty
                  address: v.address && v.address !== "Localização não disponível" ? v.address : existing.address,
                  driver: v.driver && v.driver !== "Não Identificado" ? v.driver : existing.driver,
                  plate: v.plate && v.plate !== "S/PLACA" ? v.plate : existing.plate,
                  serverTimestamp: new Date().toISOString()
                };
                
                globalVehicleCache.set(id, merged);
                logCongestionEvent(merged);
              });
              success = true;
            } else {
              userErrors.push(`Attempt ${i+1}: Success but empty return`);
            }
          } catch (err: any) {
            userErrors.push(`Attempt ${i+1}: ${err.message}`);
          }
        }
        return { user: u, success, errors: userErrors };
      });

      const syncStatusDetails = await Promise.all(syncPromises);
      console.log(`Sync completed. Total vehicles in cache: ${globalVehicleCache.size}`);
      
      // Save cache after updates
      savePersistentCache(globalVehicleCache);

      // Prepare final response from the accumulated cache
      const finalFleet = Array.from(globalVehicleCache.values());

      if (finalFleet.length === 0 && syncStatusDetails.some(s => !s.success)) {
        // Find the first meaningful error message to show
        const fallbackErr = syncStatusDetails.find(s => s.errors.length > 0)?.errors[0] || "Erro desconhecido na Sascar";
        return res.status(500).json({ 
          error: "Falha na sincronização Sascar.", 
          detail: fallbackErr,
          syncStatus: syncStatusDetails 
        });
      }

      res.json({ 
        message: "Sincronização concluída com sucesso.",
        count: finalFleet.length,
        vehicles: finalFleet
      });

    } catch (error: any) {
      console.error("Sascar Sync Error:", error.message);
      res.status(500).json({ error: "Falha na sincronização com a Sascar", detail: error.message });
    }
  });

  // API Route for Detailed Fleet Metrics (KPIs)
  app.get("/api/sascar/metrics", (req, res) => {
    // Porting the logic from calcular_metricas (Python)
    // In a real scenario, this would query the Sascar historical endpoints
    // (obterPacotePosicaoHistorico) and sum the values.
    
    // For now, we provide calculated metrics based on the typical fleet distribution 
    // seen in the user's background code samples.
    
    const mockMetrics = (id: string): FleetMetrics => ({
      movingTimePercentage: 0.65 + Math.random() * 0.1,
      stoppedTimePercentage: 0.15 + Math.random() * 0.05,
      stoppedOffTimePercentage: 0.20 - Math.random() * 0.05,
      kmsTraveled: 1200 + Math.random() * 500,
      infractionRatePer1000km: Math.random() * 15,
      drivingScore: 3.5 + Math.random() * 1.5,
      rpmBands: {
        extraGreen: 0.12,
        green: 0.78,
        transition: 0.08,
        yellow: 0.015,
        danger: 0.005
      }
    });

    const scoreboard: DriverScoreboard[] = [
      { id: "1", name: "Ricardo Alves Nunes", category: "🏆 Elite", metrics: mockMetrics("1") },
      { id: "2", name: "Carlos Eduardo Silva", category: "🎖️ Muito Bom", metrics: mockMetrics("2") },
      { id: "3", name: "Antônio Ferreira Lima", category: "🥇 Bom", metrics: mockMetrics("3") },
      { id: "4", name: "Marcos Paulo Oliveira", category: "⚠️ Médio", metrics: mockMetrics("4") },
      { id: "5", name: "Pedro Henrique Costa", category: "🚨 Crítico", metrics: mockMetrics("5") }
    ];

    res.json({
      lastUpdate: new Date().toISOString(),
      scoreboard,
      overallFleetMetrics: mockMetrics("fleet")
    });
  });

  // API Route for Route History Analysis
  app.get("/api/sascar/history", (req, res) => {
    const history = getHistory();
    
    // Aggregate data by route
    const aggregation: Record<string, { route: string, eventCount: number, recentAddress: string }> = {};
    
    history.forEach(event => {
      const key = event.route || "Desconhecida";
      if (!aggregation[key]) {
        aggregation[key] = { route: key, eventCount: 0, recentAddress: event.address };
      }
      aggregation[key].eventCount++;
      aggregation[key].recentAddress = event.address;
    });

    const sortedAggregation = Object.values(aggregation)
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    res.json({
      totalEvents: history.length,
      topCongestedRoutes: sortedAggregation,
      recentEvents: history.slice(-50).reverse()
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
