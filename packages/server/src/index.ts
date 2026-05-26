import process from "node:process";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";

const db = openDatabase();
const app = createApp(db);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`ContextHub listening on http://localhost:${port}`);
});
