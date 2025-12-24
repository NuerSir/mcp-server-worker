import { html, raw } from "hono/html";
import type { Tool } from "./utils/tools";

export const layout = (content: any, title: string) => html`
  <!DOCTYPE html>
  <html lang="en" class="dark">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <!-- Fonts -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      
      <!-- Tailwind CSS -->
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
              },
              colors: {
                background: '#09090b', // zinc-950
                surface: '#18181b', // zinc-900
                surfaceHighlight: '#27272a', // zinc-800
                primary: '#8b5cf6', // violet-500
                primaryHover: '#7c3aed', // violet-600
                secondary: '#06b6d4', // cyan-500
              }
            }
          }
        }
      </script>

      <!-- Alpine.js -->
      <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

      <style>
        [x-cloak] { display: none !important; }
        .glass {
            background: rgba(24, 24, 27, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .gradient-text {
            background: linear-gradient(to right, #c084fc, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
      </style>
    </head>
    <body 
        class="bg-background text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white"
        x-data="{ 
            search: '', 
            selectedTool: null, 
            isConfigOpen: false, 
            apiKey: '',
            result: null,
            loading: false,
            params: {},
            copySuccess: '',
            
            async runTool() {
                this.loading = true;
                this.result = null;
                try {
                    const response = await fetch('/mcp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'text/event-stream', // Fix: McpAgent transport requires this or similar
                            ...(this.apiKey ? { 'Authorization': 'Bearer ' + this.apiKey } : {})
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'tools/call',
                            params: {
                                name: this.selectedTool.name,
                                arguments: this.params
                            },
                            id: Date.now()
                        })
                    });
                    
                    if (response.status === 401) {
                        this.result = { error: 'Unauthorized: Please provide a valid API Key' };
                    } else {
                        const data = await response.json();
                        this.result = data;
                    }
                } catch (e) {
                    this.result = { error: e.message };
                } finally {
                    this.loading = false;
                }
            },

            copyToClipboard(text, key) {
                 navigator.clipboard.writeText(text).then(() => {
                    this.copySuccess = key;
                    setTimeout(() => this.copySuccess = '', 2000);
                 });
            }
        }"
    >
      
      <!-- Navigation -->
      <nav class="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 gap-8">
            <div class="flex items-center gap-3 shrink-0">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="font-bold text-lg tracking-tight hidden sm:block">Worker MCP</span>
            </div>
            
            <!-- Search Bar in Header -->
            <div class="flex-1 max-w-lg relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    x-model="search" 
                    type="text" 
                    class="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-black/40 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 sm:text-sm transition-all focus:bg-black/60" 
                    placeholder="Search tools..."
                >
            </div>

            <div class="flex items-center gap-4 shrink-0">
               <div class="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface/50 border border-white/5 text-xs font-medium text-emerald-400">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  System Operational
               </div>
               <a href="https://github.com/modelcontextprotocol" target="_blank" class="text-zinc-400 hover:text-white transition-colors">
                 <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path></svg>
               </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full z-10">
        <!-- Ambient Background Effects -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10 pointer-events-none mix-blend-screen"></div>
        <div class="absolute top-40 right-0 w-96 h-96 bg-secondary/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

        ${content}
      </main>

      <!-- Footer -->
      <footer class="border-t border-white/5 py-8 mt-12 bg-black/20 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-zinc-500 text-sm">
                Powered by <span class="text-zinc-300 font-medium">Model Context Protocol</span> & Cloudflare Workers
            </p>
        </div>
      </footer>

    </body>
  </html>
`;

export const dashboard = (tools: Tool[]) => html`
    <div>
    <!-- Hero Section -->
    <div class="text-center mb-16 relative">
        <h1 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span class="gradient-text">Intelligent Context</span><br/>
            <span>for your AI Models</span>
        </h1>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A high-performance MCP server running on the edge, seamlessly bridging your local setup with powerful cloud tools.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button @click="isConfigOpen = true" class="group relative px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                <span>Connect to IDE</span>
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
            <a href="#tools" class="px-8 py-3.5 rounded-full bg-surface border border-white/10 hover:bg-surfaceHighlight transition-colors text-zinc-300 font-medium">
                Explore Tools
            </a>
        </div>
    </div>

    <!-- Stats -->
    <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-8" id="tools">
         <div class="flex gap-8">
            <div>
                <div class="text-3xl font-bold text-white mb-1 font-mono">${tools.length}</div>
                <div class="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Tools</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-white mb-1 font-mono">0ms</div>
                <div class="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Latency</div>
            </div>
         </div>
    </div>

    <!-- Tool Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        ${tools.map((tool) => raw(`
            <div 
                class="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                x-show="search === '' || '${tool.name}'.toLowerCase().includes(search.toLowerCase()) || '${tool.description}'.toLowerCase().includes(search.toLowerCase())"
                @click="selectedTool = ${JSON.stringify(tool).replace(/"/g, '&quot;')}; params = {}; result = null;"
            >
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-surfaceHighlight border border-white/5 flex items-center justify-center text-xl font-bold text-zinc-400 group-hover:text-white group-hover:bg-primary/20 group-hover:border-primary/20 transition-all">
                        ${tool.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-500 font-mono border border-white/5">v1.0</span>
                </div>
                
                <h3 class="text-lg font-bold text-zinc-100 mb-2 group-hover:text-primary transition-colors">${tool.name}</h3>
                <p class="text-zinc-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                    ${tool.description}
                </p>

                <div class="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span class="text-xs text-zinc-500 font-medium">Ready</span>
                    </div>
                    <span class="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all flex items-center gap-1">
                        Try Tool 
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </span>
                </div>
            </div>
        `))}
    </div>

    <!-- Configuration Modal -->
    <div 
        x-show="isConfigOpen" 
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 backdrop-blur-none"
        x-transition:enter-end="opacity-100 backdrop-blur-sm"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100 backdrop-blur-sm"
        x-transition:leave-end="opacity-0 backdrop-blur-none"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        style="display: none;"
    >
        <div 
            @click.away="isConfigOpen = false"
            class="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all"
        >
            <div class="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 class="text-xl font-bold text-white">Connect to your Environment</h3>
                <button @click="isConfigOpen = false" class="text-zinc-500 hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="p-6 space-y-6" x-data="{ activeTab: 'cursor' }">
                <!-- Tab Nav -->
                <div class="flex p-1 bg-surface rounded-lg">
                    <button @click="activeTab = 'cursor'" :class="activeTab === 'cursor' ? 'bg-surfaceHighlight text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'" class="flex-1 py-2 text-sm font-medium rounded-md transition-all">Cursor / Windsurf</button>
                    <button @click="activeTab = 'claude'" :class="activeTab === 'claude' ? 'bg-surfaceHighlight text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'" class="flex-1 py-2 text-sm font-medium rounded-md transition-all">Claude Desktop</button>
                    <button @click="activeTab = 'env'" :class="activeTab === 'env' ? 'bg-surfaceHighlight text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'" class="flex-1 py-2 text-sm font-medium rounded-md transition-all">Environment</button>
                </div>

                <!-- Cursor/Windsurf Config -->
                <div x-show="activeTab === 'cursor'" class="space-y-4">
                    <p class="text-sm text-zinc-400">Add the following to your <code class="text-primary bg-primary/10 px-1 py-0.5 rounded">.cursor/mcp.json</code> or project configuration.</p>
                    <div class="relative group">
                         <div class="absolute right-4 top-4">
                            <button @click="copyToClipboard(JSON.stringify({mcpServers:{'worker-mcp':{url:window.location.origin+'/mcp',headers:{Authorization:'Bearer YOUR_API_KEY'}}}},null,2), 'cursor')" class="text-zinc-500 hover:text-white transition-colors p-2 bg-surface rounded-md border border-white/5">
                                <span x-show="copySuccess !== 'cursor'"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></span>
                                <span x-show="copySuccess === 'cursor'" class="text-emerald-400 text-xs font-bold">Copied!</span>
                            </button>
                        </div>
                        <pre class="bg-black/50 p-4 rounded-xl border border-white/5 text-sm text-zinc-300 font-mono overflow-x-auto"><code x-text="JSON.stringify({
  mcpServers: {
    'worker-mcp': {
      url: window.location.origin + '/mcp',
      headers: {
        Authorization: 'Bearer YOUR_API_KEY' 
      }
    }
  }
}, null, 2)"></code></pre>
                    </div>
                </div>

                <!-- Claude config -->
                <div x-show="activeTab === 'claude'" class="space-y-4">
                     <p class="text-sm text-zinc-400">Add to your <code class="text-primary bg-primary/10 px-1 py-0.5 rounded">claude_desktop_config.json</code>.</p>
                     <div class="relative group">
                         <div class="absolute right-4 top-4">
                            <button @click="copyToClipboard(JSON.stringify({mcpServers:{'worker-mcp':{command:'npx',args:['-y','@modelcontextprotocol/server-sse',window.location.origin+'/sse']}}},null,2), 'claude')" class="text-zinc-500 hover:text-white transition-colors p-2 bg-surface rounded-md border border-white/5">
                                <span x-show="copySuccess !== 'claude'"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></span>
                                <span x-show="copySuccess === 'claude'" class="text-emerald-400 text-xs font-bold">Copied!</span>
                            </button>
                        </div>
                        <pre class="bg-black/50 p-4 rounded-xl border border-white/5 text-sm text-zinc-300 font-mono overflow-x-auto"><code x-text="JSON.stringify({
  mcpServers: {
    'worker-mcp': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol-tools/http-client', window.location.origin + '/mcp', 'YOUR_API_KEY']
    }
  }
}, null, 2)"></code></pre>
                        <p class="text-xs text-zinc-500 mt-2">* Requires a local http-client bridge for Claude Desktop.</p>
                    </div>
                </div>
                
                 <!-- Env config -->
                <div x-show="activeTab === 'env'" class="space-y-4">
                     <p class="text-sm text-zinc-400">Remember to set your secrets in Cloudflare dashboard.</p>
                      <div class="bg-surface/50 p-4 rounded-lg border border-white/5 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-zinc-300 font-mono">API_KEY</span>
                            <span class="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Required</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-zinc-300 font-mono">SEARXNG_URL</span>
                             <span class="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">Optional</span>
                        </div>
                      </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Playground Slide-over -->
    <div 
        x-show="selectedTool" 
        class="fixed inset-0 z-[100] overflow-hidden" 
        style="display: none;"
    >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="selectedTool = null"></div>
        
        <div class="absolute inset-y-0 right-0 max-w-2xl w-full flex">
            <div 
                x-show="selectedTool"
                x-transition:enter="transform transition ease-in-out duration-300"
                x-transition:enter-start="translate-x-full"
                x-transition:enter-end="translate-x-0"
                x-transition:leave="transform transition ease-in-out duration-300"
                x-transition:leave-start="translate-x-0"
                x-transition:leave-end="translate-x-full"
                class="w-full bg-[#0f0f11] border-l border-white/10 shadow-2xl flex flex-col h-full"
            >
                <!-- Header -->
                <div class="px-8 py-6 border-b border-white/5 flex items-start justify-between bg-surface/50 shadow-sm">
                    <div class="flex-1 mr-8">
                        <div class="flex items-center gap-3 mb-3">
                             <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg font-bold text-primary" x-text="selectedTool?.name.substring(0,2).toUpperCase()"></div>
                             <h2 class="text-2xl font-bold text-white tracking-tight" x-text="selectedTool?.name"></h2>
                             <span class="px-2 py-0.5 rounded-full bg-white/5 text-xs font-mono text-zinc-500 border border-white/5">TOOL</span>
                        </div>
                        <!-- Description Box -->
                        <div class="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                           <p class="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed" x-text="selectedTool?.description"></p>
                        </div>
                    </div>
                    <button @click="selectedTool = null" class="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="flex-1 overflow-y-auto p-8 space-y-10">
                    
                    <!-- Auth -->
                    <div class="space-y-4">
                        <label class="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Authentication</label>
                        <div class="relative">
                            <input x-model="apiKey" type="password" placeholder="Enter Server API Key" class="block w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all">
                        </div>
                    </div>

                    <!-- Params Form -->
                    <div class="space-y-6">
                        <div class="flex items-center justify-between border-b border-white/5 pb-2">
                             <label class="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Input Parameters</label>
                             <span class="text-xs text-zinc-600 font-mono bg-white/5 px-2 py-0.5 rounded">JSON Schema</span>
                        </div>
                        
                        <div class="space-y-6">
                            <template x-for="(prop, key) in (selectedTool?.schema?.shape || selectedTool?.schema?.properties || {})" :key="key">
                                <div class="group">
                                    <label class="block text-sm font-medium text-zinc-300 mb-2 flex items-center justify-between">
                                        <div class="flex items-center gap-1">
                                            <span x-text="key" class="font-mono text-primary/90"></span>
                                            <span x-show="selectedTool?.schema?.required?.includes(key)" class="text-red-500 text-xs" title="Required">*</span>
                                        </div>
                                        <span class="text-xs text-zinc-600 font-normal" x-text="'string'"></span>
                                    </label>
                                     
                                    <template x-if="key === 'thought'">
                                        <textarea 
                                            @input="params[key] = $event.target.value" 
                                            :placeholder="'Enter ' + key"
                                            rows="3"
                                            class="block w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-y"
                                        ></textarea>
                                    </template>
                                    
                                    <template x-if="key !== 'thought'">
                                        <input 
                                            type="text" 
                                            @input="params[key] = $event.target.value" 
                                            :placeholder="'Enter ' + key"
                                            class="block w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                                        >
                                    </template>
                                    
                                     <p x-show="prop.description" class="mt-2 text-xs text-zinc-500 leading-normal" x-text="prop.description"></p>
                                </div>
                            </template>
                            <div x-show="!selectedTool?.schema?.shape && !selectedTool?.schema?.properties" class="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                <span class="text-zinc-500 text-sm italic">No input parameters required.</span>
                            </div>
                        </div>
                    </div>

                    <!-- Output -->
                    <div x-show="result" class="space-y-4 pt-6 border-t border-white/5" x-transition>
                        <div class="flex items-center justify-between">
                            <label class="block text-xs font-bold text-emerald-400 uppercase tracking-widest">Execution Result</label>
                            <span class="text-xs text-zinc-600 font-mono" x-text="new Date().toLocaleTimeString()"></span>
                        </div>
                        <div class="relative bg-black/50 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                             <pre class="p-4 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-96" x-text="JSON.stringify(result, null, 2)"></pre>
                        </div>
                    </div>

                </div>

                <!-- Footer / Action -->
                <div class="p-8 border-t border-white/5 bg-surface/50 backdrop-blur-md">
                    <button 
                        @click="runTool()"
                        :disabled="loading"
                        class="w-full py-4 bg-gradient-to-r from-primary to-primaryHover text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        <svg x-show="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span x-text="loading ? 'Running Protocol...' : 'Execute Tool'"></span>
                    </button>
                    <p class="text-center mt-3 text-xs text-zinc-600">Requests are sent directly to the MCP endpoint.</p>
                </div>
            </div>
        </div>
    </div>
    
    </div>
`;
