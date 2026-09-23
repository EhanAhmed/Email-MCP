#!/usr/bin/env node

/**
 * Email MCP Server - Clean, flexible email operations
 * Supports both SMTP (sending) and IMAP (reading) operations
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { EMAIL_TOOLS } from "./emailTools.js";
import {
  handleAccountsList,
  handleEmailsFind,
  handleEmailsModify,
  handleEmailSend,
  handleEmailRespond,
  handleFoldersList
} from "./emailHandlers.js";
import { loadEnvironment } from './environment.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';

// Set up logging
const logDir = path.join(os.tmpdir(), 'email-mcp-server-logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  // Silently fail if we can't create the log directory
}

const logFile = path.join(logDir, 'email-mcp-server.log');

function logToFile(message: string): void {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    // Silently fail if we can't write to the log file
  }
}

function createMcpServer(): Server {
  const server = new Server(
    {
      name: "email-smtp-imap-mcp",
      version: "2.2.0"
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.onerror = (error) => logToFile(`[MCP Error] ${error}`);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(EMAIL_TOOLS)
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "accounts_list":
          result = await handleAccountsList();
          break;

        case "emails_find":
          result = await handleEmailsFind(args);
          break;

        case "emails_modify":
          result = await handleEmailsModify(args);
          break;

        case "email_send":
          result = await handleEmailSend(args);
          break;

        case "email_respond":
          result = await handleEmailRespond(args);
          break;

        case "folders_list":
          result = await handleFoldersList(args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const parsedResult = JSON.parse(result);

      return {
        content: [{ type: "text", text: result }],
        ...(parsedResult.success === false ? { isError: true } : {})
      };
    } catch (error: any) {
      logToFile(`Error handling ${name}: ${error.message}`);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message || 'Unknown error occurred'
          }, null, 2)
        }],
        isError: true
      };
    }
  });

  return server;
}

function respondWithHttpError(res: ServerResponse, status: number, message: string): void {
  if (res.headersSent) return;
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32600, message },
    id: null
  }));
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Request body must contain valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function startHttpServer(): Promise<void> {
  const port = Number(process.env.MCP_HTTP_PORT || 8000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('MCP_HTTP_PORT must be an integer between 1 and 65535');
  }

  const httpServer = createHttpServer(async (req, res) => {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    if (pathname !== '/mcp') {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST' }).end();
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error: any) {
      respondWithHttpError(res, 400, error.message);
      return;
    }

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.once('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      logToFile(`[HTTP MCP Error] ${error}`);
      respondWithHttpError(res, 500, 'Internal server error');
      void transport.close();
      void server.close();
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, '0.0.0.0', () => {
      httpServer.off('error', reject);
      resolve();
    });
  });
  logToFile(`Email MCP Server listening on HTTP port ${port}`);
}

async function runServer(): Promise<void> {
  try {
    loadEnvironment();
    const mode = (process.env.MCP_TRANSPORT || 'stdio').trim().toLowerCase();

    if (mode === 'http') {
      await startHttpServer();
    } else if (mode === 'stdio') {
      const server = createMcpServer();
      await server.connect(new StdioServerTransport());
      logToFile("Email MCP Server started successfully over stdio");
    } else {
      throw new Error('MCP_TRANSPORT must be either "stdio" or "http"');
    }
  } catch (error) {
    logToFile(`Server failed to start: ${error}`);
    console.error(`Server failed to start: ${error}`);
    process.exit(1);
  }
}

// Run the server
runServer().catch((error) => {
  logToFile(`Server failed to start: ${error}`);
  console.error(`Server failed to start: ${error}`);
  process.exit(1);
});
