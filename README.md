# motto — 写真を、ひとつに。

スマホで使えるシンプルな写真コラージュアプリ。HTML・CSS・JavaScriptだけで動きます。

- 写真を最大12枚選択、並べ替え、削除
- 正方形・縦長・横長、おまかせ／グリッド／大きな1枚／縦4×横3（12枚）レイアウト
- 余白・背景色の調整
- PNGとしてダウンロード、対応スマホでは共有メニューから保存
- 写真は端末内で処理。アップロード・アカウント登録不要

## ローカルで起動

```sh
python3 -m http.server 8000
```

http://localhost:8000 を開きます。インストール・ビルドは不要です。

## GitHub Pages

公開URL: https://mizuho-works.github.io/motto-photo-collage/

GitHub Pagesは `main` ブランチのルートから公開します。Settings → Pages → Source は **Deploy from a branch**、ブランチは **main / (root)** です。変更をpushすると自動更新されます。

写真は各枠の中央で切り抜かれます。HEICなどブラウザが扱えない形式はJPEG/PNGに変換してください。端末への保存方法はブラウザによって異なります。フォントのみGoogle Fontsから取得し、オフラインでは端末のフォントを使います。
