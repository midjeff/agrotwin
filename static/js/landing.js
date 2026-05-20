/* ═══════════════════════════════════════════════════════════════
   Agro-Twin · Landing Page Scripts
   landing.js
═══════════════════════════════════════════════════════════════ */

/* ─── i18n СЛОВАРЬ ────────────────────────────────────────────── */
const i18n = {
  ru: {
    "nav.how":           "КАК РАБОТАЕТ",
    "nav.features":      "ВОЗМОЖНОСТИ",
    "nav.data":          "ДАННЫЕ",
    "nav.accuracy":      "ТОЧНОСТЬ",
    "nav.cta":           "▶ МОНИТОРИНГ",
    "hero.overline":     "REMOTE SENSING & AI SYSTEM",
    "hero.title":        "Интеллектуальная система дистанционного зондирования земли",
    "hero.company":      "«Северо-Казахстанский АШТЖ» ЖШС",
    "hero.desc":         "Мониторинг вегетации на основе анализа спутниковых данных и ИИ, точное прогнозирование урожайности и комплексная система управления земельными ресурсами.",
    "hero.btn_primary":  "ОТКРЫТЬ ОКНО МОНИТОРИНГА",
    "hero.btn_secondary":"УЗНАТЬ БОЛЬШЕ",
    "hero.scroll":       "SCROLL",
    "stats.vmae":        "VMAE · Восстановление",
    "stats.tsn":         "TSN · Прогноз динамики",
    "stats.sources":     "Источника данных",
    "stats.latent":      "Латентных переменных",
    "stats.forecast":    "Горизонт прогноза",
    "pipeline.label":    "АРХИТЕКТУРА СИСТЕМЫ",
    "pipeline.title":    "Как работает Agro-Twin",
    "pipeline.sub":      "Пять этапов от спутниковых снимков до интерактивного прогноза.",
    "pipe1.title":       "Data Fusion",
    "pipe1.desc":        "Sentinel-2, MODIS LST, SMAP SM, NASA POWER. Google Earth Engine pipeline.",
    "pipe2.title":       "VMAE Encoder",
    "pipe2.desc":        "Variational Masked Autoencoder сжимает данные в латентные переменные Z₁, Z₂.",
    "pipe3.title":       "Kalman Filter",
    "pipe3.desc":        "Очистка Z-траектории. Оценка неопределённости. Устранение шумов спутника.",
    "pipe4.title":       "TSN Dynamics",
    "pipe4.desc":        "Temporal State Network прогнозирует эволюцию Z-состояний во времени.",
    "pipe5.title":       "What-if Scenarios",
    "pipe5.desc":        "VMAE Decoder генерирует карты NDVI для любого климатического сценария.",
    "features.label":    "ВОЗМОЖНОСТИ",
    "features.title":    "White-box мониторинг",
    "feat1.title":       "Интерактивная карта",
    "feat1.desc":        "Три слоя: Raw NDVI (Sentinel-2), Digital Twin NDVI (VMAE), Anomaly Score. Клик на поле — мгновенное обновление всех блоков.",
    "feat2.title":       "Латентный анализ",
    "feat2.desc":        "Scatter plot Z₁–Z₂ показывает «генетический код» поля. Точки раскрашены по NDVI. Траектория — история состояния агроэкосистемы.",
    "feat3.title":       "What-if сценарии",
    "feat3.desc":        "Слайдеры температуры (±5°C) и осадков (±50%). TSN рассчитывает сдвиг Z-точки и декодер строит карту будущего стресса.",
    "feat4.title":       "Динамика и прогноз",
    "feat4.desc":        "Три линии: Raw NDVI (пунктир), Digital Twin (сглаженный VMAE), Scenario NDVI (прогноз TSN).",
    "feat5.title":       "Kalman Uncertainty",
    "feat5.desc":        "Фильтр Кальмана даёт коридор доверия. Чем дольше нет снимков — тем шире неопределённость.",
    "feat6.title":       "Мультиязычность",
    "feat6.desc":        "Полная поддержка русского и казахского языков. Переключение без перезагрузки страницы.",
    "data.label":        "ИСТОЧНИКИ ДАННЫХ",
    "data.title":        "Data Fusion Pipeline",
    "data.sub":          "Четыре спутниковых и метеорологических источника объединяются в одну матрицу признаков.",
    "src1.desc":         "10м разрешение. Индексы вегетации через Google Earth Engine.",
    "src2.desc":         "Температура поверхности земли (LST). 10-дневные медианные композиты.",
    "src3.desc":         "Влажность почвы (Soil Moisture) — критичный параметр для стресс-детекции.",
    "src4.desc":         "Осадки и солнечная радиация. Входные параметры для What-if сценариев.",
    "latent.label":      "ЛАТЕНТНОЕ ПРОСТРАНСТВО",
    "latent.title":      "Z₁ и Z₂ — генетический код поля",
    "latent.sub":        "VMAE сжимает все спутниковые данные в два числа. Этого достаточно для полного описания состояния агроэкосистемы.",
    "z1.title":          "Накопление биомассы",
    "z1.desc":           "Отражает интенсивность фотосинтеза. Растёт весной, достигает пика в фазе налива зерна. Коррелирует с NDVI, EVI, ReCI.",
    "z2.title":          "Биофизический стресс",
    "z2.desc":           "Кодирует тепловой и водный стресс. Резко возрастает при дефиците влаги (SMAP↓) или перегреве (LST↑). Высокий Z₂ — сигнал критической аномалии.",
    "kalman.label":      "Kalman Filter · Коридор доверия",
    "kalman.desc":       "Вокруг Z-траектории строится коридор ковариации. Широкий коридор = низкое доверие (нет свежих снимков).",
    "acc.label":         "ТОЧНОСТЬ МОДЕЛЕЙ",
    "acc.title":         "Проверено на данных Северного Казахстана",
    "acc1.desc":         "Восстановление пропущенных данных (облачность). Z-траектории стабильны при 40% пропусков входных данных.",
    "acc2.desc":         "Прогноз динамики Z-состояний. Стабилизация ошибки после 150 шагов. Температурный отклик ΔZ₁ подтверждён для +1°C…+4°C.",
    "table.title":       "ТАБЛИЦА 11 · ОТКЛИК ЛАТЕНТНЫХ ПЕРЕМЕННЫХ НА ТЕМПЕРАТУРНЫЕ СЦЕНАРИИ",
    "th.temp":           "Температура (°C)",
    "cta.label":         "ГОТОВ К ЗАПУСКУ",
    "cta.title":         "Открыть и выбрать поле",
    "cta.sub":           "Интерактивная карта, Z₁-Z₂ scatter plot, What-if симуляция и прогноз NDVI — всё в одном экране.",
    "cta.btn":           "ОТКРЫТЬ ОКНО МОНИТОРИНГА",
    "footer.copy":       "Платформа мониторинга агроэкосистем",
  },
  kz: {
    "nav.how":           "ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ",
    "nav.features":      "МҮМКІНДІКТЕР",
    "nav.data":          "ДЕРЕКТЕР",
    "nav.accuracy":      "ДӘЛДІК",
    "nav.cta":           "▶ МОНИТОРИНГ",
    "hero.overline":     "ҚАШЫҚТЫҚТАН ЗОНДТАУ ЖӘНЕ ЖИ ЖҮЙЕСІ",
    "hero.title":        "Жерді қашықтықтан зондтаудың интеллектуалды жүйесі",
    "hero.company":      "«Солтүстік Қазақстан АШТЖ» ЖШС",
    "hero.desc":         "Ғарыштық мониторинг және жасанды интеллект негізінде вегетация динамикасын талдау, өнімділікті дәл болжау мен жер ресурстарын басқарудың кешенді жүйесі.",
    "hero.btn_primary":  "БАҚЫЛАУ ТАҚТАСЫН АШУ",
    "hero.btn_secondary":"ТОЛЫҒЫРАҚ",
    "hero.scroll":       "SCROLL",
    "stats.vmae":        "VMAE · Қалпына келтіру",
    "stats.tsn":         "TSN · Динамика болжамы",
    "stats.sources":     "Деректер көзі",
    "stats.latent":      "Жасырын айнымалылар",
    "stats.forecast":    "Болжам горизонты",
    "pipeline.label":    "ЖҮЙЕ АРХИТЕКТУРАСЫ",
    "pipeline.title":    "Agro-Twin қалай жұмыс істейді",
    "pipeline.sub":      "Серіктік суреттерден интерактивті болжамға дейін бес кезең.",
    "pipe1.title":       "Деректерді біріктіру",
    "pipe1.desc":        "Sentinel-2, MODIS LST, SMAP SM, NASA POWER. Google Earth Engine pipeline.",
    "pipe2.title":       "VMAE Кодтаушы",
    "pipe2.desc":        "Variational Masked Autoencoder деректерді Z₁, Z₂ жасырын айнымалыларға сығымдайды.",
    "pipe3.title":       "Калман сүзгісі",
    "pipe3.desc":        "Z-траекториясын тазарту. Белгісіздікті бағалау. Серіктік шуды жою.",
    "pipe4.title":       "TSN Динамикасы",
    "pipe4.desc":        "Temporal State Network Z-күйлерінің эволюциясын уақыт бойынша болжайды.",
    "pipe5.title":       "What-if Сценарийлер",
    "pipe5.desc":        "VMAE Decoder кез келген климаттық сценарий үшін NDVI карталарын жасайды.",
    "features.label":    "МҮМКІНДІКТЕР",
    "features.title":    "White-box мониторингі",
    "feat1.title":       "Интерактивті карта",
    "feat1.desc":        "Үш қабат: Raw NDVI (Sentinel-2), Digital Twin NDVI (VMAE), Anomaly Score. Өрісті басыңыз — барлық блоктар жаңарады.",
    "feat2.title":       "Жасырын талдау",
    "feat2.desc":        "Z₁–Z₂ scatter plot өрістің «генетикалық кодын» көрсетеді. Нүктелер NDVI бойынша боялған.",
    "feat3.title":       "What-if сценарийлер",
    "feat3.desc":        "Температура (±5°C) және жауын-шашын (±50%) жүгіргіштері. TSN Z-нүктесінің ығысуын есептейді.",
    "feat4.title":       "Динамика және болжам",
    "feat4.desc":        "Үш сызық: Raw NDVI (үзік), Digital Twin (тегіс VMAE), Scenario NDVI (TSN болжамы).",
    "feat5.title":       "Калман Белгісіздігі",
    "feat5.desc":        "Калман сүзгісі сенімділік дәлізін береді. Снимок болмаса — дәліз кеңейеді.",
    "feat6.title":       "Көптілдік",
    "feat6.desc":        "Орыс және қазақ тілдерін толық қолдау. Беттерді жаңартпай ауыстыру.",
    "data.label":        "ДЕРЕКТЕР КӨЗДЕРІ",
    "data.title":        "Data Fusion Pipeline",
    "data.sub":          "Төрт серіктік және метеорологиялық дерек көзі бір белгілер матрицасына біріктіріледі.",
    "src1.desc":         "10м ажыратымдылық. Google Earth Engine арқылы өсімдік индекстері.",
    "src2.desc":         "Жер бетінің температурасы (LST). 10 күндік медиандық композиттер.",
    "src3.desc":         "Топырақ ылғалдылығы (SM) — стресс анықтау үшін маңызды параметр.",
    "src4.desc":         "Жауын-шашын және күн радиациясы. What-if сценарийлерінің кіріс параметрлері.",
    "latent.label":      "ЖАСЫРЫН КЕҢІСТІК",
    "latent.title":      "Z₁ және Z₂ — өрістің генетикалық коды",
    "latent.sub":        "VMAE барлық серіктік деректерді екі санға сығымдайды. Бұл агроэкожүйе күйін толық сипаттауға жеткілікті.",
    "z1.title":          "Биомасса жинақтау",
    "z1.desc":           "Фотосинтез қарқындылығын көрсетеді. Көктемде өседі, дән пісу кезеңінде шыңына жетеді. NDVI, EVI, ReCI-мен корреляцияланады.",
    "z2.title":          "Биофизикалық стресс",
    "z2.desc":           "Жылу және су стрессін кодтайды. Ылғал тапшылығында (SMAP↓) немесе қызып кетуде (LST↑) күрт өседі. Жоғары Z₂ — критикалық аномалия сигналы.",
    "kalman.label":      "Калман сүзгісі · Сенімділік дәлізі",
    "kalman.desc":       "Z-траекториясы айналасында ковариация дәлізі салынады. Кең дәліз = төмен сенімділік.",
    "acc.label":         "МОДЕЛЬ ДӘЛДІГІ",
    "acc.title":         "Солтүстік Қазақстан деректерінде тексерілген",
    "acc1.desc":         "Жетіспейтін деректерді қалпына келтіру (бұлттылық). Кіріс деректерінің 40% жоқ болса да Z-траекториялары тұрақты.",
    "acc2.desc":         "Z-күй динамикасын болжау. 150 қадамнан кейін қате тұрақтанды. ΔZ₁ температуралық жауабы +1°C…+4°C үшін расталды.",
    "table.title":       "11-КЕСТЕ · ЖАСЫРЫН АЙНЫМАЛЫЛАРДЫҢ ТЕМПЕРАТУРАЛЫҚ СЦЕНАРИЙЛЕРГЕ ЖАУАБЫ",
    "th.temp":           "Температура (°C)",
    "cta.label":         "ІСКЕ ҚОСУҒА ДАЙЫН",
    "cta.title":         "Бақылау тақтасын ашып, өрісті таңдаңыз",
    "cta.sub":           "Интерактивті карта, Z₁-Z₂ scatter plot, What-if симуляция және NDVI болжамы — барлығы бір экранда.",
    "cta.btn":           "МОНИТОРИНГ ТАҚТАСЫН АШУ",
    "footer.copy":       "Агроэкожүйе мониторинг платформасы",
  }
};

/* ─── АКТИВНЫЙ ЯЗЫК ───────────────────────────────────────────── */
let currentLang = 'ru';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('agrotwin_lang', lang);

  /* Кнопки переключателя */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  /* Все элементы с data-i18n */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key] !== undefined) {
      el.textContent = i18n[lang][key];
    }
  });

  document.documentElement.lang = lang === 'kz' ? 'kk' : 'ru';
}

/* ─── NAV: тень при скролле ───────────────────────────────────── */
function initNavScroll() {
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── SCROLL FADE-IN ──────────────────────────────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/* ─── ACCURACY BARS: анимировать при появлении ────────────────── */
function initAccuracyBars() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target.querySelector('.acc-bar');
        if (bar) bar.style.width = bar.dataset.width;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.acc-card').forEach(card => observer.observe(card));
}

/* ─── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initScrollAnimations();
  initAccuracyBars();
  /* Восстанавливаем сохранённый язык, дефолт — ru */
  const saved = localStorage.getItem('agrotwin_lang') || 'ru';
  setLang(saved);
});