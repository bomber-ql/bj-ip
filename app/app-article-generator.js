// 文章生成器类 - 专门处理文章生成逻辑
class ArticleGenerator {
    constructor() {
        // 依赖的全局管理器
        this.articleManager = window.articleManager;
        this.tagManager = window.tagManager;
        this.jsonParser = window.jsonParser;
        this.markdownConverter = window.markdownConverter;
        this.imageManager = window.imageManager;
    }

    // 生成文章ID
    generateArticleId(title) {
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

    // 生成图片HTML
    generateImagesHtml() {
        if (!this.imageManager) return '';
        
        const selectedImages = this.imageManager.getSelectedImages();
        if (selectedImages.length === 0) return '';
        
        return selectedImages.map(image => 
            `<div style="text-align: center; margin: 20px 0;">
                <img src="${image.dataUrl}" alt="${image.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            </div>`
        ).join('\n');
    }

    // 生成HTML内容
    generateHtmlContent(markdownContent, imagesHtml, position) {
        let htmlContent = '';
        
        // 使用Markdown转换器
        if (this.markdownConverter && typeof this.markdownConverter.toHtmlEnhanced === 'function') {
            htmlContent = this.markdownConverter.toHtmlEnhanced(markdownContent);
        } else {
            // 备用方案
            htmlContent = markdownContent.replace(/\n/g, '<br>');
            console.warn('Markdown转换器未加载，使用简单格式转换');
        }
        
        // 插入图片
        if (imagesHtml) {
            htmlContent = this.insertImages(htmlContent, imagesHtml, position, markdownContent);
        }
        
        return htmlContent;
    }

    // 插入图片到指定位置
    insertImages(htmlContent, imagesHtml, position, markdownContent) {
        switch (position) {
            case 'start':
                return imagesHtml + '\n' + htmlContent;
            case 'end':
                return htmlContent + '\n' + imagesHtml;
            case 'custom':
                if (markdownContent.includes('<!-- INSERT_IMAGES_HERE -->')) {
                    const customHtmlContent = this.markdownConverter ? 
                        this.markdownConverter.toHtmlEnhanced(markdownContent.replace('<!-- INSERT_IMAGES_HERE -->', imagesHtml)) :
                        markdownContent.replace('<!-- INSERT_IMAGES_HERE -->', imagesHtml).replace(/\n/g, '<br>');
                    return customHtmlContent;
                } else {
                    return htmlContent + '\n' + imagesHtml;
                }
            default:
                return htmlContent;
        }
    }

    // 生成最终HTML
    generateFinalHtml(title, author, date, tags, htmlContent) {
        return `<h1>${title}</h1>
<p style="color: #666; font-size: 0.9em;">发布于: ${date} | 作者: ${author}</p>
${tags.length > 0 ? `<p style="color: #666; font-size: 0.9em;">标签: ${tags.map(tag => `<span style="background: #e1ecf4; color: #39739d; padding: 2px 6px; border-radius: 10px; margin-right: 5px;">${tag}</span>`).join('')}</p>` : ''}
<hr>
${htmlContent}`;
    }

    // 构建文章数据
    buildArticleData(articleId, title, author, date, summary, tags) {
        const articleData = {
            id: articleId,
            title: title,
            date: date,
            author: author,
            summary: summary,
            tags: tags,
            contentFile: `posts/${articleId}.html`
        };
        
        // 添加图片信息
        if (this.imageManager) {
            articleData.images = this.imageManager.getSelectedImages().map(img => ({
                id: img.id,
                name: img.name
            }));
        }
        
        return articleData;
    }

    // 生成成功消息
    generateSuccessMessage(articlesCount, imagesCount, tags) {
        let message = `✅ 文章生成成功！已添加到本地索引（共 ${articlesCount} 篇文章）`;
        
        if (imagesCount > 0) {
            message += `<br>包含 ${imagesCount} 张图片`;
        }
        
        if (tags.length > 0) {
            message += `<br>标签: ${tags.join(', ')}`;
        }
        
        return message;
    }
}

// 初始化全局文章生成器
window.articleGenerator = new ArticleGenerator();