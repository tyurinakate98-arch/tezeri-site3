'use strict';
(() => {
  const $ = (query, root = document) => root.querySelector(query);
  const $$ = (query, root = document) => [...root.querySelectorAll(query)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Events are intentionally local until an analytics service is configured.
  // Clicks are never labelled as registrations, activations or payments.
  window.TEZERI_EVENTS = [];
  function track(name, detail = {}) {
    const event = { name, ...detail, page: location.pathname, time: Date.now() };
    window.TEZERI_EVENTS.push(event);
    window.dispatchEvent(new CustomEvent('tezeri:event', { detail: event }));
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (anchor?.getAttribute('href') === 'probnyy-period.html') {
      track('trial_information_open', { source: anchor.textContent.trim() });
    }
  });

  const menu = $('.menu-toggle');
  const nav = $('.main-nav');
  function closeMenu(restore = false) {
    if (!menu || !nav) return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    if (restore) menu.focus();
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('open', open);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });

  const viewer = $('.image-dialog');
  const viewerImage = $('.viewer-image');
  const viewerScroll = $('.viewer-scroll');
  const sizeButton = $('.viewer-size');
  let origin = null;
  function closeViewer() { viewer?.close(); }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-image]');
    if (!button || !viewer || !viewerImage) return;
    origin = button;
    viewerImage.src = button.dataset.image;
    viewerImage.alt = button.dataset.alt || 'Экран программы';
    $('#image-dialog-title').textContent = button.dataset.alt || 'Экран программы';
    viewerScroll.classList.remove('actual');
    sizeButton.setAttribute('aria-pressed', 'false');
    sizeButton.textContent = 'Масштаб 100%';
    viewer.showModal();
    $('.viewer-close').focus();
    track('screen_expand', { screen: button.dataset.image });
  });
  $('.viewer-close')?.addEventListener('click', closeViewer);
  viewer?.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  viewer?.addEventListener('close', () => { origin?.focus(); });
  sizeButton?.addEventListener('click', () => {
    const actual = viewerScroll.classList.toggle('actual');
    sizeButton.setAttribute('aria-pressed', String(actual));
    sizeButton.textContent = actual ? 'Вписать в окно' : 'Масштаб 100%';
  });

  const gallery = [
    { id:'order', label:'Заказ', title:'Работа по объекту — в карточке.', text:'Визуализация, конструкции, мебель в составе балкона и расчёты доступны в контексте заказа.', image:'order-projects.webp', alt:'Карточка заказа с визуализацией, остеклением и расчётом материалов', width:864, height:1296 },
    { id:'project', label:'3D-проект', title:'Клиент видит будущее решение.', text:'Настоящий 3D-проект направления «Балконы и лоджии»: остекление, отделка и мебель.', image:'visualizer-two.webp', alt:'Балкон с остеклением и отделкой в 3D-визуализаторе', width:2070, height:1316 },
    { id:'glazing', label:'Остекление', title:'Конструкция с нужными параметрами.', text:'Редактор остекления: размеры, профиль и состав конструкции. На экране — учебный пример балкона.', image:'glazing-editor.webp', alt:'Редактор конструкции остекления с размерами и параметрами', width:2015, height:1035 },
    { id:'materials', label:'Материалы', title:'Состав расчёта виден по позициям.', text:'Материалы, работы, количества и стоимость. Перед сохранением проверьте заполненность цен.', image:'materials.webp', alt:'Расчёт материалов и работ с количествами и стоимостью', width:2014, height:1003 },
    { id:'money', label:'Оплаты и затраты', title:'Поступления и остаток по заказу.', text:'На демонстрационном экране: получено 91 000 ₽, осталось 200 000 ₽. Затраты показаны отдельно в финансовой сцене выше.', image:'order-payments.webp', alt:'Оплата 91 000 рублей и остаток 200 000 рублей', width:782, height:286 },
    { id:'analytics', label:'Аналитика', title:'Результаты за выбранный период.', text:'Объём подписанных и сданных заказов, задолженность и этапы. Демонстрационные данные, не результаты клиентов.', image:'analytics-summary.webp', alt:'Аналитика подписанных и сданных заказов, задолженности и этапов', width:2045, height:531 },
    { id:'document', label:'Паспорт объекта', title:'Согласованное решение для выполнения.', text:'Фрагмент подлинного паспорта. Для бригады предусмотрен вариант с количествами без цен.', image:'passport-glazing.webp', alt:'Фрагмент настоящего паспорта объекта с конструкциями остекления', width:607, height:552 },
  ];
  const tablist = $('.gallery-tabs');
  const select = $('#gallery-select');
  const galleryPanel = $('#gallery-panel');
  let selectedGallery = 0;
  function chooseGallery(index, moveFocus = false) {
    selectedGallery = index;
    const item = gallery[index];
    if (!galleryPanel) return;
    $$('.gallery-tabs button').forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    select.value = String(index);
    galleryPanel.setAttribute('aria-labelledby', `gallery-tab-${item.id}`);
    $('#gallery-title').textContent = item.title;
    $('#gallery-description').textContent = item.text;
    const img = $('#gallery-image');
    img.src = `assets/media/${item.image}`;
    img.alt = item.alt;
    img.width = item.width; img.height = item.height;
    const button = $('.gallery-image-button');
    button.dataset.image = img.getAttribute('src');
    button.dataset.alt = item.alt;
    button.setAttribute('aria-label', `Увеличить: ${item.alt}`);
    button.classList.toggle('portrait', item.id === 'order' || item.id === 'document');
    button.classList.toggle('analytics-image', item.id === 'analytics');
    if (moveFocus) $(`#gallery-tab-${item.id}`).focus();
    track('screen_select', { screen:item.id });
  }
  if (tablist && select) {
    gallery.forEach((item, i) => {
      const tab = document.createElement('button');
      tab.type = 'button'; tab.id = `gallery-tab-${item.id}`;
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', 'gallery-panel');
      tab.textContent = item.label;
      tab.addEventListener('click', () => chooseGallery(i));
      tablist.append(tab);
      const option = document.createElement('option');
      option.value = String(i); option.textContent = item.label; select.append(option);
    });
    select.addEventListener('change', () => chooseGallery(Number(select.value)));
    tablist.addEventListener('keydown', event => {
      let next = selectedGallery;
      if (event.key === 'ArrowRight') next = (next + 1) % gallery.length;
      else if (event.key === 'ArrowLeft') next = (next - 1 + gallery.length) % gallery.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = gallery.length - 1;
      else return;
      event.preventDefault(); chooseGallery(next, true);
    });
    chooseGallery(0);
  }

  const merge = $('.merge-section');
  const canvas = $('.merge-canvas');
  const mergeToggle = $('.merge-toggle');
  let mergeOverride = null;
  let mergeOverrideScroll = 0;
  let mergeSeen = false;
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  function applyMerge(progress) {
    if (!canvas) return;
    const gathering = clamp(progress / .59);
    const reveal = clamp((progress - .48) / .38);
    canvas.style.setProperty('--g', gathering.toFixed(4));
    canvas.style.setProperty('--fade', clamp((progress - .32) / .27).toFixed(4));
    canvas.style.setProperty('--reveal', reveal.toFixed(4));
    // The source labels remain accessible. Only the not-yet-visible CTA is inert.
    const final = $('.merge-final');
    const motion = !reduced.matches && innerWidth > 760;
    final.inert = motion && reveal < .6;
    if (motion && reveal < .6) final.setAttribute('aria-hidden', 'true');
    else final.removeAttribute('aria-hidden');
    const expanded = progress > .75;
    mergeToggle?.setAttribute('aria-pressed', String(expanded));
    if (mergeToggle) mergeToggle.firstChild.textContent = expanded ? 'Показать четыре инструмента' : 'Показать объединение';
    if (reveal >= 1 && !mergeSeen) { track('workflow_merge_view'); mergeSeen = true; }
  }
  mergeToggle?.addEventListener('click', () => {
    mergeOverride = mergeToggle.getAttribute('aria-pressed') !== 'true' ? 1 : 0;
    mergeOverrideScroll = scrollY;
    applyMerge(mergeOverride);
  });

  const directions = $('.directions');
  const directionTrack = $('.direction-track');
  const directionTabs = $$('[data-direction]');
  const directionPanels = $$('.direction-panel');
  let directionIndex = 0;
  let directionManual = false;
  let directionManualScroll = 0;
  function chooseDirection(index, focus = false, source = 'scroll') {
    if (!directionTrack) return;
    directionIndex = index;
    directionTrack.style.transform = `translateX(${-100 * index}%)`;
    directionTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    directionPanels.forEach((panel, i) => {
      const hidden = !reduced.matches && i !== index;
      panel.inert = hidden;
      if (hidden) panel.setAttribute('aria-hidden', 'true');
      else panel.removeAttribute('aria-hidden');
    });
    if (focus) directionTabs[index]?.focus();
    if (source === 'click') {
      directionManual = true; directionManualScroll = scrollY;
      track('direction_select', { segment:index === 0 ? 'glazing' : 'balcony' });
    }
  }
  directionTabs.forEach((tab, index) => tab.addEventListener('click', () => chooseDirection(index, false, 'click')));
  $('.direction-tabs')?.addEventListener('keydown', event => {
    let next = directionIndex;
    if (event.key === 'ArrowRight' || event.key === 'End') next = 1;
    else if (event.key === 'ArrowLeft' || event.key === 'Home') next = 0;
    else return;
    event.preventDefault(); chooseDirection(next, true, 'click');
  });

  let framePending = false;
  function updateScroll() {
    framePending = false;
    if (merge) {
      if (mergeOverride !== null && Math.abs(scrollY - mergeOverrideScroll) > 90) mergeOverride = null;
      const rect = merge.getBoundingClientRect();
      const available = Math.max(1, merge.offsetHeight - innerHeight + 120);
      const progress = reduced.matches || innerWidth <= 760 ? 1 : clamp((-rect.top + 80) / available);
      applyMerge(mergeOverride ?? progress);
    }
    if (directions) {
      if (directionManual && Math.abs(scrollY - directionManualScroll) > 110) directionManual = false;
      if (innerWidth > 1000 && !reduced.matches && !directionManual) {
        const rect = directions.getBoundingClientRect();
        const progress = clamp((-rect.top + 100) / Math.max(1, directions.offsetHeight - innerHeight + 170));
        const index = progress > .5 ? 1 : 0;
        if (index !== directionIndex) chooseDirection(index);
      }
    }
  }
  function requestScroll() {
    if (!framePending) { requestAnimationFrame(updateScroll); framePending = true; }
  }
  addEventListener('scroll', requestScroll, { passive:true });
  addEventListener('resize', requestScroll, { passive:true });
  reduced.addEventListener('change', () => { chooseDirection(directionIndex); requestScroll(); });
  chooseDirection(0);
  document.body.classList.add('js');
  updateScroll();
})();
