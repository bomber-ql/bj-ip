// JSON解析器类 - 专门处理JSON数据的清理和解析
class JsonParser {
    constructor() {
        this.defaultAuthor = '怡亚科技';
    }

    // 清理JSON输入
    cleanJsonInput(jsonInput) {
        let cleaned = jsonInput
            .replace(/\\\\n/g, '\\n')
            .replace(/\\\\"/g, '\\"')
            .replace(/\\\\t/g, '\\t')
            .replace(/\\\\r/g, '\\r')
            .replace(/\\\\\\\\/g, '\\\\');
        
        cleaned = cleaned
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
            .replace(/:\s*'([^']*)'/g, ': "$1"')
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/([^\\])""/g, '$1"')
            .replace(/\s+/g, ' ')
            .trim();
        
        try {
            JSON.parse(cleaned);
            return cleaned;
        } catch (e) {
            console.log('初步清理失败，尝试深度清理');
            return cleaned
                .replace(/\\n/g, '\\\\n')
                .replace(/\\"/g, '\\\\"')
                .replace(/\n/g, '\\n')
                .replace(/\t/g, '\\t')
                .replace(/\r/g, '\\r');
        }
    }

    // 解析JSON输入
    parseJsonInput(jsonInput) {
        try {
            const cleanedInput = this.cleanJsonInput(jsonInput);
            console.log('清理后的JSON:', cleanedInput);
            
            const data = JSON.parse(cleanedInput);
            
            // 处理标题
            const title = Array.isArray(data.title) && data.title.length > 0 ? data.title[0] : data.title || '';
            
            // 处理作者
            const author = data.author || this.defaultAuthor;
            
            // 处理摘要
            const summary = data.summary || '';
            
            // 处理Markdown内容
            const markdownContent = data.markdown_content || data.markdownContent || '';
            
            // 处理标签 - 支持多种格式
            const tags = this.processTags(data);
            
            console.log('解析结果:', { title, author, summary, tags });
            
            return {
                success: true,
                title,
                author,
                summary,
                markdownContent,
                tags,
                message: '✅ JSON解析成功'
            };
        } catch (error) {
            console.error('JSON解析错误详情:', error);
            return {
                success: false,
                message: `❌ JSON解析错误: ${error.message}`
            };
        }
    }

    // 处理标签数据
    processTags(data) {
        let tags = [];
        
        // 支持多种标签字段格式
        if (Array.isArray(data.tags)) {
            tags = data.tags;
        } else if (typeof data.tags === 'string') {
            // 如果是逗号分隔的字符串，分割成数组
            tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (data.tag && Array.isArray(data.tag)) {
            // 支持 "tag" 字段
            tags = data.tag;
        } else if (data.tag && typeof data.tag === 'string') {
            tags = data.tag.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // 过滤空标签并去重
        return [...new Set(tags.filter(tag => tag && tag.trim()))];
    }

    // 验证文章数据
    validateArticleData(parsedData) {
        const errors = [];
        
        if (!parsedData.title || parsedData.title.trim() === '') {
            errors.push('文章标题不能为空');
        }
        
        if (!parsedData.markdownContent || parsedData.markdownContent.trim() === '') {
            errors.push('文章内容不能为空');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 生成示例JSON
    generateExampleJson() {
        return `{
  "author": "怡亚科技",
  "markdown_content": "### 文章标题\\\\n这是文章内容...",
  "summary": "文章摘要",
  "title": ["文章标题"],
  "tags": ["标签1", "标签2", "标签3"]
}`;
    }
}

// 初始化全局JSON解析器
window.jsonParser = new JsonParser();