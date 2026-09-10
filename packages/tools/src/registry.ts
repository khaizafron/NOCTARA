import { ToolDefinition } from '@noctara/shared';
import { ToolAdapter } from './types.js';
import { WebSearchTool } from './builtin/search.js';
import { WebFetchTool } from './builtin/fetch.js';
import { FileReadTool, FileWriteTool } from './builtin/filesystem.js';
import { ShellCommandTool } from './builtin/shell.js';
import { SystemStatusTool } from './builtin/system.js';

export class ToolRegistry {
  private tools: Map<string, ToolAdapter> = new Map();

  constructor() {
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    this.register(new WebSearchTool());
    this.register(new WebFetchTool());
    this.register(new FileReadTool());
    this.register(new FileWriteTool());
    this.register(new ShellCommandTool());
    this.register(new SystemStatusTool());
  }

  public register(tool: ToolAdapter): void {
    this.tools.set(tool.definition.id, tool);
  }

  public getTool(id: string): ToolAdapter | undefined {
    return this.tools.get(id);
  }

  public getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }
}
