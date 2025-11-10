// 图片管理器类
class ImageManager {
    constructor() {
        this.storageKey = 'uploadedImages';
        this.images = this.loadFromStorage();
        this.selectedImages = []; // 存储被选中的图片
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('加载图片数据失败:', e);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.images));
            return true;
        } catch (e) {
            console.error('保存图片数据失败:', e);
            return false;
        }
    }

    addImage(name, dataUrl) {
        const imageId = this.generateImageId();
        const imageData = {
            id: imageId,
            name: name,
            dataUrl: dataUrl,
            uploadTime: new Date().toISOString()
        };
        
        this.images.unshift(imageData);
        return this.saveToStorage();
    }

    removeImage(imageId) {
        this.images = this.images.filter(img => img.id !== imageId);
        this.selectedImages = this.selectedImages.filter(img => img.id !== imageId);
        return this.saveToStorage();
    }

    getAllImages() {
        return [...this.images];
    }

    getSelectedImages() {
        return [...this.selectedImages];
    }

    toggleImageSelection(imageId) {
        const image = this.images.find(img => img.id === imageId);
        if (!image) return false;

        const existingIndex = this.selectedImages.findIndex(img => img.id === imageId);
        if (existingIndex >= 0) {
            // 取消选择
            this.selectedImages.splice(existingIndex, 1);
            return false;
        } else {
            // 选择图片
            this.selectedImages.push(image);
            return true;
        }
    }

    clearSelectedImages() {
        this.selectedImages = [];
    }

    generateImageId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    clearAll() {
        this.images = [];
        this.selectedImages = [];
        return this.saveToStorage();
    }
}

// 全局图片管理器初始化
window.imageManager = new ImageManager();

// 图片管理函数
function handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }
    
    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB！');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const success = window.imageManager.addImage(file.name, e.target.result);
        if (success) {
            updateImageList();
            alert('✅ 图片上传成功！点击图片将其添加到文章中');
        } else {
            alert('❌ 图片上传失败');
        }
    };
    reader.readAsDataURL(file);
}

function updateImageList() {
    // 检查DOM元素是否存在
    const imageList = document.getElementById('imageList');
    if (!imageList) {
        console.warn('图片列表容器未找到');
        return;
    }
    
    const images = window.imageManager.getAllImages();
    const selectedImages = window.imageManager.getSelectedImages();
    const imageCount = document.getElementById('imageCount');
    const selectedImagesInfo = document.getElementById('selectedImagesInfo');
    const selectedCount = document.getElementById('selectedCount');
    
    // 更新计数（如果元素存在）
    if (imageCount) imageCount.textContent = images.length;
    if (selectedCount) selectedCount.textContent = selectedImages.length;
    
    // 显示/隐藏选中图片信息
    if (selectedImagesInfo) {
        selectedImagesInfo.style.display = selectedImages.length > 0 ? 'block' : 'none';
    }
    
    if (images.length === 0) {
        imageList.innerHTML = '<p style="color: #666; text-align: center; grid-column: 1 / -1;">暂无上传图片</p>';
        return;
    }
    
    const listHtml = images.map(image => {
        const isSelected = selectedImages.some(selected => selected.id === image.id);
        return `
        <div class="image-item ${isSelected ? 'selected' : ''}" onclick="toggleImageSelection('${image.id}')">
            <img src="${image.dataUrl}" alt="${image.name}">
            <div class="image-name">${image.name}</div>
            <div class="image-actions">
                <button class="btn-copy" onclick="event.stopPropagation(); copyImageDataUrl('${image.id}')">复制</button>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteImage('${image.id}')">删除</button>
            </div>
            ${isSelected ? '<div style="color: #27ae60; font-size: 10px; margin-top: 3px;">✓ 已选中</div>' : ''}
        </div>
    `}).join('');
    
    imageList.innerHTML = listHtml;
}

function toggleImageSelection(imageId) {
    const isSelected = window.imageManager.toggleImageSelection(imageId);
    updateImageList();
    
    if (isSelected) {
        console.log('图片已选中:', imageId);
    } else {
        console.log('图片已取消选中:', imageId);
    }
}

function clearSelectedImages() {
    window.imageManager.clearSelectedImages();
    updateImageList();
    alert('已清除所有选中的图片');
}

function copyImageDataUrl(imageId) {
    const image = window.imageManager.getAllImages().find(img => img.id === imageId);
    if (!image) return;
    
    navigator.clipboard.writeText(image.dataUrl).then(() => {
        alert('✅ 图片Data URL已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('❌ 复制失败，请手动复制');
    });
}

function deleteImage(imageId) {
    if (confirm('确定要删除这张图片吗？')) {
        window.imageManager.removeImage(imageId);
        updateImageList();
    }
}

function clearUploadedImages() {
    if (confirm('确定要清空所有上传的图片吗？此操作不可恢复！')) {
        window.imageManager.clearAll();
        updateImageList();
    }
}

// 页面加载时初始化图片列表
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行以确保DOM完全加载
    setTimeout(() => {
        updateImageList();
    }, 100);
});

// 添加拖拽上传支持
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('imageUpload');
    
    if (dropArea) {
        // 防止默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // 高亮拖放区域
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.style.backgroundColor = '#f0f8ff';
        }
        
        function unhighlight() {
            dropArea.style.backgroundColor = '';
        }
        
        // 处理文件放置
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleImageUpload(files);
        }
    }
});