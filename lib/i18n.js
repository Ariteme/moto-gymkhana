export const tagTranslations = {
  ru: {
    'Easy': 'Лёгкий',
    'Medium': 'Средний',
    'Hard': 'Сложный',
    'Countersteering': 'Контрруление',
    'Trail Braking (Front)': 'Трейл-торможение (перед)',
    'Rear Brake Drag (Rear)': 'Торможение задним (зад)',
    'Throttle Control': 'Управление газом',
    'Clutch Control': 'Управление сцеплением',
    'Body Position': 'Положение тела',
    'Counterweighting': 'Противовес',
    'Vision': 'Взгляд',
    'Gear Selection': 'Выбор передачи',
    'Slow Speed Balance': 'Баланс на малой скорости',
    'Slalom': 'Слалом',
    'Figure Eight': 'Восьмёрка',
    'Full-Lock Turn': 'Поворот до упора',
    'Pivot Turn': 'Разворот на месте',
  }
}

export const translateTag = (tag, lang) =>
  lang === 'ru' && tagTranslations.ru[tag] ? tagTranslations.ru[tag] : tag

export const i18n = {
  en: {
    // Nav
    back: '← Back',
    leaderboard: '← Leaderboard',
    submit_run: '➕ Submit Run',
    training: '🏋️ Training',
    news: '📰 News',
    admin: '🛠 Admin',

    // Home
    israel: '🇮🇱  Israel',
    tagline: 'Live competition leaderboard',
    all_maps: 'All Maps',
    all_bikes: 'All Bikes',
    all_riders: 'All Riders',
    clear_filters: '✕ Clear filters',
    all_runs: 'All runs',
    total: 'total',
    no_results: 'No results yet',
    first_submit: 'Be the first to submit a run →',
    training_sessions: 'Training Sessions',
    friday: 'Friday',
    saturday: 'Saturday',
    community: 'Community & Location',
    watch_run: '▶ Watch run',

    // Submit
    submit_title: 'Submit Your Run',
    rider_name: 'Rider name',
    rider_name_placeholder: 'Your name in English',
    plate_number: 'Plate number',
    plate_hint: '7 or 8 digits',
    bike_model: 'Bike model',
    map_track: 'Map / Track',
    map_placeholder: 'Select or type a map name',
    lap_time: 'Lap time',
    lap_time_placeholder: 'Seconds  (e.g. 68.43)',
    youtube_url: 'YouTube URL',
    optional: 'optional',
    submit_btn: '🏁 Submit Run',
    submit_success: '🏁 Submitted! Waiting for approval.',
    did_you_mean: '⚠️ Did you mean?',
    tap_to_use: '— tap to use',
    new_person_hint: 'Only continue typing if this is truly a new person.',
    plate_loading: '⏳ Looking up plate...',
    plate_found: '✅ Bike found:',
    plate_new: '⚠️ New plate — select your bike model below',
    plate_invalid: '✗ Israeli plates are 7 digits (older) or 8 digits (new)',
    add_new_map: '➕ Add new:',
    course_layout: 'course layout',
    bike_search_placeholder: 'Search bike model (e.g. mt07, xsr...)',

    // Training
    training_subtitle: 'Patterns · Techniques · Exercises',
    all: 'All',
    no_videos: 'No videos yet',
    loading: 'Loading...',

    // News
    news_title: '📰 Moto News',
    news_source: 't.me/moto_israel',
    news_error_title: 'Could not load news',
    open_telegram: 'Open channel on Telegram →',
    no_posts: 'No posts found',
    see_all_telegram: 'See all posts on Telegram →',
    open_in_telegram: 'Open in Telegram →',
    translating: 'Translating...',

    // Footer
    join_whatsapp: '💬 Join WhatsApp',
    english_only: 'Please use English characters only.',

    // Rider profile
    runs: 'Runs',
    maps: 'Maps',
    best_time: 'Best time',
    no_runs: 'No approved runs yet',
    best_per_map: 'Best times per map',
    all_runs_section: 'All runs',
    rider: 'Rider',
  },

  ru: {
    // Nav
    back: '← Назад',
    leaderboard: '← Таблица лидеров',
    submit_run: '➕ Отправить заезд',
    training: '🏋️ Тренировки',
    news: '📰 Новости',
    admin: '🛠 Admin',

    // Home
    israel: '🇮🇱  Израиль',
    tagline: 'Таблица результатов соревнований',
    all_maps: 'Все карты',
    all_bikes: 'Все байки',
    all_riders: 'Все гонщики',
    clear_filters: '✕ Сбросить фильтры',
    all_runs: 'Все заезды',
    total: 'всего',
    no_results: 'Пока нет результатов',
    first_submit: 'Первым отправить заезд →',
    training_sessions: 'Тренировки',
    friday: 'Пятница',
    saturday: 'Суббота',
    community: 'Сообщество и место',
    watch_run: '▶ Смотреть заезд',

    // Submit
    submit_title: 'Отправить заезд',
    rider_name: 'Имя гонщика',
    rider_name_placeholder: 'Ваше имя на английском',
    plate_number: 'Номер пластины',
    plate_hint: '7 или 8 цифр',
    bike_model: 'Модель байка',
    map_track: 'Карта / Трасса',
    map_placeholder: 'Выберите или введите карту',
    lap_time: 'Время круга',
    lap_time_placeholder: 'Секунды  (например 68.43)',
    youtube_url: 'Ссылка YouTube',
    optional: 'необязательно',
    submit_btn: '🏁 Отправить заезд',
    submit_success: '🏁 Отправлено! Ожидайте подтверждения.',
    did_you_mean: '⚠️ Вы имели в виду?',
    tap_to_use: '— нажмите для выбора',
    new_person_hint: 'Продолжайте вводить только если это действительно новый человек.',
    plate_loading: '⏳ Поиск номера...',
    plate_found: '✅ Байк найден:',
    plate_new: '⚠️ Новый номер — выберите модель байка ниже',
    plate_invalid: '✗ Израильские номера: 7 цифр (старые) или 8 цифр (новые)',
    add_new_map: '➕ Добавить:',
    course_layout: 'схема трассы',
    bike_search_placeholder: 'Найти модель (например mt07, xsr...)',

    // Training
    training_subtitle: 'Паттерны · Техники · Упражнения',
    all: 'Все',
    no_videos: 'Видео пока нет',
    loading: 'Загрузка...',

    // News
    news_title: '📰 Мото новости',
    news_source: 't.me/moto_israel',
    news_error_title: 'Не удалось загрузить новости',
    open_telegram: 'Открыть канал в Telegram →',
    no_posts: 'Посты не найдены',
    see_all_telegram: 'Все посты в Telegram →',
    open_in_telegram: 'Открыть в Telegram →',
    translating: 'Перевод...',

    // Footer
    join_whatsapp: '💬 Присоединиться в WhatsApp',
    english_only: 'Пожалуйста, используйте только английские символы.',

    // Rider profile
    runs: 'Заезды',
    maps: 'Карты',
    best_time: 'Лучшее время',
    no_runs: 'Нет подтверждённых заездов',
    best_per_map: 'Лучшее время по картам',
    all_runs_section: 'Все заезды',
    rider: 'Гонщик',
  },
}
