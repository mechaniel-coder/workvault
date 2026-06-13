import type OpenAI from 'openai'

export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_app_summary',
      description: 'Get counts and highlights: clients, projects by stage, invoices by status, active timer, overdue items.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_clients',
      description: 'List clients with id, name, email, company.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Optional name/email filter' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'List pipeline projects with stage, value, client.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string' },
          stage: { type: 'string', enum: ['lead', 'proposal', 'active', 'delivered', 'invoiced', 'paid'] },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices with number, client, status, total, due date.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
          clientName: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_contracts',
      description: 'List contracts with number, title, client, status, value.',
      parameters: {
        type: 'object',
        properties: { clientName: { type: 'string' }, status: { type: 'string' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_time_entries',
      description: 'List recent time entries with project, duration, billable status.',
      parameters: {
        type: 'object',
        properties: { clientName: { type: 'string' }, limit: { type: 'number' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_scope_entries',
      description: 'List scope log entries (out-of-scope requests).',
      parameters: {
        type: 'object',
        properties: { clientName: { type: 'string' }, billableOnly: { type: 'boolean' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the user to an app page. Paths: /, /time, /pipeline, /proposals, /contracts, /invoices, /inbox, /finance, /scope, /documents, /clients, /integrations, /settings, /tools, /subcontractors, /tax-1099, /cursor-cli',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Route path starting with /' } },
        required: ['path'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_client',
      description: 'Create a new client.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_client',
      description: 'Update an existing client by name or id.',
      parameters: {
        type: 'object',
        properties: {
          clientRef: { type: 'string', description: 'Client name or id' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['clientRef'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_project',
      description: 'Create a pipeline project.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          clientRef: { type: 'string', description: 'Client name or id' },
          value: { type: 'number' },
          description: { type: 'string' },
          stage: { type: 'string', enum: ['lead', 'proposal', 'active', 'delivered', 'invoiced', 'paid'] },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['title', 'clientRef'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_stage',
      description: 'Move a project to a new pipeline stage.',
      parameters: {
        type: 'object',
        properties: {
          projectRef: { type: 'string', description: 'Project title or id' },
          stage: { type: 'string', enum: ['lead', 'proposal', 'active', 'delivered', 'invoiced', 'paid'] },
        },
        required: ['projectRef', 'stage'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_time_entry',
      description: 'Log a manual time entry.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string' },
          clientRef: { type: 'string' },
          description: { type: 'string' },
          durationMinutes: { type: 'number' },
          billable: { type: 'boolean' },
        },
        required: ['projectName', 'clientRef', 'durationMinutes'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'start_timer',
      description: 'Start the active timer for a project/client.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string' },
          clientRef: { type: 'string' },
          description: { type: 'string' },
          billable: { type: 'boolean' },
        },
        required: ['projectName', 'clientRef'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'stop_timer',
      description: 'Stop the currently running timer.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_invoice',
      description: 'Create a draft invoice with line items.',
      parameters: {
        type: 'object',
        properties: {
          clientRef: { type: 'string' },
          dueDate: { type: 'string', description: 'YYYY-MM-DD' },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                rate: { type: 'number' },
              },
              required: ['description', 'rate'],
            },
          },
          notes: { type: 'string' },
          taxRate: { type: 'number', description: 'Percent e.g. 0 or 8.5' },
        },
        required: ['clientRef', 'lineItems'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_invoice_status',
      description: 'Update invoice status (e.g. mark sent or paid).',
      parameters: {
        type: 'object',
        properties: {
          invoiceRef: { type: 'string', description: 'Invoice number or id' },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] },
        },
        required: ['invoiceRef', 'status'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_scope_entry',
      description: 'Log an out-of-scope request.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          clientRef: { type: 'string' },
          projectRef: { type: 'string' },
          requestedBy: { type: 'string' },
          estimatedHours: { type: 'number' },
          billable: { type: 'boolean' },
        },
        required: ['title', 'clientRef'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_proposal',
      description: 'Create a draft proposal.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          clientRef: { type: 'string' },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                rate: { type: 'number' },
              },
              required: ['description', 'rate'],
            },
          },
          validUntil: { type: 'string', description: 'YYYY-MM-DD' },
          notes: { type: 'string' },
        },
        required: ['title', 'clientRef', 'lineItems'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_expense',
      description: 'Record a business expense.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          category: {
            type: 'string',
            enum: ['materials', 'software', 'travel', 'mileage', 'subcontractor', 'equipment', 'office', 'other'],
          },
          clientRef: { type: 'string' },
          billable: { type: 'boolean' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['description', 'amount'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contract_draft',
      description: 'Create a draft contract from a template.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          clientRef: { type: 'string' },
          value: { type: 'number' },
          template: { type: 'string', enum: ['freelance', 'retainer', 'nda'], description: 'Contract template key' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
        required: ['title', 'clientRef', 'value'],
        additionalProperties: false,
      },
    },
  },
]

export function buildCursorCliSystemPrompt(appContext: string): string {
  return `You are the Cursor CLI assistant inside WorkVault — you help contractors draft prompts and terminal commands for the Cursor \`agent\` CLI.

Your job:
- Use tools to read WorkVault data (clients, invoices, contracts, projects) so prompts are specific and accurate.
- When the user wants to run something in Cursor CLI, provide a copy-paste ready command in a \`\`\`bash code block.
- Command format: agent -p "prompt text" [--model "name"] [--mode=plan|ask]
- Escape double quotes inside prompts with backslash.
- Explain briefly what the agent prompt will do and any files/context the user should run it from.
- You may suggest saving a good prompt as a WorkVault workflow.
- Do not claim you ran the CLI — the user runs commands locally in their terminal.
- Keep replies concise. Use markdown lists when comparing options.

Today's date is ${new Date().toISOString().split('T')[0]}.

Current app context:
${appContext}`
}

export function buildSystemPrompt(appContext: string): string {
  return `You are WorkVault Assistant — an AI copilot embedded in WorkVault, a freelancer business OS.

You help the user manage clients, pipeline projects, time tracking, invoices, contracts, proposals, scope changes, expenses, and navigate the app.

Rules:
- Use tools to read data and perform actions. Prefer tools over guessing IDs.
- Resolve clients and projects by name when the user mentions them (clientRef, projectRef, invoiceRef accept names or ids).
- After creating or updating something important, briefly confirm what you did and suggest a next step.
- For destructive actions (delete, reset): explain you cannot delete via assistant — direct them to the relevant page.
- Keep replies concise and friendly. Use markdown sparingly (bold for emphasis, lists when helpful).
- If a request is ambiguous, ask one clarifying question OR make a reasonable assumption and state it.
- Today's date is ${new Date().toISOString().split('T')[0]}.

Current app context:
${appContext}`
}
