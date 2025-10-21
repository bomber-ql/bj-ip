(function() {
    'use strict';
    
    const config = {
        logoObjectId: 'yiyatech-logo-svg',
        scrollStart: 0,        // 开始消失动画的滚动位置
        scrollEnd: 800,       // 完全消失的滚动位置
        maxRetries: 15,
        retryInterval: 150
    };
    
    let svgPaths = null;
    let retryCount = 0;
    let lastScrollY = 0;
    
    // 动画参数配置
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
                console.log('✅ Logo 滚动循环动画已启用');
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
        // 初始化所有路径：默认完全显示
        setFullVisibleState();
        
        // 监听滚动事件
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 初始化时立即执行一次
        handleScroll();
    }
    
    function setFullVisibleState() {
        // Y 形状：完全显示状态
        svgPaths.yLeft.style.stroke = '#0068B7';
        svgPaths.yLeft.style.strokeWidth = '2';
        svgPaths.yLeft.style.strokeDasharray = animationConfig.yLeft.strokeDasharray;
        svgPaths.yLeft.style.strokeDashoffset = 0;
        svgPaths.yLeft.style.strokeOpacity = 0;
        svgPaths.yLeft.style.fill = 'url(#gradient1)';
        svgPaths.yLeft.style.fillOpacity = 1;
        
        // 圆形：完全显示状态
        svgPaths.circle.style.stroke = '#0068B7';
        svgPaths.circle.style.strokeWidth = '2';
        svgPaths.circle.style.strokeDasharray = animationConfig.circle.strokeDasharray;
        svgPaths.circle.style.strokeDashoffset = 0;
        svgPaths.circle.style.strokeOpacity = 0;
        svgPaths.circle.style.fill = '#FFFFFF';
        svgPaths.circle.style.fillOpacity = 1;
        
        // 勾形：完全显示状态
        svgPaths.mark.style.stroke = 'url(#gradient2)';
        svgPaths.mark.style.strokeWidth = '2';
        svgPaths.mark.style.strokeDasharray = animationConfig.mark.strokeDasharray;
        svgPaths.mark.style.strokeDashoffset = 0;
        svgPaths.mark.style.strokeOpacity = 0;
        svgPaths.mark.style.fill = 'url(#gradient2)';
        svgPaths.mark.style.fillOpacity = 1;
        
        // 文字：完全显示状态
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
    
    function setFullHiddenState() {
        // Y 形状：完全隐藏状态
        svgPaths.yLeft.style.stroke = '#0068B7';
        svgPaths.yLeft.style.strokeWidth = '2';
        svgPaths.yLeft.style.strokeDasharray = animationConfig.yLeft.strokeDasharray;
        svgPaths.yLeft.style.strokeDashoffset = animationConfig.yLeft.strokeDasharray;
        svgPaths.yLeft.style.strokeOpacity = 0;
        svgPaths.yLeft.style.fill = 'url(#gradient1)';
        svgPaths.yLeft.style.fillOpacity = 0;
        
        // 圆形：完全隐藏状态
        svgPaths.circle.style.stroke = '#0068B7';
        svgPaths.circle.style.strokeWidth = '2';
        svgPaths.circle.style.strokeDasharray = animationConfig.circle.strokeDasharray;
        svgPaths.circle.style.strokeDashoffset = animationConfig.circle.strokeDasharray;
        svgPaths.circle.style.strokeOpacity = 0;
        svgPaths.circle.style.fill = '#FFFFFF';
        svgPaths.circle.style.fillOpacity = 0;
        
        // 勾形：完全隐藏状态
        svgPaths.mark.style.stroke = 'url(#gradient2)';
        svgPaths.mark.style.strokeWidth = '2';
        svgPaths.mark.style.strokeDasharray = animationConfig.mark.strokeDasharray;
        svgPaths.mark.style.strokeDashoffset = animationConfig.mark.strokeDasharray;
        svgPaths.mark.style.strokeOpacity = 0;
        svgPaths.mark.style.fill = 'url(#gradient2)';
        svgPaths.mark.style.fillOpacity = 0;
        
        // 文字：完全隐藏状态
        svgPaths.texts.forEach(function(text) {
            text.style.stroke = '#0068B7';
            text.style.strokeWidth = '2';
            text.style.strokeDasharray = animationConfig.text.strokeDasharray;
            text.style.strokeDashoffset = animationConfig.text.strokeDasharray;
            text.style.strokeOpacity = 0;
            text.style.fill = '#0068B7';
            text.style.fillOpacity = 0;
        });
    }
    
    function handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = scrollY;
        
        // 获取页面总高度和视口高度
        const documentHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        const windowHeight = window.innerHeight;
        const maxScroll = documentHeight - windowHeight;
        
        // 判断是否接近底部（距离底部小于 scrollEnd 时开始重新显示）
        const distanceFromBottom = maxScroll - scrollY;
        const isNearBottom = distanceFromBottom < config.scrollEnd;
        
        if (scrollDirection === 'down') {
            // 向下滚动：消失动画
            if (isNearBottom) {
                // 接近底部：从消失状态逐渐显示
                const progress = 1 - (distanceFromBottom / config.scrollEnd);
                updateReappearAnimation(progress);
            } else {
                // 正常向下滚动：从显示状态逐渐消失
                const progress = Math.min(scrollY / config.scrollEnd, 1);
                updateDisappearAnimation(progress);
            }
        } else {
            // 向上滚动：显示动画
            if (scrollY === 0) {
                // 在顶部：完全显示
                setFullVisibleState();
            } else if (isNearBottom) {
                // 从底部向上滚动：从显示状态逐渐消失
                const progress = distanceFromBottom / config.scrollEnd;
                updateDisappearAnimation(progress);
            } else {
                // 正常向上滚动：从消失状态逐渐显示
                const progress = 1 - (scrollY / config.scrollEnd);
                updateReappearAnimation(progress);
            }
        }
    }
    
    // 消失动画逻辑
    function updateDisappearAnimation(progress) {
        // 更新 Y 形状
        updatePathDisappear(svgPaths.yLeft, progress, animationConfig.yLeft, 'url(#gradient1)');
        
        // 更新圆形
        updatePathDisappear(svgPaths.circle, progress, animationConfig.circle, '#FFFFFF');
        
        // 更新勾形
        updatePathDisappear(svgPaths.mark, progress, animationConfig.mark, 'url(#gradient2)');
        
        // 更新文字
        svgPaths.texts.forEach(function(text, index) {
            const textDelay = animationConfig.text.delay + (index * 0.1);
            updatePathDisappear(text, progress, {
                strokeDasharray: animationConfig.text.strokeDasharray,
                delay: textDelay
            }, '#0068B7');
        });
    }
    
    // 消失动画更新路径
    function updatePathDisappear(pathElement, progress, config, fillColor) {
        const delayedProgress = Math.max(0, (progress - config.delay) / (1 - config.delay));
        const clampedProgress = Math.max(0, Math.min(1, delayedProgress));
        
        let strokeDashoffset = 0;
        let strokeOpacity = 0;
        let fillOpacity = 1;
        
        if (clampedProgress <= 0.3) {
            strokeDashoffset = 0;
            strokeOpacity = 0;
            fillOpacity = 1;
        } 
        else if (clampedProgress <= 0.6) {
            const transitionProgress = (clampedProgress - 0.3) / 0.3;
            strokeDashoffset = 0;
            strokeOpacity = transitionProgress;
            fillOpacity = 1 - transitionProgress;
        } 
        else {
            const fadeProgress = (clampedProgress - 0.6) / 0.4;
            strokeDashoffset = config.strokeDasharray * fadeProgress;
            strokeOpacity = 1 - fadeProgress;
            fillOpacity = 0;
        }
        
        pathElement.style.strokeDashoffset = strokeDashoffset;
        pathElement.style.strokeOpacity = strokeOpacity;
        pathElement.style.fill = fillColor;
        pathElement.style.fillOpacity = fillOpacity;
    }
    
    // 重新显示动画逻辑
    function updateReappearAnimation(progress) {
        // 更新 Y 形状
        updatePathReappear(svgPaths.yLeft, progress, animationConfig.yLeft, 'url(#gradient1)');
        
        // 更新圆形
        updatePathReappear(svgPaths.circle, progress, animationConfig.circle, '#FFFFFF');
        
        // 更新勾形
        updatePathReappear(svgPaths.mark, progress, animationConfig.mark, 'url(#gradient2)');
        
        // 更新文字
        svgPaths.texts.forEach(function(text, index) {
            const textDelay = animationConfig.text.delay + (index * 0.1);
            updatePathReappear(text, progress, {
                strokeDasharray: animationConfig.text.strokeDasharray,
                delay: textDelay
            }, '#0068B7');
        });
    }
    
    // 重新显示动画更新路径
    function updatePathReappear(pathElement, progress, config, fillColor) {
        const delayedProgress = Math.max(0, (progress - config.delay) / (1 - config.delay));
        const clampedProgress = Math.max(0, Math.min(1, delayedProgress));
        
        let strokeDashoffset = 0;
        let strokeOpacity = 0;
        let fillOpacity = 1;
        
        // 重新显示逻辑：从消失状态恢复到显示状态
        if (clampedProgress <= 0.3) {
            // 阶段3：描边消失 → 描边显示
            const fadeProgress = (0.3 - clampedProgress) / 0.3;
            strokeDashoffset = config.strokeDasharray * fadeProgress;
            strokeOpacity = 1 - fadeProgress;
            fillOpacity = 0;
        } 
        else if (clampedProgress <= 0.6) {
            // 阶段2：填充消失 → 填充显示
            const transitionProgress = (0.6 - clampedProgress) / 0.3;
            strokeDashoffset = 0;
            strokeOpacity = transitionProgress;
            fillOpacity = 1 - transitionProgress;
        } 
        else {
            // 阶段1：保持完全显示
            strokeDashoffset = 0;
            strokeOpacity = 0;
            fillOpacity = 1;
        }
        
        pathElement.style.strokeDashoffset = strokeDashoffset;
        pathElement.style.strokeOpacity = strokeOpacity;
        pathElement.style.fill = fillColor;
        pathElement.style.fillOpacity = fillOpacity;
    }
    
    init();
})();