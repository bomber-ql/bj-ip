// ==================== SEO功能实现 ====================

// 关键词密度分析
function analyzeKeywordDensity(content, title) {
    // 清理内容，移除Markdown标记
    const cleanContent = content.replace(/[#*>`\\-]/g, ' ').toLowerCase();
    const words = cleanContent.split(/\s+/).filter(word => word.length > 1);
    const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    
    const keywordStats = {};
    const totalWords = words.length;
    
    // 分析标题中的关键词
    titleWords.forEach(word => {
        if (word.length > 2) {
            const count = words.filter(w => w === word).length;
            const density = totalWords > 0 ? (count / totalWords * 100).toFixed(2) : 0;
            keywordStats[word] = { 
                count, 
                density: parseFloat(density),
                recommendation: getDensityRecommendation(parseFloat(density))
            };
        }
    });
    
    return keywordStats;
}

function getDensityRecommendation(density) {
    if (density < 0.5) return '密度过低，建议增加使用';
    if (density > 2.5) return '密度过高，建议减少使用';
    return '密度合适';
}

// 生成meta描述
function generateMetaDescription(content) {
    const cleanContent = content.replace(/[#*>`\\-]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanContent.length > 155 ? cleanContent.substring(0, 152) + '...' : cleanContent;
}

// 建议关键词
function suggestKeywords(title, content) {
    const keywords = new Set();
    
    // 从标题提取关键词
    const titleWords = title.split(/\s+/).filter(word => word.length > 1);
    titleWords.forEach(word => keywords.add(word));
    
    // 从内容中提取高频词
    const cleanContent = content.replace(/[#*>`\\-]/g, ' ').toLowerCase();
    const words = cleanContent.split(/\s+/).filter(word => word.length > 1);
    const wordFreq = {};
    
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 添加高频词作为关键词
    Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([word]) => {
            if (word.length > 2) keywords.add(word);
        });
    
    return Array.from(keywords).slice(0, 8); // 最多返回8个关键词
}

// 优化图片
function optimizeImages(images, articleTitle) {
    if (!images || !Array.isArray(images)) return [];
    
    return images.map((image, index) => {
        const baseName = image.name.replace(/\.[^/.]+$/, "");
        const altText = generateAltText(baseName, articleTitle, index);
        
        return {
            ...image,
            alt: altText,
            title: `${articleTitle} - 图${index + 1}`,
            optimizedName: `${articleTitle.toLowerCase().replace(/\s+/g, '-')}-image-${index + 1}.${image.name.split('.').pop()}`
        };
    });
}

function generateAltText(filename, articleTitle, index) {
    const cleanName = filename.replace(/[_-]/g, ' ').replace(/[0-9]/g, '').trim();
    return cleanName ? `${articleTitle} - ${cleanName}` : `${articleTitle}相关图示${index + 1}`;
}

// 显示SEO评分
function displaySeoScore(seoScore) {
    const seoAnalysis = document.getElementById('seoAnalysis');
    if (!seoAnalysis) {
        console.warn('SEO分析容器未找到');
        return;
    }
    
    let analysisHtml = `
        <div class="seo-score" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
            <h3 style="margin: 0 0 10px 0;">SEO评分: ${seoScore.score}/100</h3>
            <div style="font-size: 24px; color: ${getScoreColor(seoScore.score)}; font-weight: bold;">
                ${seoScore.grade}
            </div>
        </div>
    `;
    
    // 关键词分析
    analysisHtml += `
        <div class="seo-section">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">📊 关键词分析</h4>
            <div id="keywordAnalysis" style="font-size: 14px; line-height: 1.4;">
                ${generateKeywordAnalysis(seoScore.details.keywordUsage)}
            </div>
        </div>
    `;
    
    // 内容结构
    analysisHtml += `
        <div class="seo-section">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">📝 内容结构</h4>
            <div id="structureAnalysis" style="font-size: 14px; line-height: 1.4;">
                ${generateStructureAnalysis(seoScore.details)}
            </div>
        </div>
    `;

    // 图片优化
    analysisHtml += `
        <div class="seo-section">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">🖼️ 图片优化</h4>
            <div id="imageSeo" style="font-size: 14px; line-height: 1.4;">
                ${generateImageAnalysis(seoScore.details.imageOptimization)}
            </div>
        </div>
    `;

    // 内部链接建议
    analysisHtml += `
        <div class="seo-section">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">🔗 内部链接建议</h4>
            <div id="internalLinks" style="font-size: 14px; line-height: 1.4;">
                ${generateInternalLinksAnalysis(seoScore.details.internalLinking)}
            </div>
        </div>
    `;
    
    seoAnalysis.innerHTML = analysisHtml;
}

function getScoreColor(score) {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
}

function generateKeywordAnalysis(keywordUsage) {
    if (!keywordUsage || !keywordUsage.keywords) {
        return '<p style="color: #666;">暂无关键词数据</p>';
    }
    
    let html = '';
    Object.entries(keywordUsage.keywords).forEach(([keyword, data]) => {
        html += `
            <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                <strong>${keyword}:</strong> 出现${data.count}次 (${data.density}%)
                <br><small style="color: ${data.density >= 0.5 && data.density <= 2.5 ? '#27ae60' : '#e74c3c'};">${data.recommendation}</small>
            </div>
        `;
    });
    
    return html;
}

function generateStructureAnalysis(details) {
    let html = '';
    
    if (details.titleLength) {
        html += `
            <div style="margin-bottom: 8px;">
                <strong>标题:</strong> ${details.titleLength.message}
                <br><small style="color: ${details.titleLength.score >= 7 ? '#27ae60' : '#e74c3c'};">${details.titleLength.suggestion}</small>
            </div>
        `;
    }
    
    if (details.contentLength) {
        html += `
            <div style="margin-bottom: 8px;">
                <strong>内容长度:</strong> ${details.contentLength.message}
                <br><small style="color: ${details.contentLength.score >= 10 ? '#27ae60' : '#e74c3c'};">${details.contentLength.suggestion}</small>
            </div>
        `;
    }

    if (details.metaDescription) {
        html += `
            <div style="margin-bottom: 8px;">
                <strong>Meta描述:</strong> ${details.metaDescription.message}
                <br><small style="color: ${details.metaDescription.score >= 7 ? '#27ae60' : '#e74c3c'};">${details.metaDescription.suggestion}</small>
            </div>
        `;
    }
    
    return html || '<p style="color: #666;">暂无结构分析数据</p>';
}

function generateImageAnalysis(imageOptimization) {
    if (!imageOptimization) {
        return '<p style="color: #666;">暂无图片数据</p>';
    }
    
    return `
        <div style="margin-bottom: 8px;">
            <strong>图片数量:</strong> ${imageOptimization.message}
            <br><small style="color: ${imageOptimization.score >= 7 ? '#27ae60' : '#f39c12'};">${imageOptimization.suggestion}</small>
        </div>
    `;
}

function generateInternalLinksAnalysis(internalLinking) {
    if (!internalLinking) {
        return '<p style="color: #666;">暂无内部链接数据</p>';
    }
    
    return `
        <div style="margin-bottom: 8px;">
            <strong>内部链接:</strong> ${internalLinking.message}
            <br><small style="color: #f39c12;">${internalLinking.suggestion}</small>
        </div>
    `;
}

// 完善SEOScorer类
class SEOScorer {
    constructor(content, title, images = []) {
        this.content = content;
        this.title = title;
        this.images = images;
        this.score = 0;
        this.maxScore = 100;
    }
    
    calculateScore() {
        const checks = {
            titleLength: this.checkTitleLength(),
            metaDescription: this.checkMetaDescription(),
            headingStructure: this.checkHeadingStructure(),
            contentLength: this.checkContentLength(),
            keywordUsage: this.checkKeywordUsage(),
            imageOptimization: this.checkImageOptimization(),
            internalLinking: this.checkInternalLinking(),
            readability: this.checkReadability()
        };
        
        this.score = Object.values(checks).reduce((sum, check) => sum + check.score, 0);
        this.details = checks;
        
        return {
            score: this.score,
            grade: this.getGrade(),
            details: checks
        };
    }
    
    checkTitleLength() {
        const length = this.title.length;
        return {
            score: length >= 50 && length <= 60 ? 10 : length >= 40 && length <= 70 ? 7 : 3,
            message: `标题长度: ${length} 字符 (推荐50-60字符)`,
            suggestion: length < 50 ? '考虑增加标题长度' : length > 60 ? '考虑缩短标题' : '标题长度合适'
        };
    }
    
    checkContentLength() {
        const length = this.content.replace(/<[^>]*>/g, '').length;
        return {
            score: length >= 300 ? 15 : length >= 150 ? 10 : 5,
            message: `内容长度: ${length} 字符`,
            suggestion: length < 300 ? '建议增加更多相关内容' : '内容长度良好'
        };
    }
    
    checkKeywordUsage() {
        const keywordStats = analyzeKeywordDensity(this.content, this.title);
        let score = 5; // 基础分
        
        // 根据关键词密度评分
        Object.values(keywordStats).forEach(stats => {
            if (stats.density >= 0.5 && stats.density <= 2.5) score += 2;
            if (stats.count >= 3) score += 1;
        });
        
        return {
            score: Math.min(score, 15),
            keywords: keywordStats,
            message: `分析了${Object.keys(keywordStats).length}个关键词`,
            suggestion: '确保主要关键词密度在0.5%-2.5%之间'
        };
    }
    
    checkImageOptimization() {
        const score = this.images.length > 0 ? 8 : 5;
        return {
            score: score,
            message: `包含${this.images.length}张图片`,
            suggestion: this.images.length > 0 ? '建议为图片添加描述性alt文本' : '考虑添加相关图片'
        };
    }
    
    checkMetaDescription() {
        const description = generateMetaDescription(this.content);
        const length = description.length;
        return {
            score: length >= 120 && length <= 155 ? 10 : length >= 100 ? 7 : 3,
            message: `Meta描述: ${length}字符`,
            suggestion: length < 120 ? '建议完善meta描述' : 'meta描述长度合适'
        };
    }
    
    checkHeadingStructure() {
        // 简化实现 - 检查是否有标题结构
        const hasHeadings = /#{1,6}\s+.+/.test(this.content);
        return {
            score: hasHeadings ? 8 : 5,
            message: hasHeadings ? '标题结构基本合理' : '缺少标题层级',
            suggestion: '确保使用正确的标题层级(H1>H2>H3)'
        };
    }
    
    checkInternalLinking() {
        return {
            score: 5,
            message: '内部链接功能待完善',
            suggestion: '考虑添加相关文章的内部链接'
        };
    }
    
    checkReadability() {
        // 简化可读性检查
        const paragraphCount = (this.content.match(/\n\n/g) || []).length;
        const avgParagraphLength = this.content.length / Math.max(paragraphCount, 1);
        
        let score = 7;
        if (avgParagraphLength > 500) score = 5;
        if (avgParagraphLength > 800) score = 3;
        
        return {
            score: score,
            message: paragraphCount > 2 ? '内容可读性良好' : '建议增加段落分段',
            suggestion: '保持段落简短，使用列表和分段'
        };
    }
    
    getGrade() {
        if (this.score >= 90) return 'A+';
        if (this.score >= 80) return 'A';
        if (this.score >= 70) return 'B';
        if (this.score >= 60) return 'C';
        return '需要改进';
    }
}

// 完善SEO优化函数
function autoOptimizeSEO() {
    const jsonInput = document.getElementById('jsonInput');
    
    if (!jsonInput || !jsonInput.value.trim()) {
        alert('请先输入JSON数据');
        return null;
    }
    
    // 检查依赖函数是否存在
    if (typeof parseJsonInput !== 'function') {
        alert('SEO功能依赖的文章解析功能未加载');
        return null;
    }
    
    const parsed = parseJsonInput(jsonInput.value);
    
    if (!parsed.success) {
        alert('JSON解析失败，请检查数据格式');
        return null;
    }
    
    const { title, markdownContent } = parsed;
    
    // 检查图片管理器是否存在
    const selectedImages = window.imageManager ? window.imageManager.getSelectedImages() : [];
    
    // 自动生成meta描述
    const metaDescription = generateMetaDescription(markdownContent);
    
    // 建议关键词
    const suggestedKeywords = suggestKeywords(title, markdownContent);
    
    // 优化图片alt文本
    const optimizedImages = optimizeImages(selectedImages, title);
    
    return {
        metaDescription,
        suggestedKeywords,
        optimizedImages,
        seoScore: new SEOScorer(markdownContent, title, selectedImages).calculateScore()
    };
}

function applySeoOptimizations() {
    const optimizations = autoOptimizeSEO();
    
    if (!optimizations) return;
    
    // 检查标签管理器是否存在
    if (window.tagManager && typeof updateTagList === 'function') {
        // 更新标签
        optimizations.suggestedKeywords.forEach(keyword => {
            if (!window.tagManager.getTags().includes(keyword)) {
                window.tagManager.addTag(keyword);
            }
        });
        updateTagList();
    }
    
    // 显示SEO评分
    displaySeoScore(optimizations.seoScore);
    
    // 显示成功消息
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="status success">
            ✅ SEO优化已应用！评分: ${optimizations.seoScore.score}/100 (${optimizations.seoScore.grade})
            <br>添加了 ${optimizations.suggestedKeywords.length} 个关键词建议
        </div>`;
    }
}

function generateSeoReport() {
    const optimizations = autoOptimizeSEO();
    
    if (!optimizations) return;
    
    const report = `
# SEO分析报告
## 总体评分: ${optimizations.seoScore.score}/100 (${optimizations.seoScore.grade})

### 详细分析:
${Object.entries(optimizations.seoScore.details).map(([key, detail]) => `
**${key}**: ${detail.score}分
- ${detail.message}
- ${detail.suggestion}
`).join('\n')}

### 建议关键词:
${optimizations.suggestedKeywords.join(', ')}

### 优化建议:
${generateOptimizationSuggestions(optimizations.seoScore)}
    `;
    
    // 在新窗口中显示报告
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write(`
            <html>
                <head>
                    <title>SEO分析报告</title>
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
                        h1 { color: #2c3e50; }
                        .score { 
                            font-size: 24px; 
                            font-weight: bold;
                            color: ${getScoreColor(optimizations.seoScore.score)};
                        }
                        button {
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>📊 SEO分析报告</h1>
                    <div class="score">总体评分: ${optimizations.seoScore.score}/100 (${optimizations.seoScore.grade})</div>
                    <pre>${report}</pre>
                    <button onclick="window.print()">🖨️ 打印报告</button>
                    <button onclick="window.close()">❌ 关闭</button>
                </body>
            </html>
        `);
    }
}

function generateOptimizationSuggestions(seoScore) {
    const suggestions = [];
    
    if (seoScore.score < 70) {
        suggestions.push('🔴 需要重点优化SEO');
    }
    if (seoScore.details.titleLength.score < 7) {
        suggestions.push('📝 优化标题长度');
    }
    if (seoScore.details.contentLength.score < 10) {
        suggestions.push('📄 增加内容长度');
    }
    if (seoScore.details.keywordUsage.score < 10) {
        suggestions.push('🔑 优化关键词使用');
    }
    if (seoScore.details.imageOptimization.score < 7) {
        suggestions.push('🖼️ 优化图片设置');
    }
    if (seoScore.details.metaDescription.score < 7) {
        suggestions.push('📋 完善Meta描述');
    }
    
    return suggestions.length > 0 ? suggestions.join('\n') : '✅ SEO状态良好，继续保持！';
}

// 安全地绑定事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行以确保所有依赖加载完成
    setTimeout(() => {
        const applySeoBtn = document.getElementById('applySeoBtn');
        const generateSeoReportBtn = document.getElementById('generateSeoReportBtn');
        
        if (applySeoBtn) {
            applySeoBtn.addEventListener('click', applySeoOptimizations);
        }
        
        if (generateSeoReportBtn) {
            generateSeoReportBtn.addEventListener('click', generateSeoReport);
        }
    }, 100);
});