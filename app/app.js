// 下载文本文件函数
function downloadTextFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 文章管理器类
class ArticleManager {
    constructor() {
        this.storageKey = 'blogArticlesIndex';
        this.articles = this.loadFromStorage();
        this.currentFilter = 'all';
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('加载文章数据失败:', e);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.articles));
            return true;
        } catch (e) {
            console.error('保存文章数据失败:', e);
            return false;
        }
    }

    addArticle(articleData) {
        const existingIndex = this.articles.findIndex(a => a.id === articleData.id);
        
        if (existingIndex >= 0) {
            this.articles[existingIndex] = articleData;
            console.log('更新文章:', articleData.title);
        } else {
            this.articles.unshift(articleData);
            console.log('添加新文章:', articleData.title);
        }
        
        this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        return this.saveToStorage();
    }

    removeArticle(articleId) {
        this.articles = this.articles.filter(a => a.id !== articleId);
        return this.saveToStorage();
    }

    getAllArticles() {
        return [...this.articles];
    }

    getArticlesByTag(tag) {
        if (tag === 'all') {
            return this.getAllArticles();
        }
        return this.articles.filter(article => 
            article.tags && article.tags.includes(tag)
        );
    }

    getAllTags() {
        const allTags = new Set();
        this.articles.forEach(article => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags);
    }

    exportIndex() {
        const articles = this.getAllArticles();
        return JSON.stringify(articles, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                this.articles = data;
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    setFilter(tag) {
        this.currentFilter = tag;
    }

    getCurrentFilter() {
        return this.currentFilter;
    }
}

// 标签管理器类
class TagManager {
    constructor() {
        this.tags = [];
    }

    addTag(tag) {
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
            return true;
        }
        return false;
    }

    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
            return true;
        }
        return false;
    }

    getTags() {
        return [...this.tags];
    }

    clearTags() {
        this.tags = [];
    }
}

// 工具类
class Utils {
    static downloadTextFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static generateArticleId(title) {
        let id = '';
        
        if (title && title.trim()) {
            id = title.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .substring(0, 50);
        }
        
        if (!id || id.length < 3) {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 6);
            if (id) {
                id = `${id}-${timestamp}-${randomStr}`;
            } else {
                id = `article-${timestamp}-${randomStr}`;
            }
        }
        
        return id;
    }

    static generateImagesHtml() {
        if (!window.imageManager || !window.imageManager.getSelectedImages) return '';
        
        const selectedImages = window.imageManager.getSelectedImages();
        if (selectedImages.length === 0) return '';
        
        const imageHtml = selectedImages.map(image => 
            `<div style="text-align: center; margin: 20px 0;">
                <img src="${image.dataUrl}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            </div>`
        ).join('\n');
        
        return imageHtml;
    }

    static showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    }

    static clearStatus() {
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = '';
    }

    static getImagePosition() {
        const selected = document.querySelector('input[name="imagePosition"]:checked');
        return selected ? selected.value : 'end';
    }

    static getBasicMarkdownConverter() {
        return {
            toHtml: (content) => {
                return content
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code>$1</code>');
            }
        };
    }
}

// 文章列表管理器
class ArticleListManager {
    constructor(articleManager) {
        this.articleManager = articleManager;
    }

    updateArticleList() {
        const currentFilter = this.articleManager.getCurrentFilter();
        const articles = this.articleManager.getArticlesByTag(currentFilter);
        const articleList = document.getElementById('articleList');
        const articleCount = document.getElementById('articleCount');
        const filterInfo = document.getElementById('filterInfo');
        
        articleCount.textContent = articles.length;
        
        if (currentFilter === 'all') {
            filterInfo.textContent = '';
        } else {
            filterInfo.textContent = `(筛选: ${currentFilter})`;
            filterInfo.style.color = '#3498db';
        }
        
        if (articles.length === 0) {
            articleList.innerHTML = '<p style="color: #666; text-align: center;">暂无文章</p>';
            return;
        }
        
        const listHtml = articles.map(article => `
            <div class="article-item">
                <div>
                    <strong>${article.title}</strong><br>
                    <small style="color: #666;">${article.date} • ${article.id}</small>
                    ${article.tags && article.tags.length > 0 ? `<br><small style="color: #666;">标签: ${article.tags.map(tag => `<span style="background: #e1ecf4; color: #39739d; padding: 1px 4px; border-radius: 8px; margin-right: 3px; font-size: 10px;">${tag}</span>`).join('')}</small>` : ''}
                    ${article.images && article.images.length > 0 ? `<br><small style="color: #27ae60;">包含 ${article.images.length} 张图片</small>` : ''}
                </div>
                <button class="btn" style="padding: 4px 8px; font-size: 12px;" 
                        onclick="removeArticle('${article.id}')">删除</button>
            </div>
        `).join('');
        
        articleList.innerHTML = listHtml;
    }

    updateFilterTags() {
        const filterTags = document.getElementById('filterTags');
        const allTags = this.articleManager.getAllTags();
        const currentFilter = this.articleManager.getCurrentFilter();
        
        let filterHtml = `<span class="filter-tag ${currentFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">全部</span>`;
        
        allTags.forEach(tag => {
            filterHtml += `<span class="filter-tag ${currentFilter === tag ? 'active' : ''}" onclick="setFilter('${tag}')">${tag}</span>`;
        });
        
        filterTags.innerHTML = filterHtml;
    }
}

// 文章生成器类
class ArticleGenerator {
    constructor() {
        this.currentArticle = null;
    }

    generateArticle() {
        const jsonInput = document.getElementById('jsonInput').value;
        
        if (!jsonInput.trim()) {
            Utils.showStatus('请输入JSON数据', 'error');
            return;
        }
        
        Utils.showStatus('🔄 正在生成文章...');
        
        setTimeout(() => {
            let parsed;
            
            if (window.jsonParser && window.jsonParser.parseJsonInput) {
                parsed = window.jsonParser.parseJsonInput(jsonInput);
            } else {
                try {
                    parsed = {
                        success: true,
                        ...JSON.parse(jsonInput)
                    };
                } catch (e) {
                    parsed = {
                        success: false,
                        message: 'JSON解析错误: ' + e.message
                    };
                }
            }
            
            if (!parsed.success) {
                Utils.showStatus(parsed.message, 'error');
                return;
            }
            
            const { title, author, summary, markdownContent, tags } = parsed;
            
            if (!title || !markdownContent) {
                Utils.showStatus('标题和内容不能为空', 'error');
                return;
            }
            
            const articleId = Utils.generateArticleId(title);
            const date = new Date().toISOString().split('T')[0];
            
            // 合并标签
            const jsonTags = Array.isArray(tags) ? tags : [];
            const manualTags = window.tagManager.getTags();
            const allTags = [...new Set([...jsonTags, ...manualTags])];
            
            // 生成内容
            const htmlContent = this.generateHtmlContent({
                title,
                author,
                date,
                markdownContent,
                allTags
            });
            
            // 构建文章数据
            const articleData = this.buildArticleData({
                id: articleId,
                title,
                author,
                date,
                summary,
                allTags
            });
            
            const saveResult = window.articleManager.addArticle(articleData);
            
            if (saveResult) {
                this.handleSuccess(articleData, htmlContent, allTags);
            } else {
                Utils.showStatus('❌ 保存到本地索引失败', 'error');
            }
        }, 100);
    }

    generateHtmlContent(data) {
        const { title, author, date, markdownContent, allTags } = data;
        
        // 生成图片HTML
        const imagesHtml = Utils.generateImagesHtml();
        const position = Utils.getImagePosition();
        
        // 转换Markdown
        let contentHtml = '';
        if (window.markdownConverter && typeof window.markdownConverter.toHtmlEnhanced === 'function') {
            contentHtml = window.markdownConverter.toHtmlEnhanced(markdownContent);
        } else {
            const basicConverter = Utils.getBasicMarkdownConverter();
            contentHtml = basicConverter.toHtml(markdownContent);
        }
        
        // 插入图片
        contentHtml = this.insertImages(contentHtml, imagesHtml, position, markdownContent);
        
        return this.wrapArticleHtml(title, author, date, allTags, contentHtml);
    }

    insertImages(contentHtml, imagesHtml, position, originalContent) {
        if (!imagesHtml) return contentHtml;
        
        switch (position) {
            case 'start':
                return imagesHtml + '\n' + contentHtml;
            case 'end':
                return contentHtml + '\n' + imagesHtml;
            case 'custom':
                if (originalContent.includes('<!-- INSERT_IMAGES_HERE -->')) {
                    const customContent = window.markdownConverter ? 
                        window.markdownConverter.toHtmlEnhanced(originalContent.replace('<!-- INSERT_IMAGES_HERE -->', imagesHtml)) :
                        originalContent.replace('<!-- INSERT_IMAGES_HERE -->', imagesHtml).replace(/\n/g, '<br>');
                    return customContent;
                }
                return contentHtml + '\n' + imagesHtml;
            default:
                return contentHtml + '\n' + imagesHtml;
        }
    }

    wrapArticleHtml(title, author, date, tags, content) {
        return `<h1>${title}</h1>
<p style="color: #666; font-size: 0.9em;">发布于: ${date} | 作者: ${author}</p>
${tags.length > 0 ? `<p style="color: #666; font-size: 0.9em;">标签: ${tags.map(tag => `<span style="background: #e1ecf4; color: #39739d; padding: 2px 6px; border-radius: 10px; margin-right: 5px;">${tag}</span>`).join('')}</p>` : ''}
<hr>
${content}`;
    }

    buildArticleData(data) {
        const articleData = {
            id: data.id,
            title: data.title,
            date: data.date,
            author: data.author,
            summary: data.summary || '',
            tags: data.allTags,
            contentFile: `posts/${data.id}.html`
        };
        
        // 添加图片信息
        if (window.imageManager && window.imageManager.getSelectedImages) {
            articleData.images = window.imageManager.getSelectedImages().map(img => ({
                id: img.id,
                name: img.name
            }));
        }
        
        return articleData;
    }

    handleSuccess(articleData, htmlContent, allTags) {
        window.articleListManager.updateArticleList();
        window.articleListManager.updateFilterTags();
        
        let successMessage = `✅ 文章生成成功！已添加到本地索引（共 ${window.articleManager.getAllArticles().length} 篇文章）`;
        
        if (window.imageManager && window.imageManager.getSelectedImages && window.imageManager.getSelectedImages().length > 0) {
            successMessage += `<br>包含 ${window.imageManager.getSelectedImages().length} 张图片`;
        }
        
        if (allTags.length > 0) {
            successMessage += `<br>标签: ${allTags.join(', ')}`;
        }
        
        Utils.showStatus(successMessage, 'success');
        
        this.currentArticle = {
            htmlContent: htmlContent,
            filename: `${articleData.id}.html`,
            articleData: articleData
        };
        
        document.getElementById('htmlOutput').value = htmlContent;
        document.getElementById('jsonOutput').value = JSON.stringify(articleData, null, 2);
        document.getElementById('filename').textContent = `${articleData.id}.html`;
        
        // 清空标签
        window.tagManager.clearTags();
        updateTagList();
    }

    clearAll() {
        document.getElementById('jsonInput').value = '';
        document.getElementById('htmlOutput').value = '';
        document.getElementById('jsonOutput').value = '';
        document.getElementById('filename').textContent = '尚未生成';
        Utils.clearStatus();
        this.currentArticle = null;
        
        if (window.imageManager && window.imageManager.clearSelectedImages) {
            window.imageManager.clearSelectedImages();
        }
        
        window.tagManager.clearTags();
        updateTagList();
    }

    downloadHTML() {
        if (!this.currentArticle) {
            alert('请先生成文章');
            return;
        }
        
        const { htmlContent, filename } = this.currentArticle;
        Utils.downloadTextFile(htmlContent, filename, 'text/html');
    }

    downloadJSON() {
        if (!this.currentArticle) {
            alert('请先生成文章');
            return;
        }
        
        const { articleData } = this.currentArticle;
        const jsonContent = JSON.stringify(articleData, null, 2);
        const jsonFilename = `${articleData.id}.json`;
        
        Utils.downloadTextFile(jsonContent, jsonFilename, 'application/json');
    }
}

// ========== 全局函数（供HTML调用）==========

// 标签相关函数
function addQuickTag(tag) {
    if (window.tagManager.addTag(tag)) {
        updateTagList();
        showQuickTagFeedback(tag);
    }
}

function showQuickTagFeedback(tag) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<div class="status success">✅ 已添加标签: ${tag}</div>`;
    setTimeout(() => {
        if (statusDiv.innerHTML.includes(tag)) {
            statusDiv.innerHTML = '';
        }
    }, 2000);
}

function addTag() {
    const tagInput = document.getElementById('tagInput');
    const tag = tagInput.value.trim();
    
    if (tag) {
        if (window.tagManager.addTag(tag)) {
            updateTagList();
            tagInput.value = '';
        } else {
            alert('标签已存在或无效');
        }
    }
}

function removeTag(tag) {
    window.tagManager.removeTag(tag);
    updateTagList();
}

function updateTagList() {
    const tagList = document.getElementById('tagList');
    const tags = window.tagManager.getTags();
    
    if (tags.length === 0) {
        tagList.innerHTML = '<span style="color: #666;">暂无标签</span>';
        return;
    }
    
    const tagHtml = tags.map(tag => `
        <div class="tag">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
        </div>
    `).join('');
    
    tagList.innerHTML = tagHtml;
}

// 筛选功能
function setFilter(tag) {
    window.articleManager.setFilter(tag);
    window.articleListManager.updateFilterTags();
    window.articleListManager.updateArticleList();
}

// 文章管理函数
function removeArticle(articleId) {
    if (confirm('确定要删除这篇文章吗？')) {
        window.articleManager.removeArticle(articleId);
        window.articleListManager.updateArticleList();
        window.articleListManager.updateFilterTags();
    }
}

function exportIndex() {
    const content = window.articleManager.exportIndex();
    Utils.downloadTextFile(content, 'articles-index.json', 'application/json');
}

function importIndex() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = window.articleManager.importData(e.target.result);
            if (success) {
                window.articleListManager.updateArticleList();
                window.articleListManager.updateFilterTags();
                alert('✅ 索引导入成功！');
            } else {
                alert('❌ 索引导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllArticles() {
    if (confirm('确定要清空所有文章吗？此操作不可恢复！')) {
        window.articleManager.articles = [];
        window.articleManager.saveToStorage();
        window.articleListManager.updateArticleList();
        window.articleListManager.updateFilterTags();
    }
}

// 主功能函数
function generateArticle() {
    window.articleGenerator.generateArticle();
}

function clearAll() {
    window.articleGenerator.clearAll();
}

function downloadHTML() {
    window.articleGenerator.downloadHTML();
}

function downloadJSON() {
    window.articleGenerator.downloadJSON();
}

// ========== 初始化 ==========

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化各个管理器
    window.articleManager = new ArticleManager();
    window.tagManager = new TagManager();
    window.articleListManager = new ArticleListManager(window.articleManager);
    window.articleGenerator = new ArticleGenerator();
    
    // 更新UI
    window.articleListManager.updateArticleList();
    updateTagList();
    window.articleListManager.updateFilterTags();
    
    // 设置示例数据
    const exampleJson = {
        title: "示例文章标题",
        author: "作者名称",
        summary: "这是文章的摘要内容",
        markdownContent: "这是文章的**主要内容**，支持Markdown格式。\n\n你可以在这里编写详细的内容。",
        tags: ["示例", "教程"]
    };
    
    document.getElementById('jsonInput').value = JSON.stringify(exampleJson, null, 2);
    
    // 事件监听
    document.getElementById('tagInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTag();
        }
    });
    
    console.log('应用初始化完成');
});