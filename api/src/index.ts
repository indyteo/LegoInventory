import express from "express";
import { getPort } from "./config";
import { logAfter, logBefore } from "./handlers/middlewares";
import { setupBricksHandlers } from "./handlers";

const port = getPort();
const app = express();

app.use(logBefore);

app.get("/", (_req, res) => {
  res.sendStatus(200);
});

setupBricksHandlers(app);

app.use(logAfter);

app.listen(port, () => {
  console.log(`API web server listening on port ${port}`);
});
