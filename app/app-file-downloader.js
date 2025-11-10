// 文件下载器类 - 专门处理所有下载功能
class FileDownloader {
    // 通用文本文件下载
    downloadTextFile(content, filename, mimeType) {
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

    // HTML文件下载
    downloadHTML(article) {
        if (!article) {
            alert('请先生成文章');
            return;
        }
        this.downloadTextFile(article.htmlContent, article.filename, 'text/html');
    }

    // JSON文件下载
    downloadJSON(article) {
        if (!article) {
            alert('请先生成文章');
            return;
        }
        const jsonContent = JSON.stringify(article.articleData, null, 2);
        const jsonFilename = `${article.articleData.id}.json`;
        this.downloadTextFile(jsonContent, jsonFilename, 'application/json');
    }

    // 索引导出
    exportIndex(content) {
        this.downloadTextFile(content, 'articles-index.json', 'application/json');
    }
}

// 初始化全局文件下载器
window.fileDownloader = new FileDownloader();