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