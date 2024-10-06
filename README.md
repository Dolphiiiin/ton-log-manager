# ToN log manager
![readme-image](https://github.com/user-attachments/assets/9c6270d5-1f1b-4203-9ae4-cb4905155b15)

## 概要
ToN log managerは、Terrors of Nowhereでのログを管理および表示するためのツールです。ログのフィルタリング、フォーマット、およびハイライト表示をサポートします。
DolphiiiinがTonをプレイするときに使いたかった個人的なプロジェクトであるため、自己責任で使用してください。
## [ダウンロード](https://github.com/Dolphiiiin/ton-log-manager/releases/download/1.0.0/ToN.Log.Manager-1.0.0.zip)

## 環境依存
このプロジェクトを使用するためには、[ToNSaveManager](https://github.com/ChrisFeline/ToNSaveManager)でWebSocket API Serverが有効である必要があります。
ToNSaveManagerを起動して、設定のWebSocket API Serverを有効にしてください。

## インストール

1. リポジトリをクローンします。
    ```bash
    git clone https://github.com/yourusername/ton-log-manager.git
    ```

2. 必要な依存関係をインストールします。
    ```bash
    cd ton-log-manager
    npm install
    ```

## 使用方法

### 開発環境の起動

1. 開発サーバーを起動します。
    ```bash
    npm start
    ```

2. ブラウザで `http://localhost:3000` にアクセスします。

### ビルド

1. アプリケーションをビルドします。
    ```bash
    npm run build
    ```

2. ビルドされたファイルは `release-builds` ディレクトリに出力されます。

### ログの表示

1. アプリケーションを起動すると、ログがリアルタイムで表示されます。
2. タブを切り替えることで、特定のログタイプ（ROUND, TERRORS, LOCATION）をフィルタリングできます。
3. `3split` タブでは、TERRORS, ROUND_TYPE, LOCATION のログを分割表示します。

### フォーマットされたログの表示

1. 完了したラウンドのログは、ページ下部の「Completed Rounds」セクションに表示されます。
2. 各ラウンドの詳細情報が表示され、特定の条件に基づいてハイライトされます。

## 注意事項

- `package.json` の `build` フィールドに無効なプロパティが含まれている場合、ビルドが失敗することがあります。エラーメッセージを確認し、無効なプロパティを削除してください。
- `ROUND_TYPE` が `Intermission` の場合、ログは記録されません。

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) のもとで公開されています。
