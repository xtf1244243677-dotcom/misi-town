# 档案馆竖立卷宗书架 v2

采用两排、每排五本竖立精装卷宗，替代五层平铺档案卡。书脊以不同皮革色、金色压花和凸起装订带表现质感。案件名称由游戏动态竖排，超过七字分为从右至左的两列。当前案件有红色书签；每本书脊下方显示在查、可阅或封存。整本书脊均可点击。

## 保存位置

- 工作区素材：`E:/gpt/谜思数独/.codex-transfer/brand-rename/assets/resources/art/town/archive-bookshelf-v2.png`
- Cocos 使用素材：`C:/Users/Administrator/Documents/Codex/2026-09-24/murdoku-logic-grid-puzzle-taptap-cocos/assets/resources/art/town/archive-bookshelf-v2.png`
- 界面：`assets/scripts/ui/ArchivePuzzleView.ts`

使用内置 image_gen 编辑 v1 木柜背景；未使用 CLI 回退。书脊位置按输出原图的实际边界校准。

## 生成提示词

Edit this cozy carved walnut archive cabinet into a premium illustrated game case-selection bookshelf. Retain cabinet, framing, lamp, room and 941x1672 portrait composition. Replace the empty recess with TWO substantial wooden shelves of VERTICAL UPRIGHT leather-bound archival volumes, spines facing viewer. Exactly FIVE large selectable volumes in each row, TEN total, all standing naturally on their bottom edges. Upper five occupy source x190..755, y350..850 with shelf at y860. Lower five occupy x190..755,y920..1380 with shelf at1390. Approximate spine centers x235,350,465,580,695. Books vary slightly in height and thickness, all spines nearly frontal with subtle dimensional curve and visible cover thickness, NOT flat folders, NOT horizontal cards. Rich forest green, oxblood, navy, cognac, muted plum leather, intricate embossed border tooling, restrained gold foil flourishes at top/bottom, raised spine bands, antique brass cornerwork, tactile leather grain, cream page edges peeking at top. Each spine center has a calm uninterrupted dark leather vertical area for later Chinese titles drawn by code, NO cream paper title rectangle. Keep all center title areas empty. Slightly offset volumes feel personally collected and expensive, consistent warm painterly storybook style. Soft occlusion shadows below and between books, aged oak shelf edges with carved moldings, a few thin worn companion books tucked at outer edges ONLY if room, tiny brass library details. No characters. NO TEXT, NO numbers, NO letters, NO symbols resembling words. Do not add UI. This must feel like a real charming archive library, not a grid of cards.

## 预览核验

在独立浏览器上下文的 Cocos 393×852 手机预览中，逐一点击十本书脊，读取对应目录第一卷，分别确认 A01、A06、A11、A16、A21、A26、A31、A36、A41、A46。十项均通过。另核对进入 A01 和从关卡返回书架，无运行时错误或警告；未改动用户存档。
