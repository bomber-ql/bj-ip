// ==================== Markdown转换功能 ====================

/**
 * Markdown转HTML转换器
 */
class MarkdownConverter {
    constructor() {
        this.rules = [
            {
                pattern: /^### (.*$)/gim,
                replacement: '<h3>$1</h3>'
            },
            {
                pattern: /^## (.*$)/gim,
                replacement: '<h2>$1</h2>'
            },
            {
                pattern: /^# (.*$)/gim,
                replacement: '<h1>$1</h1>'
            },
            {
                pattern: /\*\*(.*?)\*\*/g,
                replacement: '<strong>$1</strong>'
            },
            {
                pattern: /\*(.*?)\*/g,
                replacement: '<em>$1</em>'
            },
            {
                pattern: /^> (.*$)/gim,
                replacement: '<blockquote>$1</blockquote>'
            },
            {
                pattern: /`(.*?)`/g,
                replacement: '<code>$1</code>'
            },
            {
                pattern: /!\[(.*?)\]\((.*?)\)/g,
                replacement: '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">'
            },
            {
                pattern: /\[(.*?)\]\((.*?)\)/g,
                replacement: '<a href="$2" target="_blank">$1</a>'
            }
        ];
    }

    /**
     * 将Markdown文本转换为HTML
     * @param {string} markdownText - Markdown格式文本
     * @returns {string} HTML格式文本
     */
    toHtml(markdownText) {
        if (!markdownText) return '';
        
        let html = markdownText;
        
        // 应用所有转换规则
        this.rules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });
        
        // 处理段落
        html = this._processParagraphs(html);
        
        // 处理列表
        html = this._processLists(html);
        
        // 处理换行
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    /**
     * 处理段落
     * @private
     */
    _processParagraphs(text) {
        const lines = text.split('\n');
        let result = [];
        let currentParagraph = [];
        
        for (let line of lines) {
            line = line.trim();
            
            if (!line) {
                if (currentParagraph.length > 0) {
                    result.push(`<p>${currentParagraph.join(' ')}</p>`);
                    currentParagraph = [];
                }
                continue;
            }
            
            // 如果已经是HTML标签，直接添加
            if (line.startsWith('<h') || line.startsWith('<blockquote') || 
                line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('<li')) {
                if (currentParagraph.length > 0) {
                    result.push(`<p>${currentParagraph.join(' ')}</p>`);
                    currentParagraph = [];
                }
                result.push(line);
            } else {
                currentParagraph.push(line);
            }
        }
        
        if (currentParagraph.length > 0) {
            result.push(`<p>${currentParagraph.join(' ')}</p>`);
        }
        
        return result.join('\n');
    }

    /**
     * 处理列表
     * @private
     */
    _processLists(text) {
        // 处理无序列表
        text = text.replace(/^- (.*$)/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 处理有序列表
        text = text.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
        
        return text;
    }

    /**
     * 增强的Markdown转HTML，包含更多格式支持
     */
    toHtmlEnhanced(markdownText) {
        if (!markdownText) return '';
        
        let html = markdownText;
        
        // 扩展的转换规则
        const enhancedRules = [
            // 标题
            { pattern: /^###### (.*$)/gim, replacement: '<h6>$1</h6>' },
            { pattern: /^##### (.*$)/gim, replacement: '<h5>$1</h5>' },
            { pattern: /^#### (.*$)/gim, replacement: '<h4>$1</h4>' },
            { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            
            // 粗体和斜体
            { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            { pattern: /__(.*?)__/g, replacement: '<strong>$1</strong>' },
            { pattern: /_(.*?)_/g, replacement: '<em>$1</em>' },
            
            // 代码
            { pattern: /`(.*?)`/g, replacement: '<code>$1</code>' },
            { pattern: /```([\s\S]*?)```/g, replacement: '<pre><code>$1</code></pre>' },
            
            // 引用
            { pattern: /^> (.*$)/gim, replacement: '<blockquote>$1</blockquote>' },
            
            // 图片和链接
            { pattern: /!\[(.*?)\]\((.*?)\)/g, replacement: '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">' },
            { pattern: /\[(.*?)\]\((.*?)\)/g, replacement: '<a href="$2" target="_blank">$1</a>' },
            
            // 水平线
            { pattern: /^---$/gim, replacement: '<hr>' },
            { pattern: /^\*\*\*$/gim, replacement: '<hr>' },
            { pattern: /^___$/gim, replacement: '<hr>' }
        ];
        
        // 应用增强规则
        enhancedRules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });
        
        // 处理段落和列表
        html = this._processEnhancedParagraphs(html);
        
        return html;
    }

    /**
     * 增强的段落处理
     * @private
     */
    _processEnhancedParagraphs(text) {
        const lines = text.split('\n');
        let result = [];
        let inList = false;
        let listItems = [];
        
        for (let line of lines) {
            line = line.trim();
            
            if (!line) {
                if (listItems.length > 0) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    listItems = [];
                    inList = false;
                }
                continue;
            }
            
            // 检测列表项
            if (line.match(/^[-*+] /) || line.match(/^\d+\. /)) {
                if (!inList && listItems.length === 0) {
                    inList = true;
                }
                const listItem = line.replace(/^[-*+] (.*)$/, '<li>$1</li>')
                                    .replace(/^\d+\. (.*)$/, '<li>$1</li>');
                listItems.push(listItem);
            } else {
                if (listItems.length > 0) {
                    result.push(inList ? `<ul>${listItems.join('')}</ul>` : `<ol>${listItems.join('')}</ol>`);
                    listItems = [];
                    inList = false;
                }
                
                // 如果不是HTML标签，包装成段落
                if (!line.startsWith('<') || line.startsWith('</')) {
                    result.push(`<p>${line}</p>`);
                } else {
                    result.push(line);
                }
            }
        }
        
        // 处理最后的列表
        if (listItems.length > 0) {
            result.push(inList ? `<ul>${listItems.join('')}</ul>` : `<ol>${listItems.join('')}</ol>`);
        }
        
        return result.join('\n');
    }
}

// 创建全局Markdown转换器实例
window.markdownConverter = new MarkdownConverter();

// 兼容旧版本的函数
function markdownToHtml(markdownText) {
    return window.markdownConverter.toHtml(markdownText);
}

function markdownToHtmlEnhanced(markdownText) {
    return window.markdownConverter.toHtmlEnhanced(markdownText);
}

// Markdown预览功能
function setupMarkdownPreview() {
    const jsonInput = document.getElementById('jsonInput');
    const previewBtn = document.getElementById('previewMarkdown');
    const previewContainer = document.getElementById('markdownPreview');
    
    if (!jsonInput || !previewBtn || !previewContainer) return;
    
    previewBtn.addEventListener('click', function() {
        try {
            const jsonValue = jsonInput.value;
            if (!jsonValue.trim()) {
                alert('请输入JSON数据');
                return;
            }
            
            // 解析JSON获取markdown内容
            const parsed = parseJsonInput(jsonValue);
            if (!parsed.success) {
                alert('JSON解析失败: ' + parsed.message);
                return;
            }
            
            const { markdownContent, title } = parsed;
            
            // 转换Markdown为HTML
            const htmlContent = window.markdownConverter.toHtmlEnhanced(markdownContent);
            
            // 显示预览
            previewContainer.innerHTML = `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: white;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">📝 Markdown预览: ${title}</h2>
                    <div style="min-height: 200px; line-height: 1.6;">
                        ${htmlContent}
                    </div>
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                        <strong>预览说明:</strong> 这里显示的是Markdown转换后的效果，实际生成的文章会包含标题、作者、标签等信息。
                    </div>
                </div>
            `;
            
            previewContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Markdown预览错误:', error);
            alert('预览生成失败: ' + error.message);
        }
    });
}

// Markdown格式帮助
function showMarkdownHelp() {
    const helpContent = `
# Markdown格式指南

## 标题
# 一级标题
## 二级标题
### 三级标题

## 文本格式
**粗体文本**
*斜体文本*
\`代码片段\`

## 引用
> 这里是引用内容

## 列表
- 无序列表项
- 另一个列表项

1. 有序列表项
2. 另一个列表项

## 链接和图片
[链接文本](https://example.com)
![图片描述](图片URL)

## 代码块
\`\`\`
代码块内容
多行代码
\`\`\`

## 分割线
---
    `;
    
    const helpWindow = window.open('', '_blank');
    helpWindow.document.write(`
        <html>
            <head>
                <title>Markdown格式指南</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    pre { 
                        background: #f5f5f5; 
                        padding: 20px; 
                        border-radius: 8px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    code {
                        background: #f5f5f5;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: monospace;
                    }
                    h1 { color: #2c3e50; }
                </style>
            </head>
            <body>
                <h1>📖 Markdown格式指南</h1>
                <div>${window.markdownConverter.toHtmlEnhanced(helpContent)}</div>
                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ 打印指南</button>
                <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">❌ 关闭</button>
            </body>
        </html>
    `);
}

// 初始化Markdown相关功能
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行以确保所有依赖加载完成
    setTimeout(() => {
        setupMarkdownPreview();
        
        // 添加Markdown帮助按钮（如果不存在）
        const helpBtn = document.getElementById('markdownHelp');
        if (!helpBtn) {
            const buttonContainer = document.querySelector('.button-group');
            if (buttonContainer) {
                const newHelpBtn = document.createElement('button');
                newHelpBtn.id = 'markdownHelp';
                newHelpBtn.className = 'btn';
                newHelpBtn.textContent = '📖 Markdown帮助';
                newHelpBtn.onclick = showMarkdownHelp;
                buttonContainer.appendChild(newHelpBtn);
            }
        }
    }, 100);
});