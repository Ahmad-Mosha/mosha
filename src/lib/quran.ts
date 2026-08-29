export interface QuranVerse {
  arabic: string;
  translation: string;
  surahNameArabic: string;
  surahNameEnglish: string;
  surahNumber: number;
  ayahNumber: number;
}

// Curated initial seed of verses for instantaneous zero-latency render
export const INITIAL_VERSES: QuranVerse[] = [
  {
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.",
    surahNameArabic: "الشرح",
    surahNameEnglish: "Ash-Sharh",
    surahNumber: 94,
    ayahNumber: 5,
  },
  {
    arabic: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ • وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ",
    translation: "And that there is not for man except that [good] for which he strives. And that his effort is going to be seen.",
    surahNameArabic: "النجم",
    surahNameEnglish: "An-Najm",
    surahNumber: 53,
    ayahNumber: 39,
  },
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    translation: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
    surahNameArabic: "البقرة",
    surahNameEnglish: "Al-Baqarah",
    surahNumber: 2,
    ayahNumber: 201,
  },
  {
    arabic: "وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِ",
    translation: "And rely upon the Ever-Living who does not die, and exalt [Allah] with His praise.",
    surahNameArabic: "الفرقان",
    surahNameEnglish: "Al-Furqan",
    surahNumber: 25,
    ayahNumber: 58,
  },
  {
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translation: "And say, 'My Lord, increase me in knowledge.'",
    surahNameArabic: "طه",
    surahNameEnglish: "Taha",
    surahNumber: 20,
    ayahNumber: 114,
  },
  {
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation: "Indeed, Allah is with the patient.",
    surahNameArabic: "البقرة",
    surahNameEnglish: "Al-Baqarah",
    surahNumber: 2,
    ayahNumber: 153,
  },
  {
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا • وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    translation: "And whoever fears Allah - He will make for him a way out. And will provide for him from where he does not expect.",
    surahNameArabic: "الطلاق",
    surahNameEnglish: "At-Talaq",
    surahNumber: 65,
    ayahNumber: 2,
  },
  {
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond that it can bear.",
    surahNameArabic: "البقرة",
    surahNameEnglish: "Al-Baqarah",
    surahNumber: 2,
    ayahNumber: 286,
  },
];

const TOTAL_AYAHS_IN_QURAN = 6236;

/**
 * Fetches a truly random ayah from anywhere in the entire Holy Quran (1-6236).
 * Falls back to an offline curated verse if network fails.
 */
export async function fetchRandomQuranVerse(): Promise<QuranVerse> {
  const randomAyahNumber = Math.floor(Math.random() * TOTAL_AYAHS_IN_QURAN) + 1;
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/editions/quran-uthmani,en.sahih`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch from Quran API");
    const json = await res.json();
    if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
      const arabicData = json.data[0];
      const englishData = json.data[1];
      return {
        arabic: arabicData.text,
        translation: englishData.text,
        surahNameArabic: arabicData.surah.name,
        surahNameEnglish: arabicData.surah.englishName,
        surahNumber: arabicData.surah.number,
        ayahNumber: arabicData.numberInSurah,
      };
    }
  } catch (err) {
    console.warn("Using offline fallback verse:", err);
  }

  // Fallback to random initial verse
  const randomIndex = Math.floor(Math.random() * INITIAL_VERSES.length);
  return INITIAL_VERSES[randomIndex];
}
