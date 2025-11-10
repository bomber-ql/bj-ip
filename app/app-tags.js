// tags.js
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

// UI 操作函数
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

// 初始化
window.tagManager = new TagManager();