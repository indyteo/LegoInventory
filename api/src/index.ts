import express from "express";
import cors from "cors";
import { getPort } from "./config";
import { logAfter, logBefore } from "./handlers/middlewares";
import { setupBricksHandlers, setupMinifiguresHandlers, setupSetsHandlers } from "./handlers";

const port = getPort();
const app = express();

app.use(cors());
app.use(logBefore);

app.get("/", (_req, res) => {
  res.sendStatus(200);
});

setupBricksHandlers(app);
setupMinifiguresHandlers(app);
setupSetsHandlers(app);

app.use(logAfter);

app.listen(port, () => {
  console.log(`API web server listening on port ${port}`);
});
