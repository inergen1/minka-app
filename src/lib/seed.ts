import { addDays, key } from "./dates";
import { isDue, target } from "./habits";
import type { Area, Block, Goal, Habit, Logs, Task } from "./types";

/** The eight default life areas. New users start with these (ratings 5, no vision). */
export const DEFAULT_AREAS: Area[] = [
  { id: "faith", icon: "moon-star", name: { ar: "ديني", en: "Faith" }, now: 7, before: 6, vision: { ar: "صلاة في وقتها بخشوع، وصلة يومية بالقرآن لا تنقطع، وأذكار تحفظ يومي.", en: "Prayers on time and present, a daily bond with the Quran that never breaks, and adhkar that frame my day." } },
  { id: "spirit", icon: "sparkles", name: { ar: "روحاني", en: "Spiritual" }, now: 6, before: 5, vision: { ar: "قلب هادئ وممتن، ووقت أسبوعي للخلوة والتأمل ومراجعة النفس.", en: "A calm, grateful heart, with weekly time for solitude, reflection and self-review." } },
  { id: "health", icon: "heart-pulse", name: { ar: "صحي", en: "Health" }, now: 5, before: 4, vision: { ar: "جسم نشيط بوزن 78 كجم، أنام 7 ساعات، وأتمرّن 3 مرات أسبوعياً دون انقطاع.", en: "An active body at 78 kg, 7 hours of sleep, and strength training 3 times a week without breaks." } },
  { id: "work", icon: "briefcase", name: { ar: "عملي ومهني", en: "Career" }, now: 7, before: 7, vision: { ar: "قائد مشاريع معتمد يدير فريقاً، ويقضي ساعة عمل عميق يومياً على ما يهم.", en: "A certified project lead running a team, with an hour of deep work daily on what matters." } },
  { id: "wealth", icon: "wallet", name: { ar: "مالي ومادي", en: "Wealth" }, now: 4, before: 3, vision: { ar: "صندوق طوارئ يغطي 6 أشهر، وبلا ديون استهلاكية، واستثمار شهري ثابت.", en: "An emergency fund covering 6 months, no consumer debt, and a steady monthly investment." } },
  { id: "family", icon: "users", name: { ar: "أسري واجتماعي", en: "Family & social" }, now: 8, before: 7, vision: { ar: "حاضر مع عائلتي، أتصل بوالديّ مرتين أسبوعياً، ورحلة عائلية كل صيف.", en: "Present with my family, calling my parents twice a week, and a family trip every summer." } },
  { id: "growth", icon: "graduation-cap", name: { ar: "تعلّم وتطوير", en: "Learning" }, now: 6, before: 6, vision: { ar: "قارئ نهم: 24 كتاباً في السنة، ومهارة جديدة كل ربع.", en: "A keen reader: 24 books a year, and one new skill every quarter." } },
  { id: "leisure", icon: "palette", name: { ar: "ترفيه وهوايات", en: "Leisure" }, now: 5, before: 3, vision: { ar: "هواية تملأ وقتي بالجمال: إتقان خط الرقعة هذا العام.", en: "A hobby that fills my time with beauty: mastering Ruq’ah calligraphy this year." } },
];

export const blankAreas = (): Area[] =>
  DEFAULT_AREAS.map((a) => ({ ...a, now: 5, before: 5, vision: { ar: "", en: "" } }));

type SeedHabit = Habit & { rate: number; seed: number; today: number };

const HABITS: SeedHabit[] = [
  { id: "h1", area: "faith", slot: "fajr", icon: "sunrise", name: { ar: "أذكار الصباح", en: "Morning adhkar" }, type: "check", rate: 0.9, seed: 23, today: 1 },
  { id: "h2", area: "faith", slot: "fajr", icon: "book-open", name: { ar: "ورد القرآن", en: "Daily Quran portion" }, type: "count", target: 4, unit: { ar: "صفحات", en: "pages" }, rate: 0.82, seed: 9, today: 2, goal: "g1" },
  { id: "h3", area: "faith", slot: "morning", icon: "sun", name: { ar: "صلاة الضحى", en: "Duha prayer" }, type: "check", rate: 0.68, seed: 4, today: 1 },
  { id: "h12", area: "work", slot: "dhuhr", icon: "target", name: { ar: "ساعة عمل عميق", en: "One hour of deep work" }, type: "duration", target: 60, unit: { ar: "دقيقة", en: "min" }, freq: { kind: "days", days: [0, 1, 2, 3, 4] }, rate: 0.76, seed: 15, today: 0, goal: "g3" },
  { id: "h4", area: "health", slot: "anytime", icon: "glass-water", name: { ar: "شرب الماء", en: "Drink water" }, type: "count", target: 8, unit: { ar: "أكواب", en: "glasses" }, rate: 0.74, seed: 5, today: 5 },
  { id: "h5", area: "health", slot: "asr", icon: "footprints", name: { ar: "المشي", en: "Walk" }, type: "duration", target: 30, unit: { ar: "دقيقة", en: "min" }, rate: 0.66, seed: 6, today: 0, goal: "g2" },
  { id: "h6", area: "growth", slot: "maghrib", icon: "book", name: { ar: "قراءة 20 صفحة", en: "Read 20 pages" }, type: "check", rate: 0.72, seed: 12, today: 0, goal: "g5" },
  { id: "h10", area: "family", slot: "maghrib", icon: "phone", name: { ar: "الاتصال بالوالدين", en: "Call my parents" }, type: "check", freq: { kind: "days", days: [2, 5] }, rate: 0.92, seed: 30, today: 0 },
  { id: "h7", area: "spirit", slot: "night", icon: "feather", name: { ar: "تدوين 3 أشياء أنا ممتن لها", en: "Write 3 things I’m grateful for" }, type: "check", rate: 0.6, seed: 3, today: 0 },
  { id: "h8", area: "spirit", slot: "night", icon: "wind", name: { ar: "هدوء وتأمل", en: "Quiet reflection" }, type: "duration", target: 10, unit: { ar: "دقائق", en: "min" }, rate: 0.5, seed: 2, today: 0 },
  { id: "h9", area: "wealth", slot: "night", icon: "receipt", name: { ar: "تسجيل مصروفات اليوم", en: "Log today’s spending" }, type: "check", rate: 0.8, seed: 31, today: 0, goal: "g4" },
  { id: "h11", area: "health", slot: "night", icon: "smartphone", name: { ar: "بلا هاتف بعد 11 مساءً", en: "No phone after 11pm" }, type: "check", quit: true, rate: 0.55, seed: 1, today: 0 },
];

const GOALS: Goal[] = [
  { id: "g1", area: "faith", horizon: "year", start: "2026-01-01", due: "2026-12-31", title: { ar: "ختم القرآن تلاوةً هذا العام", en: "Recite the whole Quran this year" }, why: { ar: "أريد أن يكون القرآن رفيق يومي، لا موسمياً في رمضان فقط.", en: "I want the Quran to be a daily companion, not only in Ramadan." }, metric: { cur: 19, target: 30, unit: { ar: "جزءاً", en: "juz" } } },
  { id: "g1a", parent: "g1", area: "faith", horizon: "quarter", start: "2026-10-01", due: "2026-12-20", title: { ar: "حفظ سورة الكهف", en: "Memorise Surat al-Kahf" } },
  { id: "g2", area: "health", horizon: "year", start: "2026-07-01", due: "2027-03-31", title: { ar: "الوصول إلى وزن 78 كجم", en: "Reach 78 kg" }, why: { ar: "لأتحرك مع أطفالي بلا تعب، ولأحمي صحتي على المدى الطويل.", en: "To keep up with my kids without getting tired, and protect my long-term health." }, metric: { cur: 4.5, target: 8, unit: { ar: "كجم مفقودة", en: "kg lost" } } },
  { id: "g2a", parent: "g2", area: "health", horizon: "quarter", start: "2026-10-01", due: "2026-12-31", title: { ar: "تمارين قوة 3 مرات أسبوعياً", en: "Strength training 3× a week" }, metric: { cur: 20, target: 36, unit: { ar: "جلسة", en: "sessions" } } },
  { id: "g2b", parent: "g2", area: "health", horizon: "month", start: "2026-10-01", due: "2026-10-31", title: { ar: "تقليل السكر المضاف", en: "Cut added sugar" } },
  { id: "g3", area: "work", horizon: "year", start: "2026-05-01", due: "2027-01-31", title: { ar: "الحصول على شهادة PMP", en: "Earn the PMP certification" }, why: { ar: "الخطوة التالية لقيادة مشاريع أكبر وترقية مستحقة.", en: "The next step toward leading bigger projects and a deserved promotion." } },
  { id: "g3a", parent: "g3", area: "work", horizon: "quarter", start: "2026-05-01", due: "2026-08-31", title: { ar: "إكمال 35 ساعة تدريب", en: "Complete 35 training hours" }, metric: { cur: 35, target: 35, unit: { ar: "ساعة", en: "hours" } } },
  { id: "g3b", parent: "g3", area: "work", horizon: "quarter", start: "2026-09-01", due: "2026-12-15", title: { ar: "حل 4 اختبارات تجريبية كاملة", en: "Sit 4 full practice exams" }, metric: { cur: 2, target: 4, unit: { ar: "اختبارات", en: "exams" } } },
  { id: "g4", area: "wealth", horizon: "year", start: "2026-02-01", due: "2027-06-30", title: { ar: "صندوق طوارئ يغطي 6 أشهر", en: "Emergency fund covering 6 months" }, why: { ar: "حتى لا تتحول أي مفاجأة إلى دين.", en: "So no surprise ever turns into debt." }, metric: { cur: 2.5, target: 6, unit: { ar: "أشهر مصاريف", en: "months of expenses" } } },
  { id: "g5", area: "growth", horizon: "year", start: "2026-01-01", due: "2026-12-31", title: { ar: "قراءة 24 كتاباً", en: "Read 24 books" }, why: { ar: "القراءة أسرع طريق أعرفه للنمو.", en: "Reading is the fastest way I know to grow." }, metric: { cur: 17, target: 24, unit: { ar: "كتاباً", en: "books" } } },
  { id: "g6", area: "family", horizon: "year", start: "2026-09-01", due: "2027-06-15", title: { ar: "رحلة عائلية في الصيف", en: "Family trip next summer" }, why: { ar: "ذكريات مشتركة تبقى مع أطفالي.", en: "Shared memories my kids will keep." } },
  { id: "g7", area: "spirit", horizon: "year", start: "2026-01-01", due: "2026-12-31", title: { ar: "يوم خلوة ومراجعة كل شهر", en: "One day of retreat and self-review each month" }, metric: { cur: 9, target: 12, unit: { ar: "أيام", en: "days" } } },
  { id: "g8", area: "leisure", horizon: "year", start: "2026-03-01", due: "2026-12-31", title: { ar: "إتقان خط الرقعة", en: "Master Ruq’ah calligraphy" }, why: { ar: "هواية هادئة تبعدني عن الشاشات.", en: "A calm hobby that keeps me off screens." } },
  { id: "g8a", parent: "g8", area: "leisure", horizon: "quarter", start: "2026-09-01", due: "2026-11-30", title: { ar: "كتابة الحروف المفردة بإتقان", en: "Write single letters cleanly" } },
];

const TASKS: (Omit<Task, "due"> & { dueIn?: number })[] = [
  { id: "t1", goal: "g1a", title: { ar: "حفظ الآيات 1–30", en: "Memorise verses 1–30" }, done: true },
  { id: "t2", goal: "g1a", title: { ar: "حفظ الآيات 31–60", en: "Memorise verses 31–60" }, done: true },
  { id: "t3", goal: "g1a", title: { ar: "حفظ الآيات 61–110", en: "Memorise verses 61–110" }, done: false, dueIn: 12 },
  { id: "t4", goal: "g2b", title: { ar: "إزالة المشروبات الغازية من البيت", en: "Clear soft drinks from the house" }, done: true },
  { id: "t5", goal: "g2b", title: { ar: "تخطيط وجبات الأسبوع", en: "Plan this week’s meals" }, done: false, dueIn: 0 },
  { id: "t6", goal: "g3", title: { ar: "حجز موعد الاختبار", en: "Book the exam date" }, done: false, dueIn: 0 },
  { id: "t7", goal: "g3", title: { ar: "مراجعة مجالات الأداء في دليل PMBOK", en: "Review PMBOK performance domains" }, done: false, dueIn: 3 },
  { id: "t8", goal: "g4", title: { ar: "فتح حساب ادخار منفصل", en: "Open a separate savings account" }, done: true },
  { id: "t9", goal: "g4", title: { ar: "تفعيل تحويل تلقائي شهري", en: "Set up a monthly auto-transfer" }, done: true },
  { id: "t10", goal: "g4", title: { ar: "مراجعة الاشتراكات وإلغاء غير الضروري", en: "Review and cancel unused subscriptions" }, done: false, dueIn: 0 },
  { id: "t11", goal: "g6", title: { ar: "اختيار الوجهة مع العائلة", en: "Choose the destination together" }, done: true },
  { id: "t12", goal: "g6", title: { ar: "تحديد ميزانية الرحلة", en: "Set the trip budget" }, done: false, dueIn: 5 },
  { id: "t13", goal: "g6", title: { ar: "حجز الطيران والسكن", en: "Book flights and stay" }, done: false },
  { id: "t14", goal: "g8a", title: { ar: "تمرين حروف المجموعة الأولى", en: "Practise the first letter group" }, done: true },
  { id: "t15", goal: "g8a", title: { ar: "تمرين الحروف الصاعدة", en: "Practise the rising letters" }, done: false, dueIn: 2 },
  { id: "t16", goal: "g8", title: { ar: "شراء أقلام وحبر وكراسة", en: "Buy pens, ink and a practice book" }, done: true },
];

const BLOCKS: Block[] = [
  { id: "b7", dows: [5], s: 6, d: 1, area: "faith", title: { ar: "ورد وتدبّر", en: "Quran & reflection" } },
  { id: "b1", dows: [0, 1, 2, 3, 4], s: 8, d: 8, area: "work", title: { ar: "الدوام", en: "Office hours" } },
  { id: "b4", dows: [6], s: 10, d: 2, area: "family", title: { ar: "زيارة الأهل", en: "Visit family" } },
  { id: "b5", dows: [5], s: 13.5, d: 2, area: "family", title: { ar: "غداء العائلة", en: "Family lunch" } },
  { id: "b6", dows: [6], s: 16.5, d: 1, area: "leisure", title: { ar: "درس الخط العربي", en: "Calligraphy class" } },
  { id: "b2", dows: [0, 2, 4], s: 17.5, d: 1, area: "health", title: { ar: "تمارين قوة", en: "Strength training" } },
  { id: "b9", dows: [4], s: 19, d: 1, area: "work", title: { ar: "المراجعة الأسبوعية", en: "Weekly review" } },
  { id: "b3", dows: [1, 3], s: 20, d: 1.5, area: "growth", title: { ar: "دراسة PMP", en: "PMP study" } },
  { id: "b8", dows: [0, 1, 2, 3, 4, 5, 6], s: 21.5, d: 0.5, area: "spirit", title: { ar: "مراجعة اليوم وامتنان", en: "Day review & gratitude" } },
];

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample workspace with a year of plausible habit history ending on `today`. */
export function sampleData(today: Date) {
  const rnd = mulberry(20261018);
  const logs: Logs = {};
  const habits: Habit[] = HABITS.map(({ rate, seed, today: todayVal, ...h }) => {
    const m: Record<string, number> = {};
    let left = seed;
    for (let k = 1; k <= 371; k++) {
      const d = addDays(today, -k);
      if (!isDue(h, d)) continue;
      let ok: boolean;
      if (left > 0) { ok = true; left--; } else if (left === 0) { ok = false; left = -1; } else ok = rnd() < rate;
      if (ok) m[key(d)] = target(h);
      else if (h.type !== "check" && rnd() < 0.5) m[key(d)] = Math.max(1, Math.floor(target(h) * rnd() * 0.7));
    }
    if (todayVal && isDue(h, today)) m[key(today)] = todayVal;
    logs[h.id] = m;
    return h;
  });
  const tasks: Task[] = TASKS.map(({ dueIn, ...t }) => ({ ...t, ...(dueIn !== undefined ? { due: key(addDays(today, dueIn)) } : {}) }));
  return { areas: structuredClone(DEFAULT_AREAS), habits, goals: structuredClone(GOALS), tasks, blocks: structuredClone(BLOCKS), logs };
}
