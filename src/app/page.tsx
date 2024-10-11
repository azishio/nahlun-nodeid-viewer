import {App} from "@/app/App";

export default function Home() {
    return (
        <main>
            <div>
                <p>ノードID確認ツール 出典: 国土地理院 https://maps.gsi.go.jp/development/ichiran.html</p>
                <p>IDはズームレベル18におけるピクセル座標のヒルベルト値</p>
            </div>
            <div className="my-container" style={{position: "relative", height: "85vh"}}>
                <App/>
            </div>
        </main>
    );
}
