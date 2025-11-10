import { config } from "./server.config.js";
import { app } from "./src/app.js";

// Démarre un serveur
const port = config.server.port;
app.listen(port, () => {
  console.log(`🚀 Server started at http://localhost:${port}`);
});
