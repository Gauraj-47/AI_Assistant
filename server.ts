
import "dotenv/config";
import { MongoClient } from "mongodb";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const mongo = new MongoClient(process.env.MONGODB_URI!);

const server = new McpServer({
  name: "sanjivani-farmer-server",
  version: "1.0.0",
});

server.registerTool(
  "get_farmer_records",
  {
    description:
      "Retrieve all sugarcane farmer records, including names, villages, tons supplied, amount paid, and pending payment.",
    inputSchema: {},
  },
  async () => {
    const database = mongo.db(
      process.env.MONGODB_DATABASE || "sanjivani_sugar_factory"
    );

    const farmers = await database
      .collection("farmers")
      .find({}, { projection: { _id: 0 } })
      .toArray();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(farmers, null, 2),
        },
      ],
    };
  }
);

async function main() {
  await mongo.connect();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exitCode = 1;
});
