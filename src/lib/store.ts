export interface PodcastEntry {
  id: string;
  url: string;
  title: string;
  brief: string;
  keyPeople: { name: string; description: string }[];
  keyConcepts: { name: string; description: string }[];
  keyEvents: { name: string; description: string }[];
  createdAt: string;
  notes?: {
    topic: string;
    keyPoints: string[];
    thoughts: string;
    rating: number;
  };
}

const STORAGE_KEY = "podprep_entries";

export function getEntries(): PodcastEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: PodcastEntry) {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntry(id: string): PodcastEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

// Generate mock preview data based on URL
export function generateMockPreview(url: string): PodcastEntry {
  const id = crypto.randomUUID();
  const mockData: PodcastEntry[] = [
    {
      id,
      url,
      title: "AI未来与人类工作",
      brief: "本期播客深入讨论了人工智能的未来发展趋势，重点探讨了AI对就业市场的影响、AGI的可能时间线，以及教育体系需要如何适应这一变革。嘉宾们分享了对Sam Altman近期言论的解读。",
      keyPeople: [
        { name: "Sam Altman", description: "OpenAI CEO，前Y Combinator总裁，AGI研究的核心推动者" },
        { name: "Elon Musk", description: "Tesla/SpaceX/xAI创始人，曾是OpenAI联合创始人，后因理念分歧离开" },
        { name: "Ilya Sutskever", description: "前OpenAI首席科学家，深度学习先驱，后创立SSI" },
      ],
      keyConcepts: [
        { name: "AGI (通用人工智能)", description: "能够理解和执行任何人类智力任务的AI系统，被视为AI发展的终极目标" },
        { name: "AI Alignment", description: "确保AI系统的目标和行为与人类价值观一致的研究领域" },
        { name: "Scaling Laws", description: "模型性能随计算量、数据量和参数量增加而可预测提升的规律" },
      ],
      keyEvents: [
        { name: "OpenAI董事会危机 (2023.11)", description: "Sam Altman被董事会解雇又在5天内回归，引发AI治理讨论" },
        { name: "GPT-4发布", description: "多模态大语言模型发布，展示了接近人类水平的推理能力" },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id,
      url,
      title: "日本泡沫经济启示录",
      brief: "回顾1980年代末日本泡沫经济的形成与破裂，分析资产价格膨胀的深层原因，以及对当今全球经济的警示意义。从广场协议到失去的三十年，一段值得深思的经济史。",
      keyPeople: [
        { name: "三重野康", description: "日本银行第26任总裁，因激进加息被称为'平成的鬼平'" },
        { name: "Richard Koo", description: "野村综合研究所首席经济学家，资产负债表衰退理论提出者" },
      ],
      keyConcepts: [
        { name: "资产泡沫", description: "资产价格远超其内在价值的经济现象，通常由过度投机和宽松货币政策推动" },
        { name: "广场协议", description: "1985年五国集团协议，导致日元大幅升值，间接催生了日本泡沫经济" },
        { name: "资产负债表衰退", description: "企业和个人同时偿还债务导致的长期经济停滞" },
      ],
      keyEvents: [
        { name: "广场协议签订 (1985)", description: "美日英法德五国同意联合干预外汇市场，推动美元贬值" },
        { name: "泡沫破裂 (1990-1992)", description: "日经指数从38,915点暴跌，房地产价格崩溃" },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  return mockData[Math.floor(Math.random() * mockData.length)];
}
