# #コンパス履歴書ジェネレーター V2

`https://cpsresume.aosankaku.net/` で公開することを前提とした、#コンパス向け履歴書画像ジェネレーターです。

## ローカル開発

このプロジェクトではBun 1.3.14以降を使用します。

```bash
bun install --frozen-lockfile
bun run dev
```

開発サーバーは `http://localhost:35173/` で起動します。

## キャラクターの追加

キャラクター一覧は `src/data/heroes.yaml` で管理しています。新しいキャラクターは `heroes` の末尾へ次の3項目を追記してください。

```yaml
- role: attacker
  fullName: 正式な表示名
  name: 短縮名
```

`role` は `attacker`、`gunner`、`tank`、`sprinter` のいずれかです。正式名の重複や必須項目の不足は、開発サーバーまたはビルドの開始時にエラーとして検出されます。

## よくある質問の追加

ページ下部のQ&Aは `src/data/faqs.yaml` で管理しています。`faqs` の末尾へ質問と回答を追記してください。

```yaml
- question: 質問文
  answer: >-
    回答文
```

質問の重複や必須項目の不足は、開発サーバーまたはビルドの開始時にエラーとして検出されます。

## 本番ビルド

```bash
bun run lint
bun run typecheck
bun run build
```

公開対象は `dist/` ディレクトリです。サブドメイン直下の `/` へ配置し、HTTPSを有効にしてください。

本番URLは次のファイルで明示しています。

- `src/config/site.ts`: アプリ内共有URL
- `index.html`: canonical、OGP、構造化データ
- `public/robots.txt` / `public/sitemap.xml`: クローラー向けURL

## サードパーティ素材

生成画像内の絵文字には [Twemoji](https://github.com/jdecked/twemoji) を使用しています。Twemojiのグラフィックは [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) の下で提供されています。グラフィック自体への変更は行わず、SVGをCanvasへ描画しています。
