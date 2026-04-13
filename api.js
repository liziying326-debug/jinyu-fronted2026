// API Client - 不影响原有i18n.js功能
// 只在需要动态加载数据时使用

const API_BASE = window.location.origin;

// 加载产品数据
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    return await response.json();
  } catch (error) {
    console.error('Failed to load products:', error);
    return null;
  }
}

// 加载翻译
async function fetchTranslations(lang = 'en') {
  try {
    const response = await fetch(`${API_BASE}/api/i18n/${lang}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to load translations:', error);
    return null;
  }
}

// 加载站点设置（SEO）
async function fetchSettings() {
  try {
    const response = await fetch(`${API_BASE}/api/settings`);
    return await response.json();
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

/**
 * 初始化页面 SEO 标签
 * @param {object} options
 *   pageTitle   - 当前页面标题（如 "About Us"）；传入则拼接为 "About Us | {site_name}"
 *   description - 当前页面描述；不传则 fallback 到 settings.seo_description
 *   ogImage     - og:image URL（可选）
 */
async function initSEO(options) {
  options = options || {};
  const res = await fetchSettings();
  if (!res || !res.data) return;
  const s = res.data;

  // --- <title> ---
  let title = '';
  if (options.pageTitle) {
    title = options.pageTitle + (s.site_name ? ' | ' + s.site_name : '');
  } else {
    title = s.seo_title || s.site_name || document.title;
  }
  document.title = title;

  // --- meta description ---
  const desc = options.description || s.seo_description || '';
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  if (desc) metaDesc.setAttribute('content', desc);

  // --- og:title ---
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', title);

  // --- og:description ---
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  if (desc) ogDesc.setAttribute('content', desc);

  // --- og:image (可选) ---
  if (options.ogImage) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', options.ogImage);
  }
}

/**
 * 动态加载产品分类到导航栏 Products 下拉菜单
 * 查找 #nav-product-dropdown 元素，从 /api/categories 获取分类列表并填充
 * 翻译方式与产品页 tab 一致：用 autoTranslate.pickLang 异步翻译
 */
async function loadNavProductDropdown() {
  const dropdown = document.getElementById('nav-product-dropdown');
  if (!dropdown) return;

  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) return;
    const cats = await res.json();
    const list = Array.isArray(cats) ? cats : (cats.data || []);
    if (list.length === 0) return;

    // 按 sort_order 排序
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const isSelfPage = dropdown.hasAttribute('data-self-page');
    const prefix = isSelfPage ? '#' : 'products.html#';

    // 获取当前语言
    function getLang() {
      try { return localStorage.getItem('jinyu_lang') || localStorage.getItem('lang') || 'en'; } catch(e) { return 'en'; }
    }
    const lang = getLang();

    // 用 autoTranslate.pickLang 翻译每个分类名称（与产品页 tab 一致）
    const translated = await Promise.all(list.map(async cat => {
      let name;
      if (window.autoTranslate) {
        name = await window.autoTranslate.pickLang(cat, 'name', lang);
      }
      if (!name) name = cat.name_en || cat.name || String(cat.id);
      const slug = String(cat.id);
      return `<a href="${prefix}${slug}">${name}</a>`;
    }));

    dropdown.innerHTML = translated.join('');
  } catch (e) {
    console.warn('loadNavProductDropdown failed:', e);
  }
}

// 提交联系表单
async function submitContact(formData) {
  try {
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to submit form:', error);
    return { success: false, error: 'Network error' };
  }
}
