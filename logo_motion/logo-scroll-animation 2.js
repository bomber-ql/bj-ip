(function() {
    'use strict';
    
    const config = {
        logoObjectId: 'yiyatech-logo-svg',
        scrollStart: 2200,        // 开始消失动画的滚动位置（滚动到这里开始消失）
        scrollEnd: 0,        // 完全消失的滚动位置（滚动到这里完全看不见）
        maxRetries: 15,
        retryInterval: 150
    };
    
    let svgPaths = null;
    let retryCount = 0;
    
    // 动画参数配置（保持原数值，无需修改）
    const animationConfig = {
        yLeft: {
            strokeDasharray: 1500,
            delay: 0
        },
        circle: {
            strokeDasharray: 500,
            delay: 0.15
        },
        mark: {
            strokeDasharray: 800,
            delay: 0.22
        },
        text: {
            strokeDasharray: 300,
            delay: 0.32
        }
    };
    
    function init() {
        window.addEventListener('load', setup);
    }
    
    function setup() {
        const logoObject = document.getElementById(config.logoObjectId);
        
        if (!logoObject) {
            console.error('Logo Object 元素未找到');
            return;
        }
        
        attemptToAccessSVG(logoObject);
    }
    
    function attemptToAccessSVG(logoObject) {
        const svgDoc = logoObject.contentDocument;
        
        if (svgDoc) {
            const paths = getPaths(svgDoc);
            
            if (paths) {
                svgPaths = paths;
                setupScrollAnimation();
                console.log('✅ Logo 滚动反向消失动画已启用');
            } else {
                retryLater(logoObject);
            }
        } else {
            retryLater(logoObject);
        }
    }
    
    function retryLater(logoObject) {
        retryCount++;
        
        if (retryCount < config.maxRetries) {
            setTimeout(function() {
                attemptToAccessSVG(logoObject);
            }, config.retryInterval);
        } else {
            console.error('无法访问 SVG 文档');
        }
    }
    
    function getPaths(doc) {
        const paths = {
            yLeft: doc.querySelector('.path-y-left'),
            circle: doc.querySelector('.path-circle'),
            mark: doc.querySelector('.path-mark'),
            texts: Array.from(doc.querySelectorAll('.text-path'))
        };
        
        if (!paths.yLeft || !paths.circle || !paths.mark || paths.texts.length === 0) {
            return null;
        }
        
        return paths;
    }
    
    function setupScrollAnimation() {
        // 初始化所有路径：默认完全显示（填充100%，描边0%）
        initializePaths();
        
        // 监听滚动事件
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 初始化时立即执行一次（确保默认显示）
        handleScroll();
    }
    
    function initializePaths() {
        // Y 形状：默认填充显示，描边隐藏
        svgPaths.yLeft.style.stroke = '#0068B7';
        svgPaths.yLeft.style.strokeWidth = '2';
        svgPaths.yLeft.style.strokeDasharray = animationConfig.yLeft.strokeDasharray;
        svgPaths.yLeft.style.strokeDashoffset = 0; // 描边初始隐藏（偏移量0，配合opacity:0）
        svgPaths.yLeft.style.strokeOpacity = 0;
        svgPaths.yLeft.style.fill = 'url(#gradient1)';
        svgPaths.yLeft.style.fillOpacity = 1; // 填充初始完全显示
        
        // 圆形：默认填充显示，描边隐藏
        svgPaths.circle.style.stroke = '#0068B7';
        svgPaths.circle.style.strokeWidth = '2';
        svgPaths.circle.style.strokeDasharray = animationConfig.circle.strokeDasharray;
        svgPaths.circle.style.strokeDashoffset = 0;
        svgPaths.circle.style.strokeOpacity = 0;
        svgPaths.circle.style.fill = '#FFFFFF';
        svgPaths.circle.style.fillOpacity = 1;
        
        // 勾形：默认填充显示，描边隐藏
        svgPaths.mark.style.stroke = 'url(#gradient2)';
        svgPaths.mark.style.strokeWidth = '2';
        svgPaths.mark.style.strokeDasharray = animationConfig.mark.strokeDasharray;
        svgPaths.mark.style.strokeDashoffset = 0;
        svgPaths.mark.style.strokeOpacity = 0;
        svgPaths.mark.style.fill = 'url(#gradient2)';
        svgPaths.mark.style.fillOpacity = 1;
        
        // 文字：默认填充显示，描边隐藏
        svgPaths.texts.forEach(function(text) {
            text.style.stroke = '#0068B7';
            text.style.strokeWidth = '2';
            text.style.strokeDasharray = animationConfig.text.strokeDasharray;
            text.style.strokeDashoffset = 0;
            text.style.strokeOpacity = 0;
            text.style.fill = '#0068B7';
            text.style.fillOpacity = 1;
        });
    }
    
    function handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        
        // 计算滚动进度 (0 到 1)：0=未滚动（完全显示），1=滚动到目标位置（完全消失）
        let progress = (scrollY - config.scrollStart) / (config.scrollEnd - config.scrollStart);
        progress = Math.max(0, Math.min(1, progress)); // 限制在 0-1 之间
        
        updateAnimation(progress);
    }
    
    // 核心修改：反向动画逻辑（从显示→消失）
    function updateAnimation(progress) {
        // 更新 Y 形状
        updatePath(svgPaths.yLeft, progress, animationConfig.yLeft, 'url(#gradient1)');
        
        // 更新圆形
        updatePath(svgPaths.circle, progress, animationConfig.circle, '#FFFFFF');
        
        // 更新勾形
        updatePath(svgPaths.mark, progress, animationConfig.mark, 'url(#gradient2)');
        
        // 更新文字（每个字母有延迟，反向后仍保持依次消失）
        svgPaths.texts.forEach(function(text, index) {
            const textDelay = animationConfig.text.delay + (index * 0.1);
            updatePath(text, progress, {
                strokeDasharray: animationConfig.text.strokeDasharray,
                delay: textDelay
            }, '#0068B7');
        });
    }
    
    // 核心修改：反向更新路径状态（填充消失→描边显示→描边消失）
    function updatePath(pathElement, progress, config, fillColor) {
        // 考虑延迟的进度：进度需超过延迟才开始动画
        const delayedProgress = Math.max(0, (progress - config.delay) / (1 - config.delay));
        const clampedProgress = Math.max(0, Math.min(1, delayedProgress));
        
        let strokeDashoffset = 0;
        let strokeOpacity = 0;
        let fillOpacity = 1;
        
        // 反向动画三阶段：
        // 1. 初始阶段 (0 - 0.3)：填充保持100%，描边隐藏（未开始消失）
        if (clampedProgress <= 0.3) {
            strokeDashoffset = 0;
            strokeOpacity = 0;
            fillOpacity = 1;
        } 
        // 2. 过渡阶段 (0.3 - 0.6)：填充逐渐消失，描边逐渐显示
        else if (clampedProgress <= 0.6) {
            const transitionProgress = (clampedProgress - 0.3) / 0.3;
            strokeDashoffset = 0; // 描边完全显示（偏移量0）
            strokeOpacity = transitionProgress; // 描边从0→1
            fillOpacity = 1 - transitionProgress; // 填充从1→0
        } 
        // 3. 消失阶段 (0.6 - 1)：描边逐渐消失，填充保持0%
        else {
            const fadeProgress = (clampedProgress - 0.6) / 0.4;
            strokeDashoffset = config.strokeDasharray * fadeProgress; // 描边从0→满（逐渐隐藏）
            strokeOpacity = 1 - fadeProgress; // 描边从1→0
            fillOpacity = 0; // 填充完全消失
        }
        
        // 应用样式到路径
        pathElement.style.strokeDashoffset = strokeDashoffset;
        pathElement.style.strokeOpacity = strokeOpacity;
        pathElement.style.fill = fillColor;
        pathElement.style.fillOpacity = fillOpacity;
    }
    
    init();
})();