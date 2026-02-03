# AI思考ログ (MVP)

大人向けの思考ログWebアプリです。1日1回のプロンプトに答えると、AIが2〜3往復の深掘り質問を行い、最後に要約・論点・次の問いを生成します。

## 機能
- メール/パスワードで無料登録・ログイン
- 今日の思考プロンプト表示
- セッション開始 → チャット → 保存 → タイムライン表示
- OpenAI APIによる質問生成と要約生成

## ローカル起動

```bash
npm install
npm run dev
```

## Supabaseセットアップ

1. Supabaseで新しいプロジェクトを作成
2. SQLエディタで `supabase/schema.sql` を実行
3. Authentication で Email/Password を有効化
4. `.env.local` を作成し、以下を設定

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## テーブル概要

- `profiles`: ユーザーの表示名
- `sessions`: 思考セッション本体（要約を含む）
- `messages`: チャットメッセージ

## 主要ルート

- `/login`: ログイン
- `/signup`: サインアップ
- `/`: ダッシュボード
- `/session/[id]`: セッションチャット
