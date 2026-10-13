
import "dotenv/config";
import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

type ToolCallResponse = Awaited<ReturnType<Client["callTool"]>>;

export interface FarmerRecord {
  farmer_name: string;
  village: string;
  sugarcane_tons: number;
  amount_paid: number;
  payment_pending: number;
}

export class FarmerAssistantClient {
  private readonly client = new Client({
    name: "sanjivani-farmer-client",
    version: "1.0.0",
  });
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", fileURLToPath(new URL("./server.ts", import.meta.url))],
    });
    await this.client.connect(transport);
    this.connected = true;
  }

  async getFarmerRecords(): Promise<FarmerRecord[]> {
    const text = getTextContent(await this.callFarmerRecordsTool()).join("\n");
    const records: unknown = JSON.parse(text);
    if (!Array.isArray(records)) {
      throw new Error("MCP returned farmer records in an unexpected format.");
    }
    return records.map(normalizeFarmer);
  }

  async ask(question: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server.");
    }

    const { tools } = await this.client.listTools();
    const tool = tools.find((item) => item.name === "get_farmer_records");
    if (!tool) {
      throw new Error("MCP tool get_farmer_records was not found.");
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await openai.responses.create({
      model,
      input: question,
      tools: [
        {
          type: "function",
          name: tool.name,
          description: tool.description ?? "Get farmer records",
          parameters: {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false,
          },
          strict: true,
        },
      ],
      tool_choice: "required",
    });

    const call = response.output.find(
      (item) => item.type === "function_call" && item.name === tool.name,
    );
    if (!call || call.type !== "function_call") {
      throw new Error("OpenAI did not request the farmer records tool.");
    }

    const content = readToolContent(await this.client.callTool({
      name: call.name,
      arguments: JSON.parse(call.arguments) as Record<string, unknown>,
    }));

    const answer = await openai.responses.create({
      model,
      previous_response_id: response.id,
      instructions:
        "Answer using only the returned farmer records. " +
        "Calculate totals carefully. Currency is INR. " +
        "Do not invent records or financial information.",
      input: [
        {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(content),
        },
      ],
    });
    if (!answer.output_text.trim()) {
      throw new Error("OpenAI returned an empty answer.");
    }
    return answer.output_text;
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    await this.client.close();
    this.connected = false;
  }

  private async callFarmerRecordsTool(): Promise<unknown[]> {
    const { tools } = await this.client.listTools();
    const tool = tools.find((item) => item.name === "get_farmer_records");
    if (!tool) {
      throw new Error("MCP tool get_farmer_records was not found.");
    }
    return readToolContent(await this.client.callTool({
      name: tool.name,
      arguments: {},
    }));
  }
}

function normalizeFarmer(value: unknown): FarmerRecord {
  if (typeof value !== "object" || value === null) {
    throw new Error("MCP returned a farmer record in an unexpected format.");
  }
  const record = value as Record<string, unknown>;
  return {
    farmer_name: asText(record.farmer_name, "Unknown farmer"),
    village: asText(record.village, "Unknown village"),
    sugarcane_tons: asNumber(record.sugarcane_tons),
    amount_paid: asNumber(record.amount_paid),
    payment_pending: asNumber(record.payment_pending),
  };
}

function asText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function readToolContent(result: ToolCallResponse): unknown[] {
  if (!("content" in result) || !Array.isArray(result.content)) {
    throw new Error("MCP returned an asynchronous tool result that is not supported here.");
  }
  const content: unknown[] = result.content;
  if ("isError" in result && result.isError === true) {
    const message = getTextContent(content).join("\n");
    throw new Error(message || "MCP farmer records request failed.");
  }
  return content;
}

function getTextContent(content: unknown[]): string[] {
  return content.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "text" &&
      "text" in item &&
      typeof item.text === "string"
    ) {
      return [item.text];
    }
    return [];
  });
}

async function main(): Promise<void> {
  const assistant = new FarmerAssistantClient();
  await assistant.connect();
  try {
    const question = "Calculate the total amount already paid to all farmers.";
    console.log("\nQuestion:", question);
    console.log("\nAI Answer:\n", await assistant.ask(question));
  } finally {
    await assistant.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error("Client error:", error);
    process.exitCode = 1;
  });
}
