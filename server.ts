import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import https from "https";
import dotenv from "dotenv";
import { parseStringPromise } from "xml2js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

async function resolveIP(domain: string): Promise<string | null> {
  const knownIPs: { [key: string]: string } = {
    'ws.sascar.com.br': '200.152.191.130',
    'integracao.sascar.com.br': '200.152.191.130',
    'webservice.sascar.com.br': '200.152.191.130',
    'telemetria.sascar.com.br': '172.67.68.181', 
    'api-telemetria.sascar.com.br': '104.26.13.164',
    'v3.sascar.com.br': '200.152.191.130',
    'api.michelinconnectedfleet.com': '54.76.67.242', 
    'api.michelinconnectedfleet.com.br': '104.26.12.164', 
    'api.sascar.com.br': '104.26.12.164'
  };

  try {
    const googleResp = await axios.get(`https://dns.google/resolve?name=${domain}&type=A`, { timeout: 1200 });
    if (googleResp.data?.Answer?.[0]?.data) return googleResp.data.Answer[0].data;
  } catch (e) {}

  return knownIPs[domain] || null;
}

// Function to try Michelin REST API
async function tryMichelinRest(user: string, pass: string, login: string, debugLogs: string[]): Promise<{ vehicles: any[], source: string, log: string } | null> {
  const michelinDomain = "api.michelinconnectedfleet.com";
  const michelinBRDomain = "api.michelinconnectedfleet.com.br";
  const sascarDomain = "api-telemetria.sascar.com.br";
  
  const attempts = [
    { name: "Michelin CF", host: michelinDomain, u: user },
    { name: "Michelin CF BR", host: michelinBRDomain, u: user },
    { name: "Sascar REST API", host: sascarDomain, u: user },
    { name: "Sascar REST Combo", host: sascarDomain, u: `${user}:${login}` }
  ];

  for (const attempt of attempts) {
    try {
      const ip = await resolveIP(attempt.host);
      const targetUrl = ip ? `https://${ip}/token` : `https://${attempt.host}/token`;
      
      debugLogs.push(`REST ${attempt.name}: ${attempt.host}...`);
      
      const agent = new https.Agent({ rejectUnauthorized: false, servername: attempt.host });
      const tokenResponse = await axios.post(targetUrl, 
        new URLSearchParams({ grant_type: 'password', username: attempt.u, password: pass }).toString(),
        { 
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded", 
            "Host": attempt.host,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }, 
          timeout: 10000,
          httpsAgent: agent
        }
      );

      const token = tokenResponse.data.access_token;
      if (!token) continue;

      debugLogs.push(`REST ${attempt.name}: Token OK!`);
      const dataUrl = targetUrl.replace('/token', '/v1/vehicles/last-positions');
      const vehiclesResponse = await axios.get(dataUrl, {
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Host": attempt.host,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 10000,
        httpsAgent: agent
      });

      if (vehiclesResponse.data) {
        const rawData = vehiclesResponse.data;
        const list = Array.isArray(rawData) ? rawData : (rawData.vehicles || rawData.items || [rawData]);
        const vehicles = list.map((v: any) => ({
          id: (v.vehicleId || v.id || v.vin || Math.random()).toString(),
          plate: v.registrationNumber || v.plate || v.registration || v.name || "S/PLACA",
          driver: v.driverName || v.driver?.name || "N/A",
          lat: parseFloat(v.latitude || v.lastPosition?.latitude || 0),
          lng: parseFloat(v.longitude || v.lastPosition?.longitude || 0),
          speed: v.speed || v.lastPosition?.speed || 0,
          ignition: v.ignitionStatus === 'ON' || v.ignition === true,
          lastUpdate: v.lastPositionDate || v.timestamp || "Agora"
        }));
        if (vehicles.length > 0 && vehicles[0].lat !== 0) {
          return { vehicles, source: attempt.name, log: `REST ${attempt.name} (${vehicles.length} v)` };
        }
      }
    } catch (err: any) {
      debugLogs.push(`REST ${attempt.name} falhou: ${err.response?.status || err.message}`);
    }
  }
  return null;
}

  // API Route for Sascar Integration
  app.get("/api/sascar/fleet", async (req, res) => {
    let debugLogs: string[] = [];
    try {
      const user = (req.headers['x-sascar-user'] as string || "").trim();
      const login = (req.headers['x-sascar-login'] as string || "").trim();
      const pass = (req.headers['x-sascar-pass'] as string || "").trim();

      if (!user || !pass) {
        return res.status(401).json({ error: "Credenciais não fornecidas." });
      }

      // Try different credential combinations for Sascar
      const credentialCombos = login ? [
        { u: user, p: pass },
        { u: `${user}:${login}`, p: pass },
        { u: `${login}@${user}`, p: pass }, // New pattern ADM@PACHECO642
        { u: `${user}\\${login}`, p: pass }, // New pattern PACHECO642\ADM
        { u: `${user}${login}`, p: pass },
        { u: login, p: pass }
      ] : [{ u: user, p: pass }];

      debugLogs.push(`Fase 1: Varredura APIs REST (${credentialCombos.length} combos)...`);

      // 1. Try Michelin/Sascar REST APIs
      const restResult = await tryMichelinRest(user, pass, login, debugLogs);
      if (restResult && restResult.vehicles.length > 0) {
        debugLogs.push(`SUCESSO REST: ${restResult.source} -> ${restResult.log}`);
        return res.json({ 
          message: `Sincronizado via ${restResult.source}`, 
          count: restResult.vehicles.length, 
          vehicles: restResult.vehicles,
          logs: debugLogs 
        });
      }

      debugLogs.push("Fase 2: Varredura SOAP (Legado e Telemetria)...");

      // 2. Fallback to SOAP
      const domains = ["telemetria.sascar.com.br", "api-telemetria.sascar.com.br", "ws.sascar.com.br"];
      const endpoints: { url: string; host: string }[] = [];
      
      domains.forEach((d) => {
        const paths = [
          "/telemetria/IntegracaoService",
          "/ws/IntegracaoService",
          "/IntegracaoService",
          "/ws/integracao.php"
        ];
        paths.forEach(p => endpoints.push({ url: `https://${d}${p}`, host: d }));
      });

      let soapResponse;
      const topEndpoints = endpoints.slice(0, 15);
      const topCombos = credentialCombos.slice(0, 4); 

      debugLogs.push(`Fase 2: Varredura SOAP em ${topEndpoints.length} rotas...`);

      const probeResults = await Promise.allSettled(
        topEndpoints.flatMap(ep => 
          topCombos.map(async (combo) => {
            const currentEnvelope = `
              <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.sascar.com.br/">
                <soapenv:Header/>
                <soapenv:Body>
                  <ws:obterUltimaPosicaoTodosVeiculos>
                    <usuario>${combo.u}</usuario>
                    <senha>${combo.p}</senha>
                  </ws:obterUltimaPosicaoTodosVeiculos>
                </soapenv:Body>
              </soapenv:Envelope>
            `;

            const realIP = await resolveIP(ep.host);
            const finalUrl = realIP ? ep.url.replace(ep.host, realIP) : ep.url;
            const agent = new https.Agent({ rejectUnauthorized: false, servername: ep.host });

            const resp = await axios.post(finalUrl, currentEnvelope, {
              headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": "obterUltimaPosicaoTodosVeiculos",
                "Host": ep.host,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
              },
              timeout: 6000, 
              httpsAgent: agent
            });

            if (resp.data.includes('obterUltimaPosicaoTodosVeiculosResponse') || resp.data.includes('<return>')) {
              return { resp, url: ep.url, u: combo.u };
            }
            throw new Error("Negado");
          })
        )
      );

      const success = probeResults.find(r => r.status === 'fulfilled') as any;
      if (success) {
        soapResponse = success.value.resp;
        debugLogs.push(`SUCESSO SOAP: ${success.value.url}`);
      } else {
        const errs = probeResults.filter(r => r.status === 'rejected').slice(0, 2).map((r: any) => r.reason?.message || "Erro");
        debugLogs.push(`SOAP falhou. Ex: ${errs.join(' | ')}`);
      }

      if (!soapResponse) {
        throw new Error(`Não foi possível conectar aos servidores da Sascar/Michelin. Detalhes: ${debugLogs.join(' -> ')}`);
      }

      // Parse XML to JS Object
      const result = await parseStringPromise(soapResponse.data);
      
      // Flexible extraction to handle different SOAP namespaces
      const envelope = result['SOAP-ENV:Envelope'] || result['soap:Envelope'] || result['s:Envelope'] || result['Envelope'];
      if (!envelope) {
        console.error("Sascar Response Raw:", JSON.stringify(result));
        throw new Error("Resposta da Sascar não contém um Envelope SOAP válido.");
      }

      const body = envelope['SOAP-ENV:Body']?.[0] || envelope['soap:Body']?.[0] || envelope['s:Body']?.[0] || envelope['Body']?.[0];
      if (!body) throw new Error("Corpo da mensagem (SOAP Body) não encontrado.");
      
      const responseKey = Object.keys(body).find(k => k.includes('obterUltimaPosicaoTodosVeiculosResponse'));
      if (!responseKey) {
        // Check for SOAP Fault
        if (body['SOAP-ENV:Fault'] || body['soap:Fault'] || body['Fault']) {
          const fault = body['SOAP-ENV:Fault']?.[0] || body['soap:Fault']?.[0] || body['Fault']?.[0];
          const faultString = fault.faultstring?.[0] || "Erro desconhecido no servidor Sascar";
          throw new Error(`Erro Sascar (Fault): ${faultString}`);
        }
        throw new Error("Resposta da Sascar em formato inesperado (Tag de resposta não encontrada)");
      }

      const methodResponse = body[responseKey][0];
      const returnData = methodResponse['return'];

      if (!returnData) {
        return res.json({ message: "Sincronização concluída, mas nenhum veículo retornado.", count: 0, vehicles: [] });
      }

      // Sascar XML typically returns a list of items inside <return>
      const vehiclesList = Array.isArray(returnData) ? returnData : [returnData];

      const vehicles = vehiclesList.map((v: any) => {
        // Handle coordinates that might come as scaled integers or strings
        let lat = parseFloat(v.latitude?.[0] || "0");
        let lng = parseFloat(v.longitude?.[0] || "0");
        
        // Some Sascar versions return coordinates multiplied by 1,000,000
        if (Math.abs(lat) > 180) lat /= 1000000;
        if (Math.abs(lng) > 180) lng /= 1000000;

        return {
          id: (v.idVeiculo?.[0] || v.placa?.[0] || Math.random().toString()).toString(),
          plate: v.placa?.[0] || v.veiculoPlaca?.[0] || "S/PLACA",
          prefix: v.prefixo?.[0] || "",
          driver: v.motorista?.[0] || v.nomeMotorista?.[0] || "",
          lat: lat,
          lng: lng,
          speed: parseFloat(v.velocidade?.[0] || "0"),
          direction: v.direcao?.[0] || "",
          lastUpdate: v.dataPosicao?.[0] || "N/A",
          ignition: v.ignicao?.[0] === 'T' || v.ignicao?.[0] === '1' || v.ignicao?.[0] === 'true',
          address: v.logradouro?.[0] || v.localizacao?.[0] || "Localização não disponível"
        };
      }).filter((v: any) => v.lat !== 0 && v.lng !== 0);

      res.json({ 
        message: "Sincronização concluída com sucesso.",
        count: vehicles.length,
        vehicles
      });

    } catch (error: any) {
      const errorDetail = error.response ? 
        `Status ${error.response.status}: ${error.response.data}` : 
        error.message;
      
      console.error("Sascar Sync Error:", errorDetail);
      res.status(500).json({ 
        error: "Falha na sincronização", 
        detail: errorDetail 
      });
    }
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
