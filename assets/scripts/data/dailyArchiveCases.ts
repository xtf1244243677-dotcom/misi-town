import { ArchiveVolumeSpec, buildArchiveVolume } from './archiveCaseBuilder';

const witnesses = [
  { id: 'he', name: '小禾' }, { id: 'chen-officer', name: '陈警员' },
  { id: 'lu-painter', name: '陆画师' }, { id: 'shen-curator', name: '沈馆长' },
];

type DailyStory = Omit<ArchiveVolumeSpec, 'size' | 'records' | 'references'> & {
  records: Array<{ name: string; shortName: string; detail: string }>;
  landmarks: Array<{ label: string; kind: 'window' | 'door' | 'shelf' | 'desk' | 'hallway' | 'steps' | 'hearth' | 'phone' }>;
  blockers: Array<{ label: string; kind: 'window' | 'door' | 'shelf' | 'desk' | 'hallway' | 'steps' | 'hearth' | 'phone' }>;
};

const stories: DailyStory[] = [
  {
    id: 'D01-bakery-night-order-v1', title: '凌晨烘焙房的错单', subtitle: '镇西烘焙房 · 夜班档案',
    intro: '打烊后的烘焙房多出一张改过字迹的订单，第二天的生日蛋糕因此差点送错。十份夜班记录被风吹散在工作间里，先按现场痕迹归位，再查清错单是怎样被识破的。',
    records: [
      { name: '夜班交接页', shortName: '交接页', detail: '边角还粘着交班时用的蓝色面粉印。' },
      { name: '糖霜领用单', shortName: '领用单', detail: '清单上保留了最后一次称量的笔迹。' },
      { name: '烤箱温度纸带', shortName: '温度纸带', detail: '热敏纸的末端仍卷着焦黄的边。' },
      { name: '生日牌底稿', shortName: '牌底稿', detail: '底稿背面有一滴尚未干透的糖浆。' },
      { name: '临时改单副本', shortName: '改单副本', detail: '被擦去的名字在侧光下仍能辨认。' },
      { name: '面粉袋封口签', shortName: '封口签', detail: '封签上的折痕与开袋时间相符。' },
      { name: '配送路线便笺', shortName: '路线便笺', detail: '铅笔圈出了尚未出发的最后一单。' },
      { name: '冷柜取放记录', shortName: '取放记录', detail: '记录里有一次没有签名的开柜。' },
      { name: '收银台找零条', shortName: '找零条', detail: '纸条上的金额与原订单完全一致。' },
      { name: '清晨复核回执', shortName: '复核回执', detail: '回执证明蛋糕出炉前有人发现了差错。' },
    ],
    landmarks: [
      { label: '北窗', kind: 'window' }, { label: '烤炉门', kind: 'door' }, { label: '糖罐架', kind: 'shelf' },
      { label: '揉面台', kind: 'desk' }, { label: '传菜口', kind: 'hallway' }, { label: '储物梯', kind: 'steps' },
      { label: '余烬炉', kind: 'hearth' }, { label: '值班电话', kind: 'phone' }, { label: '冷藏柜', kind: 'shelf' }, { label: '收银桌', kind: 'desk' },
    ],
    blockers: [{ label: '倾倒面粉禁放区', kind: 'hearth' }, { label: '维修中的烤盘架', kind: 'shelf' }],
    question: '最多两处订单标记可能被抄反，复核员需要区分多少种错误状态？',
    premise: '订单有十个二值标记，每项只有“已核对”或“未核对”两种。复核时至多两项可能被抄反；标记位置不同就算不同状态，完全没有抄错也要计入。',
    testimonies: [
      '小禾：完全没有抄错，是一种独立状态。',
      '陈警员：恰好一处抄错时，十个位置各对应一种可能。',
      '陆画师：恰好两处抄错时，交换这两个位置的先后不产生新状态。',
      '沈馆长：复核表必须把零处、一处和两处抄错分别算清。',
    ],
    options: [
      { id: 'answer-46', name: '46 种' }, { id: 'answer-55', name: '55 种' },
      { id: 'answer-56', name: '56 种' }, { id: 'answer-64', name: '64 种' },
    ], answerId: 'answer-56',
    completion: '分别计算零处、恰好一处和恰好两处抄错：C(10,0)+C(10,1)+C(10,2)=1+10+45=56。两处错误按无序位置组合计算，所以答案是56种。',
  },
  {
    id: 'D02-ferry-fog-route-v1', title: '浓雾里的渡口灯号', subtitle: '南岸渡口 · 夜航档案',
    intro: '浓雾中，两盏故障灯让渡船的最短巡航路线少了许多。值班员留下十份路线材料和两处封锁标记；归位后，按证词还原有多少条安全航线。',
    records: [
      { name: '南岸出发草图', shortName: '出发草图', detail: '草图只保留向东和向北的航标箭头。' },
      { name: '第一盏故障灯照片', shortName: '故障灯照', detail: '玻璃罩上有风暴后留下的盐霜。' },
      { name: '水道测深表', shortName: '测深表', detail: '表格确认主水道的深度足以通船。' },
      { name: '渡船最短航程页', shortName: '航程页', detail: '航程没有多绕一段回头水道。' },
      { name: '北汊封航通告', shortName: '封航通告', detail: '通告生效时没有船只停在封锁灯位。' },
      { name: '灯塔值守抄件', shortName: '值守抄件', detail: '抄件记下两处故障灯的先后关系。' },
      { name: '第二盏故障灯照片', shortName: '第二灯照', detail: '照片里的灯架没有被移动过。' },
      { name: '船长口述校对稿', shortName: '口述校对', detail: '船长确认全程只向两个方向前进。' },
      { name: '回港前检查单', shortName: '检查单', detail: '检查单把封锁区之外的水道列为畅通。' },
      { name: '抵岸签收回执', shortName: '签收回执', detail: '回执确认起点与终点之间恰有十八步。' },
    ],
    landmarks: [
      { label: '南岸灯窗', kind: 'window' }, { label: '渡口闸门', kind: 'door' }, { label: '潮汐标架', kind: 'shelf' },
      { label: '测深台', kind: 'desk' }, { label: '北汊栈桥', kind: 'hallway' }, { label: '石阶码头', kind: 'steps' },
      { label: '引航灯炉', kind: 'hearth' }, { label: '值守电话', kind: 'phone' }, { label: '绳缆柜', kind: 'shelf' }, { label: '签收桌', kind: 'desk' },
    ],
    blockers: [{ label: '浅滩禁航标', kind: 'steps' }, { label: '暗礁禁航灯', kind: 'hearth' }],
    question: '从起点到终点，避开两处封锁灯后还剩多少条最短路线？',
    premise: '路线图由十乘十个交点组成。从左下起点到右上终点，路线每步只能向东或向北，共需九步向东、九步向北。两处封锁灯在抽象路线坐标(4,5)和(7,6)，航线不能经过它们。',
    testimonies: [
      '小禾：不设封锁时共有C(18,9)=48,620条最短路线。',
      '陈警员：经过第一盏封锁灯的路线数为C(7,3)×C(11,5)=16,170。',
      '陆画师：经过第二盏封锁灯的路线数也为16,170。',
      '沈馆长：能依次经过两盏灯的路线有C(7,3)×C(4,1)×C(7,3)=4,900，前两项相减时要加回一次。',
    ],
    options: [
      { id: 'answer-9342', name: '9,342 条' }, { id: 'answer-11180', name: '11,180 条' },
      { id: 'answer-12870', name: '12,870 条' }, { id: 'answer-16170', name: '16,170 条' },
    ], answerId: 'answer-11180',
    completion: '用容斥计数：48,620−16,170−16,170+4,900=11,180。两处封锁灯都被经过的路线在两次扣除中被重复减去，因此加回一次。',
  },
  {
    id: 'D03-harvest-banquet-seats-v1', title: '丰收宴上的圆桌座次', subtitle: '谷仓会堂 · 秋收档案',
    intro: '丰收宴散场后，圆桌座位图被打翻的麦穗和酒杯印遮住。十位来客的名牌仍在工作间内，复原材料后，算出符合轮班规约的座次数量。',
    records: [
      { name: '圆桌轮廓稿', shortName: '轮廓稿', detail: '纸边标出十把椅子的等距位置。' },
      { name: '谷仓主人名牌', shortName: '主人名牌', detail: '背面留有宴前确认的签名。' },
      { name: '第一组轮班卡', shortName: '甲乙班卡', detail: '两位值夜搭档的交班时间重叠。' },
      { name: '第二组轮班卡', shortName: '丙丁班卡', detail: '这组搭档也不能在邻座交谈。' },
      { name: '椅背编号拓片', shortName: '编号拓片', detail: '十个编号都能在原椅背找到。' },
      { name: '宴席签到册', shortName: '签到册', detail: '每位来客只签过一次到。' },
      { name: '餐具摆放单', shortName: '摆放单', detail: '桌上没有额外的主宾座。' },
      { name: '旋转规则便笺', shortName: '旋转便笺', detail: '整桌转动不改变谁与谁相邻。' },
      { name: '镜像核对页', shortName: '镜像核对', detail: '左右翻转后的顺序仍算另一种座次。' },
      { name: '散席清点回执', shortName: '清点回执', detail: '回执确认十位来客全部入席。' },
    ],
    landmarks: [
      { label: '北侧气窗', kind: 'window' }, { label: '谷仓侧门', kind: 'door' }, { label: '麦袋架', kind: 'shelf' },
      { label: '长桌案台', kind: 'desk' }, { label: '传菜走廊', kind: 'hallway' }, { label: '舞台石阶', kind: 'steps' },
      { label: '取暖炉', kind: 'hearth' }, { label: '宴会电话', kind: 'phone' }, { label: '餐具柜', kind: 'shelf' }, { label: '签到桌', kind: 'desk' },
    ],
    blockers: [{ label: '塌落酒架禁放区', kind: 'shelf' }, { label: '灭火桶禁放区', kind: 'hearth' }],
    question: '满足三组搭档都不相邻的圆桌座次有多少种？',
    premise: '十位来客围坐一圈，整体旋转算同一种座次，镜像翻转算不同。三组固定搭档各自不能相邻，其他组合不受限制。',
    testimonies: [
      '小禾：先固定一位来客消除旋转，未加限制共有9!种。',
      '陈警员：指定一组搭档相邻时，把两人视作一块，有2×8!种。',
      '陆画师：指定两组同时相邻时，有4×7!种；三组同时相邻时，有8×6!种。',
      '沈馆长：逐组排除后，用容斥把重复排除的情况加回。',
    ],
    options: [
      { id: 'answer-155680', name: '155,680 种' }, { id: 'answer-175680', name: '175,680 种' },
      { id: 'answer-181440', name: '181,440 种' }, { id: 'answer-241920', name: '241,920 种' },
    ], answerId: 'answer-175680',
    completion: '容斥结果为9!−3×(2×8!)+3×(4×7!)−8×6!=175,680。三组搭档均不可相邻，镜像没有合并，所以答案是175,680种。',
  },
  {
    id: 'D04-opera-roof-trusses-v1', title: '戏院穹顶的支撑梁', subtitle: '老戏院 · 修缮档案',
    intro: '老戏院修缮时，工匠发现穹顶支撑草图被雨水泡散。十张测绘记录和封存的梁材样本仍可辨认；归位后，计算这座穹顶可能的无交叉搭建方案。',
    records: [
      { name: '穹顶边界描图', shortName: '边界描图', detail: '描图确认边界是一条凸弧线。' },
      { name: '梁材编号簿', shortName: '编号簿', detail: '编号从第一根梁连续登记。' },
      { name: '北端顶点模板', shortName: '北端模板', detail: '模板边缘没有被裁切或移动。' },
      { name: '东弧夹角测量', shortName: '夹角测量', detail: '测量纸上保留着工匠的校准线。' },
      { name: '南弧接缝照片', shortName: '接缝照片', detail: '照片中所有支撑都落在固定顶点。' },
      { name: '中央连接规约', shortName: '连接规约', detail: '梁材只允许连接边界顶点。' },
      { name: '木梁加工单', shortName: '加工单', detail: '每根梁都是一条笔直的木料。' },
      { name: '西弧复测拓片', shortName: '复测拓片', detail: '复测结果与原图比例完全相同。' },
      { name: '交叉检查清单', shortName: '检查清单', detail: '施工规约不允许两根梁在内部相交。' },
      { name: '完工验收页', shortName: '验收页', detail: '每种不同的内部梁组合都单独登记。' },
    ],
    landmarks: [
      { label: '北端高窗', kind: 'window' }, { label: '侧台门', kind: 'door' }, { label: '道具柜', kind: 'shelf' },
      { label: '绘图案台', kind: 'desk' }, { label: '观众廊道', kind: 'hallway' }, { label: '舞台石阶', kind: 'steps' },
      { label: '暖炉', kind: 'hearth' }, { label: '报幕电话', kind: 'phone' }, { label: '梁材架', kind: 'shelf' }, { label: '验收桌', kind: 'desk' },
    ],
    blockers: [{ label: '漏雨塌陷禁放区', kind: 'window' }, { label: '断裂梁禁放区', kind: 'shelf' }],
    question: '十一边形穹顶能用不交叉支撑梁三角剖分成多少种？',
    premise: '俯视图是一个严格凸的十一边形。用内部互不交叉的直梁把它全部切成三角形，边界顶点固定；只要内部梁集合不同，就算不同方案。',
    testimonies: [
      '小禾：固定一条边，它必属于某个三角形。',
      '陈警员：选择该三角形的第三个顶点后，剩下两侧各自独立剖分。',
      '陆画师：剖分数量遵循卡特兰递推，十一边形对应第九个卡特兰数。',
      '沈馆长：第九个卡特兰数可写为C(18,9)÷10。',
    ],
    options: [
      { id: 'answer-1430', name: '1,430 种' }, { id: 'answer-3003', name: '3,003 种' },
      { id: 'answer-4862', name: '4,862 种' }, { id: 'answer-16796', name: '16,796 种' },
    ], answerId: 'answer-4862',
    completion: '凸十一边形的三角剖分数为第九个卡特兰数：C(18,9)÷10=48,620÷10=4,862。',
  },
  {
    id: 'D05-herbal-shop-label-draw-v1', title: '药铺抽屉里的同色签', subtitle: '百草药铺 · 盘点档案',
    intro: '药铺盘点时，十种草本茶的抽屉标签混在一起，店主想确认盲取时至少要抽几张，才能保证有三张同色签。十份盘点材料记录了标签和封存规矩。',
    records: [
      { name: '草本茶总目录', shortName: '总目录', detail: '目录列全了十种不同的茶签。' },
      { name: '抽屉封签图', shortName: '封签图', detail: '封签显示盘点前无人调换抽屉。' },
      { name: '前柜盘点页', shortName: '前柜盘点', detail: '前柜与后柜使用同一套十种颜色。' },
      { name: '盲取测试记录', shortName: '测试记录', detail: '测试过程不查看签的颜色。' },
      { name: '茶罐补货单', shortName: '补货单', detail: '补货没有增加新的标签种类。' },
      { name: '标签印制样张', shortName: '印制样张', detail: '每张标签只对应一种草本茶。' },
      { name: '盘点员口述稿', shortName: '口述稿', detail: '抽取后不会把标签放回抽屉。' },
      { name: '重复签核对表', shortName: '核对表', detail: '目标是至少三张同色，而非恰好三张。' },
      { name: '货架清洁记录', shortName: '清洁记录', detail: '盘点时十个抽屉都在使用。' },
      { name: '店主复查回执', shortName: '复查回执', detail: '抽取顺序不影响保证结论。' },
    ],
    landmarks: [
      { label: '北窗药柜', kind: 'window' }, { label: '后堂门', kind: 'door' }, { label: '干草架', kind: 'shelf' },
      { label: '称量台', kind: 'desk' }, { label: '抓药廊道', kind: 'hallway' }, { label: '地窖石阶', kind: 'steps' },
      { label: '煎茶炉', kind: 'hearth' }, { label: '值守电话', kind: 'phone' }, { label: '封签柜', kind: 'shelf' }, { label: '盘点桌', kind: 'desk' },
    ],
    blockers: [{ label: '熏蒸区禁放标', kind: 'hearth' }, { label: '翻修药柜禁放标', kind: 'shelf' }],
    question: '至少盲取多少张标签，才能保证有三张来自同一种草本茶？',
    premise: '共有十种颜色，每种颜色至少有三张标签。盲取时抽出后不放回；要保证至少三张同色，不要求事先知道各颜色分布。',
    testimonies: [
      '小禾：最不利的情形是每种颜色先各抽两张。',
      '陈警员：十种颜色各两张，一共二十张，仍没有三张相同。',
      '陆画师：再抽一张，不论颜色是什么，都会使其中一种达到三张。',
      '沈馆长：这是保证所需的最少张数；二十张还不能保证。',
    ],
    options: [
      { id: 'answer-20', name: '20 张' }, { id: 'answer-21', name: '21 张' },
      { id: 'answer-30', name: '30 张' }, { id: 'answer-31', name: '31 张' },
    ], answerId: 'answer-21',
    completion: '最坏情况下先抽到十种标签各两张，共20张，仍没有三张同色。第21张必然让某一种达到三张，因此最少需要21张。',
  },
  {
    id: 'D06-repair-shop-heavy-battery-v1', title: '修理站的失重电池', subtitle: '钟表修理站 · 校准档案',
    intro: '十枚外形相同的电池里有一枚偏重，旧天平没有刻度，只能比较左右两盘。修理师留下了操作规程和三次测试的草稿；先归位，再判断最少需要几次称量。',
    records: [
      { name: '电池外观对照页', shortName: '外观对照', detail: '十枚电池外壳都没有编号。' },
      { name: '天平校准记录', shortName: '校准记录', detail: '天平只能显示左重、右重或平衡。' },
      { name: '第一次分组草图', shortName: '分组草图', detail: '每次比较都可以重新安排电池。' },
      { name: '备用砝码封条', shortName: '砝码封条', detail: '测试期间没有使用外部砝码。' },
      { name: '偏重样本记录', shortName: '样本记录', detail: '唯一异常电池一定比其余九枚重。' },
      { name: '第二轮称量单', shortName: '称量单', detail: '平衡结果也能排除已称过的组。' },
      { name: '修理师口述稿', shortName: '口述稿', detail: '测试次数按启动天平的次数计算。' },
      { name: '第三轮候选表', shortName: '候选表', detail: '每次称量都产生三种可能结果。' },
      { name: '电池回收清单', shortName: '回收清单', detail: '称量结束后所有电池都已归还。' },
      { name: '最后校验签字', shortName: '校验签字', detail: '目标是保证识别，不要求每次都用满次数。' },
    ],
    landmarks: [
      { label: '北窗', kind: 'window' }, { label: '修理门', kind: 'door' }, { label: '齿轮架', kind: 'shelf' },
      { label: '精密工作台', kind: 'desk' }, { label: '送修廊道', kind: 'hallway' }, { label: '地窖阶梯', kind: 'steps' },
      { label: '焊接炉', kind: 'hearth' }, { label: '报修电话', kind: 'phone' }, { label: '零件柜', kind: 'shelf' }, { label: '签收桌', kind: 'desk' },
    ],
    blockers: [{ label: '高温焊台禁放区', kind: 'hearth' }, { label: '漏电检修禁放区', kind: 'phone' }],
    question: '保证找出偏重电池，最少需要称量几次？',
    premise: '十枚电池中恰有一枚偏重。天平每次只能比较两组，结果只有左重、右重、平衡三种；可以把电池分组，且不需要砝码。',
    testimonies: [
      '小禾：两次称量最多区分3²=9种结果序列，不足以覆盖十枚候选。',
      '陈警员：三次称量最多区分3³=27种结果序列。',
      '陆画师：先称三枚对三枚；若平衡，异常在剩余四枚，否则在较重的三枚。',
      '沈馆长：在三枚候选时，一次称一枚对一枚即可判断；四枚候选还能再拆分一次后判定。',
    ],
    options: [
      { id: 'answer-2', name: '2 次' }, { id: 'answer-3', name: '3 次' },
      { id: 'answer-4', name: '4 次' }, { id: 'answer-5', name: '5 次' },
    ], answerId: 'answer-3',
    completion: '两次只有9种结果序列，不能区分10枚电池；三次可覆盖27种结果序列，而且按3对3称量后，三枚候选一次可分辨，四枚候选可在两次内分辨。因此保证最少为3次。',
  },
  {
    id: 'D07-radio-tower-relay-v1', title: '广播塔的两处断线', subtitle: '东坡广播塔 · 抢修档案',
    intro: '山风吹断了沿线十个接线站之间的两处线路。抢修队必须挑出两个互不相邻的站点，分别派人检修；十份记录和两处停电标记还原后，算清派工组合数。',
    records: [
      { name: '十站线路总图', shortName: '线路总图', detail: '线路按固定顺序串成一条直线。' },
      { name: '北坡站接线卡', shortName: '北坡接线', detail: '接线卡列出每个站的相邻关系。' },
      { name: '南坡断线照片', shortName: '断线照片', detail: '照片确认共有十个候选站点。' },
      { name: '巡线员交接表', shortName: '交接表', detail: '每名抢修员只负责一个站。' },
      { name: '第一处电缆伤痕', shortName: '伤痕记录', detail: '受损处之间至少隔着一段完整线路。' },
      { name: '备用接头清单', shortName: '接头清单', detail: '两个站可以同时派工但不能相邻。' },
      { name: '第二处断线复核', shortName: '断线复核', detail: '两处断线发生在不同接线站。' },
      { name: '抢修车出发单', shortName: '出发单', detail: '选择两个站时不区分先后顺序。' },
      { name: '完工回传抄件', shortName: '回传抄件', detail: '其余站点当晚均保持正常供电。' },
      { name: '台长签收回执', shortName: '签收回执', detail: '两名抢修员分别从塔的两侧出发。' },
    ],
    landmarks: [
      { label: '北坡窗', kind: 'window' }, { label: '塔门', kind: 'door' }, { label: '电缆架', kind: 'shelf' },
      { label: '接线台', kind: 'desk' }, { label: '检修廊道', kind: 'hallway' }, { label: '铁梯', kind: 'steps' },
      { label: '备用炉', kind: 'hearth' }, { label: '台站电话', kind: 'phone' }, { label: '工具柜', kind: 'shelf' }, { label: '签收桌', kind: 'desk' },
    ],
    blockers: [{ label: '雷击禁入区', kind: 'hearth' }, { label: '塌落电缆架禁放区', kind: 'shelf' }],
    question: '从十个站点中选两处互不相邻的检修站，有多少种选法？',
    premise: '十个接线站沿一条直线排列，选出两个不同站点；相邻站点不能同时检修。两名抢修员没有身份区别，因此交换分工不算新组合。',
    testimonies: [
      '小禾：不加限制时共有C(10,2)=45种站点组合。',
      '陈警员：直线上有9对相邻站点，每一对都必须排除。',
      '陆画师：每种被排除的相邻组合只出现一次。',
      '沈馆长：选择的两个站点无序，不能把同一对按出发先后重复计数。',
    ],
    options: [
      { id: 'answer-35', name: '35 种' }, { id: 'answer-36', name: '36 种' },
      { id: 'answer-45', name: '45 种' }, { id: 'answer-54', name: '54 种' },
    ], answerId: 'answer-36',
    completion: '所有两站组合有C(10,2)=45种；九对相邻站点均不合规，扣除9种，剩36种。',
  },
  {
    id: 'D08-river-warning-lamps-v1', title: '河堤上的十盏警示灯', subtitle: '北岸堤坝 · 巡检档案',
    intro: '暴雨后的河堤上，十盏警示灯需要重新配成夜间方案。每盏灯只有亮或灭两种状态，值守员留下的材料说明至少六盏必须亮起；先归位，再计算可行方案数。',
    records: [
      { name: '堤坝灯位总览', shortName: '灯位总览', detail: '图上标出了十盏可以独立控制的灯。' },
      { name: '第一段电路测试', shortName: '电路测试', detail: '每盏灯都能单独切换。' },
      { name: '备用电池领用页', shortName: '电池领用', detail: '备用电池足够，不限制亮灯数量。' },
      { name: '雨夜能见度记录', shortName: '能见度记录', detail: '至少六盏灯必须保持亮起。' },
      { name: '第二段电路复核', shortName: '电路复核', detail: '各灯之间没有联动开关。' },
      { name: '河道警戒说明', shortName: '警戒说明', detail: '灯亮的位置不同就算不同方案。' },
      { name: '值守员交班单', shortName: '交班单', detail: '无需考虑灯具损坏或闪烁状态。' },
      { name: '堤顶巡查照片', shortName: '巡查照片', detail: '照片显示灯与灯之间没有遮挡。' },
      { name: '开关箱编号册', shortName: '编号册', detail: '十个开关分别对应十盏灯。' },
      { name: '防汛指挥回执', shortName: '指挥回执', detail: '方案只按亮灯集合区分。' },
    ],
    landmarks: [
      { label: '堤顶观察窗', kind: 'window' }, { label: '防汛闸门', kind: 'door' }, { label: '电池架', kind: 'shelf' },
      { label: '控制台', kind: 'desk' }, { label: '巡堤通道', kind: 'hallway' }, { label: '泄洪阶梯', kind: 'steps' },
      { label: '备用发电炉', kind: 'hearth' }, { label: '报警电话', kind: 'phone' }, { label: '开关柜', kind: 'shelf' }, { label: '指挥桌', kind: 'desk' },
    ],
    blockers: [{ label: '积水触电禁区', kind: 'hearth' }, { label: '坍塌堤段禁区', kind: 'steps' }],
    question: '十盏灯中至少六盏亮起，一共有多少种不同状态？',
    premise: '十盏灯彼此独立，每盏只有亮或灭两种状态。方案中亮灯数量不少于六；只要亮灭集合不同就算不同状态。',
    testimonies: [
      '小禾：恰好六盏亮有C(10,6)=210种。',
      '陈警员：恰好七、八、九、十盏亮分别有120、45、10、1种。',
      '陆画师：不同亮灯集合互不重叠，应把这些数量相加。',
      '沈馆长：全亮的状态也在“至少六盏”之内。',
    ],
    options: [
      { id: 'answer-256', name: '256 种' }, { id: 'answer-386', name: '386 种' },
      { id: 'answer-512', name: '512 种' }, { id: 'answer-638', name: '638 种' },
    ], answerId: 'answer-386',
    completion: '按亮灯数分别计数：C(10,6)+C(10,7)+C(10,8)+C(10,9)+C(10,10)=210+120+45+10+1=386种。',
  },
  {
    id: 'D09-trail-rescue-markers-v1', title: '林间救援标记的间隔', subtitle: '杉木步道 · 搜救档案',
    intro: '大雨冲坏了林间步道，搜救队要在十个路标位置中放四个救援标记，任何两个标记都不能相邻。十份现场记录被带回档案室；归位后计算所有布点方案。',
    records: [
      { name: '十处路标线路图', shortName: '线路图', detail: '路标沿单一路径依次排列。' },
      { name: '北口搜救草图', shortName: '搜救草图', detail: '入口和终点之间没有支路。' },
      { name: '第一枚反光片', shortName: '反光片', detail: '标记占据一个路标位置。' },
      { name: '背包补给签', shortName: '补给签', detail: '四个标记都能独立固定。' },
      { name: '第二枚反光片', shortName: '第二反光片', detail: '任何两个标记之间至少空出一个路标。' },
      { name: '林道泥痕拓印', shortName: '泥痕拓印', detail: '步道位置顺序没有被改变。' },
      { name: '搜救员交接单', shortName: '交接单', detail: '标记之间没有方向或颜色差别。' },
      { name: '树根塌方照片', shortName: '塌方照片', detail: '未封闭路段都可作为候选位置。' },
      { name: '终点信号旗记录', shortName: '信号旗记录', detail: '同一组标记不按摆放先后重复计算。' },
      { name: '队长点收回执', shortName: '点收回执', detail: '最终恰好使用四枚标记。' },
    ],
    landmarks: [
      { label: '林场气窗', kind: 'window' }, { label: '北口木门', kind: 'door' }, { label: '标记架', kind: 'shelf' },
      { label: '地图案台', kind: 'desk' }, { label: '林间廊道', kind: 'hallway' }, { label: '溪边石阶', kind: 'steps' },
      { label: '营地炉', kind: 'hearth' }, { label: '搜救电话', kind: 'phone' }, { label: '急救柜', kind: 'shelf' }, { label: '队部桌', kind: 'desk' },
    ],
    blockers: [{ label: '塌方封锁区', kind: 'steps' }, { label: '落枝封锁区', kind: 'hearth' }],
    question: '从十个依次排列的路标中选四处，任意两处不相邻，有多少种方案？',
    premise: '十个路标沿一条直线排列，要恰好选择四个位置放救援标记；任意两个被选位置之间至少留一个未选路标。标记相同，不考虑摆放顺序。',
    testimonies: [
      '小禾：把四个被选位置之间各预留一个空位后，相当于从七个可用位置中选四个。',
      '陈警员：七个位置里选四个，组合数是C(7,4)。',
      '陆画师：方案由位置集合决定，调换标记放置顺序不产生新方案。',
      '沈馆长：首尾两端无需额外预留空位，内部间隔才受限制。',
    ],
    options: [
      { id: 'answer-28', name: '28 种' }, { id: 'answer-35', name: '35 种' },
      { id: 'answer-56', name: '56 种' }, { id: 'answer-70', name: '70 种' },
    ], answerId: 'answer-35',
    completion: '四个位置之间至少留三个空位。先固定这些必要空位，等价于从10−4+1=7个位置中选4个，C(7,4)=35种。',
  },
  {
    id: 'D10-theater-password-errors-v1', title: '放映室的十位口令', subtitle: '露天影院 · 终场档案',
    intro: '露天影院放映室的十位口令在暴雨中被抄下，录音带最多有三处杂音会把开关状态听反。十份材料说明了校对规则；复原后，计算技术员必须核对多少种可能。',
    records: [
      { name: '原始口令录音带', shortName: '原始录音', detail: '原始口令由十个开关状态组成。' },
      { name: '放映机开关表', shortName: '开关表', detail: '每一位只有开或关两种状态。' },
      { name: '第一份听写稿', shortName: '听写稿', detail: '听写稿没有保留错误发生顺序。' },
      { name: '杂音波形截图', shortName: '波形截图', detail: '杂音最多影响三处不同位置。' },
      { name: '校验灯提示单', shortName: '提示单', detail: '同一组错误位置只算一种情况。' },
      { name: '放映员复听记录', shortName: '复听记录', detail: '完全无误的录音也要计入。' },
      { name: '第二份听写稿', shortName: '第二听写', detail: '校正时按发生错误的位置区分。' },
      { name: '备用磁带标签', shortName: '备用标签', detail: '磁带速度没有改变十位长度。' },
      { name: '值班员核对表', shortName: '核对表', detail: '错误位置不同就必须分别核验。' },
      { name: '终场播放回执', shortName: '播放回执', detail: '校正台要覆盖零处至三处误听。' },
    ],
    landmarks: [
      { label: '放映窗', kind: 'window' }, { label: '机房隔音门', kind: 'door' }, { label: '胶片架', kind: 'shelf' },
      { label: '剪辑台', kind: 'desk' }, { label: '观众廊道', kind: 'hallway' }, { label: '放映室石阶', kind: 'steps' },
      { label: '灯泡炉', kind: 'hearth' }, { label: '播音电话', kind: 'phone' }, { label: '磁带柜', kind: 'shelf' }, { label: '校验桌', kind: 'desk' },
    ],
    blockers: [{ label: '积水电箱禁放区', kind: 'hearth' }, { label: '破损胶片架禁放区', kind: 'shelf' }],
    question: '十位口令最多有三处被听反，需要区分多少种错误状态？',
    premise: '口令由十个二值位组成。录音最多三处可能被听反，错误状态按错误位的位置集合区分；完全正确也算一种状态。',
    testimonies: [
      '小禾：零处错误有C(10,0)=1种。',
      '陈警员：一处、两处、三处错误分别有C(10,1)、C(10,2)、C(10,3)种。',
      '陆画师：三项分别是10、45、120种，错误位的先后顺序不另计。',
      '沈馆长：四种错误数量互斥，必须把数量相加。',
    ],
    options: [
      { id: 'answer-166', name: '166 种' }, { id: 'answer-176', name: '176 种' },
      { id: 'answer-256', name: '256 种' }, { id: 'answer-386', name: '386 种' },
    ], answerId: 'answer-176',
    completion: '状态数为C(10,0)+C(10,1)+C(10,2)+C(10,3)=1+10+45+120=176种。',
  },
];

const baseColumns = [5, 10, 4, 9, 3, 8, 2, 7, 1, 6];
function createMap(story: DailyStory, levelIndex: number): ArchiveVolumeSpec {
  const prefix = story.id.slice(0, 3);
  const placements = story.records.map((_, rowIndex) => ({
    row: rowIndex + 1,
    column: ((baseColumns[rowIndex] - 1 + levelIndex * 3) % 10) + 1,
  }));
  const occupied = new Set(placements.map(({ row, column }) => `${row},${column}`));
  const references: ArchiveVolumeSpec['references'] = [];
  story.records.forEach((record, index) => {
    const placement = placements[index];
    const columnOffset = placement.column === 1 ? 1 : placement.column === 10 ? -1 : ((levelIndex + index) % 2 === 0 ? 1 : -1);
    const referenceColumn = placement.column + columnOffset;
    const reference = story.landmarks[index];
    references.push({ row: placement.row, column: referenceColumn, label: reference.label, kind: reference.kind });
    occupied.add(`${placement.row},${referenceColumn}`);
  });
  const blockerKinds = story.blockers;
  let scan = (levelIndex * 17) % 100;
  blockerKinds.forEach(blocker => {
    while (scan < 100) {
      const row = Math.floor(scan / 10) + 1;
      const column = scan % 10 + 1;
      scan += 1;
      const key = `${row},${column}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      references.push({ row, column, label: blocker.label, kind: blocker.kind, blocksPlacement: true });
      return;
    }
    throw new Error(`No free blocker cell for ${story.id}`);
  });

  return {
    id: story.id, title: story.title, subtitle: story.subtitle, intro: story.intro, size: 10,
    records: story.records.map((record, index) => {
      const placement = placements[index];
      const reference = story.landmarks[index];
      const columnOffset = placement.column === 1 ? 1 : placement.column === 10 ? -1 : ((levelIndex + index) % 2 === 0 ? 1 : -1);
      const direction = columnOffset === 1 ? '西' : '东';
      return {
        id: `${prefix}-record-${String(index + 1).padStart(2, '0')}`,
        name: record.name, shortName: record.shortName, row: placement.row, column: placement.column,
        clues: [`${record.name}的现场拓印贴在${reference.label}${direction}侧，${record.detail}`],
      };
    }),
    references, question: story.question, premise: story.premise, testimonies: story.testimonies,
    options: story.options, answerId: story.answerId, completion: story.completion,
  };
}

export const dailyArchiveCases = stories.map((story, index) =>
  buildArchiveVolume(createMap(story, index), '每日档案挑战', witnesses));

export const dailyArchiveCaseIds = dailyArchiveCases.map((_, index) => `D${String(index + 1).padStart(2, '0')}`);
