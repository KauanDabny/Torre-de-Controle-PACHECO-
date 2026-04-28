import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import { parseStringPromise } from "xml2js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Sascar Integration
  app.get("/api/sascar/fleet", async (req, res) => {
    try {
      const user = process.env.SASCAR_USER;
      const pass = process.env.SASCAR_PASSWORD;

      if (!user || !pass) {
        return res.status(401).json({ error: "Sascar credentials not configured in environment variables." });
      }

      // Sascar SOAP Body for obtaining the last positions
      // This is a common pattern for Sascar WS integration
      const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.sascar.com.br/">
           <soapenv:Header/>
           <soapenv:Body>
              <ws:obterUltimaPosicaoTodosVeiculos>
                 <usuario>${user}</usuario>
                 <senha>${pass}</senha>
              </ws:obterUltimaPosicaoTodosVeiculos>
           </soapenv:Body>
        </soapenv:Envelope>
      `;

      // Note: ws.sascar.com.br is the standard endpoint for Sascar WebServices
      const response = await axios.post("https://ws.sascar.com.br/ws/integracao.php", soapEnvelope, {
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": "obterUltimaPosicaoTodosVeiculos"
        },
        timeout: 15000
      });

      // Parse XML to JS Object
      const result = await parseStringPromise(response.data);
      
      // Flexible extraction to handle different SOAP namespaces
      const envelope = result['SOAP-ENV:Envelope'] || result['soap:Envelope'] || result['s:Envelope'] || result['Envelope'];
      const body = envelope['SOAP-ENV:Body']?.[0] || envelope['soap:Body']?.[0] || envelope['s:Body']?.[0] || envelope['Body']?.[0];
      
      // Look for the response tag regardless of namespaceprefix
      const responseKey = Object.keys(body).find(k => k.includes('obterUltimaPosicaoTodosVeiculosResponse'));
      if (!responseKey) {
        throw new Error("Resposta da Sascar em formato inesperado (Response tag not found)");
      }

      const methodResponse = body[responseKey][0];
      const returnData = methodResponse['return'];

      if (!returnData) {
        return res.json({ message: "Sincronização concluída, mas nenhum veículo retornado.", count: 0, vehicles: [] });
      }

      // Sascar XML typically returns a list of items inside <return>
      const vehiclesList = Array.isArray(returnData) ? returnData : [returnData];

      const vehicles = vehiclesList.map((v: any) => ({
        id: (v.idVeiculo?.[0] || v.placa?.[0] || Math.random().toString()).toString(),
        plate: v.placa?.[0] || "S/PLACA",
        prefix: v.prefixo?.[0] || "",
        lat: parseFloat(v.latitude?.[0] || "0"),
        lng: parseFloat(v.longitude?.[0] || "0"),
        speed: parseFloat(v.velocidade?.[0] || "0"),
        direction: v.direcao?.[0] || "",
        lastUpdate: v.dataPosicao?.[0] || "N/A",
        ignition: v.ignicao?.[0] === 'T' || v.ignicao?.[0] === '1',
        address: v.logradouro?.[0] || "Localização não disponível"
      })).filter((v: any) => v.lat !== 0 && v.lng !== 0);

      res.json({ 
        message: "Sincronização concluída com sucesso.",
        count: vehicles.length,
        vehicles
      });

    } catch (error: any) {
      console.error("Sascar Sync Error:", error.message);
      res.status(500).json({ error: "Falha na sincronização com a Sascar", detail: error.message });
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
    const distPath = process.env.NODE_ENV === "production" 
      ? (__dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), 'dist'))
      : path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // For Express 4
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
