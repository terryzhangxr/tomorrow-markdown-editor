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
    
    renderMarkdown();
    updateWordCount();
    
    editor.addEventListener('input', function() {
        renderMarkdown();
        updateWordCount();
        saveToLocalStorage();
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    copyBtn.addEventListener('click', copyMarkdown);
    saveBtn.addEventListener('click', saveToLocalStorage);
    clearBtn.addEventListener('click', clearEditor);
    downloadBtn.addEventListener('click', downloadMarkdown);
    
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function() {
            insertText(this.dataset.insert);
        });
    });
    
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
    
    function renderMarkdown() {
        const content = editor.value;
        preview.innerHTML = marked.parse(content);
        addCopyButtonsToCodeBlocks();
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
    
    function insertText(syntax) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        
        let insertText = syntax;
        if (selectedText) {
            insertText = syntax.replace('text', selectedText);
        } else if (syntax.includes('text')) {
            insertText = syntax.replace('text', '');
        }
        
        editor.value = editor.value.substring(0, start) + 
                      insertText + 
                      editor.value.substring(end);
        
        let newCursorPos = start + insertText.length;
        
        if (syntax.includes('text') && !selectedText) {
            const placeholderStart = syntax.indexOf('text');
            const placeholderEnd = placeholderStart + 4;
            newCursorPos = start + placeholderStart;
            editor.setSelectionRange(newCursorPos, newCursorPos + 4);
        } else {
            editor.setSelectionRange(newCursorPos, newCursorPos);
        }
        
        editor.focus();
        renderMarkdown();
        updateWordCount();
        saveToLocalStorage();
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
        
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 1000;
                    transform: translateX(120%);
                    transition: transform 0.3s ease-out;
                    border-left: 5px solid var(--accent-color);
                    min-width: 300px;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-success {
                    border-left-color: var(--success-color);
                }
                .notification-danger {
                    border-left-color: var(--danger-color);
                }
                .notification-warning {
                    border-left-color: var(--warning-color);
                }
                .notification i {
                    font-size: 1.2rem;
                }
                .notification-success i {
                    color: var(--success-color);
                }
                .notification-danger i {
                    color: var(--danger-color);
                }
                .notification-warning i {
                    color: var(--warning-color);
                }
            `;
            document.head.appendChild(style);
        }
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
            
            if (!document.querySelector('#copy-btn-styles')) {
                const style = document.createElement('style');
                style.id = 'copy-btn-styles';
                style.textContent = `
                    .copy-code-btn {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                        color: var(--text-secondary);
                        cursor: pointer;
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        opacity: 0;
                    }
                    pre {
                        position: relative;
                    }
                    pre:hover .copy-code-btn {
                        opacity: 1;
                    }
                    .copy-code-btn:hover {
                        background: var(--accent-color);
                        color: white;
                        transform: scale(1.05);
                    }
                `;
                document.head.appendChild(style);
            }
            
            block.style.position = 'relative';
            block.appendChild(copyButton);
        });
    }
    
    showNotification('编辑器已加载', 'info');
});

// ==================== 数学公式支持 ====================

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
        const preview = document.getElementById('preview');
        if (preview) {
            renderMathInElement(preview, options);
        }
    }
}

// ==================== 提示框功能 ====================

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
    
    console.log('✅ 提示框初始化完成');
}

// ==================== 添加代码块复制按钮 ====================

function addCopyButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('#preview pre');
    codeBlocks.forEach(block => {
        // 如果已经有复制按钮，跳过
        if (block.querySelector('.copy-code-btn')) return;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '复制代码';
        
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
                    console.error('复制代码失败:', err);
                });
        });
        
        block.appendChild(copyButton);
    });
}

// ==================== 统一的插入文本函数 ====================

function insertText(syntax) {
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
    }
}

// ==================== 核心编辑器函数 ====================

// 渲染 Markdown
function renderMarkdown() {
    try {
        const content = editor.value;
        preview.innerHTML = marked.parse(content);
        
        // 添加代码块复制按钮
        addCopyButtonsToCodeBlocks();
        
        // 渲染数学公式
        renderMath();
        
    } catch (error) {
        console.error('Markdown 渲染错误:', error);
        preview.innerHTML = '<div style="padding: 20px; color: red; border: 2px solid red;">渲染错误: ' + error.message + '</div>';
    }
}

// 更新字数统计
function updateWordCount() {
    try {
        const text = editor.value;
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = text.match(/\b[a-z]+\b/gi) || [];
        const count = chineseChars.length + englishWords.length;
        
        if (wordCount) {
            wordCount.textContent = count.toLocaleString();
        }
    } catch (error) {
        console.error('字数统计错误:', error);
    }
}

// 切换主题
function toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('markdown-editor-theme', newTheme);
        updateThemeButton(newTheme);
        showNotification(`已切换到${newTheme === 'light' ? '亮色' : '暗色'}模式`, 'info');
        
        // 重新初始化提示框以应用新主题
        setTimeout(initTooltips, 100);
    } catch (error) {
        console.error('主题切换错误:', error);
    }
}

// 更新主题按钮
function updateThemeButton(theme) {
    if (!themeToggle) return;
    
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

// 复制 Markdown
function copyMarkdown() {
    navigator.clipboard.writeText(editor.value)
        .then(() => {
            showNotification('Markdown 内容已复制到剪贴板', 'success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 2000);
        })
        .catch(err => {
            console.error('复制失败:', err);
            showNotification('复制失败，请手动复制', 'danger');
        });
}

// 保存到本地存储
function saveToLocalStorage() {
    try {
        localStorage.setItem('markdown-editor-content', editor.value);
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

// 清空编辑器
function clearEditor() {
    if (editor.value && confirm('确定要清空所有内容吗？此操作不可撤销。')) {
        editor.value = '';
        renderMarkdown();
        updateWordCount();
        localStorage.removeItem('markdown-editor-content');
        showNotification('编辑器内容已清空', 'warning');
    }
}

// 下载 Markdown 文件
function downloadMarkdown() {
    try {
        const content = editor.value;
        if (!content.trim()) {
            showNotification('编辑器为空，没有内容可下载', 'warning');
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
        
        showNotification('Markdown 文件已开始下载', 'success');
    } catch (error) {
        console.error('下载文件错误:', error);
        showNotification('下载失败', 'danger');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    try {
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
    } catch (error) {
        console.error('显示通知错误:', error);
    }
}

// ==================== 全局变量声明 ====================
let editor, preview, themeToggle, wordCount, copyBtn, saveBtn, clearBtn, downloadBtn;

// ==================== 主初始化函数 ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 编辑器初始化开始...');
    
    // 获取DOM元素
    editor = document.getElementById('editor');
    preview = document.getElementById('preview');
    
    if (!editor || !preview) {
        console.error('❌ 找不到关键元素');
        alert('页面加载失败，请刷新重试');
        return;
    }
    
    console.log('✅ DOM 元素加载成功');
    
    // 检查外部库是否加载成功
    if (typeof marked === 'undefined') {
        console.error('❌ marked.js 未加载');
        preview.innerHTML = '<div style="padding: 20px; color: red; border: 2px solid red;">错误：Markdown 解析库加载失败，请刷新页面或检查网络</div>';
        return;
    }
    
    if (typeof hljs === 'undefined') {
        console.warn('⚠️ highlight.js 未加载，代码高亮不可用');
    }
    
    // 配置 marked
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {
                    console.warn('代码高亮错误:', err);
                    return code;
                }
            }
            return code;
        }
    });
    
    // 获取其他元素
    themeToggle = document.getElementById('themeToggle');
    wordCount = document.getElementById('wordCount');
    copyBtn = document.getElementById('copyBtn');
    saveBtn = document.getElementById('saveBtn');
    clearBtn = document.getElementById('clearBtn');
    downloadBtn = document.getElementById('downloadBtn');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-insert]');
    
    // 检查所有按钮是否存在
    if (!themeToggle || !copyBtn || !saveBtn || !clearBtn || !downloadBtn) {
        console.warn('⚠️ 部分按钮元素未找到');
    }
    
    // 主题初始化
    const savedTheme = localStorage.getItem('markdown-editor-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    // 加载保存的内容
    const savedContent = localStorage.getItem('markdown-editor-content');
    if (savedContent) {
        editor.value = savedContent;
        console.log('✅ 已加载本地保存的内容');
    }
    
    // 初始渲染
    renderMarkdown();
    updateWordCount();
    
    // === 事件监听器 ===
    
    // 输入事件
    editor.addEventListener('input', function() {
        renderMarkdown();
        updateWordCount();
        saveToLocalStorage();
    });
    
    // 主题切换
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 复制按钮
    if (copyBtn) {
        copyBtn.addEventListener('click', copyMarkdown);
    }
    
    // 保存按钮
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveToLocalStorage();
            showNotification('内容已保存到本地存储', 'success');
        });
    }
    
    // 清空按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', clearEditor);
    }
    
    // 下载按钮
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadMarkdown);
    }
    
    // 工具栏按钮 - 只绑定一次事件
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('点击工具栏按钮:', this.dataset.insert);
            insertText(this.dataset.insert);
        });
    });
    
    // 键盘快捷键
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
    
    // 自动保存
    setInterval(() => {
        const content = editor.value;
        if (content && content !== localStorage.getItem('markdown-editor-content')) {
            saveToLocalStorage();
        }
    }, 30000);
    
    // 初始化提示框
    initTooltips();
    
    console.log('✅ 编辑器初始化完成');
    
    // 初始通知
    setTimeout(() => {
        showNotification('编辑器已加载完成', 'info');
    }, 500);
    
    // 初始渲染数学公式
    setTimeout(renderMath, 100);
});
