/* ==================== APP ==================== */
const App = {
  setup() {
    const page = ref('auth');
    const authMode = ref('register');
    const email = ref('');
    const password = ref('');
    const authError = ref('');
    const emailError = ref(false);
    const pwError = ref(false);
    const toast = ref('');
    let toastTimer = null;

    const navPage = ref('feed');
    const viewingUserId = ref(null);

    // Onboarding
    const selectedHobbies = ref([]);
    const hobbyLevels = ref({});
    const goalsText = ref('');
    const addedFriends = ref([]);
    const friendsTab = ref('Все');
    const hobbySearch = ref('');
    const onboardingValidationMsg = ref('');

    // User
    const currentUser = reactive({
      name: 'Гость',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      streak: 1,
      hobbies: [],
      hobbyLevels: {},
      goals: '',
      friends: [],
      bio: 'Люблю хобби и новых друзей! ⭐',
    });
    const isGuest = ref(false);
    const userStats = reactive({ posts: 0, likesGiven: 0, comments: 0, readingHours: 0, friends: 0 });

    // Calendar
    const calData = ref(getCalendarData());
    const visitedDays = ref(loadVisitedDays(calData.value.year, calData.value.month));
    function markTodayVisited() {
      saveVisitedDay(calData.value.year, calData.value.month, calData.value.today);
      visitedDays.value = loadVisitedDays(calData.value.year, calData.value.month);
    }

    // Settings
    const currentTheme = ref(localStorage.getItem('hd_theme') || 'light');
    const soundsEnabled = ref(localStorage.getItem('hd_sound') !== 'false');
    const currentLang = ref(localStorage.getItem('hd_lang') || 'ru');
    function setLang(code) { currentLang.value = code; localStorage.setItem('hd_lang', code); }
    const settingNewName = ref('');
    const settingNewEmail = ref('');
    const settingNewBio = ref('');

    function applyTheme(t) {
      t === 'dark' ? document.body.classList.add('dark') : document.body.classList.remove('dark');
      localStorage.setItem('hd_theme', t);
    }
    watch(currentTheme, applyTheme, { immediate: true });
    watch(soundsEnabled, v => localStorage.setItem('hd_sound', v));

    function playSoundIfEnabled(type) { if (soundsEnabled.value) playSound(type); }

    function saveName() {
      if (!settingNewName.value.trim()) return;
      currentUser.name = settingNewName.value.trim();
      settingNewName.value = '';
      showToast('✅ Имя изменено!');
    }
    function saveBio() {
      currentUser.bio = settingNewBio.value || currentUser.bio;
      settingNewBio.value = '';
      showToast('✅ О себе обновлено!');
    }
    function handleAvatarChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { currentUser.avatar = ev.target.result; showToast('📸 Аватар обновлён!'); };
      reader.readAsDataURL(file);
    }

    // Feed posts
    const allPosts = ref([
      { id: 1, authorId: 7, author: 'ФотоОхотник', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', time: '12 минут назад', badge: 'Новое достижение', hobbyDone: false, streak: 19, title: 'Золотой час — магия света 🌅', text: 'Сегодня встал в 5 утра ради этого снимка. Первые 20 минут после восхода — лучшее время для фото. Свет становится мягким и тёплым, тени длинными. Использую Sony A7III + 85mm f/1.8. Никакого HDR — всё в одном кадре.', img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400', tags: ['#Фотография','#Золотойчас','#Пейзаж'], likes: 341, liked: false, comments: [{author:'ЙогаМастер', text:'Невероятный свет! Какая локация?', time:'8 мин назад'},{author:'СолнышкоМое', text:'Хочу научиться так снимать!', time:'5 мин назад'}], shares: 24, expanded: false },
      { id: 2, authorId: 11, author: 'ЙогаМастер', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', time: '34 минуты назад', badge: '60 дней подряд! 🔥', hobbyDone: true, streak: 60, title: '60 дней йоги каждый день', text: 'Два месяца назад поставила цель: йога каждый день без исключений. Сегодня 60-й день! Спина перестала болеть, сон стал глубже, тревожность снизилась. Начинала с 20 минут, сейчас занимаюсь полтора часа. Самое сложное — первые 10 дней, потом тело само требует практики.', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', tags: ['#Йога','#60дней','#Привычки'], likes: 512, liked: false, comments: [{author:'ФотоОхотник', text:'Вдохновляет! Я на 14-м дне', time:'20 мин назад'},{author:'ЦветокМечты', text:'Как себя заставляла в плохие дни?', time:'15 мин назад'},{author:'ЙогаМастер', text:'Правило 2 минут — начни хотя бы на 2 минуты, дальше само идёт', time:'10 мин назад'}], shares: 41, expanded: false },
      { id: 3, authorId: 9, author: 'КулинарПро', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', time: '1 час назад', badge: 'Занимался хобби', hobbyDone: true, streak: 7, title: 'Паста карбонара — только классика 🍝', text: 'Много раз видел рецепты со сливками — это преступление против итальянской кухни! Настоящая карбонара: гуанчале, яичные желтки, пекорино романо, чёрный перец. Никаких сливок, никакого лука. Готовится за 20 минут и никогда не надоедает.', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', tags: ['#Кулинария','#Паста','#Рецепт'], likes: 287, liked: false, comments: [{author:'ШахматистБот', text:'Полностью согласен! Сливки — не карбонара 😄', time:'50 мин назад'},{author:'МастерЗелья', text:'Где найти гуанчале в России?', time:'40 мин назад'}], shares: 15, expanded: false },
      { id: 4, authorId: 8, author: 'ГитаристМечты', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', time: '2 часа назад', badge: 'Занимался хобби', hobbyDone: true, streak: 45, title: 'Fingerpicking — путь к пальцевой технике', text: 'Полгода назад не мог сыграть простую арпеджию без ошибок. Сейчас разучиваю Классический газ Родриго. Секрет: 15 минут медленной отработки лучше, чем час игры как получится. Метроном — ваш лучший друг.', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400', tags: ['#Гитара','#Fingerpicking','#Музыка'], likes: 203, liked: false, comments: [{author:'ШахматистБот', text:'Тоже учусь! На каком этапе?', time:'1.5 ч назад'}], shares: 18, expanded: false },
      { id: 5, authorId: 10, author: 'АквариумистЛюкс', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100', time: '3 часа назад', badge: 'Занимался хобби', hobbyDone: true, streak: 12, title: 'Голландский аквариум — 3 месяца спустя', text: 'Три месяца назад запустил первый голландский акваскейп на 150 литров. Белые водоросли на первой неделе, азотный кризис на второй, гибель растений на третьей. Но сейчас — смотрите сами. Терпение и биология решают всё!', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', tags: ['#Аквариум','#Акваскейп','#Растения'], likes: 274, liked: false, comments: [{author:'ФотоОхотник', text:'Фантастика! Сколько видов растений?', time:'2.5 ч назад'}], shares: 22, expanded: false },
      { id: 6, authorId: 3, author: 'КреативЛепщик', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', time: '4 часа назад', badge: 'Новое достижение', hobbyDone: false, streak: 22, title: 'Первый мастер-класс — нервы и восторг', text: 'Провела первый платный МК по лепке из полимерной глины. 8 человек, 3 часа. Так волновалась! Готовила программу неделю. Но всё прошло лучше, чем ожидала — 8 улыбающихся людей с их первыми фигурками. Уже набираю следующую группу!', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', tags: ['#Лепка','#МастерКласс','#Творчество'], likes: 156, liked: false, comments: [{author:'КулинарПро', text:'Молодец! Сколько стоил МК?', time:'3.5 ч назад'},{author:'АквариумистЛюкс', text:'Запишите меня на следующий!', time:'3 ч назад'}], shares: 7, expanded: false },
      { id: 7, authorId: 12, author: 'ШахматистБот', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100', time: '5 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 33, title: 'Разбор моей лучшей партии', text: 'Сегодня сыграл партию, которой горжусь. Соперник сильнее на 200 пунктов. Ключевой момент — жертва ферзя на 23-м ходу. Риск огромный, но интуиция подсказывала правильно. Урок: изучайте эндшпиль, большинство игроков его игнорируют.', img: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400', tags: ['#Шахматы','#Разбор','#Стратегия'], likes: 189, liked: false, comments: [{author:'ПурПурПур', text:'Жду разбора! Какой рейтинг соперника?', time:'4.5 ч назад'}], shares: 13, expanded: false },
      { id: 8, authorId: 5, author: 'ТанцорСнов', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', time: '6 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 11, title: 'Сальса — моя новая любовь ❤️', text: 'Три месяца назад впервые встала на сальсу — думала, буду нелепо выглядеть. Сейчас уже выхожу в социальные танцы! Главный совет: не бойтесь ошибаться, все через это проходят. Найдите хорошего партнёра — прогресс ускоряется в разы.', img: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400', tags: ['#Танцы','#Сальса','#Хобби'], likes: 198, liked: false, comments: [{author:'ЦветокМечты', text:'Хочу попробовать тоже!', time:'5.5 ч назад'}], shares: 9, expanded: false },
      { id: 9, authorId: 2, author: 'СолнышкоМое', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', time: '7 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 8, title: 'Первый акварельный портрет 🎨', text: 'Три месяца рисовала котиков и натюрморты, и вот решилась на портрет человека. Рисовала по фото подруги. Пропорции немного поплыли, но я горжусь собой! Акварель не прощает ошибок — это самое сложное, но и самое интересное.', img: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400', tags: ['#Рисование','#Акварель','#Портрет'], likes: 145, liked: false, comments: [{author:'КреативЛепщик', text:'Очень мило! Продолжай, прогресс отличный!', time:'6.5 ч назад'}], shares: 8, expanded: false },
      { id: 10, authorId: 1, author: 'ПурПурПур', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', time: '8 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 16, title: 'Как я победил колорадского жука 🪲', text: 'Делюсь рабочим методом! Протравитель Табу в сочетании с народными средствами дал отличный результат. Главное — не пропустить момент появления личинок. Обрабатывал клубни за 2 недели до посадки — всходы чистые, жуков нет!', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', tags: ['#Садоводство','#Огород','#Советы'], likes: 172, liked: false, comments: [{author:'ЗнатокОгорода', text:'Очень полезно, спасибо!', time:'7.5 ч назад'}], shares: 11, expanded: false },
      { id: 11, authorId: 6, author: 'ЦветокМечты', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', time: '9 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 3, title: 'Мой первый огород на подоконнике 🌱', text: 'Живу в квартире, но очень хотела выращивать зелень. Начала с базилика, петрушки и лука. Прошёл месяц — всё живо! Секрет: хорошая земля, рассеянный свет и умеренный полив. Теперь добавлю мяту и рукколу.', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', tags: ['#Садоводство','#Огород','#Подоконник'], likes: 167, liked: false, comments: [{author:'ПурПурПур', text:'Вдохновляет! У меня тоже квартира', time:'8.5 ч назад'}], shares: 11, expanded: false },
      { id: 12, authorId: 4, author: 'МастерЗелья', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', time: '10 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 5, title: 'Осенний лес в объективе 🍂', text: 'Вышел на рассвете в ближайший лес — туман, опавшие листья, косые лучи солнца. Снимал на Canon 6D с 50мм объективом. Ничего дорогого не нужно — только готовность вставать рано и терпение ждать нужного момента.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', tags: ['#Фотография','#Природа','#Осень'], likes: 231, liked: false, comments: [{author:'ФотоОхотник', text:'Прекрасный свет! Canon 6D до сих пор топ', time:'9.5 ч назад'}], shares: 16, expanded: false },
      { id: 13, authorId: 7, author: 'ФотоОхотник', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', time: '11 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 19, title: 'Звёздное небо над озером 🌌', text: 'Выехал за 80 км от города поймать Млечный путь. Экспозиция 25 секунд, ISO 3200, f/2.8. Самое сложное — ждать пока глаза привыкнут к темноте и навести фокус на бесконечность вручную. Результат стоит каждой минуты ожидания!', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400', tags: ['#Фотография','#Астрофото','#Ночь'], likes: 389, liked: false, comments: [{author:'ГитаристМечты', text:'Сказочно! Какой объектив?', time:'10.5 ч назад'}], shares: 31, expanded: false },
      { id: 14, authorId: 9, author: 'КулинарПро', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', time: '12 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 7, title: 'Хлеб на закваске — месяц экспериментов', text: 'Начинал с плотного кирпича, теперь — пышная буханка с хрустящей корочкой. Секрет: долгий холодный старт (18 часов в холодильнике) и раскалённая чугунная кастрюля. Закваска Маша уже 4 месяца живёт у меня на кухне.', img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400', tags: ['#Выпечка','#Хлеб','#Закваска'], likes: 244, liked: false, comments: [{author:'ЦветокМечты', text:'Рецепт закваски пожалуйста!', time:'11.5 ч назад'}], shares: 27, expanded: false },
      { id: 15, authorId: 8, author: 'ГитаристМечты', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', time: '13 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 45, title: 'Написал первую песню 🎵', text: 'Два года играл чужое — и вот наконец что-то своё. Три аккорда, немного боли, немного надежды. Запишу демо на следующей неделе. Страшно и радостно одновременно. Творчество начинается там, где кончается зона комфорта.', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400', tags: ['#Гитара','#Сочинение','#Музыка'], likes: 176, liked: false, comments: [{author:'ЙогаМастер', text:'Ждём запись!', time:'12 ч назад'}], shares: 19, expanded: false },
      { id: 16, authorId: 12, author: 'ШахматистБот', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100', time: '14 часов назад', badge: 'Новое достижение', hobbyDone: false, streak: 33, title: 'Рейтинг 1700 — новый личник! ♟️', text: 'Шесть месяцев назад был на 1450. Что помогло: ежедневные задачи на тактику (30 минут), разбор своих проигранных партий и изучение одного дебюта вместо многих. Следующая цель — 1800 к лету.', img: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400', tags: ['#Шахматы','#Рейтинг','#Прогресс'], likes: 211, liked: false, comments: [{author:'ГитаристМечты', text:'Жёстко! Какой сайт для задач?', time:'13.5 ч назад'},{author:'ШахматистБот', text:'Chess.com и Lichess — оба хороши', time:'13 ч назад'}], shares: 9, expanded: false },
      { id: 17, authorId: 11, author: 'ЙогаМастер', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', time: '15 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 60, title: 'Медитация изменила моё утро ☀️', text: 'Раньше вставала и сразу смотрела в телефон. Три месяца назад заменила это 10-минутной медитацией. Тревога по утрам исчезла, фокус в течение дня заметно лучше. Начните с 5 минут — уже работает.', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', tags: ['#Медитация','#Утро','#Привычки'], likes: 298, liked: false, comments: [], shares: 22, expanded: false },
      { id: 18, authorId: 3, author: 'КреативЛепщик', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', time: '16 часов назад', badge: 'Новое достижение', hobbyDone: false, streak: 22, title: 'Продала первую работу! 🎉', text: 'Фигурка лисы из полимерной глины нашла своего хозяина. Первый раз получила деньги за хобби — 1800 рублей. Казалось бы немного, но эмоции как от первого миллиона. Теперь открываю магазин на Etsy!', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', tags: ['#Лепка','#Продажа','#Handmade'], likes: 334, liked: false, comments: [{author:'ЙогаМастер', text:'Поздравляю!! 🎊', time:'15.5 ч назад'},{author:'АквариумистЛюкс', text:'Дай ссылку на магазин!', time:'15 ч назад'}], shares: 34, expanded: false },
      { id: 19, authorId: 5, author: 'ТанцорСнов', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', time: '17 часов назад', badge: 'Новое достижение', hobbyDone: false, streak: 11, title: 'Выступление на фестивале 🏆', text: 'Впервые вышла на сцену перед аудиторией 300 человек. Ноги тряслись за кулисами. Но вышла — и всё исчезло. Только музыка и движение. Заняли 2-е место в Social Salsa. Слёзы после — лучшие слёзы в жизни.', img: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400', tags: ['#Танцы','#Сцена','#Конкурс'], likes: 421, liked: false, comments: [{author:'ЙогаМастер', text:'Восхищаюсь тобой!! 🎊', time:'16.5 ч назад'},{author:'ГитаристМечты', text:'Это вдохновляет на своё выступление', time:'16 ч назад'}], shares: 52, expanded: false },
      { id: 20, authorId: 10, author: 'АквариумистЛюкс', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100', time: '18 часов назад', badge: 'Занимался хобби', hobbyDone: true, streak: 12, title: 'Нерест дискусов — дождался! 🐟', text: 'Полтора года терпения — и вот пара дискусов отложила икру! 200 икринок на конусе. Теперь самое сложное: держать температуру 30°C, мягкую воду и не мешать родителям. Следите за обновлениями!', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', tags: ['#Аквариум','#Дискус','#Разведение'], likes: 267, liked: false, comments: [{author:'ФотоОхотник', text:'Вот это терпение!', time:'17.5 ч назад'}], shares: 18, expanded: false },
    ]);
    const myPosts = ref([]);
    const likedPosts = computed(() => allPosts.value.filter(p => p.liked));
    const likedNotifCount = ref(0);
    const openComments = ref({});
    const commentInputs = ref({});
    const showScrollTop = ref(false);
    const loadingMore = ref(false);

    // Search
    const searchQuery = ref('');
    const searchOpen = ref(false);
    const showSearchResults = ref(false);
    const searchResults = computed(() => {
      const q = searchQuery.value.toLowerCase().trim();
      if (!q) return { posts: [], users: [] };
      return {
        posts: allPosts.value.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))),
        users: ALL_USERS.filter(u => u.name.toLowerCase().includes(q))
      };
    });
    const sortedPosts = computed(() => {
      const hobbyNames = currentUser.hobbies.map(h => h.name.toLowerCase());
      if (!hobbyNames.length) return allPosts.value;
      return [...allPosts.value].sort((a, b) => {
        const aR = a.tags.some(t => hobbyNames.some(h => t.toLowerCase().includes(h))) ? 1 : 0;
        const bR = b.tags.some(t => hobbyNames.some(h => t.toLowerCase().includes(h))) ? 1 : 0;
        return bR - aR;
      });
    });

    // Onboarding derived
    const onboardingStep = computed(() => {
      const m = { 'onboarding-hobbies':1,'onboarding-levels':2,'onboarding-goals':3,'onboarding-summary':4,'onboarding-friends':5 };
      return m[page.value] || 0;
    });
    const filteredHobbies = computed(() => {
      if (!hobbySearch.value) return HOBBIES;
      return HOBBIES.filter(h => h.name.includes(hobbySearch.value.toLowerCase()));
    });
    const friendsTabs2 = computed(() => {
      const tabs = ['Все'];
      selectedHobbies.value.forEach(id => { const h = HOBBIES.find(x => x.id===id); if (h) tabs.push(h.name.charAt(0).toUpperCase()+h.name.slice(1)); });
      tabs.push('Новички');
      return tabs;
    });
    const filteredFriends = computed(() => {
      if (friendsTab.value === 'Все') return ALL_USERS;
      if (friendsTab.value === 'Новички') return ALL_USERS.filter(u => u.hobbies.some(h => h.level==='Новичок'));
      return ALL_USERS.filter(u => u.hobbies.some(h => h.name.toLowerCase().includes(friendsTab.value.toLowerCase())));
    });
    const sidebarSteps = [
      { label: 'Ваши хобби', sub: 'выберите свои хобби' },
      { label: 'Уровень', sub: 'выберите свой уровень' },
      { label: 'Ваши цели', sub: 'напишите, чего хотите достичь' },
      { label: 'Готово!', sub: '' },
      { label: 'Поиск друзей', sub: 'найдите новых друзей' },
    ];
    const onboardingBgImages = {
      'onboarding-hobbies': 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200',
      'onboarding-levels': 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1200',
      'onboarding-goals': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      'onboarding-summary': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
      'onboarding-friends': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200',
    };

    // Friends page
    const myFriendsList = computed(() => {
      const ids = currentUser.friends.length ? currentUser.friends : (addedFriends.value.length ? addedFriends.value : [1]);
      return ALL_USERS.filter(u => ids.includes(u.id));
    });
    const friendsFilter = ref('all');
    const FRIENDS_FILTERS = ['all','online','active','inactive'];
    const filteredFriendsList = computed(() => {
      const list = myFriendsList.value;
      if (friendsFilter.value === 'online') return list.filter(u => u.online);
      if (friendsFilter.value === 'active') return list.filter(u => u.streak >= 5);
      if (friendsFilter.value === 'inactive') return list.filter(u => u.streak < 5);
      return list;
    });

    // Other user
    const viewingUser = computed(() => ALL_USERS.find(u => u.id === viewingUserId.value));
    const viewingUserPosts = computed(() => {
      const base = OTHER_USER_POSTS[viewingUserId.value] || [];
      return base.map(p => ({ ...p, authorId: viewingUserId.value, author: viewingUser.value?.name || '', avatar: viewingUser.value?.avatar || '', badge: 'Занимался хобби', hobbyDone: true, streak: viewingUser.value?.streak || 1, liked: false, shares: p.shares || 0, expanded: false }));
    });

    // ===== CHAT STATE =====
    const chats = ref(JSON.parse(JSON.stringify(initialChats)));
    const activeChatId = ref(null);
    const chatInput = ref('');
    const chatSearch = ref('');
    const activeReactionMsgId = ref(null);
    const showTyping = ref(false);
    const REACTIONS = ['❤️','😂','😮','👍','🔥','🎉'];
    const chatListWidth = ref(320);
    const isResizing = ref(false);

    const activeChat = computed(() => chats.value.find(c => c.id === activeChatId.value));
    const activeChatUser = computed(() => activeChat.value ? ALL_USERS.find(u => u.id === activeChat.value.userId) : null);
    const totalChatUnread = computed(() => chats.value.filter(c => !c.muted).reduce((s,c) => s+c.unread, 0));
    const filteredChats = computed(() => {
      const q = chatSearch.value.toLowerCase();
      if (!q) return [...chats.value].sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0));
      return chats.value.filter(c => { const u = ALL_USERS.find(x=>x.id===c.userId); return u?.name.toLowerCase().includes(q); });
    });

    function openChatWith(userId) {
      if (isGuest.value) { showToast('Войдите, чтобы писать сообщения'); return; }
      let chat = chats.value.find(c => c.userId === userId);
      if (!chat) { chat = { id: Date.now(), userId, messages: [], unread: 0, muted: false, pinned: false }; chats.value.unshift(chat); }
      activeChatId.value = chat.id;
      chat.unread = 0;
      navPage.value = 'chats';
      nextTick(scrollChatBottom);
    }
    function sendChatMessage() {
      if (!chatInput.value.trim() || !activeChat.value) return;
      const msg = { id: Date.now(), from: 'me', text: chatInput.value.trim(), time: new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}), reaction: null };
      activeChat.value.messages.push(msg);
      chatInput.value = '';
      nextTick(scrollChatBottom);
      playSoundIfEnabled('msg');
      showTyping.value = true;
      setTimeout(() => {
        showTyping.value = false;
        const replies = ['Интересно! 😊','Расскажи подробнее 🙌','Отлично! 🔥','Согласна!','Да, конечно! ✨','Понял(а) тебя 👍','Здорово!','Продолжай, я слушаю 😄'];
        const reply = { id: Date.now()+1, from: activeChat.value.userId, text: replies[Math.floor(Math.random()*replies.length)], time: new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}), reaction: null };
        activeChat.value.messages.push(reply);
        nextTick(scrollChatBottom);
        playSoundIfEnabled('notify');
      }, 1200 + Math.random()*800);
    }
    function scrollChatBottom() {
      const el = document.getElementById('chat-msgs');
      if (el) el.scrollTop = el.scrollHeight;
    }
    function setReaction(msgId, emoji) {
      if (!activeChat.value) return;
      const msg = activeChat.value.messages.find(m => m.id === msgId);
      if (msg) msg.reaction = msg.reaction === emoji ? null : emoji;
      activeReactionMsgId.value = null;
      playSoundIfEnabled('select');
    }
    function deleteChatItem() {
      chats.value = chats.value.filter(c => c.id !== activeChatId.value);
      activeChatId.value = null;
      showToast('🗑️ Чат удалён');
    }
    function toggleMuteChat() {
      if (!activeChat.value) return;
      activeChat.value.muted = !activeChat.value.muted;
      showToast(activeChat.value.muted ? '🔕 Уведомления отключены' : '🔔 Уведомления включены');
    }
    function togglePinChat() {
      if (!activeChat.value) return;
      activeChat.value.pinned = !activeChat.value.pinned;
      showToast(activeChat.value.pinned ? '📌 Чат закреплён' : '📌 Чат откреплён');
    }
    function startChatResize(e) {
      isResizing.value = true;
      const startX = e.clientX, startW = chatListWidth.value;
      const onMove = ev => { chatListWidth.value = Math.max(200, Math.min(480, startW + ev.clientX - startX)); };
      const onUp = () => { isResizing.value = false; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    function handleChatFileAttach(e, type) {
      const file = e.target.files[0];
      if (!file || !activeChat.value) return;
      const msg = { id: Date.now(), from: 'me', text: type==='photo' ? '📸 Фото' : `📎 ${file.name}`, time: new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}), reaction: null };
      activeChat.value.messages.push(msg);
      nextTick(scrollChatBottom);
    }

    // Create post modal
    const showCreatePost = ref(false);
    const newPostTitle = ref('');
    const newPostText = ref('');
    const newPostTags = ref([]);
    const newPostTagInput = ref('');
    const newPostHobbyDone = ref(false);
    const newPostImage = ref(null);
    const postValidation = ref('');

    // Helpers
    function showToast(msg) {
      toast.value = msg;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.value = ''; }, 3000);
    }
    function getNickFromEmail(em) {
      if (!em) return 'Гость';
      return em.split('@')[0].replace(/[^a-zA-Zа-яА-Я0-9_]/g,'') || 'Гость';
    }
    function isValidEmail(em) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.trim()); }

    // Auth
    function submitAuth() {
      authError.value = ''; emailError.value = false; pwError.value = false;
      const em = email.value.trim(), pw = password.value;
      if (!em) { authError.value = 'Введите электронную почту'; emailError.value = true; return; }
      if (!isValidEmail(em)) { authError.value = 'Введите корректный email'; emailError.value = true; return; }
      if (!pw) { authError.value = 'Введите пароль'; pwError.value = true; return; }
      if (pw.length < 6) { authError.value = 'Пароль минимум 6 символов'; pwError.value = true; return; }
      if (/\s/.test(pw)) { authError.value = 'Пароль не должен содержать пробелы'; pwError.value = true; return; }
      if (authMode.value === 'login') {
        if ((em==='test@test.com'||em==='test@mail.ru') && pw==='testtest') {
          playSoundIfEnabled('success'); currentUser.name='Мистер Жук31'; currentUser.streak=updateStreak();
          isGuest.value=false; page.value='feed'; navPage.value='feed';
          markTodayVisited(); showToast('🔥 Добро пожаловать обратно!');
        } else { authError.value='Неверный email или пароль'; emailError.value=true; pwError.value=true; playSoundIfEnabled('error'); }
      } else {
        currentUser.name = getNickFromEmail(em); currentUser.streak = updateStreak();
        isGuest.value=false; playSoundIfEnabled('success'); page.value='onboarding-hobbies';
      }
    }
    function skipToFeed() {
      currentUser.name='Гость'; currentUser.streak=1; isGuest.value=true;
      page.value='feed'; navPage.value='feed'; showToast('👀 Просмотр без авторизации');
    }

    // Onboarding
    function toggleHobby(id) {
      const i = selectedHobbies.value.indexOf(id);
      i===-1 ? selectedHobbies.value.push(id) : selectedHobbies.value.splice(i,1);
      onboardingValidationMsg.value=''; playSoundIfEnabled('select');
    }
    function setLevel(hobbyId, level) {
      hobbyLevels.value = {...hobbyLevels.value, [hobbyId]: level};
      onboardingValidationMsg.value=''; playSoundIfEnabled('select');
    }
    function addGoalHint(hint) { goalsText.value += (goalsText.value?'\n':'')+hint; }
    function toggleFriend(id) {
      const i = addedFriends.value.indexOf(id);
      i===-1 ? addedFriends.value.push(id) : addedFriends.value.splice(i,1);
      playSoundIfEnabled('select');
    }
    function nextOnboarding() {
      onboardingValidationMsg.value='';
      if (page.value==='onboarding-hobbies') {
        if (!selectedHobbies.value.length) { onboardingValidationMsg.value='Выберите хотя бы одно хобби'; return; }
        playSoundIfEnabled('success'); page.value='onboarding-levels';
      } else if (page.value==='onboarding-levels') {
        const missing = selectedHobbies.value.filter(id=>!hobbyLevels.value[id]);
        if (missing.length) { onboardingValidationMsg.value='Выберите уровень для каждого хобби'; return; }
        playSoundIfEnabled('success'); page.value='onboarding-goals';
      } else if (page.value==='onboarding-goals') {
        if (!goalsText.value.trim()) { onboardingValidationMsg.value='Напишите хотя бы одну цель'; return; }
        playSoundIfEnabled('success'); page.value='onboarding-summary';
      } else if (page.value==='onboarding-summary') {
        playSoundIfEnabled('success'); page.value='onboarding-friends';
      } else if (page.value==='onboarding-friends') {
        currentUser.hobbies = selectedHobbies.value.map(id => { const h=HOBBIES.find(x=>x.id===id); return {id, name:h.name, level:hobbyLevels.value[id]||'Новичок'}; });
        currentUser.hobbyLevels = {...hobbyLevels.value};
        currentUser.goals = goalsText.value;
        currentUser.friends = [...addedFriends.value];
        userStats.friends = addedFriends.value.length;
        playSoundIfEnabled('success'); page.value='feed'; navPage.value='feed';
        showToast('🎉 Добро пожаловать в ХОББИДРУГ!');
      }
    }
    function prevOnboarding() {
      onboardingValidationMsg.value='';
      const steps=['onboarding-hobbies','onboarding-levels','onboarding-goals','onboarding-summary','onboarding-friends'];
      const i=steps.indexOf(page.value); if(i>0) page.value=steps[i-1];
    }

    // Feed actions
    function likePost(post) {
      if (isGuest.value) { showToast('Войдите, чтобы ставить лайки'); return; }
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      if (post.liked) { playSoundIfEnabled('like'); userStats.likesGiven++; likedNotifCount.value++; }
      else { userStats.likesGiven=Math.max(0,userStats.likesGiven-1); likedNotifCount.value=Math.max(0,likedNotifCount.value-1); }
    }
    function toggleComments(postId) { openComments.value = {...openComments.value, [postId]: !openComments.value[postId]}; }
    function sendComment(post) {
      if (isGuest.value) { showToast('Войдите, чтобы комментировать'); return; }
      const text = (commentInputs.value[post.id]||'').trim();
      if (!text) return;
      post.comments.push({ author: currentUser.name, text, time: 'только что' });
      post.comments = [...post.comments];
      commentInputs.value = {...commentInputs.value, [post.id]: ''};
      userStats.comments++; playSoundIfEnabled('select');
    }
    function refreshFeed() {
      allPosts.value = [...allPosts.value].sort(()=>Math.random()-.5);
      getScroller()&&getScroller().scrollTo({top:0,behavior:'smooth'}); showToast('✨ Лента обновлена');
    }
    // ── Infinite-scroll post pool (30 varied posts, cycles endlessly) ──
    const EXTRA_POSTS_POOL = [
      {authorId:1,author:'ПурПурПур',avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',badge:'Занимался хобби',hobbyDone:true,streak:16,title:'Рассада томатов: моя система',text:'Высеваю семена в феврале в торфяные таблетки. Ключ — досвечивание 16 часов и температура +22°C. За 3 года ни одной болезни на рассаде. Делюсь полной схемой в комментариях!',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',tags:['#Садоводство','#Томаты','#Советы'],comments:[{author:'ЦветокМечты',text:'Уже сохранила, спасибо!',time:'5 мин назад'}],shares:14},
      {authorId:7,author:'ФотоОхотник',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',badge:'Новое достижение',hobbyDone:false,streak:19,title:'Звёздное небо над озером 🌌',text:'Выехал за 80 км от города, чтобы поймать Млечный путь. Экспозиция 25 секунд, ISO 3200, f/2.8. Самое сложное — ждать пока глаза привыкнут к темноте и правильно навести фокус на бесконечность вручную.',img:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',tags:['#Фотография','#Астрофото','#Ночь'],comments:[{author:'ГитаристМечты',text:'Сказочно! Какой объектив?',time:'20 мин назад'}],shares:31},
      {authorId:8,author:'ГитаристМечты',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',badge:'Занимался хобби',hobbyDone:true,streak:45,title:'Написал первую песню 🎵',text:'Два года играл чужое — и вот наконец что-то своё. Три аккорда, немного боли, немного надежды. Запишу демо на следующей неделе. Страшно и радостно одновременно.',img:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',tags:['#Гитара','#Сочинение','#Музыка'],comments:[{author:'ЙогаМастер',text:'Ждём запись!',time:'1 ч назад'}],shares:19},
      {authorId:9,author:'КулинарПро',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:7,title:'Хлеб на закваске — месяц экспериментов',text:'Начинал с плотного кирпича, а теперь вот — пышная буханка с хрустящей корочкой. Секрет: долгий холодный старт (18 часов в холодильнике) и хорошо прогретая чугунная кастрюля. Закваска "Маша" уже 4 месяца живёт у меня на кухне.',img:'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400',tags:['#Выпечка','#Хлеб','#Закваска'],comments:[{author:'ЦветокМечты',text:'Рецепт закваски пожалуйста!',time:'2 ч назад'},{author:'КулинарПро',text:'Напишу отдельный пост!',time:'1 ч назад'}],shares:27},
      {authorId:11,author:'ЙогаМастер',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',badge:'Занимался хобби',hobbyDone:true,streak:60,title:'Медитация изменила моё утро ☀️',text:'Раньше я вставала и сразу смотрела в телефон. Три месяца назад заменила это 10-минутной медитацией. Результат: тревога по утрам исчезла, фокус в течение дня заметно лучше. Начните с приложения — даже 5 минут работают.',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',tags:['#Медитация','#Утро','#Привычки'],comments:[],shares:22},
      {authorId:10,author:'АквариумистЛюкс',avatar:'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',badge:'Занимался хобби',hobbyDone:true,streak:12,title:'Нерест дискусов — дождался! 🐟',text:'Полтора года терпения и вот — пара дискусов отложила икру! 200 икринок на конусе. Теперь самое сложное: поддерживать температуру 30°C, мягкую воду и не мешать родителям. Следите за обновлениями!',img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',tags:['#Аквариум','#Дискус','#Разведение'],comments:[{author:'ФотоОхотник',text:'Вот это терпение!',time:'3 ч назад'}],shares:18},
      {authorId:12,author:'ШахматистБот',avatar:'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',badge:'Новое достижение',hobbyDone:false,streak:33,title:'Рейтинг 1700 — новый личник!',text:'Шесть месяцев назад был на 1450. Что помогло: ежедневные задачи на тактику (30 минут), разбор своих проигранных партий и изучение одного дебюта вместо многих. Следующая цель — 1800 к лету.',img:'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400',tags:['#Шахматы','#Рейтинг','#Прогресс'],comments:[{author:'ГитаристМечты',text:'Жёстко! Какой сайт для задач?',time:'4 ч назад'},{author:'ШахматистБот',text:'Chess.com и Lichess — оба хороши',time:'3 ч назад'}],shares:9},
      {authorId:2,author:'СолнышкоМое',avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',badge:'Занимался хобби',hobbyDone:true,streak:8,title:'Скетчинг в кафе — новая практика',text:'Взяла за правило: раз в неделю иду в кафе с блокнотом и рисую всё вокруг. Официанты, чашки, случайные люди. Рисунки корявые, но прогресс заметен. Плюс это лучший способ снять рабочий стресс.',img:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400',tags:['#Рисование','#Скетчинг','#Практика'],comments:[{author:'КреативЛепщик',text:'Классная идея! Беру на вооружение',time:'5 ч назад'}],shares:12},
      {authorId:3,author:'КреативЛепщик',avatar:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',badge:'Новое достижение',hobbyDone:false,streak:22,title:'Продала первую работу! 🎉',text:'Фигурка лисы из полимерной глины нашла своего хозяина. Первый раз получила деньги за хобби — 1800 рублей. Казалось бы немного, но эмоции как от первого миллиона. Теперь открываю Etsy-магазин.',img:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',tags:['#Лепка','#Продажа','#Handmade'],comments:[{author:'ЙогаМастер',text:'Поздравляю!! 🎊',time:'1 ч назад'},{author:'АквариумистЛюкс',text:'Дай ссылку на магазин!',time:'45 мин назад'}],shares:34},
      {authorId:5,author:'ТанцорСнов',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',badge:'Занимался хобби',hobbyDone:true,streak:11,title:'Бачата vs сальса — мой выбор',text:'Два года танцевала сальсу, месяц назад попробовала бачату. Это совершенно другой мир: меньше энергии, больше связи с партнёром, другие эмоции. Теперь хожу на оба — они прекрасно дополняют друг друга.',img:'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',tags:['#Танцы','#Бачата','#Сальса'],comments:[],shares:8},
      {authorId:4,author:'МастерЗелья',avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',badge:'Занимался хобби',hobbyDone:true,streak:5,title:'Макросъёмка: мир в деталях 🔍',text:'Купил макрокольца за 800 рублей — и открыл новую вселенную. Глаз мухи, тычинка цветка, поверхность монеты. Никакого дорогого макрообъектива не нужно для начала. Главное — штатив и терпение.',img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',tags:['#Фотография','#Макро','#Советы'],comments:[{author:'ФотоОхотник',text:'Макрокольца — огонь! У меня тоже есть',time:'6 ч назад'}],shares:15},
      {authorId:6,author:'ЦветокМечты',avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',badge:'Занимался хобби',hobbyDone:true,streak:3,title:'Суккуленты: невозможно убить 🌵',text:'Говорят, суккуленты — для тех, кто убивает все растения. Они правы! Поливаю раз в две недели, ставлю на солнечный подоконник и просто любуюсь. Коллекция выросла с 3 до 14 штук за год.',img:'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',tags:['#Растения','#Суккуленты','#Подоконник'],comments:[{author:'ПурПурПур',text:'Какой вид самый неприхотливый?',time:'7 ч назад'},{author:'ЦветокМечты',text:'Хавортия — вообще не убиваемая!',time:'6 ч назад'}],shares:21},
      {authorId:1,author:'ПурПурПур',avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',badge:'Занимался хобби',hobbyDone:true,streak:16,title:'Компост: превращаю отходы в золото ♻️',text:'Три года назад поставил компостный ящик. Теперь все кухонные отходы, листья и трава становятся лучшим удобрением. Экономлю на покупной земле и чувствую себя ответственным перед природой.',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',tags:['#Садоводство','#Компост','#Экология'],comments:[],shares:6},
      {authorId:7,author:'ФотоОхотник',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:19,title:'Уличная фотография: правила игры',text:'Главный страх уличного фотографа — снимать незнакомых людей. Мой метод: снимаю сначала, прошу разрешения потом (если человек заметил). За 3 года съёмок было отказано лишь дважды. Люди в основном рады.',img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',tags:['#Фотография','#Стрит','#Город'],comments:[{author:'СолнышкоМое',text:'Как не бояться подходить к людям?',time:'8 ч назад'},{author:'ФотоОхотник',text:'Просто делать. Первые разы сложно, потом привыкаешь',time:'7 ч назад'}],shares:17},
      {authorId:8,author:'ГитаристМечты',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',badge:'Занимался хобби',hobbyDone:true,streak:45,title:'Как выбрать первую гитару — честно',text:'Не берите самую дешёвую (мучение для пальцев) и не берите дорогую (жалко бросать). Оптимум 6000–12000 рублей — нормальный гриф, держит строй. Yamaha C40 или Fender CD-60S — проверенные варианты.',img:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',tags:['#Гитара','#Советы','#Новичок'],comments:[{author:'КреативЛепщик',text:'Как раз думала купить! Спасибо',time:'9 ч назад'}],shares:43},
      {authorId:9,author:'КулинарПро',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:7,title:'Ризотто: терпение и движение 🍚',text:'Ризотто не терпит спешки. 18 минут непрерывного помешивания — это не преувеличение. Зато результат: шёлковая, кремовая текстура, которую не купить в ресторане. Бульон добавляю половником, жду впитывания — и снова.',img:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',tags:['#Кулинария','#Ризотто','#Рецепт'],comments:[{author:'ЙогаМастер',text:'Мой любимый рецепт тоже!',time:'10 ч назад'}],shares:11},
      {authorId:11,author:'ЙогаМастер',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',badge:'Занимался хобби',hobbyDone:true,streak:60,title:'Поза воина II: разбор ошибок',text:'Казалось бы, простая поза. Но 90% новичков делают одно и то же: заваливают колено внутрь. Колено должно смотреть точно над вторым пальцем стопы. Это защищает сустав и включает нужные мышцы. Снимайте себя на видео — сразу увидите ошибки.',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',tags:['#Йога','#Техника','#Разбор'],comments:[{author:'МастерЗелья',text:'Именно эту позу не мог сделать правильно!',time:'11 ч назад'}],shares:29},
      {authorId:12,author:'ШахматистБот',avatar:'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',badge:'Занимался хобби',hobbyDone:true,streak:33,title:'Эндшпиль решает всё',text:'Большинство любителей зубрят дебюты и игнорируют эндшпиль. Это ошибка. 60% партий на моём уровне доходят до ладейного эндшпиля. Три месяца изучения базовых техник подняли меня на 150 пунктов быстрее, чем год работы над дебютами.',img:'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400',tags:['#Шахматы','#Эндшпиль','#Учёба'],comments:[],shares:16},
      {authorId:10,author:'АквариумистЛюкс',avatar:'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',badge:'Занимался хобби',hobbyDone:true,streak:12,title:'Живые растения vs. пластик: мой ответ',text:'Три года назад поставил пластик "для простоты". Год назад перешёл на живые растения. Разница колоссальная: рыбы активнее, воды менее, водоросли почти исчезли. Растения — это биофильтр и декор одновременно.',img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',tags:['#Аквариум','#Растения','#Советы'],comments:[{author:'ЦветокМечты',text:'Думала только о наземных!',time:'12 ч назад'}],shares:24},
      {authorId:2,author:'СолнышкоМое',avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',badge:'Занимался хобби',hobbyDone:true,streak:8,title:'Гуашь после акварели — другой мир',text:'Месяц рисовала только акварелью, потом взяла гуашь. Шок! Можно рисовать светлое поверх тёмного, исправлять ошибки, смешивать прямо на бумаге. Теперь чередую обе техники в зависимости от настроения.',img:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400',tags:['#Рисование','#Гуашь','#Техника'],comments:[{author:'КреативЛепщик',text:'Тоже недавно попробовала гуашь!',time:'13 ч назад'}],shares:7},
      {authorId:5,author:'ТанцорСнов',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',badge:'Новое достижение',hobbyDone:false,streak:11,title:'Выступление на фестивале 🏆',text:'Впервые вышла на сцену перед аудиторией 300 человек. Ноги тряслись за кулисами. Вышла — и всё исчезло. Только музыка и движение. Мы заняли 2-е место в категории Social Salsa. Слёзы после выступления — лучшие слёзы в жизни.',img:'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',tags:['#Танцы','#Сцена','#Конкурс'],comments:[{author:'ЙогаМастер',text:'Восхищаюсь тобой!! 🎊',time:'14 ч назад'},{author:'ГитаристМечты',text:'Это вдохновляет на своё выступление',time:'13 ч назад'}],shares:52},
      {authorId:6,author:'ЦветокМечты',avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',badge:'Занимался хобби',hobbyDone:true,streak:3,title:'Проращиваю авокадо 🥑',text:'Уже третья попытка — и наконец-то! Косточка пустила корни после 6 недель в воде. Секрет: держать зубочистками строго горизонтально, нижняя треть в воде, менять воду каждые 3 дня. Осталось дождаться ростка!',img:'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',tags:['#Растения','#Авокадо','#Эксперимент'],comments:[{author:'ПурПурПур',text:'У меня тоже растёт!',time:'15 ч назад'}],shares:18},
      {authorId:4,author:'МастерЗелья',avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',badge:'Занимался хобби',hobbyDone:true,streak:5,title:'Длинная выдержка: рисую светом',text:'Ночная съёмка с 30-секундной выдержкой. Фонарик в кадре создаёт световые узоры. Это называется light painting — никаких специальных инструментов, только штатив и фантазия.',img:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400',tags:['#Фотография','#Lightpainting','#Ночь'],comments:[],shares:23},
      {authorId:3,author:'КреативЛепщик',avatar:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',badge:'Занимался хобби',hobbyDone:true,streak:22,title:'Роспись по камням: начало',text:'Нашла на реке красивые гладкие камешки и поняла — это холст! Акриловые краски, лак для защиты. Первая партия из 10 камней ушла в подарки друзьям. Все в восторге. Ноль затрат на материал.',img:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',tags:['#Роспись','#Камни','#Творчество'],comments:[{author:'СолнышкоМое',text:'Какой лак используешь?',time:'16 ч назад'}],shares:14},
      {authorId:1,author:'ПурПурПур',avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',badge:'Занимался хобби',hobbyDone:true,streak:16,title:'Японские огурцы: первый опыт',text:'Впервые вырастил японские огурцы — длинные, хрустящие, почти без семян. Секрет: вертикальная шпалера, регулярный полив (не заливать!), щипать боковые побеги первых двух ярусов. Урожай втрое больше обычного.',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',tags:['#Садоводство','#Огурцы','#Урожай'],comments:[{author:'ЦветокМечты',text:'Беру идею на следующий сезон!',time:'17 ч назад'}],shares:9},
      {authorId:7,author:'ФотоОхотник',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:19,title:'Туманное утро в лесу 🌫️',text:'Встал в 4:30 — и не пожалел. Туман держался ровно 40 минут после восхода. За это время успел сделать лучшие кадры в жизни. Свет сквозь туман создаёт объём, который не передать на словах.',img:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400',tags:['#Фотография','#Туман','#Лес'],comments:[{author:'МастерЗелья',text:'Это магия! Какое место?',time:'18 ч назад'}],shares:38},
      {authorId:11,author:'ЙогаМастер',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',badge:'Занимался хобби',hobbyDone:true,streak:60,title:'Йога-нидра: сон за 20 минут',text:'Нашла практику, которую делаю даже в самые загруженные дни — йога-нидра. Лежишь 20 минут, следуешь голосу. Состояние после — как после 2 часов сна. Идеально для восстановления в середине дня.',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',tags:['#Йога','#НидраЙога','#Отдых'],comments:[{author:'ШахматистБот',text:'Звучит как то, что мне нужно',time:'19 ч назад'}],shares:41},
      {authorId:9,author:'КулинарПро',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:7,title:'Идеальная яичница: секреты',text:'Казалось бы, что тут сложного? Но яичница — это техника. Средний огонь, сливочное масло, крышка на финальные 30 секунд. Белок схватывается, желток остаётся жидким. Добавьте морскую соль и свежий тимьян — совсем другая история.',img:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',tags:['#Кулинария','#Яичница','#Техника'],comments:[],shares:19},
      {authorId:2,author:'СолнышкоМое',avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',badge:'Занимался хобби',hobbyDone:true,streak:8,title:'Пастель: мягкость в каждом штрихе',text:'Попробовала сухую пастель после акварели — это другой мир! Можно смешивать прямо пальцем, исправлять, накладывать слои. Первый натюрморт получился мягким и воздушным. Теперь хочу попробовать пейзаж.',img:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400',tags:['#Рисование','#Пастель','#Живопись'],comments:[{author:'КреативЛепщик',text:'Пастель обожаю! Покажи работу?',time:'2 ч назад'}],shares:13},
      {authorId:1,author:'ПурПурПур',avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',badge:'Занимался хобби',hobbyDone:true,streak:16,title:'Зимний сад: как не дать всему умереть',text:'Ноябрь — самое сложное время для огородников. Делюсь схемой укрытия: что мульчировать, что убрать в подвал, что оставить зимовать прямо в грунте. За 5 лет ни одного потерянного куста.',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',tags:['#Садоводство','#Зима','#Советы'],comments:[{author:'ЦветокМечты',text:'Как раз искала такую инструкцию!',time:'3 ч назад'}],shares:29},
      {authorId:12,author:'ШахматистБот',avatar:'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',badge:'Занимался хобби',hobbyDone:true,streak:33,title:'Задача дня: найди мат в 3 хода',text:'Белые делают ход и ставят мат в 3 хода. Позиция не простая — большинство игроков моего клуба не решили её с первой попытки. Ответ дам в комментариях через 24 часа. Пишите свои варианты!',img:'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400',tags:['#Шахматы','#Задача','#Тактика'],comments:[{author:'МастерЗелья',text:'Kg6? Пробую разобраться',time:'1 ч назад'},{author:'ГитаристМечты',text:'Это сложно, сдаюсь 😅',time:'45 мин назад'}],shares:21},
      {authorId:5,author:'ТанцорСнов',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',badge:'Занимался хобби',hobbyDone:true,streak:11,title:'Реггетон: ритм в крови 🎶',text:'После двух лет сальсы решила попробовать реггетон. Другая энергетика, другое тело, другой ритм. Первое занятие — полный хаос. Второе — уже что-то получается. Это так раскрепощает! Рекомендую всем, кто боится выглядеть нелепо.',img:'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',tags:['#Танцы','#Реггетон','#Свобода'],comments:[{author:'АквариумистЛюкс',text:'Выглядит как веселье!',time:'4 ч назад'}],shares:16},
      {authorId:4,author:'МастерЗелья',avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',badge:'Новое достижение',hobbyDone:false,streak:5,title:'Дрон: небо стало ближе 🚁',text:'Купил первый дрон — DJI Mini 3. Первый полёт: врезался в дерево через 4 минуты. Второй полёт: снял закат над рекой, чуть не плакал от красоты. Дрон — это отдельный вид фотографии. Учусь и влюбляюсь.',img:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400',tags:['#Дрон','#Аэрофото','#Небо'],comments:[{author:'ФотоОхотник',text:'DJI Mini 3 — отличный выбор! Мини советует 👍',time:'5 ч назад'}],shares:37},
      {authorId:6,author:'ЦветокМечты',avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',badge:'Занимался хобби',hobbyDone:true,streak:3,title:'Декупаж: вторая жизнь старых вещей ✂️',text:'Взяла старую деревянную шкатулку с дачи, наждачку, акриловый лак и красивые салфетки. Три часа работы — и вот уже украшение интерьера. Декупаж — медитация и творчество одновременно. Материалы на всё про всё: 200 рублей.',img:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',tags:['#Декупаж','#Рукоделие','#DIY'],comments:[{author:'СолнышкоМое',text:'Покажи фото результата!',time:'6 ч назад'},{author:'ЦветокМечты',text:'Скоро выложу 📸',time:'5.5 ч назад'}],shares:14},
      {authorId:8,author:'ГитаристМечты',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',badge:'Занимался хобби',hobbyDone:true,streak:45,title:'Укулеле за 2 недели: реально ли?',text:'Поспорил с другом что за две недели выучу 5 песен на укулеле. Спойлер: выиграл. Укулеле — идеальный второй инструмент для гитариста. Всего 4 струны, мягкий нейлон не режет пальцы, аккорды проще. Отличный способ порадовать себя быстрым прогрессом.',img:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',tags:['#Укулеле','#Музыка','#Новичок'],comments:[{author:'ТанцорСнов',text:'Хочу тоже попробовать!',time:'7 ч назад'}],shares:25},
      {authorId:10,author:'АквариумистЛюкс',avatar:'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',badge:'Занимался хобби',hobbyDone:true,streak:12,title:'Мини-аквариум на рабочем столе 🐠',text:'Поставил 15-литровый нано-аквариум прямо на стол. Три вида растений, пять кардиналов, одна креветка-вишня. Смотреть на них во время созвонов — лучший антистресс. Коллеги в Zoom постоянно спрашивают что это за рыбки.',img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',tags:['#Аквариум','#Нано','#Работа'],comments:[{author:'ПурПурПур',text:'Хочу такой же! Сколько стоит запуск?',time:'8 ч назад'},{author:'АквариумистЛюкс',text:'Около 3000 руб всё вместе вышло',time:'7.5 ч назад'}],shares:33},
      {authorId:11,author:'ЙогаМастер',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',badge:'Занимался хобби',hobbyDone:true,streak:60,title:'Пранаяма: дышу — значит живу 🌬️',text:'Два месяца практикую капалабхати и нади шодхана каждое утро. 10 минут до кофе. Результат неожиданный: прошли хронические головные боли, которые беспокоили годами. Дыхательные практики — самое недооценённое в йоге.',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',tags:['#Йога','#Пранаяма','#Дыхание'],comments:[],shares:31},
      {authorId:3,author:'КреативЛепщик',avatar:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',badge:'Занимался хобби',hobbyDone:true,streak:22,title:'Фьюзинг: когда стекло плавится',text:'Записалась на мастер-класс по фьюзингу — это когда кусочки стекла плавят в печи и получается украшение или панно. Пять часов в мастерской, собственные руки и — вот оно, моё первое стеклянное панно. Магия!',img:'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',tags:['#Стекло','#Фьюзинг','#Творчество'],comments:[{author:'ЙогаМастер',text:'Никогда не слышала! Хочу попробовать',time:'9 ч назад'}],shares:19},
      {authorId:7,author:'ФотоОхотник',avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:19,title:'Плёнка в 2024 году: зачем? 📷',text:'Купил советский Зенит и кассету Kodak Gold. Снял 36 кадров за месяц. Проявка, сканирование — и вот они, снимки. Плёнка учит думать перед нажатием кнопки. Каждый кадр — решение, а не случайность. Совсем другое ощущение.',img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',tags:['#Фотография','#Плёнка','#Аналог'],comments:[{author:'МастерЗелья',text:'Зенит — легенда! Есть ещё советские объективы?',time:'10 ч назад'}],shares:28},
      {authorId:9,author:'КулинарПро',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',badge:'Занимался хобби',hobbyDone:true,streak:7,title:'Домашние пельмени: семейный рецепт 🥟',text:'Каждое воскресенье лепим пельмени всей семьёй. Тесто на кипятке — оно эластичное и не рвётся. Фарш: свинина+говядина 50/50, лук через мясорубку, чёрный перец, немного ледяной воды для сочности. 200 штук за вечер — норма.',img:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',tags:['#Кулинария','#Пельмени','#Семья'],comments:[{author:'ЦветокМечты',text:'Тесто на кипятке? Первый раз слышу!',time:'11 ч назад'},{author:'КулинарПро',text:'Попробуй — не пожалеешь, оно идеальное',time:'10.5 ч назад'}],shares:44},
      {authorId:2,author:'СолнышкоМое',avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',badge:'Новое достижение',hobbyDone:false,streak:8,title:'Первая выставка — мои работы на стене! 🖼️',text:'Местная галерея взяла 3 моих акварели на групповую выставку начинающих художников. Маленькое событие, но для меня огромное. Стоять и смотреть как люди останавливаются у твоей работы — ни с чем не сравнимое чувство.',img:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400',tags:['#Рисование','#Выставка','#Акварель'],comments:[{author:'КреативЛепщик',text:'Поздравляю!! Это большой шаг!',time:'12 ч назад'},{author:'ФотоОхотник',text:'Гордись собой 🎉',time:'11.5 ч назад'}],shares:47},
      {authorId:1,author:'ПурПурПур',avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',badge:'Занимался хобби',hobbyDone:true,streak:16,title:'Варенье без сахара: миф или реальность?',text:'Сделал варенье из клубники на яблочном пектине без единого грамма сахара. Честно: на вкус не то же самое. Но это хорошо по-другому — чистый вкус ягоды, никакой приторности. Хранить только в холодильнике и не дольше месяца.',img:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',tags:['#Заготовки','#Варенье','#Здоровье'],comments:[{author:'ЙогаМастер',text:'Давно хотела попробовать! Рецепт?',time:'13 ч назад'}],shares:22},
      {authorId:12,author:'ШахматистБот',avatar:'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',badge:'Занимался хобби',hobbyDone:true,streak:33,title:'Блиц vs классика: в чём разница?',text:'Блиц (3+2) и классика (90+30) — это почти разные игры. В блице решает тактика и скорость реакции. В классике — стратегия, планирование, глубокий расчёт. Я долго играл только блиц и деградировал в счёте вариантов. Теперь сочетаю оба формата.',img:'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400',tags:['#Шахматы','#Блиц','#Стратегия'],comments:[{author:'ПурПурПур',text:'Всегда думал что блиц полезен!',time:'14 ч назад'}],shares:17},
      {authorId:6,author:'ЦветокМечты',avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',badge:'Занимался хобби',hobbyDone:true,streak:3,title:'Орхидеи: не так страшно, как кажется 🌸',text:'Три года убивала орхидеи. Теперь у меня их семь и все цветут. Главные ошибки новичков: частый полив (раз в 10 дней, не чаще!), прямое солнце (рассеянный свет), горшок без дырок. Исправьте это — и всё заработает.',img:'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400',tags:['#Растения','#Орхидеи','#Советы'],comments:[{author:'АквариумистЛюкс',text:'Раз в 10 дней?? Я поливал через день 😱',time:'15 ч назад'},{author:'ЦветокМечты',text:'Вот почему они умирали 😄',time:'14.5 ч назад'}],shares:51},
      {authorId:5,author:'ТанцорСнов',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',badge:'Занимался хобби',hobbyDone:true,streak:11,title:'Растяжка за 30 дней: мой результат',text:'Месяц назад не могла дотянуться до колен стоя. Сегодня ладони касаются пола. 20 минут каждый вечер перед сном — и результат налицо. Главное правило: никогда не тяни через боль, только до лёгкого дискомфорта. Тело откликается на регулярность, не на интенсивность.',img:'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',tags:['#Растяжка','#Гибкость','#30дней'],comments:[{author:'ЙогаМастер',text:'Подписываюсь под каждым словом!',time:'16 ч назад'}],shares:38},
      {authorId:4,author:'МастерЗелья',avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',badge:'Занимался хобби',hobbyDone:true,streak:5,title:'Репортаж с городского рынка 📸',text:'Рынок — лучшее место для уличной фотографии. Живые лица, естественный свет, движение, цвет. Снимал два часа — получил 300 кадров. Отобрал 8 сильных. Нормальная пропорция для уличного жанра. Делюсь тремя любимыми.',img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',tags:['#Фотография','#Репортаж','#Улица'],comments:[{author:'СолнышкоМое',text:'Потрясающие кадры! Не боишься снимать людей?',time:'17 ч назад'}],shares:20},
      {authorId:8,author:'ГитаристМечты',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',badge:'Занимался хобби',hobbyDone:true,streak:45,title:'Перебор vs бой: когда что использовать?',text:'Новички часто спрашивают: бой или перебор? Ответ: зависит от песни и настроения. Бой — энергия, ритм, танец. Перебор — мелодия, нежность, история. Научитесь обоим, и ваш репертуар станет в два раза богаче. Показываю базовые паттерны в видео.',img:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',tags:['#Гитара','#Техника','#Перебор'],comments:[{author:'ЦветокМечты',text:'Как раз застряла на этом вопросе!',time:'18 ч назад'}],shares:32},
      {authorId:11,author:'ЙогаМастер',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',badge:'Занимался хобби',hobbyDone:true,streak:60,title:'Акро-йога: летать вместе 🕊️',text:'Попробовала акро-йогу в паре с другом — это страшно, смешно и невероятно весело. Первый раз упали раз пятнадцать. Но когда получилось — эйфория! Требует абсолютного доверия к партнёру и базовой физической подготовки.',img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',tags:['#Йога','#АкроЙога','#Пара'],comments:[{author:'ТанцорСнов',text:'Хочу попробовать! Нужна специальная подготовка?',time:'19 ч назад'},{author:'ЙогаМастер',text:'Достаточно уметь делать планку и не бояться высоты 😄',time:'18.5 ч назад'}],shares:35},
    ];
    let _poolIndex = 0;

    function isSentinelVisible() {
      const sentinel = document.getElementById('feedSentinel');
      const scroller = getScroller();
      if (!sentinel || !scroller) return false;
      const sr = scroller.getBoundingClientRect();
      const tr2 = sentinel.getBoundingClientRect();
      return tr2.top < sr.bottom + 200;
    }

    function addPostBatch() {
      const batch = [];
      for (let i = 0; i < 4; i++) {
        const tpl = EXTRA_POSTS_POOL[_poolIndex % EXTRA_POSTS_POOL.length];
        _poolIndex++;
        batch.push({
          ...tpl,
          id: Date.now() + i + Math.random(),
          time: (Math.floor(Math.random() * 18) + 2) + ' часов назад',
          likes: Math.floor(Math.random() * 280) + 40,
          liked: false,
          expanded: false,
          comments: tpl.comments ? tpl.comments.map(c => ({...c})) : [],
        });
      }
      allPosts.value.push(...batch);
    }

    function loadMorePosts() {
      if (loadingMore.value) return;
      loadingMore.value = true;
      setTimeout(() => {
        addPostBatch();
        loadingMore.value = false;
        // If sentinel is still visible after adding posts → keep filling
        nextTick(() => {
          if (isSentinelVisible() && navPage.value === 'feed') loadMorePosts();
        });
      }, 400);
    }

    // Create post
    function addTagFromInput() {
      const t = newPostTagInput.value.trim().replace(/\s+/g,'');
      if (!t) return;
      const tag = t.startsWith('#') ? t : '#'+t;
      if (!newPostTags.value.includes(tag)) newPostTags.value.push(tag);
      newPostTagInput.value='';
    }
    function addSuggestedTag(tag) { if (!newPostTags.value.includes(tag)) newPostTags.value.push(tag); }
    function removeTag(tag) { newPostTags.value=newPostTags.value.filter(t=>t!==tag); }
    function handleImageUpload(e) {
      const file=e.target.files[0]; if(!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{newPostImage.value=ev.target.result;};
      reader.readAsDataURL(file);
    }
    function submitPost() {
      if (isGuest.value) { showToast('Войдите, чтобы публиковать посты'); return; }
      postValidation.value='';
      if (!newPostTitle.value.trim()) { postValidation.value='Введите заголовок'; return; }
      if (!newPostText.value.trim()) { postValidation.value='Напишите текст поста'; return; }
      const newPost = { id:Date.now(), authorId:'me', author:currentUser.name, avatar:currentUser.avatar, time:'только что', badge:newPostHobbyDone.value?'Занимался хобби':'Новый пост', hobbyDone:newPostHobbyDone.value, streak:currentUser.streak, title:newPostTitle.value.trim(), text:newPostText.value.trim(), img:newPostImage.value||null, tags:[...newPostTags.value], likes:0, liked:false, comments:[], shares:0, expanded:false };
      allPosts.value.unshift(newPost); myPosts.value.unshift(newPost);
      userStats.posts++;
      newPostTitle.value=''; newPostText.value=''; newPostTags.value=[]; newPostTagInput.value=''; newPostHobbyDone.value=false; newPostImage.value=null;
      showCreatePost.value=false; playSoundIfEnabled('success'); showToast('🎉 Пост опубликован!');
      nextTick(()=>{ const sc=getScroller(); if(sc) sc.scrollTo({top:0,behavior:'smooth'}); });
    }

    // Navigate
    function goToUser(id) {
      if (!id || id==='me') { navPage.value='profile'; return; }
      if (isGuest.value) { showToast('Войдите, чтобы просматривать профили'); return; }
      viewingUserId.value=id; navPage.value='other-user';
    }
    function addFriendFromPage(userId) {
      if (isGuest.value) { showToast('Войдите, чтобы добавлять друзей'); return; }
      if (!currentUser.friends.includes(userId)) {
        currentUser.friends.push(userId); userStats.friends++;
        playSoundIfEnabled('success'); showToast('🎉 Друг добавлен!');
      } else { showToast('Уже в друзьях!'); }
    }

    function getScroller() {
      return document.getElementById('mainScroll');
    }
    function handleScroll() {
      const el = getScroller();
      if (!el) return;
      showScrollTop.value = el.scrollTop > 400;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300 && navPage.value === 'feed') loadMorePosts();
    }

    onMounted(() => {
      nextTick(() => {
        const scroller = getScroller();

        // ── Scroll-to-top detection — primary listener ──
        if (scroller) {
          scroller.addEventListener('scroll', () => {
            showScrollTop.value = scroller.scrollTop > 400;
            if (isSentinelVisible() && navPage.value === 'feed') loadMorePosts();
          }, { passive: true });
        }
        // ── Fallback: poll every 300ms in case scroll events miss ──
        setInterval(() => {
          const sc = getScroller();
          if (sc) showScrollTop.value = sc.scrollTop > 400;
        }, 300);

        // ── IntersectionObserver: fires on enter AND stays observed ──
        const setupObserver = () => {
          const sentinel = document.getElementById('feedSentinel');
          if (!sentinel) return;
          // Disconnect any existing observer
          if (window._feedObserver) window._feedObserver.disconnect();
          window._feedObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && navPage.value === 'feed') {
              loadMorePosts();
            }
          }, { root: scroller || null, rootMargin: '300px', threshold: 0 });
          window._feedObserver.observe(sentinel);
        };
        setupObserver();

        watch(navPage, (val) => {
          if (val === 'feed') nextTick(setupObserver);
        });
      });
      markTodayVisited();
      setInterval(()=>{ userStats.readingHours += 1/3600; }, 1000);
    });

    const LANGS = [{code:'ru',flag:'🇷🇺',name:'Русский'},{code:'en',flag:'🇬🇧',name:'English'},{code:'fr',flag:'🇫🇷',name:'Français'},{code:'es',flag:'🇪🇸',name:'Español'},{code:'kz',flag:'🇰🇿',name:'Қазақша'},{code:'be',flag:'🇧🇾',name:'Беларуская'}];

    // Reactive translation proxy — use tr.key in templates
    const tr = computed(() => {
      const lang = currentLang.value;
      return new Proxy({}, { get: (_, key) => t(lang, key) });
    });

    return {
      page, authMode, email, password, authError, emailError, pwError, toast,
      navPage, viewingUserId, viewingUser, viewingUserPosts,
      selectedHobbies, hobbyLevels, goalsText, addedFriends, friendsTab, hobbySearch,
      onboardingValidationMsg, onboardingStep, filteredHobbies, friendsTabs2, filteredFriends,
      sidebarSteps, onboardingBgImages,
      currentUser, isGuest, userStats, myPosts,
      calData, visitedDays,
      allPosts, likedPosts, likedNotifCount, openComments, commentInputs,
      showScrollTop, loadingMore, sortedPosts, getScroller,
      searchQuery, searchOpen, searchResults, showSearchResults,
      showCreatePost, newPostTitle, newPostText, newPostTags, newPostTagInput,
      newPostHobbyDone, newPostImage, postValidation,
      myFriendsList, filteredFriendsList, friendsFilter, FRIENDS_FILTERS,
      currentTheme, soundsEnabled, currentLang, LANGS, setLang, tr,
      settingNewName, settingNewEmail, settingNewBio,
      chats, activeChatId, activeChat, activeChatUser, totalChatUnread,
      filteredChats, chatInput, chatSearch, activeReactionMsgId, showTyping,
      REACTIONS, chatListWidth, isResizing,
      HOBBIES, LEVELS, GOAL_HINTS, SUGGESTED_TAGS, ALL_USERS,
      submitAuth, skipToFeed,
      toggleHobby, setLevel, addGoalHint, nextOnboarding, prevOnboarding, toggleFriend,
      likePost, toggleComments, sendComment, refreshFeed,
      addTagFromInput, addSuggestedTag, removeTag, handleImageUpload, submitPost,
      goToUser, addFriendFromPage, showToast,
      saveName, saveBio, handleAvatarChange,
      openChatWith, sendChatMessage, setReaction, deleteChatItem, toggleMuteChat,
      togglePinChat, startChatResize, handleChatFileAttach, scrollChatBottom,
    };
  },

  template: `
<div>
  <!-- TOAST -->
  <div v-if="toast" class="toast-notification">{{ toast }}</div>

  <!-- ============ AUTH ============ -->
  <div v-if="page==='auth'" style="position:relative;min-height:100vh">
    <div class="bg-watercolor"></div>
    <button class="auth-skip-btn" @click="skipToFeed">👀 Смотреть без входа</button>
    <div class="auth-page">
      <div class="auth-logo-area">
        <div class="logo-icon" style="margin:0 auto"><span style="font-size:36px">⭐</span></div>
        <div class="auth-title">ХОББИ ДРУГ</div>
        <div class="auth-subtitle">сервис для помощи в вашем хобби</div>
      </div>
      <div class="auth-card">
        <div class="auth-card-title">{{ authMode==='login' ? '👋 Добро пожаловать!' : '🌟 Создание аккаунта' }}</div>
        <div class="form-group">
          <label class="form-label">Электронная почта:</label>
          <div class="form-input-wrap" :class="{error:emailError}">
            <span class="icon">✉️</span>
            <input class="form-input" v-model="email" @keyup.enter="submitAuth" @input="emailError=false" type="text" placeholder="email@example.com"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Пароль:</label>
          <div class="form-input-wrap" :class="{error:pwError}">
            <span class="icon">🔒</span>
            <input class="form-input" v-model="password" @keyup.enter="submitAuth" @input="pwError=false" type="password" placeholder="Минимум 6 символов, без пробелов"/>
          </div>
          <div v-if="authMode==='register'" style="font-size:12px;color:var(--gray-text);margin-top:5px;padding-left:2px">Минимум 6 символов. Пробелы не допускаются.</div>
        </div>
        <div v-if="authError" class="error-msg">⚠️ {{ authError }}</div>
        <div class="auth-footer">
          <div v-if="authMode==='register'" style="font-size:15px;color:var(--brown-dark);font-weight:500">
            Есть аккаунт? <span class="auth-link" @click="authMode='login'">Войти</span>
          </div>
          <div v-else style="font-size:15px;color:var(--brown-dark);font-weight:500">
            Нет аккаунта? <span class="auth-link" @click="authMode='register'">Регистрация</span>
          </div>
          <button class="btn-primary" @click="submitAuth">{{ authMode==='login' ? 'Войти' : 'Регистрация' }}</button>
        </div>
      </div>
      <div style="margin-top:20px;text-align:center;color:rgba(92,61,30,.6);font-size:13px">Тестовый аккаунт: test@mail.ru / testtest</div>
    </div>
  </div>

  <!-- ============ ONBOARDING ============ -->
  <div v-if="['onboarding-hobbies','onboarding-levels','onboarding-goals','onboarding-summary','onboarding-friends'].includes(page)" class="onboarding-page">
    <div class="onboarding-sidebar">
      <div class="sidebar-welcome-title">Давайте познакомимся!</div>
      <div class="sidebar-welcome-desc">Расскажите немного о своих хобби, это поможет подобрать контент и найти единомышленников</div>
      <div v-for="(step,i) in sidebarSteps" :key="i" class="sidebar-step">
        <div class="step-num" :class="onboardingStep>i+1?'done':onboardingStep===i+1?'active':'pending'">{{ onboardingStep>i+1?'✓':i+1 }}</div>
        <div class="step-info"><div class="step-label">{{ step.label }}</div><div class="step-sub">{{ step.sub }}</div></div>
      </div>
    </div>
    <div class="onboarding-main">
      <div class="onboarding-bg" :style="'background-image:url('+onboardingBgImages[page]+')'"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <div class="logo-icon-sm"><span style="font-size:24px">⭐</span></div>
          <div><div class="onboarding-brand-title">ХОББИ ДРУГ</div><div class="onboarding-brand-sub">сервис для помощи в вашем хобби</div></div>
        </div>
        <div v-if="onboardingValidationMsg" class="validation-hint">⚠️ {{ onboardingValidationMsg }}</div>

        <!-- STEP 1 -->
        <div v-if="page==='onboarding-hobbies'" class="onboarding-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
            <div><div style="font-size:14px;font-weight:600;color:var(--gray-text);margin-bottom:4px">Шаг 1 из 5:</div><div style="font-size:22px;font-weight:800;color:var(--brown-dark)">Выберите ваши хобби</div></div>
            <div class="hobby-search-bar"><span style="color:#bbb">🔍</span><input v-model="hobbySearch" placeholder="поиск хобби"/></div>
          </div>
          <div class="hobby-grid">
            <div v-for="(h,i) in filteredHobbies" :key="h.id" class="hobby-chip" :class="{selected:selectedHobbies.includes(h.id)}" :style="'animation-delay:'+i*0.04+'s'" @click="toggleHobby(h.id)">
              <span>{{ h.icon }}</span><span>{{ h.name }}</span>
              <span v-if="selectedHobbies.includes(h.id)" style="position:absolute;top:6px;right:8px;font-size:12px">✓</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px;font-size:17px;font-weight:700;color:var(--brown-dark)">Выбрано: <span class="count-badge">{{ selectedHobbies.length }}</span></div>
            <button class="btn-primary" @click="nextOnboarding">Далее →</button>
          </div>
        </div>

        <!-- STEP 2 -->
        <div v-if="page==='onboarding-levels'" class="onboarding-card">
          <div style="font-size:14px;font-weight:600;color:var(--gray-text);margin-bottom:4px">Шаг 2 из 5:</div>
          <div style="font-size:22px;font-weight:800;color:var(--brown-dark);margin-bottom:24px">Ваш уровень в каждом хобби</div>
          <div class="level-grid">
            <div v-for="id in selectedHobbies" :key="id" class="level-row">
              <div class="level-hobby-name">{{ HOBBIES.find(h=>h.id===id)?.icon }} {{ HOBBIES.find(h=>h.id===id)?.name }}</div>
              <div class="level-chips">
                <div v-for="lvl in LEVELS" :key="lvl" class="level-chip" :class="{selected:hobbyLevels[id]===lvl}" @click="setLevel(id,lvl)">{{ lvl }}</div>
              </div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between"><button class="btn-cancel" @click="prevOnboarding">← Назад</button><button class="btn-primary" @click="nextOnboarding">Далее →</button></div>
        </div>

        <!-- STEP 3 -->
        <div v-if="page==='onboarding-goals'" class="onboarding-card">
          <div style="font-size:14px;font-weight:600;color:var(--gray-text);margin-bottom:4px">Шаг 3 из 5:</div>
          <div style="font-size:22px;font-weight:800;color:var(--brown-dark);margin-bottom:24px">Ваши цели</div>
          <textarea class="goals-textarea" v-model="goalsText" placeholder="Напишите свои цели... Например: освоить хобби, найти друзей, участвовать в выставке"></textarea>
          <div class="goals-hints"><div v-for="hint in GOAL_HINTS" :key="hint" class="hint-chip" @click="addGoalHint(hint)">+ {{ hint }}</div></div>
          <div style="display:flex;justify-content:space-between;margin-top:24px"><button class="btn-cancel" @click="prevOnboarding">← Назад</button><button class="btn-primary" @click="nextOnboarding">Далее →</button></div>
        </div>

        <!-- STEP 4 -->
        <div v-if="page==='onboarding-summary'" class="onboarding-card">
          <div style="font-size:14px;font-weight:600;color:var(--gray-text);margin-bottom:4px">Шаг 4 из 5 — Готово!</div>
          <div style="font-size:22px;font-weight:800;color:var(--brown-dark);margin-bottom:24px">Отлично! Вот что вы рассказали:</div>
          <div class="summary-grid">
            <div class="summary-card"><div class="s-icon" style="animation-delay:0s">🎯</div><div class="s-num">{{ selectedHobbies.length }}</div><div class="s-label">хобби выбрано</div></div>
            <div class="summary-card"><div class="s-icon" style="animation-delay:.2s">⭐</div><div class="s-num">{{ Object.values(hobbyLevels).length }}</div><div class="s-label">уровней указано</div></div>
            <div class="summary-card"><div class="s-icon" style="animation-delay:.4s">🏆</div><div class="s-num">{{ goalsText.split('\\n').filter(l=>l.trim()).length }}</div><div class="s-label">целей поставлено</div></div>
          </div>
          <div style="background:var(--orange-pale);border-radius:14px;padding:16px 20px;margin-bottom:24px">
            <div style="font-weight:800;color:var(--brown-dark);margin-bottom:8px">Ваши хобби:</div>
            <div v-for="id in selectedHobbies" :key="id" style="margin-bottom:4px;font-size:14px">{{ HOBBIES.find(h=>h.id===id)?.icon }} {{ HOBBIES.find(h=>h.id===id)?.name }} — <span style="color:var(--orange);font-weight:700">{{ hobbyLevels[id] }}</span></div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <button class="btn-cancel" @click="prevOnboarding">← Назад</button>
            <button class="btn-primary" style="background:linear-gradient(135deg,#B0D9B1,#4CAF50);color:#fff" @click="()=>{page='feed';navPage='feed';currentUser.hobbies=selectedHobbies.map(id=>{const h=HOBBIES.find(x=>x.id===id);return{id,name:h.name,level:hobbyLevels[id]||'Новичок'}});showToast('🎉 Добро пожаловать!')}">Сразу в ленту 🚀</button>
            <button class="btn-primary" @click="nextOnboarding">Найти друзей →</button>
          </div>
        </div>

        <!-- STEP 5 -->
        <div v-if="page==='onboarding-friends'" class="onboarding-card" style="max-width:880px">
          <div style="font-size:22px;font-weight:800;color:var(--brown-dark);margin-bottom:8px">Найдём вам единомышленников!</div>
          <div style="font-size:14px;color:var(--gray-text);margin-bottom:22px">Люди с похожими хобби и уровнем</div>
          <div class="friends-tabs"><button v-for="tab in friendsTabs2" :key="tab" class="friends-tab" :class="{active:friendsTab===tab}" @click="friendsTab=tab">{{ tab }}</button></div>
          <div class="friends-grid">
            <div v-for="(u,i) in filteredFriends" :key="u.id" class="friend-card" :class="{selected:addedFriends.includes(u.id)}" :style="'animation-delay:'+i*0.07+'s'">
              <div class="friend-card-top">
                <div class="friend-avatar" style="position:relative"><img :src="u.avatar"/><div v-if="u.online" class="online-dot"></div></div>
                <div><div class="friend-name">{{ u.name }}</div><div class="friend-flame">🔥 {{ u.streak }}</div></div>
              </div>
              <div style="margin-bottom:10px"><div v-for="h in u.hobbies" :key="h.name" style="font-size:12px;margin-bottom:3px"><span style="color:var(--orange);font-weight:600">{{ h.name }}</span> — <span style="color:var(--gray-text)">{{ h.level }}</span></div></div>
              <button class="btn-add-friend" :class="{added:addedFriends.includes(u.id)}" @click="toggleFriend(u.id)">{{ addedFriends.includes(u.id)?'✓ Добавлен':'Добавить в друзья' }}</button>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <button class="btn-cancel" @click="prevOnboarding">← Назад</button>
            <button class="btn-primary" @click="nextOnboarding">Продолжить ({{ addedFriends.length }}) →</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ MAIN APP ============ -->
  <div v-if="page==='feed'" class="app-layout">
    <!-- SIDEBAR -->
    <div class="app-sidebar">
      <div class="app-brand">
        <div class="logo-icon-xs"><span style="font-size:18px">⭐</span></div>
        <div><div class="app-brand-name">ХОББИДРУГ</div><div class="app-brand-sub">{{ tr.brand_sub }}</div></div>
      </div>
      <div class="nav-item" :class="{active:navPage==='profile'}" @click="isGuest?showToast(tr.toast_login_profile):navPage='profile'"><span class="nav-icon">⭐</span> {{ tr.nav_profile }}</div>
      <div class="nav-item" :class="{active:navPage==='feed'}" @click="navPage='feed'"><span class="nav-icon">📋</span> {{ tr.nav_feed }}</div>
      <div class="nav-item" :class="{active:navPage==='chats'}" @click="isGuest?showToast(tr.toast_login_chats):navPage='chats'">
        <span class="nav-icon">💬</span> {{ tr.nav_chats }}
        <span v-if="!isGuest&&totalChatUnread>0" class="nav-badge">{{ totalChatUnread }}</span>
      </div>
      <div class="nav-item" :class="{active:navPage==='friends'}" @click="isGuest?showToast(tr.toast_login_friends):navPage='friends'"><span class="nav-icon">👥</span> {{ tr.nav_friends }}</div>
      <div class="nav-item" :class="{active:navPage==='settings'}" @click="navPage='settings'"><span class="nav-icon">⚙️</span> {{ tr.nav_settings }}</div>
      <div class="sidebar-footer">
        <div class="nav-item" :class="{active:navPage==='rules'}" @click="navPage='rules'" style="padding:10px 0;margin:0"><span class="nav-icon">📜</span> {{ tr.nav_rules }}</div>
        <div v-if="!isGuest" class="btn-logout" style="margin-top:12px" @click="page='auth'">{{ tr.nav_logout }}</div>
      </div>
    </div>

    <!-- MAIN -->
    <div class="app-main-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;min-width:0;overflow-y:auto;overflow-x:hidden" ref="mainScroll" id="mainScroll">
      <!-- TOPBAR -->
      <div class="app-topbar">
        <div class="topbar-search-wrap">
          <div class="topbar-search">
            <span style="color:#bbb">🔍</span>
            <input :placeholder="tr.search_placeholder" v-model="searchQuery"
              @input="searchOpen=searchQuery.length>0"
              @focus="searchOpen=searchQuery.length>0"
              @blur="setTimeout(()=>searchOpen=false,200)"
              @keyup.enter="showSearchResults=true;searchOpen=false"/>
          </div>
          <div v-if="searchOpen&&(searchResults.posts.length||searchResults.users.length)" class="search-dropdown">
            <div v-if="searchResults.users.length"><div class="sd-section">{{ tr.search_people }}</div>
              <div v-for="u in searchResults.users.slice(0,3)" :key="u.id" class="sd-item" @mousedown="goToUser(u.id);searchOpen=false;searchQuery=''">
                <img :src="u.avatar"/><span style="font-weight:700">{{ u.name }}</span><span style="color:var(--gray-text);font-size:12px;margin-left:auto">🔥{{ u.streak }}</span>
              </div>
            </div>
            <div v-if="searchResults.posts.length"><div class="sd-section">{{ tr.search_articles }}</div>
              <div v-for="p in searchResults.posts.slice(0,4)" :key="p.id" class="sd-item" @mousedown="showSearchResults=true;searchOpen=false">
                <span style="font-size:16px">📄</span><span>{{ p.title }}</span><span style="color:var(--gray-text);font-size:11px;margin-left:auto">{{ p.author }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="topbar-right">
          <button class="heart-btn" :class="likedPosts.length>0?'active-likes':''" @click="navPage='likes';likedNotifCount=0">
            ❤️<div v-if="likedNotifCount>0" class="likes-count-badge">{{ likedNotifCount }}</div>
          </button>
          <div v-if="!isGuest" class="streak-display"><span>{{ currentUser.streak }} {{ tr.days_streak }}</span><span class="flame-icon">🔥</span></div>
          <button v-if="!isGuest" class="btn-create-post" @click="showCreatePost=true">{{ tr.btn_create_post }}</button>
          <div v-if="!isGuest" class="user-avatar-btn" @click="navPage='profile'"><img :src="currentUser.avatar"/></div>
          <button v-if="isGuest" class="btn-create-post" @click="page='auth'">{{ tr.btn_login_reg }}</button>
        </div>
      </div>

      <!-- GUEST BANNER -->
      <div v-if="isGuest" class="guest-banner">
        <span style="font-size:20px">🌟</span>
        <span>{{ tr.guest_text }}</span>
        <div class="guest-banner-btns">
          <button class="gb-btn-outline" @click="page='auth';authMode='login'">{{ tr.btn_login }}</button>
          <button class="gb-btn-solid" @click="page='auth';authMode='register'">{{ tr.btn_register }}</button>
        </div>
      </div>

      <!-- SEARCH RESULTS -->
      <div v-if="showSearchResults" style="display:flex;padding:24px;gap:24px">
        <div style="flex:1;max-width:740px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <button class="btn-back-nav" @click="showSearchResults=false;searchQuery=''">← Назад</button>
            <div style="font-size:18px;font-weight:800;color:var(--brown-dark)">Поиск: «{{ searchQuery }}»</div>
          </div>
          <div v-if="searchResults.users.length" style="margin-bottom:24px">
            <div style="font-size:16px;font-weight:800;color:var(--brown-dark);margin-bottom:12px">👤 Люди</div>
            <div v-for="u in searchResults.users" :key="u.id" class="friends-list-card" style="cursor:pointer" @click="goToUser(u.id)">
              <div class="friends-list-avatar"><img :src="u.avatar"/></div>
              <div><div class="friends-list-name">{{ u.name }} <span style="color:var(--orange)">🔥{{ u.streak }}</span></div>
                <div v-for="h in u.hobbies.slice(0,2)" :key="h.name" style="font-size:12px;margin-top:4px;color:var(--gray-text)">{{ h.name }} — {{ h.level }}</div>
              </div>
            </div>
          </div>
          <div v-if="searchResults.posts.length">
            <div style="font-size:16px;font-weight:800;color:var(--brown-dark);margin-bottom:12px">📄 Статьи</div>
            <div v-for="post in searchResults.posts" :key="post.id" class="post-card">
              <div class="post-header">
                <div class="post-author"><div class="post-avatar" @click="goToUser(post.authorId)"><img :src="post.avatar"/></div>
                  <div><div class="post-author-name" @click="goToUser(post.authorId)">{{ post.author }}</div><div class="post-time">{{ post.time }}</div></div>
                </div>
              </div>
              <div class="post-title">{{ post.title }}</div>
              <div class="post-text" style="margin-bottom:12px">{{ post.text.slice(0,200) }}{{ post.text.length>200?'...':'' }}</div>
              <div class="post-actions">
                <button class="action-btn" :class="{liked:post.liked}" @click="likePost(post)"><span class="heart-icon">{{ post.liked?'❤️':'🤍' }}</span> {{ post.likes }}</button>
              </div>
            </div>
          </div>
          <div v-if="!searchResults.posts.length&&!searchResults.users.length" style="text-align:center;padding:60px;color:var(--gray-text)">
            <div style="font-size:48px;margin-bottom:12px">🔍</div>
            <div style="font-size:18px;font-weight:700">Ничего не найдено</div>
            <div style="margin-top:8px">Попробуйте другой запрос</div>
          </div>
        </div>
      </div>

      <!-- ======= FEED ======= -->
      <div v-if="!showSearchResults&&navPage==='feed'" class="feed-page-wrap">
        <div class="feed-main">
          <div v-for="(post,pi) in sortedPosts" :key="post.id" class="post-card" :style="'animation-delay:'+Math.min(pi,6)*0.06+'s'">
            <div class="post-header">
              <div class="post-author">
                <div class="post-avatar" @click="goToUser(post.authorId)"><img :src="post.avatar"/></div>
                <div><div class="post-author-name" @click="goToUser(post.authorId)">{{ post.author }}</div><div class="post-time">{{ tr.post_published }} {{ post.time }}</div></div>
              </div>
              <div class="post-meta">
                <span class="post-badge" :class="post.hobbyDone?'hobby-done':''">{{ post.badge }}</span>
                <span class="post-flame">🔥 {{ post.streak }}</span>
              </div>
            </div>
            <div class="post-title">{{ post.title }}</div>
            <div class="post-content-wrap">
              <div class="post-text">
                <span v-if="!post.expanded&&post.text.length>220">{{ post.text.slice(0,220) }}<span style="color:var(--gray-text)">...</span><button class="read-more-btn" @click="post.expanded=true">{{ tr.read_more }}</button></span>
                <span v-else>{{ post.text }}<button v-if="post.text.length>220&&post.expanded" class="read-more-btn" @click="post.expanded=false">{{ tr.read_less }}</button></span>
              </div>
              <div v-if="post.img" class="post-img"><img :src="post.img"/></div>
            </div>
            <div v-if="post.tags.length" class="post-tags"><span v-for="tag in post.tags" :key="tag" class="post-tag" @click="searchQuery=tag;showSearchResults=true">{{ tag }}</span></div>
            <div class="post-actions">
              <button class="action-btn" :class="{liked:post.liked}" @click="likePost(post)"><span class="heart-icon">{{ post.liked?'❤️':'🤍' }}</span> {{ post.likes }}</button>
              <button class="action-btn" @click="toggleComments(post.id)">💬 {{ post.comments.length }}</button>
              <button class="action-btn">↗ {{ post.shares }}</button>
            </div>
            <div v-if="openComments[post.id]" class="comments-section">
              <div v-for="c in post.comments" :key="c.author+c.time" class="comment-item">
                <div class="comment-avatar"><img :src="'https://ui-avatars.com/api/?name='+encodeURIComponent(c.author)+'&background=FFD166&color=3B2510'"/></div>
                <div class="comment-bubble"><div class="comment-author">{{ c.author }}</div><div class="comment-text">{{ c.text }}</div><div class="comment-time">{{ c.time }}</div></div>
              </div>
              <div class="comment-input-wrap">
                <img :src="currentUser.avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>
                <input class="comment-input" v-model="commentInputs[post.id]" :placeholder="tr.comment_placeholder" @keyup.enter="sendComment(post)"/>
                <button class="comment-send" @click="sendComment(post)">↑</button>
              </div>
            </div>
          </div>
          <!-- Loading skeleton -->
          <div v-if="loadingMore" style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
            <div v-for="i in 2" :key="i" style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.05)">
              <div class="skeleton" style="height:16px;width:60%;margin-bottom:12px"></div>
              <div class="skeleton" style="height:12px;width:90%;margin-bottom:8px"></div>
              <div class="skeleton" style="height:120px;width:100%;border-radius:12px"></div>
            </div>
          </div>
          <!-- Infinite scroll sentinel -->
          <div id="feedSentinel" style="height:1px;margin-top:8px"></div>
        </div>
        <!-- RIGHT PANEL -->
        <div class="feed-right">
          <div class="progress-card">
            <div class="progress-title">{{ tr.progress_title }}<span style="color:var(--red);font-size:14px;font-weight:700">{{ visitedDays.length }}/7</span></div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div class="days-track">
                <div v-for="d in calData.weekDays" :key="d" class="day-circle" :class="d===calData.today?'today':visitedDays.includes(d)?'done':''">{{ d||'·' }}</div>
              </div>
              <div class="star-reward">⭐</div>
            </div>
            <div class="progress-bar-wrap" style="margin-bottom:18px"><div class="progress-bar-fill" :style="'width:'+(visitedDays.length/7*100)+'%'"></div></div>
            <div class="stat-row"><span>{{ tr.stat_reading }}</span><span class="stat-badge">{{ Math.floor(userStats.readingHours*60) }} мин</span></div>
            <div class="stat-row"><span>{{ tr.stat_likes }}</span><span class="stat-badge">{{ userStats.likesGiven }}</span></div>
            <div class="stat-row"><span>{{ tr.stat_comments }}</span><span class="stat-badge">{{ userStats.comments }}</span></div>
          </div>
          <div class="progress-card" style="background:linear-gradient(135deg,var(--orange-pale),#FFFAF0);border:1.5px solid var(--orange-light)">
            <div style="font-size:15px;font-weight:800;color:var(--brown-dark);margin-bottom:12px">{{ tr.tips_title }}</div>
            <div style="font-size:13px;color:var(--brown);line-height:1.7">{{ tr.tips_text1 }}</div>
            <div style="margin-top:12px;font-size:13px;color:var(--brown);line-height:1.7">{{ tr.tips_text2 }}</div>
          </div>
        </div>
      </div>

      <!-- ======= PROFILE ======= -->
      <div v-if="!showSearchResults&&navPage==='profile'" style="display:flex;padding:24px;gap:24px">
        <div style="flex:1;max-width:740px">
          <div class="profile-card">
            <div style="display:flex;align-items:flex-start;gap:24px">
              <div class="profile-avatar-big"><img :src="currentUser.avatar"/></div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <div class="profile-name">{{ currentUser.name }}</div>
                  <div class="profile-streak">🔥 {{ currentUser.streak }}</div>
                </div>
                <div style="font-size:14px;color:var(--brown);margin-bottom:12px;line-height:1.6">{{ currentUser.bio }}</div>
                <div v-if="currentUser.hobbies.length">
                  <div v-for="h in currentUser.hobbies" :key="h.id" class="profile-hobby-row">
                    <span class="phi-name">{{ h.name }}</span><span class="phi-sep">—</span><span class="phi-level">{{ h.level }}</span>
                  </div>
                </div>
                <div v-else style="color:var(--gray-text);font-size:14px">Хобби не указаны</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:600;color:var(--green)">
                  <span class="online-ping" style="width:8px;height:8px;background:var(--green);border-radius:50%;display:inline-block"></span>онлайн
                </div>
              </div>
            </div>
          </div>
          <!-- Stats -->
          <div class="profile-card">
            <div style="font-size:18px;font-weight:800;color:var(--brown-dark);margin-bottom:20px">📊 В этом месяце:</div>
            <div class="month-stats-grid">
              <div class="month-stat-card"><span class="ms-icon" style="animation-delay:0s">👀</span><div class="ms-num">{{ Math.floor(userStats.readingHours*60) }}</div><div class="ms-label">минут на сайте</div></div>
              <div class="month-stat-card"><span class="ms-icon" style="animation-delay:.2s">✏️</span><div class="ms-num">{{ userStats.posts }}</div><div class="ms-label">написано постов</div></div>
              <div class="month-stat-card"><span class="ms-icon" style="animation-delay:.4s">👥</span><div class="ms-num">{{ userStats.friends }}</div><div class="ms-label">новых друзей</div></div>
            </div>
            <div style="display:flex;gap:14px;margin-top:14px">
              <div style="flex:1;background:var(--orange-pale);border-radius:12px;padding:14px;text-align:center;border:1.5px solid var(--orange-light)">
                <div style="font-size:20px;font-weight:900;color:var(--brown-dark)">{{ userStats.likesGiven }}</div>
                <div style="font-size:12px;color:var(--gray-text);font-weight:600;margin-top:4px">лайков поставлено</div>
              </div>
              <div style="flex:1;background:var(--orange-pale);border-radius:12px;padding:14px;text-align:center;border:1.5px solid var(--orange-light)">
                <div style="font-size:20px;font-weight:900;color:var(--brown-dark)">{{ userStats.comments }}</div>
                <div style="font-size:12px;color:var(--gray-text);font-weight:600;margin-top:4px">комментариев</div>
              </div>
            </div>
          </div>
          <!-- Posts -->
          <div v-if="myPosts.length===0" class="profile-card" style="text-align:center;padding:40px">
            <div style="font-size:48px;margin-bottom:16px;animation:starFloat 3s ease-in-out infinite">✍️</div>
            <div style="font-size:20px;font-weight:800;color:var(--brown-dark);margin-bottom:8px">Напишите первый пост ❤️</div>
            <div style="font-size:14px;color:var(--gray-text);margin-bottom:20px">это поможет вам быстрее расти и находить новых друзей</div>
            <button class="btn-primary" @click="showCreatePost=true">{{ tr.btn_create_post }}</button>
          </div>
          <div v-else>
            <div style="font-size:18px;font-weight:800;color:var(--brown-dark);margin-bottom:14px">Мои посты</div>
            <div v-for="post in myPosts" :key="post.id" class="post-card">
              <div class="post-header">
                <div class="post-author"><div class="post-avatar"><img :src="currentUser.avatar"/></div>
                  <div><div class="post-author-name">{{ currentUser.name }}</div><div class="post-time">{{ post.time }}</div></div>
                </div>
                <div class="post-meta"><span class="post-badge">{{ post.badge }}</span><span class="post-flame">🔥 {{ currentUser.streak }}</span></div>
              </div>
              <div class="post-title">{{ post.title }}</div>
              <div class="post-content-wrap"><div class="post-text">{{ post.text }}</div><div v-if="post.img" class="post-img"><img :src="post.img"/></div></div>
              <div v-if="post.tags.length" class="post-tags"><span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span></div>
              <div class="post-actions">
                <button class="action-btn" :class="{liked:post.liked}" @click="likePost(post)"><span class="heart-icon">{{ post.liked?'❤️':'🤍' }}</span> {{ post.likes }}</button>
                <button class="action-btn" @click="toggleComments(post.id)">💬 {{ post.comments.length }}</button>
              </div>
            </div>
          </div>
        </div>
        <div class="feed-right">
          <div class="progress-card">
            <div class="progress-title">Твой прогресс</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div class="days-track"><div v-for="d in calData.weekDays" :key="d" class="day-circle" :class="d===calData.today?'today':visitedDays.includes(d)?'done':''">{{ d||'·' }}</div></div>
              <div class="star-reward">⭐</div>
            </div>
            <div class="progress-bar-wrap" style="margin-bottom:18px"><div class="progress-bar-fill" :style="'width:'+(visitedDays.length/7*100)+'%'"></div></div>
            <div class="stat-row"><span>Читали статьи</span><span class="stat-badge">{{ Math.floor(userStats.readingHours*60) }} мин</span></div>
            <div class="stat-row"><span>Лайков</span><span class="stat-badge">{{ userStats.likesGiven }}</span></div>
            <div class="stat-row"><span>{{ tr.stat_comments }}</span><span class="stat-badge">{{ userStats.comments }}</span></div>
          </div>
        </div>
      </div>

      <!-- ======= LIKED ======= -->
      <div v-if="!showSearchResults&&navPage==='likes'" style="display:flex;padding:24px;gap:24px">
        <div class="feed-main">
          <div style="font-size:22px;font-weight:800;color:var(--brown-dark);margin-bottom:20px">❤️ Понравившиеся посты</div>
          <div v-if="likedPosts.length===0" class="liked-empty">
            <div class="le-icon">🤍</div>
            <div style="font-size:20px;font-weight:800;color:var(--brown-dark);margin-bottom:8px">Пока нет понравившихся постов</div>
            <div style="font-size:14px;color:var(--gray-text);margin-bottom:20px">Поставьте лайк постам в ленте — они появятся здесь</div>
            <button class="btn-primary" @click="navPage='feed'">Перейти в ленту</button>
          </div>
          <div v-for="post in likedPosts" :key="post.id" class="post-card">
            <div class="post-header">
              <div class="post-author"><div class="post-avatar" @click="goToUser(post.authorId)"><img :src="post.avatar"/></div>
                <div><div class="post-author-name" @click="goToUser(post.authorId)">{{ post.author }}</div><div class="post-time">{{ post.time }}</div></div>
              </div>
              <div class="post-meta"><span class="post-badge">{{ post.badge }}</span></div>
            </div>
            <div class="post-title">{{ post.title }}</div>
            <div class="post-content-wrap"><div class="post-text">{{ post.text }}</div><div v-if="post.img" class="post-img"><img :src="post.img"/></div></div>
            <div class="post-actions">
              <button class="action-btn liked" @click="likePost(post)"><span class="heart-icon">❤️</span> {{ post.likes }}</button>
              <button class="action-btn" @click="toggleComments(post.id)">💬 {{ post.comments.length }}</button>
            </div>
          </div>
        </div>
        <div class="feed-right">
          <div class="progress-card">
            <div style="font-size:15px;font-weight:800;color:var(--brown-dark);margin-bottom:12px">Всего понравилось</div>
            <div style="font-size:48px;font-weight:900;color:var(--orange);text-align:center;padding:16px;animation:starFloat 3s ease-in-out infinite">{{ likedPosts.length }}</div>
            <div style="font-size:13px;color:var(--gray-text);text-align:center">постов</div>
          </div>
        </div>
      </div>

      <!-- ======= FRIENDS ======= -->
      <div v-if="!showSearchResults&&navPage==='friends'" style="display:flex;padding:24px;gap:24px">
        <div style="flex:1;max-width:740px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div style="font-size:22px;font-weight:800;color:var(--brown-dark)">👥 Мои друзья</div>
            <div style="font-size:14px;color:var(--gray-text)">{{ myFriendsList.length }} друзей</div>
          </div>
          <div class="friends-filter-tabs">
            <button v-for="f in FRIENDS_FILTERS" :key="f" class="friends-filter-tab" :class="{active:friendsFilter===f}" @click="friendsFilter=f">
              <span>{{ f==='online'?'🟢':f==='active'?'🔥':f==='inactive'?'😴':'🎯' }}</span>{{ f==='online'?tr.friends_online:f==='active'?tr.friends_active:f==='inactive'?tr.friends_inactive:tr.friends_filter_all }}
            </button>
          </div>
          <div v-if="filteredFriendsList.length===0" style="background:#fff;border-radius:20px;padding:40px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.05)">
            <div style="font-size:40px;margin-bottom:12px">😴</div>
            <div style="font-size:16px;font-weight:700;color:var(--brown-dark)">Нет друзей в этой категории</div>
          </div>
          <div v-for="(u,i) in filteredFriendsList" :key="u.id" class="friends-list-card" :style="'animation-delay:'+i*0.08+'s'">
            <div class="friends-list-avatar" @click="goToUser(u.id)"><img :src="u.avatar"/></div>
            <div style="flex:1">
              <div class="friends-list-name" @click="goToUser(u.id)">{{ u.name }} <span style="color:var(--orange);font-size:14px;font-weight:700">🔥 {{ u.streak }}</span></div>
              <div style="margin:8px 0"><div v-for="h in u.hobbies" :key="h.name" style="font-size:13px;color:var(--gray-text);margin-bottom:2px"><span style="color:var(--orange);font-weight:600">{{ h.name }}</span> — {{ h.level }}</div></div>
              <div class="online-status"><div class="online-dot-sm" :class="u.online?'online':'offline'"></div><span style="color:var(--gray-text)">{{ u.online?'онлайн':'был 5 дней назад' }}</span></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-left:auto">
              <button class="btn-write" @click="openChatWith(u.id)">{{ tr.btn_write }}</button>
              <button class="btn-write" style="background:var(--gray-bg);border-color:#E0D8CF;font-size:13px;padding:8px 16px" @click="goToUser(u.id)">👤 Профиль</button>
            </div>
          </div>
          <div style="background:#fff;border-radius:20px;padding:24px 28px;box-shadow:0 2px 12px rgba(0,0,0,.05);border:2px dashed var(--orange-light);text-align:center">
            <div style="font-size:32px;margin-bottom:10px">🔍</div>
            <div style="font-size:16px;font-weight:800;color:var(--brown-dark);margin-bottom:6px">Найти больше друзей</div>
            <div style="font-size:14px;color:var(--gray-text);margin-bottom:16px">Это поможет тебе двигаться быстрее</div>
            <button class="btn-primary" @click="page='onboarding-friends'">Найти друзей</button>
          </div>
        </div>
        <div class="feed-right">
          <div class="progress-card">
            <div class="progress-title">Активность</div>
            <div class="stat-row"><span>Онлайн сейчас</span><span class="stat-badge">{{ myFriendsList.filter(u=>u.online).length }}</span></div>
            <div class="stat-row"><span>Всего друзей</span><span class="stat-badge">{{ myFriendsList.length }}</span></div>
            <div class="stat-row"><span>Активных (стрик 5+)</span><span class="stat-badge">{{ myFriendsList.filter(u=>u.streak>=5).length }}</span></div>
          </div>
        </div>
      </div>

      <!-- ======= OTHER USER ======= -->
      <div v-if="!showSearchResults&&navPage==='other-user'&&viewingUser" class="other-user-page" style="display:flex;padding:24px;gap:24px">
        <div style="flex:1;max-width:740px">
          <button class="btn-back-nav" @click="navPage='feed'">← Назад</button>
          <div class="profile-card">
            <div style="display:flex;align-items:flex-start;gap:24px">
              <div style="position:relative">
                <div class="profile-avatar-big"><img :src="viewingUser.avatar"/></div>
                <div v-if="viewingUser.online" style="position:absolute;bottom:4px;right:4px;width:14px;height:14px;border-radius:50%;background:var(--green);border:2px solid #fff"></div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
                  <div>
                    <div class="profile-name">{{ viewingUser.name }}</div>
                    <div class="profile-streak" style="font-size:16px;margin-top:4px">🔥 {{ viewingUser.streak }} дней подряд</div>
                  </div>
                  <div style="display:flex;gap:8px">
                    <button class="btn-write" @click="openChatWith(viewingUser.id)">{{ tr.btn_write }}</button>
                    <button class="btn-primary" style="font-size:13px;padding:10px 20px" @click="addFriendFromPage(viewingUser.id)">{{ currentUser.friends.includes(viewingUser.id)?'✓ В друзьях':'+ В друзья' }}</button>
                  </div>
                </div>
                <div style="font-size:14px;color:var(--brown);margin-bottom:12px;line-height:1.6">{{ viewingUser.bio }}</div>
                <div v-for="h in viewingUser.hobbies" :key="h.name" class="profile-hobby-row">
                  <span class="phi-name">{{ h.name }}</span><span class="phi-sep">—</span><span class="phi-level">{{ h.level }}</span>
                </div>
                <div class="online-status" style="margin-top:10px">
                  <div class="online-dot-sm" :class="viewingUser.online?'online':'offline'"></div>
                  <span style="color:var(--gray-text)">{{ viewingUser.online?'онлайн':'был 5 дней назад' }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- User stats -->
          <div class="profile-card">
            <div style="font-size:16px;font-weight:800;color:var(--brown-dark);margin-bottom:16px">📊 Статистика</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
              <div style="text-align:center;background:var(--orange-pale);border-radius:12px;padding:16px 10px;border:1.5px solid var(--orange-light)"><div style="font-size:24px;font-weight:900;color:var(--brown-dark)">{{ viewingUser.postsCount }}</div><div style="font-size:12px;color:var(--gray-text);margin-top:4px;font-weight:600">постов</div></div>
              <div style="text-align:center;background:var(--orange-pale);border-radius:12px;padding:16px 10px;border:1.5px solid var(--orange-light)"><div style="font-size:24px;font-weight:900;color:var(--brown-dark)">{{ viewingUser.likesCount }}</div><div style="font-size:12px;color:var(--gray-text);margin-top:4px;font-weight:600">лайков</div></div>
              <div style="text-align:center;background:var(--orange-pale);border-radius:12px;padding:16px 10px;border:1.5px solid var(--orange-light)"><div style="font-size:24px;font-weight:900;color:var(--brown-dark)">{{ viewingUser.friendsCount }}</div><div style="font-size:12px;color:var(--gray-text);margin-top:4px;font-weight:600">друзей</div></div>
              <div style="text-align:center;background:var(--orange-pale);border-radius:12px;padding:16px 10px;border:1.5px solid var(--orange-light)"><div style="font-size:24px;font-weight:900;color:var(--brown-dark)">{{ viewingUser.joinedMonths }}</div><div style="font-size:12px;color:var(--gray-text);margin-top:4px;font-weight:600">месяцев</div></div>
            </div>
          </div>
          <!-- Goals -->
          <div class="profile-card" v-if="viewingUser.goals?.length">
            <div style="font-size:16px;font-weight:800;color:var(--brown-dark);margin-bottom:14px">🏆 Цели</div>
            <div v-for="(g,gi) in viewingUser.goals" :key="gi" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--orange-pale);border-radius:10px;margin-bottom:8px;border:1px solid var(--orange-light)">
              <span style="font-size:20px">{{ ['🎯','🌟','💪'][gi%3] }}</span>
              <span style="font-size:14px;color:var(--brown);font-weight:600">{{ g }}</span>
            </div>
          </div>
          <!-- Posts -->
          <div style="font-size:18px;font-weight:800;color:var(--brown-dark);margin:0 0 14px 4px">Посты {{ viewingUser.name }}</div>
          <div v-if="viewingUserPosts.length===0" style="background:#fff;border-radius:20px;padding:32px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.05)">
            <div style="font-size:14px;color:var(--gray-text)">Пользователь ещё не написал постов</div>
          </div>
          <div v-for="post in viewingUserPosts" :key="post.id" class="post-card">
            <div class="post-header">
              <div class="post-author"><div class="post-avatar"><img :src="viewingUser.avatar"/></div>
                <div><div class="post-author-name">{{ viewingUser.name }}</div><div class="post-time">недавно</div></div>
              </div>
              <div class="post-meta"><span class="post-badge hobby-done">Занимался хобби</span><span class="post-flame">🔥 {{ viewingUser.streak }}</span></div>
            </div>
            <div class="post-title">{{ post.title }}</div>
            <div class="post-content-wrap"><div class="post-text">{{ post.text }}</div><div v-if="post.img" class="post-img"><img :src="post.img"/></div></div>
            <div v-if="post.tags.length" class="post-tags"><span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span></div>
            <div class="post-actions">
              <button class="action-btn" :class="{liked:post.liked}" @click="likePost(post)"><span class="heart-icon">{{ post.liked?'❤️':'🤍' }}</span> {{ post.likes }}</button>
              <button class="action-btn" @click="toggleComments(post.id)">💬 {{ post.comments.length }}</button>
              <button class="action-btn">↗ {{ post.shares }}</button>
            </div>
            <div v-if="openComments[post.id]" class="comments-section">
              <div v-for="c in post.comments" :key="c.author+c.time" class="comment-item">
                <div class="comment-avatar"><img :src="'https://ui-avatars.com/api/?name='+encodeURIComponent(c.author)+'&background=FFD166&color=3B2510'"/></div>
                <div class="comment-bubble"><div class="comment-author">{{ c.author }}</div><div class="comment-text">{{ c.text }}</div><div class="comment-time">{{ c.time }}</div></div>
              </div>
              <div class="comment-input-wrap">
                <img :src="currentUser.avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>
                <input class="comment-input" v-model="commentInputs[post.id]" :placeholder="tr.comment_placeholder" @keyup.enter="sendComment(post)"/>
                <button class="comment-send" @click="sendComment(post)">↑</button>
              </div>
            </div>
          </div>
        </div>
        <div class="feed-right">
          <div class="progress-card">
            <div style="text-align:center;margin-bottom:16px">
              <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 12px;border:3px solid var(--orange-light)"><img :src="viewingUser.avatar" style="width:100%;height:100%;object-fit:cover"/></div>
              <div style="font-size:16px;font-weight:800;color:var(--brown-dark)">{{ viewingUser.name }}</div>
              <div style="font-size:14px;color:var(--orange);font-weight:700;margin-top:4px">🔥 {{ viewingUser.streak }} дней</div>
            </div>
            <div class="stat-row"><span>Постов</span><span class="stat-badge">{{ viewingUser.postsCount }}</span></div>
            <div class="stat-row"><span>Хобби</span><span class="stat-badge">{{ viewingUser.hobbies.length }}</span></div>
            <div class="stat-row"><span>Статус</span><span class="stat-badge" :style="viewingUser.online?'background:#E8F5E9;color:var(--green)':''">{{ viewingUser.online?'🟢 онлайн':'⚫ офлайн' }}</span></div>
          </div>
        </div>
      </div>

      <!-- ======= CHATS ======= -->
      <div v-if="!showSearchResults&&navPage==='chats'" class="chat-layout">
        <!-- Chat list -->
        <div class="chat-list" :style="'width:'+chatListWidth+'px'">
          <div class="chat-list-header">
            <span>{{ tr.nav_chats }}</span>
            <input class="chat-search" v-model="chatSearch" :placeholder="tr.chat_search_ph"/>
          </div>
          <div class="chat-items-scroll">
            <div v-for="chat in filteredChats" :key="chat.id" class="chat-item" :class="{active:activeChatId===chat.id}" @click="activeChatId=chat.id;chat.unread=0;$nextTick(scrollChatBottom)">
              <div class="chat-item-avatar">
                <img :src="ALL_USERS.find(u=>u.id===chat.userId)?.avatar"/>
                <div v-if="ALL_USERS.find(u=>u.id===chat.userId)?.online" class="chat-item-online"></div>
              </div>
              <div class="chat-item-info">
                <div class="chat-item-name">
                  {{ chat.pinned?'📌 ':'' }}{{ ALL_USERS.find(u=>u.id===chat.userId)?.name }}
                  <span v-if="chat.muted" style="font-size:11px;color:var(--gray-text)"> 🔕</span>
                </div>
                <div class="chat-item-preview">{{ chat.messages[chat.messages.length-1]?.text||'Нет сообщений' }}</div>
              </div>
              <div class="chat-item-meta">
                <div class="chat-item-time">{{ chat.messages[chat.messages.length-1]?.time||'' }}</div>
                <div v-if="chat.unread>0&&!chat.muted" class="chat-item-badge">{{ chat.unread }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Resizer -->
        <div class="chat-resizer" :class="{resizing:isResizing}" @mousedown="startChatResize"></div>
        <!-- Chat main -->
        <div class="chat-main">
          <div v-if="!activeChatId" class="chat-empty-state">
            <div style="font-size:64px;animation:starFloat 3s ease-in-out infinite">💬</div>
            <div style="font-size:18px;font-weight:700">{{ tr.chat_select }}</div>
            <div style="font-size:14px">или начните новый диалог с другом</div>
          </div>
          <template v-else>
            <!-- Chat header -->
            <div class="chat-header">
              <div class="chat-header-avatar" @click="goToUser(activeChatUser?.id)"><img :src="activeChatUser?.avatar"/></div>
              <div>
                <div class="chat-header-name" @click="goToUser(activeChatUser?.id)">{{ activeChatUser?.name }}</div>
                <div class="chat-header-status">
                  <span v-if="activeChatUser?.online" style="width:7px;height:7px;background:var(--green);border-radius:50%;display:inline-block"></span>
                  <span v-if="activeChatUser?.online" style="color:var(--green)">онлайн</span>
                  <span v-else style="color:var(--gray-text)">был 5 дней назад</span>
                </div>
              </div>
              <div class="chat-header-actions">
                <button class="chat-action-btn" @click="goToUser(activeChatUser?.id)" title="Профиль">👤</button>
                <button class="chat-action-btn" @click="toggleMuteChat()" :title="activeChat?.muted?'Включить звук':'Заглушить'">{{ activeChat?.muted?'🔔':'🔕' }}</button>
                <button class="chat-action-btn" @click="togglePinChat()" :title="activeChat?.pinned?'Открепить':'Закрепить'">📌</button>
                <button class="chat-action-btn" @click="deleteChatItem()" title="Удалить чат" style="color:var(--red)">🗑️</button>
              </div>
            </div>
            <!-- Messages -->
            <div class="chat-messages-area" id="chat-msgs" @click="activeReactionMsgId=null">
              <div class="chat-date-separator"><span class="chat-date-label">Сегодня</span></div>
              <div v-for="msg in activeChat.messages" :key="msg.id" class="msg-row" :class="{own:msg.from==='me'}">
                <div v-if="msg.from!=='me'" class="msg-avatar"><img :src="activeChatUser?.avatar"/></div>
                <div class="msg-bubble-wrap">
                  <div :class="msg.from==='me'?'msg-bubble-own':'msg-bubble-other'" @click.stop="activeReactionMsgId=activeReactionMsgId===msg.id?null:msg.id">
                    {{ msg.text }}
                  </div>
                  <div class="msg-time">{{ msg.time }}</div>
                  <div v-if="msg.reaction" class="msg-reaction-badge" @click.stop="setReaction(msg.id,msg.reaction)">{{ msg.reaction }}</div>
                  <!-- Reaction picker -->
                  <div v-if="activeReactionMsgId===msg.id" class="msg-reaction-picker" @click.stop>
                    <span v-for="emoji in REACTIONS" :key="emoji" class="reaction-emoji" @click="setReaction(msg.id,emoji)">{{ emoji }}</span>
                  </div>
                </div>
                <div v-if="msg.from==='me'" class="msg-avatar"><img :src="currentUser.avatar"/></div>
              </div>
              <!-- Typing indicator -->
              <div v-if="showTyping" class="msg-row">
                <div class="msg-avatar"><img :src="activeChatUser?.avatar"/></div>
                <div class="typing-indicator">
                  <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                </div>
              </div>
            </div>
            <!-- Input -->
            <div class="chat-input-area">
              <label style="width:36px;height:36px;border-radius:50%;background:var(--gray-input);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:background .15s;flex-shrink:0" title="Прикрепить файл">
                📎<input type="file" style="display:none" @change="e=>handleChatFileAttach(e,'file')"/>
              </label>
              <label style="width:36px;height:36px;border-radius:50%;background:var(--gray-input);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:background .15s;flex-shrink:0" title="Отправить фото">
                📸<input type="file" accept="image/*" style="display:none" @change="e=>handleChatFileAttach(e,'photo')"/>
              </label>
              <input class="chat-input" v-model="chatInput" :placeholder="activeChat?.muted?'🔕 Чат заглушён — но вы можете писать':tr.chat_input_ph" @keyup.enter="sendChatMessage"/>
              <button class="chat-send-btn" @click="sendChatMessage">➤</button>
            </div>
          </template>
        </div>
      </div>

      <!-- ======= SETTINGS ======= -->
      <div v-if="!showSearchResults&&navPage==='settings'" class="settings-page">
        <div class="settings-page-title">{{ tr.settings_title }}</div>
        <div class="settings-grid">
          <!-- Theme -->
          <div class="settings-card">
            <div class="settings-section-title">{{ tr.settings_theme }}</div>
            <div class="settings-option-row">
              <button class="settings-opt-btn" :class="{active:currentTheme==='light'}" @click="currentTheme='light'">{{ tr.theme_light }}</button>
              <button class="settings-opt-btn" :class="{active:currentTheme==='dark'}" @click="currentTheme='dark'">{{ tr.theme_dark }}</button>
            </div>
          </div>
          <!-- Sounds -->
          <div class="settings-card">
            <div class="settings-section-title">{{ tr.settings_sound }}</div>
            <div class="settings-option-row">
              <button class="settings-opt-btn" :class="{active:soundsEnabled}" @click="soundsEnabled=true">{{ tr.sound_on }}</button>
              <button class="settings-opt-btn" :class="{active:!soundsEnabled}" @click="soundsEnabled=false">{{ tr.sound_off }}</button>
            </div>
          </div>
          <!-- Language -->
          <div class="settings-card" style="grid-column:span 2">
            <div class="settings-section-title">{{ tr.settings_lang }}</div>
            <div class="lang-grid">
              <button v-for="lang in LANGS" :key="lang.code" class="lang-btn" :class="{active:currentLang===lang.code}" @click="setLang(lang.code);showToast(tr.toast_lang_changed+lang.name)">{{ lang.flag }} {{ lang.name }}</button>
            </div>
          </div>
          <!-- Profile -->
          <div class="settings-card">
            <div class="settings-section-title">{{ tr.settings_profile }}</div>
            <div style="font-size:13px;font-weight:600;color:var(--gray-text);margin-bottom:6px">{{ tr.label_name }}</div>
            <input class="settings-input" v-model="settingNewName" :placeholder="currentUser.name"/>
            <div style="font-size:13px;font-weight:600;color:var(--gray-text);margin-bottom:6px">{{ tr.label_bio }}</div>
            <input class="settings-input" v-model="settingNewBio" :placeholder="currentUser.bio"/>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn-save-settings" @click="saveName();saveBio()">{{ tr.btn_save }}</button>
            </div>
          </div>
          <!-- Avatar -->
          <div class="settings-card">
            <div class="settings-section-title">{{ tr.settings_avatar }}</div>
            <div class="avatar-upload-area">
              <div class="avatar-preview"><img :src="currentUser.avatar"/></div>
              <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--gray-input);border-radius:50px;cursor:pointer;font-size:13px;font-weight:600;color:var(--brown-dark);transition:background .15s" @mouseover="$event.currentTarget.style.background='var(--orange-pale)'" @mouseleave="$event.currentTarget.style.background='var(--gray-input)'">
                {{ tr.btn_upload_photo }}<input type="file" accept="image/*" style="display:none" @change="handleAvatarChange"/>
              </label>
            </div>
          </div>
          <!-- Hobbies summary -->
          <div class="settings-card" style="grid-column:span 2">
            <div class="settings-section-title">{{ tr.settings_hobbies }}</div>
            <div v-if="currentUser.hobbies.length" style="display:flex;flex-wrap:wrap;gap:8px">
              <div v-for="h in currentUser.hobbies" :key="h.id" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--orange-pale);border-radius:50px;border:1.5px solid var(--orange-light);font-size:13px;font-weight:600;color:var(--brown-dark)">
                {{ HOBBIES.find(x=>x.id===h.id)?.icon }} {{ h.name }} — <span style="color:var(--orange)">{{ h.level }}</span>
              </div>
            </div>
            <div v-else style="color:var(--gray-text);font-size:14px">{{ tr.hobbies_empty }} <span style="color:var(--orange);cursor:pointer;font-weight:700" @click="page='onboarding-hobbies'">{{ tr.hobbies_choose }}</span></div>
          </div>
          <!-- Danger zone -->
          <div class="settings-card" style="grid-column:span 2">
            <div class="settings-section-title">{{ tr.settings_account }}</div>
            <button class="btn-logout" @click="page='auth'">{{ tr.btn_logout_full }}</button>
          </div>
        </div>
      </div>

      <!-- ======= RULES ======= -->
      <div v-if="!showSearchResults&&navPage==='rules'" style="padding:24px;overflow-y:auto">
        <div class="rules-page">
          <!-- Hero -->
          <div class="rules-hero">
            <div class="rules-hero-title">📜 Правила ХОББИДРУГ</div>
            <div class="rules-hero-sub">Мы создаём пространство, где каждый может делиться своим творчеством, находить единомышленников и вдохновляться. Пожалуйста, соблюдайте эти правила — они помогают нам всем.</div>
          </div>

          <!-- Core rules grid -->
          <div class="rules-card">
            <div class="rules-title"><span>🌟</span> Основные правила сообщества</div>
            <div class="rules-grid">
              <div class="rule-item" style="animation-delay:0s">
                <div class="rule-num-title"><span class="rule-icon">🤝</span> 1. Уважение и доброжелательность</div>
                <div class="rule-body">Относитесь к каждому участнику с уважением. Критика допустима только конструктивная. Оскорбления, унижения и грубость — недопустимы.
                  <ul><li>Критикуйте идею, а не человека</li><li>Используйте вежливые формулировки</li><li>Помогайте новичкам освоиться</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.08s">
                <div class="rule-num-title"><span class="rule-icon">🎨</span> 2. Тематика постов</div>
                <div class="rule-body">Публикуйте контент, связанный с вашим хобби. Делитесь прогрессом, советами, вопросами и вдохновением.
                  <ul><li>Фото работ приветствуются</li><li>Вопросы и советы — отличный контент</li><li>Рекламу сторонних сервисов — запрещено</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.16s">
                <div class="rule-num-title"><span class="rule-icon">🔒</span> 3. Конфиденциальность</div>
                <div class="rule-body">Не публикуйте личные данные других пользователей без их согласия. Уважайте приватность.
                  <ul><li>Нельзя делиться чужими фото без разрешения</li><li>Личная переписка остаётся личной</li><li>Контактные данные — только с согласия</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.24s">
                <div class="rule-num-title"><span class="rule-icon">📸</span> 4. Авторские права</div>
                <div class="rule-body">Публикуйте только свои работы или контент с разрешением автора. Указывайте источник при цитировании.
                  <ul><li>Ваши работы — ваши авторские права</li><li>Чужие работы — только с разрешения</li><li>Укажите автора при репосте</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.32s">
                <div class="rule-num-title"><span class="rule-icon">🚫</span> 5. Запрещённый контент</div>
                <div class="rule-body">Категорически запрещается публиковать:
                  <ul><li>Ненависть, дискриминация, экстремизм</li><li>Контент для взрослых</li><li>Спам и фишинг</li><li>Дезинформацию и фейки</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.40s">
                <div class="rule-num-title"><span class="rule-icon">💬</span> 6. Общение в чатах</div>
                <div class="rule-body">В личных сообщениях действуют те же правила. Нежелательное общение можно заблокировать.
                  <ul><li>Нельзя преследовать других пользователей</li><li>Спам в личных сообщениях запрещён</li><li>Уважайте право на молчание</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.48s">
                <div class="rule-num-title"><span class="rule-icon">🏆</span> 7. Честность и стрик</div>
                <div class="rule-body">Стрик — это ваш ежедневный прогресс. Не накручивайте статистику искусственно.
                  <ul><li>Один реальный визит в день</li><li>Посты должны быть настоящими</li><li>За накрутку — блокировка</li></ul>
                </div>
              </div>
              <div class="rule-item" style="animation-delay:.56s">
                <div class="rule-num-title"><span class="rule-icon">🌍</span> 8. Язык общения</div>
                <div class="rule-body">Основной язык платформы — русский, но мы рады пользователям со всего мира.
                  <ul><li>Пишите понятно для других</li><li>Переводы приветствуются</li><li>Диалекты и другие языки — допустимы</li></ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Sanctions -->
          <div class="rules-sanctions">
            <div class="sanctions-title">⚠️ Санкции за нарушение правил</div>
            <div class="sanction-item"><div class="sanction-dot"></div><strong>Предупреждение</strong> — за первичное незначительное нарушение. Нарушитель получит уведомление.</div>
            <div class="sanction-item"><div class="sanction-dot"></div><strong>Временная блокировка</strong> (1-30 дней) — за повторные нарушения или серьёзное единоразовое нарушение.</div>
            <div class="sanction-item"><div class="sanction-dot"></div><strong>Удаление поста/комментария</strong> — нарушающий контент будет немедленно удалён.</div>
            <div class="sanction-item"><div class="sanction-dot"></div><strong>Постоянная блокировка аккаунта</strong> — за грубые нарушения (экстремизм, домогательства, систематический спам).</div>
            <div class="sanction-item"><div class="sanction-dot"></div><strong>Обращение в правоохранительные органы</strong> — при выявлении незаконной деятельности.</div>
          </div>

          <!-- Closing -->
          <div class="rules-closing">
            <span class="rules-closing-icon">🌟</span>
            <div class="rules-closing-text">ХОББИДРУГ — это место, где каждый может расти, вдохновляться и находить друзей по интересам.<br><br>Соблюдая эти правила, мы создаём безопасное и дружелюбное сообщество для всех. Спасибо, что вы с нами!</div>
            <button class="btn-primary" style="margin-top:20px" @click="navPage='feed'">Вернуться в ленту 🚀</button>
          </div>
        </div>
      </div>

    </div><!-- /main content -->

    <!-- MOTIVATION BUBBLE -->
    <div class="motivation-bubble" @click="showToast('Ты молодец! 🎉')">У тебя всё получится! ⭐</div>

    <!-- SCROLL TOP -->
    <button v-if="showScrollTop&&navPage==='feed'" class="scroll-top" @click="getScroller()&&getScroller().scrollTo({top:0,behavior:'smooth'})">{{ tr.scroll_top }}</button>

    <!-- MOBILE BOTTOM NAV -->
    <nav class="mobile-nav-bar">
      <div class="nav-item" :class="{active:navPage==='feed'}" @click="navPage='feed'"><span class="nav-icon">📋</span> {{ tr.nav_feed }}</div>
      <div class="nav-item" :class="{active:navPage==='friends'}" @click="isGuest?showToast(tr.toast_login_friends):navPage='friends'"><span class="nav-icon">👥</span> {{ tr.nav_friends }}</div>
      <div class="nav-item" :class="{active:navPage==='chats'}" @click="isGuest?showToast(tr.toast_login_chats):navPage='chats'"><span class="nav-icon">💬</span> {{ tr.nav_chats }}</div>
      <div class="nav-item" :class="{active:navPage==='profile'}" @click="isGuest?showToast(tr.toast_login_profile):navPage='profile'"><span class="nav-icon">⭐</span> {{ tr.nav_profile }}</div>
      <div class="nav-item" :class="{active:navPage==='settings'}" @click="navPage='settings'"><span class="nav-icon">⚙️</span> {{ tr.nav_settings }}</div>
    </nav>
  </div><!-- /app-layout -->

  <!-- ============ CREATE POST MODAL ============ -->
  <div v-if="showCreatePost" class="modal-overlay" @click.self="showCreatePost=false">
    <div class="modal-box" style="max-width:580px">
      <div class="modal-title">
        <span>{{ tr.modal_create_post }}</span>
        <span class="modal-close" @click="showCreatePost=false">✕</span>
      </div>
      <div v-if="postValidation" class="validation-hint">⚠️ {{ postValidation }}</div>
      <input class="post-title-input" v-model="newPostTitle" :placeholder="tr.post_title_ph" @input="postValidation=''"/>
      <textarea class="post-text-area" v-model="newPostText" :placeholder="tr.post_text_ph" @input="postValidation=''"></textarea>
      <!-- Tags -->
      <div style="margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--brown-dark);margin-bottom:8px">Теги:</div>
        <div class="tag-input-wrap">
          <div v-for="tag in newPostTags" :key="tag" class="tag-chip-removable">{{ tag }}<span class="remove" @click="removeTag(tag)">×</span></div>
          <input style="flex:1;min-width:100px;background:var(--gray-input);border:2px solid transparent;border-radius:50px;outline:none;padding:6px 14px;font-family:'Nunito',sans-serif;font-size:13px;color:var(--brown-dark)" v-model="newPostTagInput" placeholder="#тег" @keyup.enter="addTagFromInput" @keyup.space="addTagFromInput"/>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
          <span v-for="tag in SUGGESTED_TAGS" :key="tag" style="padding:4px 10px;border-radius:50px;background:var(--orange-pale);border:1px solid var(--orange-light);color:var(--brown);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s" @click="addSuggestedTag(tag)" @mouseover="$event.target.style.background='var(--orange-light)'" @mouseleave="$event.target.style.background='var(--orange-pale)'">{{ tag }}</span>
        </div>
      </div>
      <!-- Image -->
      <div style="margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--brown-dark);margin-bottom:8px">Фото (необязательно):</div>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--gray-input);border-radius:12px;cursor:pointer;transition:background .2s" @mouseover="$event.currentTarget.style.background='#E8E4DC'" @mouseleave="$event.currentTarget.style.background='var(--gray-input)'">
          <span style="font-size:20px">📸</span>
          <span style="font-size:13px;font-weight:600;color:var(--brown-dark)">{{ newPostImage ? tr.post_img_done || 'Фото добавлено ✓' : tr.post_img }}</span>
          <input type="file" accept="image/*" style="display:none" @change="handleImageUpload"/>
        </label>
        <div v-if="newPostImage" style="margin-top:8px;position:relative;display:inline-block">
          <img :src="newPostImage" style="width:120px;height:90px;object-fit:cover;border-radius:10px"/>
          <span style="position:absolute;top:-6px;right:-6px;background:var(--red);color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;font-weight:700" @click="newPostImage=null">×</span>
        </div>
      </div>
      <!-- Hobby done toggle -->
      <div class="hobby-today-toggle" @click="newPostHobbyDone=!newPostHobbyDone">
        <div class="toggle-switch" :class="{on:newPostHobbyDone}"></div>
        <span>{{ tr.post_hobby_done }}</span>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="showCreatePost=false">{{ tr.btn_cancel }}</button>
        <button class="btn-primary" @click="submitPost">{{ tr.btn_publish }} 🚀</button>
      </div>
    </div>
  </div>

</div>
`
};