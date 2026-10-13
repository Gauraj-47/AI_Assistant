import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { FarmerAssistantClient } from "./client.js";

const app = express();
const port = Number(process.env.API_PORT || 3001);
const assistant = new FarmerAssistantClient();
const questionSchema = z.object({
  question: z.string().trim().min(1, "Question cannot be empty.").max(2000),
});

app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/farmers", async (_request, response, next) => {
  try {
    response.json({ farmers: await assistant.getFarmerRecords() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard/stats", async (_request, response, next) => {
  try {
    const farmers = await assistant.getFarmerRecords();
    const villages = new Map<string, number>();
    for (const farmer of farmers) {
      villages.set(
        farmer.village,
        (villages.get(farmer.village) || 0) + farmer.sugarcane_tons,
      );
    }

    response.json({
      totalFarmers: farmers.length,
      totalTons: sum(farmers.map((farmer) => farmer.sugarcane_tons)),
      totalPaid: sum(farmers.map((farmer) => farmer.amount_paid)),
      totalPending: sum(farmers.map((farmer) => farmer.payment_pending)),
      villageSupply: Array.from(villages, ([village, tons]) => ({ village, tons }))
        .sort((left, right) => right.tons - left.tons),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai/ask", async (request, response, next) => {
  const parsed = questionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: parsed.error.issues[0]?.message || "Invalid request body.",
    });
    return;
  }

  try {
    response.json({ answer: await assistant.ask(parsed.data.question) });
  } catch (error) {
    next(error);
  }
});

app.use(((error: unknown, _request, response, _next) => {
  console.error("API request failed:", error);
  const badJson = typeof error === "object" && error !== null &&
    "status" in error && error.status === 400;
  response.status(badJson ? 400 : 500).json({
    error: badJson
      ? "Request body must contain valid JSON."
      : "The request could not be completed. Check the backend logs.",
  });
}) satisfies ErrorRequestHandler);

async function start(): Promise<void> {
  await assistant.connect();
  const server = app.listen(port, () => {
    console.log(`Sanjivani API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    server.close();
    await assistant.close();
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

start().catch(async (error: unknown) => {
  console.error("API startup failed:", error);
  await assistant.close();
  process.exitCode = 1;
});

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
