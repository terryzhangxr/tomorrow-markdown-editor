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
