# 地图石板清理与档案馆书架

日期：2026-09-28

## 实现

- 旧街艺坊移除两个无编号石板：源图中心 (214,99)、(346,132)。
- 海湾灯塔移除四个无编号石板：源图中心 (230,733)、(363,785)、(466,858)、(883,469)。
- 原始地图保留。修图资源只在六个局部矩形中通过 SpriteFrame 显示，确保其余原图像素和100个已校准关卡坐标不变。
- 档案馆入口展示五层书架、十份案件档案。点击案件档案查看五卷目录，封存卷不可进入，已开放卷保持重新开始规则。
- 每日关卡继续使用原来的目录和解锁规则。

## 项目资源

- `assets/resources/art/town/maps/map-district-02-cleanup-v1.png`
- `assets/resources/art/town/maps/map-district-03-cleanup-v1.png`
- `assets/resources/art/town/archive-bookshelf-v1.png`

生成方式：内置 image_gen；未使用 CLI/API 回退。原始输出保留在 Codex generated_images 目录，项目资源已保存至以上位置。

## 图像提示词

### 旧街艺坊

Precise-object-edit for a game map. Edit ONLY TWO tiny blank oval stepping-stone discs in this exact image. Image coordinate reference 941 wide by 1672 high, top-left origin: disc centers (214,99) and (346,132), the two uppermost discs on the top-left terrace by the bench and lamp. Remove those TWO oval discs completely, replacing them with continuous ordinary small rectangular warm paving matching the immediate surrounding terrace. KEEP ALL OTHER TWENTY OVAL DISCS, their exact positions, sizes, and surrounding scenery UNCHANGED. Preserve exact full canvas framing, aspect ratio, buildings, streets, colors, details. No crop, no new UI, no text. It is critical no other stone moves.

### 海湾灯塔

Precise-object-edit. Remove exactly FOUR unused blank oval discs from this map, replacing them seamlessly with matching normal paving. Source is 941x1672, coordinate origin top-left. Remove discs centered at (230,733), (363,785), (466,858): these THREE are on the diagonal middle-left wooden harbor pier in front of the orange-roof waterside building. Also remove ONE disc at (883,469), on the far-right upper path immediately above the stairs. Fill with the original terrace/pier/path paving texture, no oval rim/shadow left. CRITICAL preserve all other TWENTY oval discs exactly in place, with original sizes, and preserve ALL scenery, framing, composition, dimensions/aspect ratio and colors. No redesign, no cropping, no text.

该输出额外改动了部分有效石板，因此没有整张替换地图，只使用要求清除的四个区域。

### 书架背景

Game environment asset, portrait 9:16. Cozy animal-town detective archive library matching warm detailed watercolor storybook town maps, polished mobile game illustration. Straight-on view, absolutely frontal symmetrical composition. A very large EMPTY dark warm walnut cabinet recess occupies x8% to92%, y15% to86%, completely empty flat dark wood backing with gentle wood grain, NO horizontal shelves in this recess, NO books in this recess: shelves and selectable case files will be drawn by game code. Sturdy carved honey-walnut frame at outer edges. At very top a small brass ceiling lamp, warm gentle light, tiny decorative botanical carvings. Narrow outside margins show distant books and ivy, bottom a small strip of wooden floor. Central empty wood backing must be dark and calm, no patterns or clutter, usable as backdrop for five shelves. Storybook mystery, welcoming cozy atmosphere. No people, no animals, no UI, no buttons, NO TEXT, no labels, no lettering or watermark.

## 验证

在 localhost:7456 的 Cocos 手机预览（393×852）中核对地图编号及修补区域，操作地图翻页、进入档案馆、查看封存案件并尝试点击锁定卷、返回书架、进入 A01、开始关卡、返回书架和小镇。未出现运行时错误或警告。验证使用独立浏览器上下文，档案馆解锁仅作为该上下文的测试条件，没有修改用户浏览器存档。
