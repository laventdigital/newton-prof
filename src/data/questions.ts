/**
 * ProfiTest KZ v4 — All 53 Questions
 *
 * Layer 1: 24 RIASEC interest questions (R01-R24), forced_choice
 * Layer 2: 14 ability self-assessment questions (A01-A14), scale_3
 * Layer 3: 15 value pair questions (V01-V15), forced_choice
 */

export interface Question {
  id: string;
  layer: 1 | 2 | 3;
  type: 'forced_choice' | 'scale_3';
  // Layer 1 fields
  type_a?: string;
  text_a: string;
  type_b?: string;
  text_b?: string;
  // Layer 2 fields
  dimension?: string;
  options?: { label: string; value: number }[];
  // Layer 3 fields
  code_a?: string;
  code_b?: string;
}

export interface LayerMeta {
  id: number;
  name: string;
  questions: number;
  format: string;
  instruction: string;
  header: string;
}

export const LAYERS: LayerMeta[] = [
  {
    id: 1,
    name: "Интересы (RIASEC)",
    questions: 24,
    format: "forced_choice",
    instruction: "Выбери занятие, которое тебе ближе. Не думай долго — первая реакция самая честная.",
    header: "Что тебе интереснее?",
  },
  {
    id: 2,
    name: "Способности",
    questions: 14,
    format: "scale_3",
    instruction: "Оцени, насколько легко тебе даётся каждый навык. Отвечай честно — правильных ответов нет.",
    header: "Насколько легко тебе это даётся?",
  },
  {
    id: 3,
    name: "Ценности",
    questions: 15,
    format: "forced_choice",
    instruction: "Представь свою будущую работу. Что для тебя важнее? Снова — первая реакция!",
    header: "Что для тебя важнее в будущей работе?",
  },
];

const SCALE_3_OPTIONS: { label: string; value: number }[] = [
  { label: "\u{1F630} Мне сложно", value: 0 },
  { label: "\u{1F914} Нормально", value: 1 },
  { label: "\u{1F60E} Легко!", value: 2 },
];

export const QUESTIONS: Question[] = [
  // =====================================================================
  // LAYER 1 — Interests (RIASEC), 24 forced-choice questions
  // =====================================================================
  {
    id: "R01",
    layer: 1,
    type: "forced_choice",
    type_a: "R",
    text_a: "Собрать робота из конструктора или деталей",
    type_b: "I",
    text_b: "Разобраться, как работает искусственный интеллект",
  },
  {
    id: "R02",
    layer: 1,
    type: "forced_choice",
    type_a: "A",
    text_a: "Нарисовать граффити, сделать коллаж или оформить комнату",
    type_b: "R",
    text_b: "Починить велосипед, скутер или бытовую технику",
  },
  {
    id: "R03",
    layer: 1,
    type: "forced_choice",
    type_a: "R",
    text_a: "Работать руками — собирать, строить, ремонтировать",
    type_b: "S",
    text_b: "Помогать младшим с уроками или объяснять сложные темы",
  },
  {
    id: "R04",
    layer: 1,
    type: "forced_choice",
    type_a: "E",
    text_a: "Организовать турнир или соревнование среди одноклассников",
    type_b: "R",
    text_b: "Настроить оборудование для школьного мероприятия",
  },
  {
    id: "R05",
    layer: 1,
    type: "forced_choice",
    type_a: "C",
    text_a: "Создать идеальную таблицу или систему, где всё на своём месте",
    type_b: "R",
    text_b: "Собрать мебель по инструкции или схеме",
  },
  {
    id: "R06",
    layer: 1,
    type: "forced_choice",
    type_a: "A",
    text_a: "Написать песню, стихотворение или короткий рассказ",
    type_b: "I",
    text_b: "Провести опыт или эксперимент и зафиксировать результат",
  },
  {
    id: "R07",
    layer: 1,
    type: "forced_choice",
    type_a: "S",
    text_a: "Выслушать друга и помочь советом в трудной ситуации",
    type_b: "I",
    text_b: "Решать сложные задачи по математике или физике",
  },
  {
    id: "R08",
    layer: 1,
    type: "forced_choice",
    type_a: "I",
    text_a: "Изучать научные статьи и документальные фильмы о космосе",
    type_b: "E",
    text_b: "Продвигать свой проект и привлекать в него людей",
  },
  {
    id: "R09",
    layer: 1,
    type: "forced_choice",
    type_a: "C",
    text_a: "Навести порядок в хаосе данных — так, чтобы всё стало кристально ясно",
    type_b: "I",
    text_b: "Анализировать данные и искать в них закономерности",
  },
  {
    id: "R10",
    layer: 1,
    type: "forced_choice",
    type_a: "A",
    text_a: "Снимать и монтировать видеоролики для соцсетей",
    type_b: "S",
    text_b: "Организовать благотворительную акцию или волонтёрский проект",
  },
  {
    id: "R11",
    layer: 1,
    type: "forced_choice",
    type_a: "E",
    text_a: "Продавать идею инвесторам и убеждать людей вложиться",
    type_b: "A",
    text_b: "Придумывать дизайн — логотипы, обложки, интерфейсы",
  },
  {
    id: "R12",
    layer: 1,
    type: "forced_choice",
    type_a: "A",
    text_a: "Импровизировать — танцевать, рисовать, играть на инструменте",
    type_b: "C",
    text_b: "Составить чёткий план и видеть, как всё идёт точно по нему",
  },
  {
    id: "R13",
    layer: 1,
    type: "forced_choice",
    type_a: "S",
    text_a: "Волонтёрить — помогать в детском доме или приюте для животных",
    type_b: "E",
    text_b: "Возглавить школьный клуб или студенческий совет",
  },
  {
    id: "R14",
    layer: 1,
    type: "forced_choice",
    type_a: "C",
    text_a: "Быть тем, кто находит ошибки, которые все остальные пропустили",
    type_b: "S",
    text_b: "Помогать одноклассникам готовиться к ЕНТ или контрольной",
  },
  {
    id: "R15",
    layer: 1,
    type: "forced_choice",
    type_a: "E",
    text_a: "Запустить свой маленький бизнес — хоть на Instagram",
    type_b: "C",
    text_b: "Контролировать финансы — знать, куда уходит каждый тенге",
  },
  {
    id: "R16",
    layer: 1,
    type: "forced_choice",
    type_a: "I",
    text_a: "Понять, почему мост выдерживает нагрузку — физика за каждой конструкцией",
    type_b: "R",
    text_b: "Построить что-то из дерева, металла или 3D-принтера",
  },
  {
    id: "R17",
    layer: 1,
    type: "forced_choice",
    type_a: "S",
    text_a: "Быть вожатым в детском лагере и заботиться о группе",
    type_b: "R",
    text_b: "Работать на природе — ферма, стройка, экспедиция",
  },
  {
    id: "R18",
    layer: 1,
    type: "forced_choice",
    type_a: "R",
    text_a: "Чинить технику — компьютеры, телефоны, электронику",
    type_b: "C",
    text_b: "Создать систему хранения, в которой любой файл находится за секунду",
  },
  {
    id: "R19",
    layer: 1,
    type: "forced_choice",
    type_a: "I",
    text_a: "Разбираться в формулах, теориях и доказательствах",
    type_b: "A",
    text_b: "Создавать визуальный арт — рисовать, лепить, фотографировать",
  },
  {
    id: "R20",
    layer: 1,
    type: "forced_choice",
    type_a: "E",
    text_a: "Убедить команду действовать по твоему плану",
    type_b: "I",
    text_b: "Исследовать причины проблемы до самого корня",
  },
  {
    id: "R21",
    layer: 1,
    type: "forced_choice",
    type_a: "S",
    text_a: "Поддержать человека в трудную минуту — просто быть рядом",
    type_b: "A",
    text_b: "Писать сценарии, рассказы или вести блог",
  },
  {
    id: "R22",
    layer: 1,
    type: "forced_choice",
    type_a: "C",
    text_a: "Довести процесс до совершенства — чтобы работал без сбоев",
    type_b: "A",
    text_b: "Придумывать новые идеи без ограничений и рамок",
  },
  {
    id: "R23",
    layer: 1,
    type: "forced_choice",
    type_a: "E",
    text_a: "Руководить командой и принимать сложные решения",
    type_b: "S",
    text_b: "Работать в команде помощи людям — медицина, соцработа, психология",
  },
  {
    id: "R24",
    layer: 1,
    type: "forced_choice",
    type_a: "C",
    text_a: "Всё просчитать заранее и быть уверенным в результате на 100%",
    type_b: "E",
    text_b: "Рисковать ради большой цели и идти ва-банк",
  },

  // =====================================================================
  // LAYER 2 — Abilities, 14 scale_3 questions
  // =====================================================================
  {
    id: "A01",
    layer: 2,
    type: "scale_3",
    dimension: "Verb",
    text_a: "Пересказать суть длинного текста или статьи своими словами",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A02",
    layer: 2,
    type: "scale_3",
    dimension: "Verb",
    text_a: "Написать эссе или сочинение на заданную тему так, чтобы было интересно читать",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A03",
    layer: 2,
    type: "scale_3",
    dimension: "Verb",
    text_a: "Убедительно аргументировать свою позицию в споре или дискуссии",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A04",
    layer: 2,
    type: "scale_3",
    dimension: "Num",
    text_a: "Быстро посчитать в уме — скидки в магазине, проценты, сдачу",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A05",
    layer: 2,
    type: "scale_3",
    dimension: "Num",
    text_a: "Решить задачу по физике или математике из учебника",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A06",
    layer: 2,
    type: "scale_3",
    dimension: "Num",
    text_a: "Работать с таблицами и числами — находить закономерности и ошибки",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A07",
    layer: 2,
    type: "scale_3",
    dimension: "Num",
    text_a: "Оценить, реалистична ли цифра — например, бюджет мероприятия или цена проекта",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A08",
    layer: 2,
    type: "scale_3",
    dimension: "Spat",
    text_a: "Представить объёмный предмет по его чертежу или плоской картинке",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A09",
    layer: 2,
    type: "scale_3",
    dimension: "Spat",
    text_a: "Собрать что-то по схеме — конструктор, мебель, электросхему",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A10",
    layer: 2,
    type: "scale_3",
    dimension: "Spat",
    text_a: "Ориентироваться по карте или навигатору в незнакомом городе",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A11",
    layer: 2,
    type: "scale_3",
    dimension: "Logic",
    text_a: "Найти ошибку или слабое место в чужих рассуждениях",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A12",
    layer: 2,
    type: "scale_3",
    dimension: "Logic",
    text_a: "Решить логическую загадку или головоломку (судоку, ребусы, задачи на смекалку)",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A13",
    layer: 2,
    type: "scale_3",
    dimension: "Crit",
    text_a: "Определить, где в новости факт, а где манипуляция или чьё-то мнение",
    options: SCALE_3_OPTIONS,
  },
  {
    id: "A14",
    layer: 2,
    type: "scale_3",
    dimension: "Creat",
    text_a: "Придумать 10 необычных способов использования обычного предмета (кирпича или скрепки)",
    options: SCALE_3_OPTIONS,
  },

  // =====================================================================
  // LAYER 3 — Values, 15 forced-choice questions
  // =====================================================================
  {
    id: "V01",
    layer: 3,
    type: "forced_choice",
    code_a: "Stab",
    text_a: "Средняя зарплата, но с гарантией — тебя точно не уволят",
    code_b: "Inc",
    text_b: "Высокая зарплата, даже если работа не самая интересная",
  },
  {
    id: "V02",
    layer: 3,
    type: "forced_choice",
    code_a: "Inc",
    text_a: "Зарабатывать много, даже если работа однообразная",
    code_b: "Creat",
    text_b: "Заниматься тем, что зажигает, даже если платят скромнее",
  },
  {
    id: "V03",
    layer: 3,
    type: "forced_choice",
    code_a: "Auto",
    text_a: "Свободный график и своё дело, но доход нестабильный",
    code_b: "Inc",
    text_b: "Высокий доход, но работать на чужих условиях и графике",
  },
  {
    id: "V04",
    layer: 3,
    type: "forced_choice",
    code_a: "Inc",
    text_a: "Работа с отличной зарплатой в коммерции",
    code_b: "Soc",
    text_b: "Работа, которая реально помогает людям, но платят меньше",
  },
  {
    id: "V05",
    layer: 3,
    type: "forced_choice",
    code_a: "Pres",
    text_a: "Престижная должность, которой восхищаются, но зарплата средняя",
    code_b: "Inc",
    text_b: "Хорошо зарабатывать, но никто не знает, чем ты занимаешься",
  },
  {
    id: "V06",
    layer: 3,
    type: "forced_choice",
    code_a: "Stab",
    text_a: "Предсказуемая работа — знаешь, что будет завтра и через год",
    code_b: "Creat",
    text_b: "Работа, где каждый день новый вызов и ни дня похожего",
  },
  {
    id: "V07",
    layer: 3,
    type: "forced_choice",
    code_a: "Auto",
    text_a: "Быть фрилансером — сам решаешь, когда, где и что делать",
    code_b: "Stab",
    text_b: "Надёжное рабочее место с графиком 9-18 и соцпакетом",
  },
  {
    id: "V08",
    layer: 3,
    type: "forced_choice",
    code_a: "Stab",
    text_a: "Государственная работа — стабильно, спокойно, понятно",
    code_b: "Soc",
    text_b: "Работа в НКО — помогаешь людям, но нет гарантий на будущее",
  },
  {
    id: "V09",
    layer: 3,
    type: "forced_choice",
    code_a: "Pres",
    text_a: "Престижная карьера в крупной компании, но с высокими рисками",
    code_b: "Stab",
    text_b: "Тихая стабильная работа без карьерных амбиций",
  },
  {
    id: "V10",
    layer: 3,
    type: "forced_choice",
    code_a: "Creat",
    text_a: "Творческий проект с вдохновляющей командой, но жёстким руководителем",
    code_b: "Auto",
    text_b: "Полная свобода действий, но задачи рутинные и скучные",
  },
  {
    id: "V11",
    layer: 3,
    type: "forced_choice",
    code_a: "Soc",
    text_a: "Делать что-то полезное для общества — даже если это не креативно",
    code_b: "Creat",
    text_b: "Создавать что-то новое и красивое — продукт, дизайн, контент",
  },
  {
    id: "V12",
    layer: 3,
    type: "forced_choice",
    code_a: "Creat",
    text_a: "Заниматься любимым делом без признания и славы",
    code_b: "Pres",
    text_b: "Иметь уважаемую должность, но без творчества в работе",
  },
  {
    id: "V13",
    layer: 3,
    type: "forced_choice",
    code_a: "Auto",
    text_a: "Работать на себя — полная независимость",
    code_b: "Soc",
    text_b: "Работать в команде ради общего дела — вместе менять мир",
  },
  {
    id: "V14",
    layer: 3,
    type: "forced_choice",
    code_a: "Pres",
    text_a: "Быть на виду и уважаемым, но зависимым от чужих ожиданий",
    code_b: "Auto",
    text_b: "Быть свободным и независимым, но незаметным для окружающих",
  },
  {
    id: "V15",
    layer: 3,
    type: "forced_choice",
    code_a: "Soc",
    text_a: "Помогать людям тихо, без публичности — главное результат",
    code_b: "Pres",
    text_b: "Быть лицом благотворительности — вдохновлять других примером",
  },
];
