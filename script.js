// 简化的脚本文件
document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单功能
    const menuButton = document.getElementById('menuButton');
    const nav = document.querySelector('nav');
    
    if (menuButton && nav) {
        menuButton.addEventListener('click', function() {
            nav.classList.toggle('active');
            console.log('Menu button clicked');
        });
        
        // 点击页面其他区域关闭菜单
        document.addEventListener('click', function(event) {
            if (nav.classList.contains('active') && 
                !nav.contains(event.target) && 
                !menuButton.contains(event.target)) {
                nav.classList.remove('active');
            }
        });
    }
    
    // 导航链接高亮
    const navLinks = document.querySelectorAll('nav a');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        
        // Default to index.html if path is empty
        const pagePath = currentPath === '' ? 'index.html' : currentPath;

        if (linkPath === pagePath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
        
        // 点击导航链接后关闭菜单
        link.addEventListener('click', function() {
            nav.classList.remove('active');
        });
    });
    
    // 幻灯片功能
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    if (slides.length > 0) {
        slides[currentSlide].classList.add('active');

        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000); // Change image every 5 seconds
    }
    
    // 联系表单功能
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    formStatus.innerHTML = "感谢您的提交！";
                    form.reset();
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            formStatus.innerHTML = data["errors"].map(error => error["message"]).join(", ")
                        } else {
                            formStatus.innerHTML = "糟糕！提交表单时出错了。"
                        }
                    })
                }
            }).catch(error => {
                formStatus.innerHTML = "糟糕！提交表单时出错了。"
            });
        });
    }
});
// 轮播图按钮控制功能
function initSlideshowControls() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.slideshow-prev');
    const nextBtn = document.querySelector('.slideshow-next');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length === 0) return;

    // 显示指定幻灯片
    function showSlide(index) {
        // 移除所有幻灯片的active类
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // 确保索引在有效范围内
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }
        
        // 显示当前幻灯片
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    // 下一张幻灯片
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // 上一张幻灯片
    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // 启动自动轮播
    function startAutoPlay() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动轮播
    function stopAutoPlay() {
        clearInterval(slideInterval);
    }

    // 添加按钮事件监听器
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            stopAutoPlay();
            nextSlide();
            startAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            stopAutoPlay();
            prevSlide();
            startAutoPlay();
        });
    }

    // 添加指示器点击事件
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
            stopAutoPlay();
            showSlide(index);
            startAutoPlay();
        });
    });

    // 鼠标悬停时暂停自动轮播
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', stopAutoPlay);
        slideshowContainer.addEventListener('mouseleave', startAutoPlay);
    }

    // 初始化自动轮播
    startAutoPlay();
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 您现有的代码...
    
    // 初始化轮播图控制
    initSlideshowControls();
    
    // ==================== 新增：分类筛选逻辑 ====================
    function handleCategoryFilter() {
        // 检查是否是insights页面
        if (window.location.pathname.includes('insights.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryFromUrl = urlParams.get('category');
            
            let targetCategory = '数据洞察'; // 默认
            
            if (categoryFromUrl === 'strategy') {
                targetCategory = '品牌策略';
            } else if (categoryFromUrl === 'activities') {
                targetCategory = '品牌活动';
            }
            
            // 如果有分类参数，自动点击对应的分类按钮
            setTimeout(() => {
                const categoryButtons = document.querySelectorAll('.category-btn');
                categoryButtons.forEach(btn => {
                    if (btn.textContent.includes(targetCategory)) {
                        btn.click();
                    }
                });
            }, 100);
        }
    }
    
    // 执行分类筛选处理
    handleCategoryFilter();
    
    // 您现有的其他代码...
});