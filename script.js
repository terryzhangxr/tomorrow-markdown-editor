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
    
    // 移动端相关 DOM
    const viewToggle = document.getElementById('viewToggle');
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');
    const toolbar = document.getElementById('toolbar');
    const openToolbarBtn = document.getElementById('openToolbarBtn');
    const closeToolbarBtn = document.getElementById('closeToolbarBtn');
    
    let isPreviewMode = false;
    
    // ========== 数学公式支持 ==========
    function setupKaTeX() {
        if (typeof renderMathInElement !== 'function') return;
        return {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        };
    }
    
    function renderMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(preview, setupKaTeX());
        }
    }
    
    // ========== 提示框功能 ==========
    function initTooltips() {
        if (typeof tippy !== 'function' || window.innerWidth <= 768) return; 
        
        tippy('[data-tippy-content]', {
            theme: 'light-border',
            placement: 'top',
            animation: 'fade',
            duration: 150
        });
    }
    
    // ========== 核心渲染与状态 ==========
    function renderMarkdown() {
        try {
            preview.innerHTML = marked.parse(editor.value);
            addCopyButtonsToCodeBlocks();
            renderMath();
        } catch (error) {
            console.error('Markdown error:', error);
        }
    }
    
    function updateWordCount() {
        const text = editor.value;
        const count = (text.match(/[\u4e00-\u9fa5]/g) || []).length + (text.match(/\b[a-z]+\b/gi) || []).length;
        if(wordCount) wordCount.textContent = count;
    }
    
    function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('markdown-editor-theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        showNotification(`Switched to ${newTheme} mode`, 'info');
    }
    
    // ========== 插入文本逻辑 ==========
    function insertText(syntax) {
        if (window.insertTextExecuting) return;
        window.insertTextExecuting = true;
        
        try {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selectedText = editor.value.substring(start, end);
            
            // 修复：确保把字面量 "\n" 转换为真正的换行符
            let insertText = syntax.replace(/\\n/g, '\n');
            
            if (insertText.includes('公式')) {
                insertText = insertText.replace(/公式/g, selectedText || '');
            } else if (insertText.includes('text')) {
                insertText = insertText.replace(/text/g, selectedText || '');
            } else if (insertText.includes('code') && !insertText.includes('`code`')) {
                insertText = insertText.replace(/code/g, selectedText || '');
            }
            
            editor.value = editor.value.substring(0, start) + insertText + editor.value.substring(end);
            
            // 光标定位逻辑
            let newPos = start + insertText.length;
            if (syntax.includes('公式') && !selectedText) {
                newPos = start + syntax.indexOf('公式');
                editor.setSelectionRange(newPos, newPos + 2);
            } else if (syntax.includes('text') && !selectedText) {
                newPos = start + syntax.indexOf('text');
                editor.setSelectionRange(newPos, newPos + 4);
            } else {
                editor.setSelectionRange(newPos, newPos);
            }
            
            editor.focus();
            renderMarkdown();
            updateWordCount();
            
            // 移动端输入后自动收起工具栏
            if (window.innerWidth <= 768 && toolbar) {
                toolbar.classList.remove('show');
            }
            
        } finally {
            setTimeout(() => window.insertTextExecuting = false, 10);
        }
    }
    
    // ========== 工具函数 ==========
    function showNotification(message, type = 'info') {
        const old = document.querySelector('.notification');
        if (old) old.remove();
        
        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'danger' ? 'exclamation' : 'info'}"></i><span>${message}</span>`;
        
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }
    
    function addCopyButtonsToCodeBlocks() {
        preview.querySelectorAll('pre').forEach(block => {
            if (block.querySelector('.copy-code-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.innerHTML = '<i class="fas fa-copy"></i>';
            btn.onclick = () => {
                const code = block.querySelector('code') ? block.querySelector('code').textContent : block.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
                });
            };
            block.appendChild(btn);
        });
    }

    // ========== 移动端交互 ==========
    function toggleMobileView() {
        isPreviewMode = !isPreviewMode;
        
        if (isPreviewMode) {
            editorPane.classList.remove('active');
            previewPane.classList.add('active');
            viewToggle.innerHTML = '<i class="fas fa-pen"></i>';
            if(toolbar) toolbar.classList.remove('show');
        } else {
            previewPane.classList.remove('active');
            editorPane.classList.add('active');
            viewToggle.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
    
    // ========== 事件绑定 ==========
    if (viewToggle) viewToggle.addEventListener('click', toggleMobileView);
    if (openToolbarBtn) openToolbarBtn.addEventListener('click', () => toolbar.classList.add('show'));
    if (closeToolbarBtn) closeToolbarBtn.addEventListener('click', () => toolbar.classList.remove('show'));
    
    toolbarButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            insertText(this.dataset.insert);
        });
    });
    
    editor.addEventListener('input', () => {
        renderMarkdown();
        updateWordCount();
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(editor.value).then(() => {
            copyBtn.textContent = 'Copied';
            setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
    });
    
    saveBtn.addEventListener('click', () => {
        localStorage.setItem('md-content', editor.value);
        showNotification('Saved locally', 'success');
        if (window.innerWidth <= 768) toolbar.classList.remove('show');
    });
    
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all content?')) {
            editor.value = '';
            renderMarkdown();
            updateWordCount();
            localStorage.removeItem('md-content');
            if (window.innerWidth <= 768) toolbar.classList.remove('show');
        }
    });
    
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([editor.value], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `md-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // 快捷键支持
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            localStorage.setItem('md-content', editor.value);
            showNotification('Saved locally', 'success');
        }
    });
    
    // ========== 初始化 ==========
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });
    
    const savedTheme = localStorage.getItem('markdown-editor-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    const savedContent = localStorage.getItem('md-content');
    if (savedContent) editor.value = savedContent;
    
    renderMarkdown();
    updateWordCount();
    initTooltips();
});
