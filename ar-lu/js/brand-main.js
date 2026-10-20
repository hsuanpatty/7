(() => {
  "use strict";

  /* =========================================================
     巨匠・典藏｜完整互動 JS

     1. Header 捲動效果
     2. 手機選單
     3. Reveal 淡入動畫
     4. 精選旅程：無限循環＋自動輪播＋中央定位＋圓點＋觸控
     5. 歐洲／紐澳區域圖片輪播
     6. 歐洲經典行程：直接讀取 HTML
     7. 紐澳經典行程：直接讀取 HTML
     8. 響應式重新定位
     9. 經典行程左右切換與觸控拖曳
    10. 推薦行程展開／收合
  ========================================================= */

  const $ = (selector, scope = document) =>
    scope ? scope.querySelector(selector) : null;

  const $$ = (selector, scope = document) =>
    scope ? [...scope.querySelectorAll(selector)] : [];

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );


  /* =========================================================
     0. 推薦行程｜歐洲與紐澳共用展開／收合
  ========================================================= */

  function setTripMoreHeight(more, height) {
    if (!more) return;
    more.style.height = `${Math.max(0, height)}px`;
  }

  function openTripMore(card, toggle, more) {
    card.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");

    more.style.opacity = "1";

    if (reducedMotionQuery.matches) {
      more.style.height = "auto";
      return;
    }

    more.style.height = "0px";

    requestAnimationFrame(() => {
      if (!card.classList.contains("is-open")) return;
      setTripMoreHeight(more, more.scrollHeight);
    });

    const onTransitionEnd = event => {
      if (
        event.target !== more ||
        event.propertyName !== "height"
      ) {
        return;
      }

      more.removeEventListener("transitionend", onTransitionEnd);

      if (card.classList.contains("is-open")) {
        more.style.height = "auto";
      }
    };

    more.addEventListener("transitionend", onTransitionEnd);
  }

  function closeTripMore(card, toggle, more) {
    const currentHeight = more.getBoundingClientRect().height;

    card.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");

    if (reducedMotionQuery.matches) {
      more.style.height = "0px";
      more.style.opacity = "0";
      return;
    }

    more.style.height = `${currentHeight}px`;
    more.style.opacity = "0";

    void more.offsetHeight;

    more.style.height = "0px";
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element
      ? event.target
      : event.target?.parentElement;

    const toggle = target?.closest(
      ".classic-card .trip-toggle, .trip-card .trip-toggle"
    );

    if (!toggle) return;

    const card = toggle.closest(".classic-card, .trip-card");
    const more = card?.querySelector(".trip-more");

    if (!card || !more) return;

    if (card.classList.contains("is-open")) {
      closeTripMore(card, toggle, more);
    } else {
      openTripMore(card, toggle, more);
    }
  });


  /* =========================================================
     1. Header 捲動效果
  ========================================================= */

  const header = $("#siteHeader");
  const menuToggle = $(".menu-toggle");
  const mainNav = $(".main-nav");

  function handleHeader() {
    if (!header) return;

    header.classList.toggle("scrolled", window.scrollY > 70);
  }

  if (header) {
    window.addEventListener("scroll", handleHeader, {
      passive: true
    });

    handleHeader();
  }


  /* =========================================================
     2. 手機選單
  ========================================================= */

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  $$(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav?.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });


  /* =========================================================
     3. Reveal 淡入動畫
  ========================================================= */

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach(el => revealObserver.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add("is-visible"));
  }


  /* =========================================================
     4. 精選旅程輪播
     1. 無限循環
     2. 每 5 秒自動切換
     3. 中央卡片定位
     4. 左右箭頭與圓點切換
     5. 手機觸控滑動
     6. 滑鼠移入暫停，移出繼續
     7. 切換時維持平順放大效果
  ========================================================= */

  function setupFeaturedSlider() {
    const root = document.getElementById("featuredSlider");
    if (!root) return null;

    const track = root.querySelector(".featured-track");

    const dotsBox = document.querySelector(
      '[data-dots-for="featuredSlider"]'
    );

    const controls = document.querySelector(
      '[data-slider-controls="featuredSlider"]'
    );

    const prevBtn = controls?.querySelector(".prev");
    const nextBtn = controls?.querySelector(".next");

    if (!track || !prevBtn || !nextBtn) {
      console.warn(
        "精選旅程：請確認 #featuredSlider、.featured-track 與左右按鈕。"
      );
      return null;
    }

    // 避免同一個輪播重複初始化
    if (root.dataset.featuredInitialized === "true") {
      return null;
    }

    const originals = Array.from(track.children).filter(item =>
      item.classList.contains("featured-item")
    );

    const total = originals.length;

    if (!total) return null;

    root.dataset.featuredInitialized = "true";

    let initialIndex = originals.findIndex(item =>
      item.classList.contains("is-active")
    );

    if (initialIndex < 0) initialIndex = 0;

    // 前後各複製一組卡片，建立無限循環
    const before = originals.map(item => {
      const clone = item.cloneNode(true);

      clone.classList.remove("is-active");
      clone.removeAttribute("aria-current");
      clone.dataset.featuredClone = "true";

      return clone;
    });

    const after = originals.map(item => {
      const clone = item.cloneNode(true);

      clone.classList.remove("is-active");
      clone.removeAttribute("aria-current");
      clone.dataset.featuredClone = "true";

      return clone;
    });

    track.replaceChildren(...before, ...originals, ...after);

    const items = Array.from(
      track.querySelectorAll(".featured-item")
    );

    // position 指向目前要置中的卡片
    let position = total + initialIndex;
    let moving = false;
    let fallbackTimer = null;
    let resizeFrame = 0;

    // 自動輪播設定
    const autoplayDelay = 5000;
    let autoplayTimer = null;
    let isHovering = false;
    let isTouching = false;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const dots = [];

    /* -----------------------------------------
       取得原始行程索引
    ----------------------------------------- */

    function getLogicalIndex() {
      return ((position - total) % total + total) % total;
    }

    /* -----------------------------------------
       建立下方圓點
    ----------------------------------------- */

    if (dotsBox) {
      dotsBox.replaceChildren();

      originals.forEach((item, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.setAttribute(
          "aria-label",
          `前往第 ${index + 1} 個行程`
        );

        dot.addEventListener("click", () => {
          if (moving || index === getLogicalIndex()) return;

          stopAutoplay();

          moving = true;
          position = total + index;

          moveToPosition(true);
          startFallback();
          startAutoplay();
        });

        dotsBox.appendChild(dot);
        dots.push(dot);
      });
    }

    /* -----------------------------------------
       更新作用中卡片與圓點
    ----------------------------------------- */

    function updateActive() {
      items.forEach((item, index) => {
        const active = index === position;

        item.classList.toggle("is-active", active);

        if (active) {
          item.setAttribute("aria-current", "true");
        } else {
          item.removeAttribute("aria-current");
        }
      });

      const activeIndex = getLogicalIndex();

      dots.forEach((dot, index) => {
        const active = index === activeIndex;

        dot.classList.toggle("is-active", active);

        dot.setAttribute(
          "aria-current",
          active ? "true" : "false"
        );
      });
    }

    /* -----------------------------------------
       計算卡片置中位置
    ----------------------------------------- */

    function getOffset(item) {
      const viewportCenter = root.clientWidth / 2;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;

      return viewportCenter - itemCenter;
    }

    /* -----------------------------------------
       無動畫重新定位
       用於初始化、視窗縮放及循環接回
    ----------------------------------------- */

    function rebaseWithoutAnimation() {
      const activeItem = items[position];

      if (!activeItem) return;

      track.style.transition = "none";

      items.forEach(item => {
        item.style.transition = "none";
      });

      updateActive();

      track.style.transform =
        `translate3d(${getOffset(activeItem)}px, 0, 0)`;

      // 強制瀏覽器完成定位
      void track.offsetWidth;

      requestAnimationFrame(() => {
        items.forEach(item => {
          item.style.removeProperty("transition");
        });

        track.style.removeProperty("transition");
      });
    }

    /* -----------------------------------------
       移動至指定卡片
    ----------------------------------------- */

    function moveToPosition(animate = true) {
      const activeItem = items[position];

      if (!activeItem) return;

      updateActive();

      if (!animate || reducedMotionQuery.matches) {
        rebaseWithoutAnimation();
        return;
      }

      track.style.transition =
        "transform 0.6s cubic-bezier(0.2, 0.75, 0.25, 1)";

      track.style.transform =
        `translate3d(${getOffset(activeItem)}px, 0, 0)`;
    }

    /* -----------------------------------------
       動畫結束後處理無限循環
    ----------------------------------------- */

    function finishMove() {
      if (!moving) return;

      clearTimeout(fallbackTimer);
      fallbackTimer = null;

      // 移到前方複製區：無動畫接回原始卡片
      if (position < total) {
        position += total;
        rebaseWithoutAnimation();
      }

      // 移到後方複製區：無動畫接回原始卡片
      else if (position >= total * 2) {
        position -= total;
        rebaseWithoutAnimation();
      }

      moving = false;
    }

    /* -----------------------------------------
       備用完成機制
       避免 transitionend 未觸發造成輪播卡住
    ----------------------------------------- */

    function startFallback() {
      clearTimeout(fallbackTimer);

      fallbackTimer = setTimeout(() => {
        if (!moving) return;

        // 直接完成定位，並恢復 CSS 動畫
        rebaseWithoutAnimation();

        moving = false;
        fallbackTimer = null;
      }, 850);
    }

    /* -----------------------------------------
       上一張／下一張
    ----------------------------------------- */

    function move(step) {
      if (moving || total < 2) return;

      moving = true;
      position += step;

      moveToPosition(true);
      startFallback();
    }

    /* -----------------------------------------
       自動輪播控制
       每 5 秒切換一次
    ----------------------------------------- */

    function stopAutoplay() {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    function startAutoplay() {
      stopAutoplay();

      if (
        total < 2 ||
        reducedMotionQuery.matches ||
        isHovering ||
        isTouching ||
        document.hidden
      ) {
        return;
      }

      autoplayTimer = setInterval(() => {
        if (!moving) {
          move(1);
        }
      }, autoplayDelay);
    }

    /* -----------------------------------------
       左右箭頭
    ----------------------------------------- */

    prevBtn.addEventListener("click", event => {
      event.preventDefault();
      stopAutoplay();
      move(-1);
      startAutoplay();
    });

    nextBtn.addEventListener("click", event => {
      event.preventDefault();
      stopAutoplay();
      move(1);
      startAutoplay();
    });

    /* -----------------------------------------
       軌道位移結束
    ----------------------------------------- */

    track.addEventListener("transitionend", event => {
      if (event.target !== track) return;
      if (event.propertyName !== "transform") return;

      finishMove();
    });

    /* -----------------------------------------
       滑鼠移入暫停，移出繼續
    ----------------------------------------- */

    root.addEventListener("mouseenter", () => {
      isHovering = true;
      stopAutoplay();
    });

    root.addEventListener("mouseleave", () => {
      isHovering = false;
      startAutoplay();
    });

    /* -----------------------------------------
       手機觸控開始
    ----------------------------------------- */

    root.addEventListener(
      "touchstart",
      event => {
        if (!event.touches.length) return;

        isTouching = true;
        stopAutoplay();

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;

        touchEndX = touchStartX;
        touchEndY = touchStartY;
      },
      { passive: true }
    );

    /* -----------------------------------------
       手機觸控移動
    ----------------------------------------- */

    root.addEventListener(
      "touchmove",
      event => {
        if (!event.touches.length) return;

        touchEndX = event.touches[0].clientX;
        touchEndY = event.touches[0].clientY;
      },
      { passive: true }
    );

    /* -----------------------------------------
       手機左右滑動
    ----------------------------------------- */

    root.addEventListener(
      "touchend",
      () => {
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (
          Math.abs(diffX) > 45 &&
          Math.abs(diffX) > Math.abs(diffY) * 1.2
        ) {
          move(diffX < 0 ? 1 : -1);
        }

        isTouching = false;
        startAutoplay();
      },
      { passive: true }
    );

    root.addEventListener(
      "touchcancel",
      () => {
        isTouching = false;
        startAutoplay();
      },
      { passive: true }
    );

    /* -----------------------------------------
       瀏覽器分頁切換
    ----------------------------------------- */

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    /* -----------------------------------------
       視窗尺寸變更：重新置中
    ----------------------------------------- */

    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);

      resizeFrame = requestAnimationFrame(() => {
        clearTimeout(fallbackTimer);
        moving = false;
        rebaseWithoutAnimation();
      });
    });

    /* -----------------------------------------
       初始化
    ----------------------------------------- */

    rebaseWithoutAnimation();
    startAutoplay();

    return {
      root,
      track,

      refresh() {
        clearTimeout(fallbackTimer);
        moving = false;
        rebaseWithoutAnimation();
      },

      stopAutoplay,
      startAutoplay
    };
  }

  // 精選旅程只初始化一次
  const featuredSlider = setupFeaturedSlider();


  /* =========================================================
     5. 歐洲／紐澳區域圖片輪播
     1. 上一張／下一張
     2. 每 4 秒自動切換
     3. 圓點切換
     4. 左右滑動
     5. 滑鼠移入暫停，移出繼續
     6. 視窗尺寸變更時重新渲染
  ========================================================= */

  function setupRegionSlider(id) {
    const root = document.getElementById(id);
    if (!root) return null;

    const track = $(".region-track", root);
    const prev = $(".region-prev", root);
    const next = $(".region-next", root);
    const dots = $(".region-dots", root);

    if (!track || root.dataset.regionInitialized === "true") {
      return null;
    }

    root.dataset.regionInitialized = "true";

    const slides = $$(".region-slide", track);
    const total = slides.length;

    if (!total) return null;

    let index = 0;
    let timer = null;
    let resizeTimer = null;
    let touchStartX = null;
    let touchStartY = null;

    const initialIndex = slides.findIndex(slide =>
      slide.classList.contains("is-active")
    );

    index = initialIndex >= 0 ? initialIndex : 0;

    /* 更新輪播畫面 */

    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove(
          "is-active",
          "is-prev",
          "is-next"
        );

        if (i === index) {
          slide.classList.add("is-active");
        } else if (i === (index - 1 + total) % total) {
          slide.classList.add("is-prev");
        } else if (i === (index + 1) % total) {
          slide.classList.add("is-next");
        }

        const copy = $(".region-copy", slide);

        if (copy) {
          copy.style.display = i === index ? "" : "none";
        }
      });

      if (dots) {
        $$("button", dots).forEach((button, i) => {
          const active = i === index;

          button.classList.toggle("is-active", active);
          button.classList.toggle("active", active);

          button.setAttribute(
            "aria-current",
            active ? "true" : "false"
          );
        });
      }
    }

    function render() {
      updateSlides();
    }

    /* 自動輪播 */

    function restart() {
      clearInterval(timer);
      timer = null;

      if (total > 1 && !reducedMotionQuery.matches) {
        timer = setInterval(() => {
          move(1);
        }, 4000);
      }
    }

    /* 切換指定頁面 */

    function goTo(target) {
      index = (target + total) % total;

      render();
      restart();
    }

    function move(step) {
      if (total < 2) return;
      goTo(index + step);
    }

    /* 建立下方圓點 */

    function buildDots() {
      if (!dots) return;

      dots.innerHTML = "";

      slides.forEach((slide, i) => {
        const button = document.createElement("button");

        button.type = "button";

        button.setAttribute(
          "aria-label",
          `切換到第 ${i + 1} 張`
        );

        button.addEventListener("click", () => {
          goTo(i);
        });

        dots.appendChild(button);
      });
    }

    /* 左右切換按鈕 */

    prev?.addEventListener("click", () => {
      move(-1);
    });

    next?.addEventListener("click", () => {
      move(1);
    });

    /* 滑鼠移入暫停，移出繼續 */

    root.addEventListener("mouseenter", () => {
      clearInterval(timer);
      timer = null;
    });

    root.addEventListener("mouseleave", restart);

    /* 手機觸控開始 */

    root.addEventListener(
      "touchstart",
      event => {
        if (!event.touches.length) return;

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    /* 手機左右滑動切換 */

    root.addEventListener(
      "touchend",
      event => {
        if (
          touchStartX === null ||
          touchStartY === null ||
          !event.changedTouches.length
        ) {
          return;
        }

        const dx =
          event.changedTouches[0].clientX - touchStartX;

        const dy =
          event.changedTouches[0].clientY - touchStartY;

        if (
          Math.abs(dx) > 45 &&
          Math.abs(dx) > Math.abs(dy) * 1.2
        ) {
          move(dx < 0 ? 1 : -1);
        }

        touchStartX = null;
        touchStartY = null;
      },
      { passive: true }
    );

    /* 視窗尺寸變更 */

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        render();
      }, 120);
    });

    /* 初始化 */

    buildDots();
    render();
    restart();

    return {
      root,
      track,
      render,
      move
    };
  }

  setupRegionSlider("europeRegion");
  setupRegionSlider("oceaniaRegion");


  /* =========================================================
     6. 經典行程狀態
  ========================================================= */

  const classicState = {
    europe: {
      category: "western",
      offset: 0
    },
    oceania: {
      category: "newzealand",
      offset: 0
    }
  };


  /* =========================================================
     7. 可見卡片數量
  ========================================================= */

  function cardsVisible() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1000) return 2;
    return 3;
  }


  /* =========================================================
     8. 取得經典行程容器
  ========================================================= */

  function getClassicTrack(type) {
    return document.getElementById(
      type === "europe"
        ? "europeClassicTrack"
        : "oceaniaClassicTrack"
    );
  }


  /* =========================================================
     9. 取得目前顯示的經典行程卡片
  ========================================================= */

  function getClassicCards(type) {
    const track = getClassicTrack(type);
    if (!track) return [];

    return $$(".classic-card", track).filter(card =>
      getComputedStyle(card).display !== "none"
    );
  }


  /* =========================================================
     9A. 經典行程圓點
  ========================================================= */

  function getClassicDots(type) {
    return document.getElementById(
      type === "europe"
        ? "europeClassicDots"
        : "oceaniaClassicDots"
    );
  }

  function renderClassicDots(type) {
    const wrap = getClassicDots(type);
    const cards = getClassicCards(type);
    const state = classicState[type];

    if (!wrap || !state) return;

    const maxOffset = Math.max(
      0,
      cards.length - cardsVisible()
    );

    const dotCount = maxOffset + 1;

    wrap.innerHTML = "";

    wrap.setAttribute("role", "group");

    wrap.setAttribute(
      "aria-label",
      type === "europe"
        ? "歐洲經典行程頁面切換"
        : "紐澳經典行程頁面切換"
    );

    for (let index = 0; index < dotCount; index += 1) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "classic-dot";

      button.setAttribute(
        "aria-label",
        `切換到第 ${index + 1} 個位置`
      );

      button.setAttribute(
        "aria-pressed",
        String(index === state.offset)
      );

      button.dataset.classicDot = type;
      button.dataset.offset = String(index);

      button.addEventListener("click", () => {
        state.offset = Number(button.dataset.offset) || 0;
        updateClassicPosition(type);
      });

      wrap.appendChild(button);
    }

    updateClassicDots(type);
  }

  function updateClassicDots(type) {
    const wrap = getClassicDots(type);
    const state = classicState[type];

    if (!wrap || !state) return;

    $$(".classic-dot", wrap).forEach((dot, index) => {
      const active = index === state.offset;

      dot.classList.toggle("is-active", active);

      dot.setAttribute("aria-pressed", String(active));

      dot.setAttribute(
        "aria-current",
        active ? "true" : "false"
      );
    });
  }


  /* =========================================================
     10. 更新經典行程位置
  ========================================================= */

  function updateClassicPosition(type) {
    const track = getClassicTrack(type);
    const state = classicState[type];

    if (!track || !state) return;

    const cards = getClassicCards(type);

    if (!cards.length) {
      track.style.transform = "translate3d(0, 0, 0)";
      updateClassicDots(type);
      return;
    }

    const maxOffset = Math.max(
      0,
      cards.length - cardsVisible()
    );

    state.offset = Math.max(
      0,
      Math.min(state.offset, maxOffset)
    );

    const firstCard = cards[0];
    const cardWidth = firstCard.getBoundingClientRect().width;
    const trackStyle = window.getComputedStyle(track);

    const gap =
      parseFloat(trackStyle.columnGap) ||
      parseFloat(trackStyle.gap) ||
      0;

    const offset = state.offset * (cardWidth + gap);

    track.style.transform =
      `translate3d(${-offset}px, 0, 0)`;

    updateClassicDots(type);
  }


  /* =========================================================
     11. 歐洲經典行程篩選
  ========================================================= */

  function filterEuropeCards(category) {
    const track = document.getElementById("europeClassicTrack");
    if (!track) return;

    $$(".classic-card", track).forEach(card => {
      card.style.display =
        card.dataset.region === category ? "" : "none";
    });

    classicState.europe.category = category;
    classicState.europe.offset = 0;

    track.style.transform = "translate3d(0, 0, 0)";

    renderClassicDots("europe");
    updateClassicPosition("europe");
  }


  /* =========================================================
     12. 紐澳經典行程篩選
  ========================================================= */

  function filterOceaniaCards(category) {
    const track = document.getElementById("oceaniaClassicTrack");
    if (!track) return;

    $$(".classic-card", track).forEach(card => {
      const isMatch = card.dataset.country === category;

      card.style.display = isMatch ? "" : "none";

      card.classList.remove("is-open");

      const toggle = $(".trip-toggle", card);
      const more = $(".trip-more", card);

      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }

      if (more) {
        more.style.height = "0px";
        more.style.opacity = "0";
      }
    });

    classicState.oceania.category = category;
    classicState.oceania.offset = 0;

    track.style.transform = "translate3d(0, 0, 0)";

    renderClassicDots("oceania");
    updateClassicPosition("oceania");
  }


  /* =========================================================
     13. 經典行程左右切換
  ========================================================= */

  function changeClassic(type, step) {
    const state = classicState[type];
    if (!state) return;

    const cards = getClassicCards(type);

    const maxOffset = Math.max(
      0,
      cards.length - cardsVisible()
    );

    if (maxOffset <= 0) {
      state.offset = 0;
      updateClassicPosition(type);
      return;
    }

    state.offset += step;

    if (state.offset > maxOffset) {
      state.offset = 0;
    }

    if (state.offset < 0) {
      state.offset = maxOffset;
    }

    updateClassicPosition(type);
  }


  /* =========================================================
     14. 區域篩選按鈕
  ========================================================= */

  $$("[data-filter-group]").forEach(group => {
    const type = group.dataset.filterGroup;

    if (!classicState[type]) return;

    $$(".filter-btn", group).forEach(button => {
      button.addEventListener("click", () => {
        const category = button.dataset.filter;

        const validCategory = type === "europe"
          ? [
              "western",
              "eastern",
              "southern",
              "northern"
            ].includes(category)
          : [
              "newzealand",
              "australia"
            ].includes(category);

        if (!validCategory) return;

        $$(".filter-btn", group).forEach(item => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        if (type === "europe") {
          filterEuropeCards(category);
        } else if (type === "oceania") {
          filterOceaniaCards(category);
        }
      });
    });
  });


  /* =========================================================
     15. 經典行程左右箭頭
  ========================================================= */

  $$("[data-classic-prev]").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.classicPrev;

      if (!classicState[type]) return;

      changeClassic(type, -1);
    });
  });

  $$("[data-classic-next]").forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.classicNext;

      if (!classicState[type]) return;

      changeClassic(type, 1);
    });
  });


  /* =========================================================
     16. 初始化經典行程
  ========================================================= */

  function initializeClassicFilters() {
    const europeTrack = document.getElementById("europeClassicTrack");
    const oceaniaTrack = document.getElementById("oceaniaClassicTrack");

    if (europeTrack) {
      filterEuropeCards("western");

      const europeGroup = $('[data-filter-group="europe"]');

      $$(".filter-btn", europeGroup).forEach(button => {
        const active = button.dataset.filter === "western";

        button.classList.toggle("is-active", active);

        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      });
    }

    if (oceaniaTrack) {
      filterOceaniaCards("newzealand");

      const oceaniaGroup = $('[data-filter-group="oceania"]');

      $$(".filter-btn", oceaniaGroup).forEach(button => {
        const active = button.dataset.filter === "newzealand";

        button.classList.toggle("is-active", active);

        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      });
    }
  }

  initializeClassicFilters();


  /* =========================================================
     17. 經典行程觸控／滑鼠拖曳
  ========================================================= */

  function enableDrag(track, type) {
    if (!track) return;

    let startX = 0;
    let startY = 0;
    let dragging = false;

    track.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest(
          "button, a, input, textarea, select, summary"
        )
      ) {
        return;
      }

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
    });

    track.addEventListener("pointerup", event => {
      if (!dragging) return;

      dragging = false;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (
        Math.abs(dx) > 50 &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        changeClassic(type, dx < 0 ? 1 : -1);
      }
    });

    track.addEventListener("pointercancel", () => {
      dragging = false;
    });

    track.addEventListener("pointerleave", () => {
      dragging = false;
    });
  }

  enableDrag(
    document.getElementById("europeClassicTrack"),
    "europe"
  );

  enableDrag(
    document.getElementById("oceaniaClassicTrack"),
    "oceania"
  );


  /* =========================================================
     18. 視窗尺寸變更
  ========================================================= */

  let classicResizeTimer = null;

  window.addEventListener("resize", () => {
    clearTimeout(classicResizeTimer);

    classicResizeTimer = setTimeout(() => {
      // 精選旅程：重新置中，不額外播放縮放動畫
      featuredSlider?.refresh();

      // 經典行程：重新計算圓點與卡片位置
      renderClassicDots("europe");
      renderClassicDots("oceania");

      updateClassicPosition("europe");
      updateClassicPosition("oceania");

      // 展開中的行程內容重新計算高度
      $$(".classic-card.is-open .trip-more, .trip-card.is-open .trip-more")
        .forEach(more => {
          more.style.height = "auto";
        });
    }, 120);
  });


  /* =========================================================
     19. 初始化完成
     精選旅程已在第 4 段初始化，不重複呼叫
  ========================================================= */

})();
