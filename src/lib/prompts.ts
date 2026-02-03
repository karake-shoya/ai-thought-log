export type DailyPrompt = {
  id: string;
  text: string;
};

const PROMPTS: DailyPrompt[] = [
  {
    id: "clarity-1",
    text: "今いちばん頭から離れないことは何ですか？なぜそれが気になっていますか？",
  },
  {
    id: "values-1",
    text: "最近の出来事で『自分らしい』と感じた瞬間はいつでしたか？",
  },
  {
    id: "relationships-1",
    text: "最近の人間関係でモヤッとしたことは何ですか？その背景には何がありますか？",
  },
  {
    id: "work-1",
    text: "今日の仕事や学びで最もエネルギーを使った場面はどこでしたか？",
  },
  {
    id: "self-care-1",
    text: "自分のコンディションを整えるために、今日できた小さなことは何ですか？",
  },
  {
    id: "future-1",
    text: "3ヶ月後の自分にどんな状態でいてほしいですか？今できる一歩は何でしょう？",
  },
  {
    id: "gratitude-1",
    text: "最近ありがたいと感じたことは何ですか？その理由は？",
  },
  {
    id: "decision-1",
    text: "今、決めかねていることはありますか？迷いの正体は何でしょう？",
  },
  {
    id: "growth-1",
    text: "最近の挑戦で学んだことは何ですか？それは今後どう活かせそうですか？",
  },
  {
    id: "rest-1",
    text: "休むことに対して感じることは何ですか？罪悪感や安心感はありますか？",
  },
];

export function getDailyPrompt(date = new Date()): DailyPrompt {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = day % PROMPTS.length;
  return PROMPTS[index];
}
