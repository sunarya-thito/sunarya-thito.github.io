document.addEventListener('DOMContentLoaded', () => {
  
  // DOM Elements
  const themeToggle = document.getElementById('theme-toggle');
  const sidebar = document.getElementById('ide-sidebar');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  const fileNodes = document.querySelectorAll('.tree-node.file');
  const tabContainer = document.getElementById('tab-bar');
  const codeBlocks = document.querySelectorAll('.code-block');
  const lineNumbersContainer = document.getElementById('line-numbers-container');
  const breadcrumbActive = document.getElementById('breadcrumb-active-file');
  const footerLang = document.getElementById('footer-lang');

  // Open files tracking
  let openFiles = ['main.dart', 'experience.java', 'achievements.py', 'design.figma', 'contact.json'];
  let activeFile = 'main.dart';

  // --- Collapsible Folders ---
  const folders = document.querySelectorAll('.tree-node.folder');
  folders.forEach(folder => {
    folder.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentFolder = folder.closest('.tree-folder');
      if (parentFolder) {
        parentFolder.classList.toggle('collapsed');
        
        // Swap folder icon (between 'folder' and 'folder_open')
        const iconSpan = folder.querySelector('.icon');
        if (iconSpan) {
          const isCollapsed = parentFolder.classList.contains('collapsed');
          iconSpan.textContent = isCollapsed ? 'folder' : 'folder_open';
        }
        
        // Recalculate line numbers in case container height changed
        setTimeout(updateLineNumbers, 150);
      }
    });
  });

  // --- Theme Management ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
    updateThemeIcon('light');
  } else {
    document.documentElement.classList.add('dark');
    updateThemeIcon('dark');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateThemeIcon('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateThemeIcon('dark');
    }
  });

  function updateThemeIcon(theme) {
    const iconSpan = themeToggle.querySelector('.material-symbols-outlined');
    if (iconSpan) {
      iconSpan.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
    }
  }

  // --- Line Numbers Generator ---
  function updateLineNumbers() {
    if (!lineNumbersContainer) return;
    
    const activeBlock = document.querySelector('.code-block.active');
    if (!activeBlock) {
      lineNumbersContainer.innerHTML = '';
      return;
    }

    // Get height of the active block content and calculate lines based on height
    const blockHeight = activeBlock.getBoundingClientRect().height;
    // Estimated line height is approx 20.4px based on line-num layout styling (12px * 1.7)
    const lineCount = Math.max(15, Math.ceil(blockHeight / 20.4));

    let html = '';
    for (let i = 1; i <= lineCount; i++) {
      html += `<span class="line-num">${i}</span>`;
    }
    lineNumbersContainer.innerHTML = html;
  }

  // Run line numbers generation initially & on resize
  updateLineNumbers();
  window.addEventListener('resize', updateLineNumbers);

  // --- File Switcher Logic ---
  function switchToFile(fileName) {
    if (!openFiles.includes(fileName)) {
      openFiles.push(fileName);
      renderTabs();
    }

    activeFile = fileName;

    // 1. Sidebar Nodes Styling Update (just class toggling, styles are in CSS)
    fileNodes.forEach(node => {
      const nodeFile = node.getAttribute('data-file');
      if (nodeFile === fileName) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // 2. Editor Tabs Styling Update
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => {
      const tabFile = tab.getAttribute('data-file');
      if (tabFile === fileName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 3. Swap Active Editor Content Blocks
    codeBlocks.forEach(block => {
      if (block.id === `code-${fileName}`) {
        block.classList.add('active');
      } else {
        block.classList.remove('active');
      }
    });

    // 4. Update Breadcrumbs
    if (breadcrumbActive) {
      breadcrumbActive.textContent = fileName;
    }

    // 5. Update Status bar language text
    if (footerLang) {
      if (fileName.endsWith('.dart')) {
        footerLang.textContent = 'Dart';
      } else if (fileName.endsWith('.java')) {
        footerLang.textContent = 'Java';
      } else if (fileName.endsWith('.py')) {
        footerLang.textContent = 'Python';
      } else if (fileName.endsWith('.figma')) {
        footerLang.textContent = 'Figma';
      } else if (fileName.endsWith('.json')) {
        footerLang.textContent = 'JSON';
      }
    }

    // 6. Regenerate Line Numbers
    updateLineNumbers();

    // 7. Auto close mobile drawer
    closeMobileSidebar();
  }

  // Bind Sidebar file tree clicks
  fileNodes.forEach(node => {
    node.addEventListener('click', () => {
      const file = node.getAttribute('data-file');
      switchToFile(file);
    });
  });

  // --- Dynamic Tab Renderer (handles closing tabs) ---
  function renderTabs() {
    tabContainer.innerHTML = '';
    
    if (openFiles.length === 0) {
      tabContainer.innerHTML = `
        <div class="editor-tab flex items-center h-full cursor-default select-none">
          <span class="material-symbols-outlined mr-2 text-[16px]">info</span>
          <span class="font-code-md">No open files</span>
        </div>`;
      codeBlocks.forEach(block => block.classList.remove('active'));
      lineNumbersContainer.innerHTML = '';
      if (breadcrumbActive) breadcrumbActive.textContent = '';
      return;
    }

    openFiles.forEach(file => {
      const tab = document.createElement('div');
      const isActive = file === activeFile;
      
      tab.className = `editor-tab ${isActive ? 'active' : ''}`;
      tab.setAttribute('data-file', file);
      
      let fileIcon = 'description';
      if (file.endsWith('.java')) fileIcon = 'code';
      if (file.endsWith('.py')) fileIcon = 'emoji_events';
      if (file.endsWith('.figma')) fileIcon = 'draw';
      if (file.endsWith('.json')) fileIcon = 'alternate_email';

      tab.innerHTML = `
        <span class="material-symbols-outlined mr-2 text-[16px]">${fileIcon}</span>
        <span class="font-code-md tab-name-text">${file}</span>
        <span class="material-symbols-outlined ml-2 text-[14px] opacity-50 hover:opacity-100 tab-close-btn" data-close="${file}">close</span>
      `;

      // Click tab to focus
      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close-btn')) return;
        switchToFile(file);
      });

      // Close tab click
      const closeBtn = tab.querySelector('.tab-close-btn');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(file);
      });

      tabContainer.appendChild(tab);
    });
  }

  function closeTab(fileName) {
    openFiles = openFiles.filter(f => f !== fileName);
    
    if (activeFile === fileName) {
      if (openFiles.length > 0) {
        activeFile = openFiles[openFiles.length - 1];
        switchToFile(activeFile);
      } else {
        activeFile = null;
        renderTabs();
      }
    } else {
      renderTabs();
    }
  }

  // Render initial tabs
  renderTabs();

  // Ensure active styles are initially set correctly
  if (activeFile) {
    switchToFile(activeFile);
  }

  // --- Mobile Sidebar slide-drawer and overlay logic ---
  function openMobileSidebar() {
    document.body.classList.add('sidebar-open');
    sidebarOverlay.classList.remove('hidden');
  }

  // Bind key folders or click background to close mobile view
  function closeMobileSidebar() {
    document.body.classList.remove('sidebar-open');
    sidebarOverlay.classList.add('hidden');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = document.body.classList.contains('sidebar-open');
      if (isOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      closeMobileSidebar();
    });
  }

  // --- Media Modal Logic ---
  const mediaModal = document.getElementById('media-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  function openMediaModal(type, src, titleText) {
    if (!mediaModal || !modalTitle || !modalContent) return;
    
    modalTitle.textContent = titleText;
    modalContent.innerHTML = '';
    
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = src;
      img.alt = titleText;
      img.className = 'max-w-full max-h-[70vh] object-contain rounded-sm border border-technical';
      modalContent.appendChild(img);
    } else if (type === 'pdf') {
      const embed = document.createElement('embed');
      embed.src = src;
      embed.type = 'application/pdf';
      embed.className = 'w-full h-[70vh] rounded-sm';
      modalContent.appendChild(embed);
    }
    
    mediaModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeMediaModal() {
    if (!mediaModal) return;
    mediaModal.classList.add('hidden');
    if (modalContent) modalContent.innerHTML = '';
    document.body.classList.remove('overflow-hidden');
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeMediaModal);
  }
  if (mediaModal) {
    mediaModal.addEventListener('click', (e) => {
      if (e.target === mediaModal) {
        closeMediaModal();
      }
    });
  }

  // Expose to window for inline onclick handlers
  window.openMediaModal = openMediaModal;
  window.closeMediaModal = closeMediaModal;

  // --- GitHub Star Count Fetcher ---
  async function fetchRepoStars(repoName, elementId, fallbackCount) {
    const starSpan = document.getElementById(elementId);
    if (!starSpan) return;

    try {
      const response = await fetch(`https://api.github.com/repos/sunarya-thito/${repoName}`);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.stargazers_count === 'number') {
          starSpan.textContent = data.stargazers_count;
        } else {
          starSpan.textContent = fallbackCount;
        }
      } else {
        starSpan.textContent = fallbackCount;
      }
    } catch (error) {
      starSpan.textContent = fallbackCount;
    }
  }

  // Fetch live stats from GitHub API
  fetchRepoStars('shadcn_flutter', 'stars-shadcn_flutter', '888');
  fetchRepoStars('goo2d', 'stars-goo2d', '12');

});
