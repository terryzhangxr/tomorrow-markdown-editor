document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const themeToggle = document.getElementById('themeToggle');
    const wordCount = document.getElementById('wordCount');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-insert]');
    
    // 标记是否已初始化，防止重复绑定
    let isInitialized = false;
    
    // ========== 数学公式支持 ==========
    // 配置 KaTeX
    function setupKaTeX() {
        if (typeof renderMathInElement !== 'function') {
            console.warn('KaTeX 自动渲染功能未加载');
            return;
        }
        
        const options = {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false,
            strict: false,
            trust: false
        };
        
        return options;
    }
    
    // 渲染数学公式
    function renderMath() {
        if (typeof renderMathInElement === 'function') {
            const options = setupKaTeX();
            renderMathInElement(preview, options);
        }
    }
    
    // ========== 提示框功能 ==========
    // 初始化 Tippy.js 提示框
    function initTooltips() {
        if (typeof tippy !== 'function') {
            console.warn('Tippy.js 未加载，提示框不可用');
            return;
        }
        
        tippy('[data-tippy-content]', {
            theme: 'light-border',
            placement: 'top',
            animation: 'fade',
            duration: 200,
            arrow: true,
            delay: [100, 0],
            onShow(instance) {
                const theme = document.documentElement.getAttribute('data-theme');
                if (theme === 'dark') {
                    instance.setProps({ theme: 'dark' });
                } else {
                    instance.setProps({ theme: 'light-border' });
                }
            }
        });
    }
    
    // ========== 核心函数 ==========
    function renderMarkdown() {
        try {
            const content = editor.value;
            preview.innerHTML = marked.parse(content);
            addCopyButtonsToCodeBlocks();
            // 渲染数学公式
            renderMath();
        } catch (error) {
            console.error('Markdown 渲染错误:', error);
            preview.innerHTML = '<div style="padding: 20px; color: red;">渲染错误: ' + error.message + '</div>';
        }
    }
    
    function updateWordCount() {
        const text = editor.value;
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = text.match(/\b[a-z]+\b/gi) || [];
        const count = chineseChars.length + englishWords.length;
        wordCount.textContent = count.toLocaleString();
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('markdown-editor-theme', newTheme);
        updateThemeButton(newTheme);
        showNotification(`已切换到${newTheme === 'light' ? '亮色' : '暗色'}模式`, 'info');
        
        // 重新初始化提示框以应用新主题
        setTimeout(initTooltips, 100);
    }
    
    function updateThemeButton(theme) {
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = '亮色模式';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = '暗色模式';
        }
    }
    
    // ========== 修复的插入文本函数 ==========
    function insertText(syntax) {
        // 防止重复执行
        if (window.insertTextExecuting) {
            return;
        }
        
        window.insertTextExecuting = true;
        
        try {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selectedText = editor.value.substring(start, end);
            
            let insertText = syntax;
            
            // 处理数学公式的"公式"占位符
            if (selectedText && syntax.includes('公式')) {
                insertText = syntax.replace(/公式/g, selectedText);
            } else if (syntax.includes('公式')) {
                insertText = syntax.replace(/公式/g, '');
            }
            // 处理其他格式的"text"占位符
            else if (selectedText && syntax.includes('text')) {
                insertText = syntax.replace(/text/g, selectedText);
            } else if (syntax.includes('text')) {
                insertText = syntax.replace(/text/g, '');
            }
            
            const newValue = editor.value.substring(0, start) + 
                            insertText + 
                            editor.value.substring(end);
            
            editor.value = newValue;
            
            let newCursorPos = start + insertText.length;
            
            // 设置光标位置
            if (syntax.includes('公式') && !selectedText) {
                const placeholderStart = syntax.indexOf('公式');
                newCursorPos = start + placeholderStart;
                editor.setSelectionRange(newCursorPos, newCursorPos + 2);
            } else if (syntax.includes('text') && !selectedText) {
                const placeholderStart = syntax.indexOf('text');
                newCursorPos = start + placeholderStart;
                editor.setSelectionRange(newCursorPos, newCursorPos + 4);
            } else {
                editor.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            editor.focus();
            renderMarkdown();
            updateWordCount();
            saveToLocalStorage();
            
        } catch (error) {
            console.error('插入文本错误:', error);
        } finally {
            // 重置标志
            setTimeout(() => {
                window.insertTextExecuting = false;
            }, 10);
        }
    }
    
    function copyMarkdown() {
        navigator.clipboard.writeText(editor.value)
            .then(() => {
                showNotification('已复制到剪贴板', 'success');
                copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败:', err);
                showNotification('复制失败', 'danger');
            });
    }
    
    function saveToLocalStorage() {
        localStorage.setItem('markdown-editor-content', editor.value);
    }
    
    function clearEditor() {
        if (editor.value && confirm('确定要清空所有内容吗？')) {
            editor.value = '';
            renderMarkdown();
            updateWordCount();
            localStorage.removeItem('markdown-editor-content');
            showNotification('内容已清空', 'warning');
        }
    }
    
    function downloadMarkdown() {
        const content = editor.value;
        if (!content.trim()) {
            showNotification('编辑器为空', 'warning');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `markdown-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('文件开始下载', 'success');
    }
    
    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    function addCopyButtonsToCodeBlocks() {
        const codeBlocks = preview.querySelectorAll('pre');
        codeBlocks.forEach(block => {
            if (block.querySelector('.copy-code-btn')) return;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            
            copyButton.addEventListener('click', function() {
                const code = block.querySelector('code') ? 
                    block.querySelector('code').textContent : 
                    block.textContent;
                
                navigator.clipboard.writeText(code)
                    .then(() => {
                        copyButton.innerHTML = '<i class="fas fa-check"></i>';
                        copyButton.style.color = 'var(--success-color)';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                            copyButton.style.color = '';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                    });
            });
            
            block.style.position = 'relative';
            block.appendChild(copyButton);
        });
    }
    
    // ========== 修复事件绑定 ==========
    function bindToolbarEvents() {
        if (isInitialized) {
            console.log('工具栏事件已经绑定，跳过');
            return;
        }
        
        console.log('绑定工具栏事件...');
        
        // 方式1：使用事件委托
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            // 移除可能存在的旧监听器
            toolbar.removeEventListener('click', handleToolbarClick);
            // 添加新监听器
            toolbar.addEventListener('click', handleToolbarClick);
        }
        
        // 方式2：或者保持原有方式，但确保只绑定一次
        // 移除旧的事件监听器
        toolbarButtons.forEach(button => {
            // 克隆元素并替换，以移除所有事件监听器
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // 重新获取按钮元素
        const newToolbarButtons = document.querySelectorAll('.toolbar-btn[data-insert]');
        
        // 绑定新的事件监听器
        newToolbarButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                e.stopImmediatePropagation(); // 阻止其他监听器
                
                if (window.buttonClicked) {
                    return; // 防止重复点击
                }
                
                window.buttonClicked = true;
                setTimeout(() => {
                    window.buttonClicked = false;
                }, 100);
                
                console.log('点击按钮:', this.dataset.insert);
                insertText(this.dataset.insert);
            }, { once: false }); // 不要使用 once，否则只能点击一次
        });
        
        isInitialized = true;
    }
    
    // 事件委托处理函数
    function handleToolbarClick(e) {
        const button = e.target.closest('.toolbar-btn[data-insert]');
        if (!button) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('事件委托：点击按钮:', button.dataset.insert);
        insertText(button.dataset.insert);
    }
    
    // ========== 初始化 ==========
    
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {}
            }
            return hljs.highlightAuto(code).value;
        }
    });
    
    const savedTheme = localStorage.getItem('markdown-editor-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    const savedContent = localStorage.getItem('markdown-editor-content');
    if (savedContent) {
        editor.value = savedContent;
    }
    
    // 初始渲染
    renderMarkdown();
    updateWordCount();
    
    // 事件监听
    editor.addEventListener('input', function() {
        renderMarkdown();
        updateWordCount();
        saveToLocalStorage();
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    copyBtn.addEventListener('click', copyMarkdown);
    saveBtn.addEventListener('click', function() {
        saveToLocalStorage();
        showNotification('内容已保存到本地存储', 'success');
    });
    clearBtn.addEventListener('click', clearEditor);
    downloadBtn.addEventListener('click', downloadMarkdown);
    
    // 修复工具栏按钮事件绑定
    bindToolbarEvents();
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
            showNotification('内容已保存', 'success');
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            downloadMarkdown();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            clearEditor();
        }
    });
    
    setInterval(() => {
        const content = editor.value;
        if (content && content !== localStorage.getItem('markdown-editor-content')) {
            saveToLocalStorage();
        }
    }, 30000);
    
    // 初始化提示框
    initTooltips();
    
    showNotification('编辑器已加载，支持数学公式和提示框', 'info');
});
