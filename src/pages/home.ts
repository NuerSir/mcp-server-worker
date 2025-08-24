import { html, raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

/**
 * 工具信息接口
 */
export interface ToolInfo {
  name: string;
  description: string;
  schema: Record<string, any>;
  status?: 'active' | 'inactive' | 'error';
}

/**
 * 生成工具卡片 HTML
 */
function renderToolCard(tool: ToolInfo): HtmlEscapedString {
  const statusColor = tool.status === 'active' ? 'bg-green-100 text-green-800' : 
                     tool.status === 'error' ? 'bg-red-100 text-red-800' : 
                     'bg-gray-100 text-gray-600';
  
  const statusText = tool.status === 'active' ? '可用' : 
                    tool.status === 'error' ? '错误' : 
                    '未知';

  // 安全地获取参数数量
  const paramCount = tool.schema && typeof tool.schema === 'object' ? Object.keys(tool.schema).length : 0;

  return html`
    <div class="tool-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
         data-tool-name="${tool.name}">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-semibold text-gray-900">${tool.name}</h3>
        <span class="px-2 py-1 text-xs rounded-full ${statusColor}">
          ${statusText}
        </span>
      </div>
      <p class="text-gray-600 text-sm mb-4 line-clamp-2">${tool.description}</p>
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">
          ${paramCount} 个参数
        </span>
        <button class="try-tool-btn text-blue-600 hover:text-blue-800 text-sm font-medium"
                data-tool-name="${tool.name}">
          试用 →
        </button>
      </div>
    </div>
  `;
}

/**
 * 生成工具试用对话框 HTML
 */
function renderToolDialog(): HtmlEscapedString {
  return html`
    <div id="tool-dialog" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div class="flex justify-between items-center p-6 border-b">
            <h2 id="dialog-title" class="text-xl font-semibold text-gray-900">工具试用</h2>
            <button id="close-dialog" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <div id="dialog-content">
              <!-- 动态内容将在这里插入 -->
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button id="cancel-btn" class="px-4 py-2 text-gray-600 hover:text-gray-800">取消</button>
            <button id="execute-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              执行
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 生成设置对话框 HTML
 */
function renderSettingsDialog(): HtmlEscapedString {
  return html`
    <div id="settings-dialog" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="flex justify-between items-center p-6 border-b">
            <h2 class="text-xl font-semibold text-gray-900">系统设置</h2>
            <button id="close-settings" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                <input
                  type="password"
                  id="global-api-token"
                  placeholder="请输入 API Token"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p id="token-status" class="text-xs text-gray-500 mt-1">未设置</p>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button id="clear-token-btn" class="px-4 py-2 text-red-600 hover:text-red-800">清除</button>
            <button id="save-token-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 生成首页 HTML 内容
 */
export function renderHomePage(tools: ToolInfo[]): HtmlEscapedString {
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MCP Server Worker - 工具中心</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .tool-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }
          
          @media (max-width: 640px) {
            .tool-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- 头部 -->
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">MCP Server Worker</h1>
                <p class="text-gray-600 mt-1">工具中心 - 可用工具总览</p>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-500">共 ${tools.length} 个工具</span>
                <button id="settings-btn" class="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1">
                  ⚙️ 设置
                </button>
                <button id="refresh-btn" class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  刷新
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- 主要内容 -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 搜索和筛选 -->
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <input
                  type="text"
                  id="search-input"
                  placeholder="搜索工具名称或描述..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select id="status-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option value="">所有状态</option>
                <option value="active">可用</option>
                <option value="inactive">不可用</option>
                <option value="error">错误</option>
              </select>
            </div>
          </div>

          <!-- 工具网格 -->
          <div id="tools-grid" class="tool-grid">
            ${raw(tools.map(tool => renderToolCard(tool)).join(''))}
          </div>

          <!-- 空状态 -->
          <div id="empty-state" class="text-center py-12 hidden">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">没有找到工具</h3>
            <p class="text-gray-600">尝试调整搜索条件或筛选器</p>
          </div>
        </main>

        <!-- 工具试用对话框 -->
        ${renderToolDialog()}

        <!-- 设置对话框 -->
        ${renderSettingsDialog()}

        <!-- JavaScript -->
        <script>
          // 工具数据
          const toolsData = ${raw(JSON.stringify(tools))};
          
          // DOM 元素
          const searchInput = document.getElementById('search-input');
          const statusFilter = document.getElementById('status-filter');
          const toolsGrid = document.getElementById('tools-grid');
          const emptyState = document.getElementById('empty-state');
          const refreshBtn = document.getElementById('refresh-btn');
          const settingsBtn = document.getElementById('settings-btn');
          const toolDialog = document.getElementById('tool-dialog');
          const settingsDialog = document.getElementById('settings-dialog');
          const dialogTitle = document.getElementById('dialog-title');
          const dialogContent = document.getElementById('dialog-content');
          const closeDialog = document.getElementById('close-dialog');
          const closeSettings = document.getElementById('close-settings');
          const cancelBtn = document.getElementById('cancel-btn');
          const executeBtn = document.getElementById('execute-btn');

          let currentTool = null;

          // 搜索和筛选功能
          function filterTools() {
            const searchTerm = searchInput.value.toLowerCase();
            const statusValue = statusFilter.value;
            
            const filtered = toolsData.filter(tool => {
              const matchesSearch = tool.name.toLowerCase().includes(searchTerm) || 
                                  tool.description.toLowerCase().includes(searchTerm);
              const matchesStatus = !statusValue || tool.status === statusValue;
              return matchesSearch && matchesStatus;
            });
            
            renderFilteredTools(filtered);
          }

          // 渲染筛选后的工具
          function renderFilteredTools(tools) {
            if (tools.length === 0) {
              toolsGrid.classList.add('hidden');
              emptyState.classList.remove('hidden');
            } else {
              toolsGrid.classList.remove('hidden');
              emptyState.classList.add('hidden');
              
              toolsGrid.innerHTML = tools.map(tool => \`
                <div class="tool-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     data-tool-name="\${tool.name}">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-semibold text-gray-900">\${tool.name}</h3>
                    <span class="px-2 py-1 text-xs rounded-full \${getStatusColor(tool.status)}">
                      \${getStatusText(tool.status)}
                    </span>
                  </div>
                  <p class="text-gray-600 text-sm mb-4 line-clamp-2">\${tool.description}</p>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                      \${tool.schema && typeof tool.schema === 'object' ? Object.keys(tool.schema).length : 0} 个参数
                    </span>
                    <button class="try-tool-btn text-blue-600 hover:text-blue-800 text-sm font-medium"
                            data-tool-name="\${tool.name}">
                      试用 →
                    </button>
                  </div>
                </div>
              \`).join('');
              
              // 重新绑定事件
              bindToolEvents();
            }
          }

          // 获取状态颜色
          function getStatusColor(status) {
            return status === 'active' ? 'bg-green-100 text-green-800' : 
                   status === 'error' ? 'bg-red-100 text-red-800' : 
                   'bg-gray-100 text-gray-600';
          }

          // 获取状态文本
          function getStatusText(status) {
            return status === 'active' ? '可用' : 
                   status === 'error' ? '错误' : 
                   '未知';
          }

          // 绑定工具卡片事件
          function bindToolEvents() {
            document.querySelectorAll('.try-tool-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const toolName = btn.dataset.toolName;
                openToolDialog(toolName);
              });
            });
          }

          // 打开工具对话框
          function openToolDialog(toolName) {
            currentTool = toolsData.find(tool => tool.name === toolName);
            if (!currentTool) return;
            
            dialogTitle.textContent = \`试用工具: \${currentTool.name}\`;
            
            // 生成参数表单 - 安全地处理 schema
            const schema = currentTool.schema || {};
            const schemaKeys = typeof schema === 'object' ? Object.keys(schema) : [];
            
            const parameterFields = schemaKeys.length === 0 ? 
              '<p class="text-gray-600 mb-4">此工具无需参数</p>' :
              schemaKeys.map(key => \`
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">\${key}</label>
                  <input type="text" name="\${key}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                         placeholder="请输入 \${key}">
                </div>
              \`).join('');
            
            dialogContent.innerHTML = \`
              <div class="space-y-4">
                <p class="text-gray-600 mb-4">\${currentTool.description}</p>
                
                <!-- 工具参数 -->
                <form id="tool-form">
                  \${parameterFields}
                </form>
              </div>
            \`;
            
            // 重置按钮状态
            executeBtn.textContent = '执行';
            executeBtn.disabled = false;
            executeBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
            
            toolDialog.classList.remove('hidden');
          }

          // 关闭工具对话框
          function closeToolDialog() {
            toolDialog.classList.add('hidden');
            currentTool = null;
          }

          // 打开设置对话框
          function openSettingsDialog() {
            settingsDialog.classList.remove('hidden');
            loadSavedToken();
          }

          // 关闭设置对话框
          function closeSettingsDialog() {
            settingsDialog.classList.add('hidden');
          }

          // 根据工具schema转换参数类型
          function convertArgsBySchema(args, schema) {
            const converted = {};
            for (const [key, value] of Object.entries(args)) {
              if (schema[key]) {
                const schemaInfo = schema[key];
                // 检查是否为数字类型
                if (schemaInfo._def && schemaInfo._def.typeName === 'ZodNumber') {
                  const num = parseFloat(value);
                  converted[key] = isNaN(num) ? value : num;
                } else if (schemaInfo._def && schemaInfo._def.typeName === 'ZodBoolean') {
                  converted[key] = value === 'true' || value === '1' || value === 'yes';
                } else {
                  converted[key] = value;
                }
              } else {
                converted[key] = value;
              }
            }
            return converted;
          }

          // 执行工具
          async function executeTool() {
            if (!currentTool) return;
            
            // 从 localStorage 获取 API Token
            const apiToken = localStorage.getItem('apiToken');
            if (!apiToken) {
              alert('请先在设置中配置 API Token');
              return;
            }
            
            const formData = new FormData(document.getElementById('tool-form'));
            const rawArgs = {};
            for (const [key, value] of formData.entries()) {
              rawArgs[key] = value;
            }
            
            // 根据工具schema转换参数类型
            const args = convertArgsBySchema(rawArgs, currentTool.schema || {});
            
            executeBtn.textContent = '执行中...';
            executeBtn.disabled = true;
            
            try {
              const response = await fetch('/invoke', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${apiToken}\`
                },
                body: JSON.stringify({
                  name: currentTool.name,
                  args: args
                })
              });
              
              const result = await response.json();
              
              if (response.ok) {
                // 显示成功结果
                dialogContent.innerHTML = \`
                  <div class="space-y-4">
                    <h4 class="font-medium text-green-600">✅ 执行成功</h4>
                    <pre class="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-64">\${JSON.stringify(result, null, 2)}</pre>
                  </div>
                \`;
              } else {
                // 智能提取错误信息 - 正确解析响应结构
                let errorMessage = '执行失败';
                
                try {
                  // 首先检查 content[0].text 结构（这是实际的响应格式）
                  if (result.content && result.content[0] && result.content[0].text) {
                    const textContent = result.content[0].text;
                    try {
                      // 尝试解析 JSON 字符串
                      const parsed = JSON.parse(textContent);
                      if (parsed.error) {
                        errorMessage = parsed.error;
                      } else if (parsed.message) {
                        errorMessage = parsed.message;
                      } else {
                        errorMessage = textContent;
                      }
                    } catch {
                      // 如果不是 JSON，直接使用文本内容
                      errorMessage = textContent;
                    }
                  }
                  // 其他错误格式的兼容处理
                  else if (result.error) {
                    if (typeof result.error === 'string') {
                      errorMessage = result.error;
                    } else if (result.error.message) {
                      errorMessage = result.error.message;
                    } else {
                      errorMessage = JSON.stringify(result.error);
                    }
                  } else if (result.message) {
                    errorMessage = result.message;
                  } else if (result.text) {
                    errorMessage = result.text;
                  } else if (typeof result === 'string') {
                    errorMessage = result;
                  } else {
                    // 最后兜底显示完整响应
                    const responseStr = JSON.stringify(result, null, 2);
                    errorMessage = responseStr.length > 500 ? 
                      responseStr.substring(0, 500) + '...' : 
                      responseStr;
                  }
                } catch (e) {
                  errorMessage = '解析错误信息失败: ' + String(e);
                }
                
                dialogContent.innerHTML = \`
                  <div class="space-y-4">
                    <h4 class="font-medium text-red-600">❌ 执行失败</h4>
                    <div class="bg-red-50 border border-red-200 rounded-md p-4">
                      <p class="text-red-800 font-medium">\${errorMessage}</p>
                      <p class="text-xs text-red-600 mt-1">HTTP状态码: \${response.status}</p>
                      <details class="mt-3">
                        <summary class="text-sm text-red-600 cursor-pointer hover:text-red-800">📋 查看完整响应</summary>
                        <pre class="text-xs text-red-700 mt-2 bg-red-100 p-3 rounded overflow-auto max-h-40 border">\${JSON.stringify(result, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                \`;
              }
              
              // 执行完成后，隐藏执行按钮，只显示关闭按钮
              executeBtn.style.display = 'none';
              cancelBtn.textContent = '关闭';
              
            } catch (error) {
              dialogContent.innerHTML = \`
                <div class="space-y-4">
                  <h4 class="font-medium text-red-600">❌ 网络错误</h4>
                  <div class="bg-red-50 border border-red-200 rounded-md p-4">
                    <p class="text-red-800">\${error.message}</p>
                    <p class="text-xs text-red-600 mt-1">请检查网络连接和服务器状态</p>
                  </div>
                </div>
              \`;
              
              // 网络错误时也隐藏执行按钮
              executeBtn.style.display = 'none';
              cancelBtn.textContent = '关闭';
            }
          }

          // 刷新页面
          function refreshPage() {
            window.location.reload();
          }

          // API Token 管理
          const globalApiToken = document.getElementById('global-api-token');
          const saveTokenBtn = document.getElementById('save-token-btn');
          const clearTokenBtn = document.getElementById('clear-token-btn');
          const tokenStatus = document.getElementById('token-status');

          // 加载保存的 Token
          function loadSavedToken() {
            const savedToken = localStorage.getItem('apiToken');
            if (savedToken) {
              globalApiToken.value = savedToken;
              tokenStatus.textContent = '✅ 已保存';
              tokenStatus.className = 'text-xs text-green-600';
            } else {
              tokenStatus.textContent = '未设置';
              tokenStatus.className = 'text-xs text-gray-500';
            }
          }

          // 保存 Token
          function saveToken() {
            const token = globalApiToken.value.trim();
            if (token) {
              localStorage.setItem('apiToken', token);
              tokenStatus.textContent = '✅ 已保存';
              tokenStatus.className = 'text-xs text-green-600';
            } else {
              alert('请输入有效的 API Token');
            }
          }

          // 清除 Token
          function clearToken() {
            localStorage.removeItem('apiToken');
            globalApiToken.value = '';
            tokenStatus.textContent = '未设置';
            tokenStatus.className = 'text-xs text-gray-500';
          }

          // 事件监听
          searchInput.addEventListener('input', filterTools);
          statusFilter.addEventListener('change', filterTools);
          refreshBtn.addEventListener('click', refreshPage);
          settingsBtn.addEventListener('click', openSettingsDialog);
          closeDialog.addEventListener('click', closeToolDialog);
          closeSettings.addEventListener('click', closeSettingsDialog);
          cancelBtn.addEventListener('click', closeToolDialog);
          executeBtn.addEventListener('click', executeTool);
          saveTokenBtn.addEventListener('click', saveToken);
          clearTokenBtn.addEventListener('click', clearToken);
          
          // 点击对话框外部关闭
          toolDialog.addEventListener('click', (e) => {
            if (e.target === toolDialog) {
              closeToolDialog();
            }
          });

          settingsDialog.addEventListener('click', (e) => {
            if (e.target === settingsDialog) {
              closeSettingsDialog();
            }
          });

          // 初始化
          bindToolEvents();
        </script>
      </body>
    </html>
  `;
}