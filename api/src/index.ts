import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { getPort } from "./config";
import { logAfter, logBefore } from "./handlers/middlewares";
import { setupBricksHandlers, setupInventoriesHandlers, setupMinifiguresHandlers, setupSetsHandlers } from "./handlers";

const port = getPort();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(logBefore);

app.get("/", (_req, res, next) => {
  res.sendStatus(200);
  next();
});

app.get("/favicon.ico", (_req, res, next) => {
  res.sendStatus(404);
  next();
});

setupBricksHandlers(app);
setupMinifiguresHandlers(app);
setupSetsHandlers(app);
setupInventoriesHandlers(app);

app.use(logAfter);

app.listen(port, () => {
  console.log(`API web server listening on port ${port}`);
});
