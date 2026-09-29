import { BlockInputEvents, Button, Color, Graphics, ImageAsset, Label, Node, Rect, resources, Size, Sprite, SpriteFrame, Texture2D, tween, UITransform, UIOpacity } from 'cc';
import { characterAppearances, recordOwners, PuzzleTheme } from '../data/visualCatalog';
import { FinalDeduction } from '../core/PuzzleTypes';
import { RewardedLevelUnlockFlow } from '../services/RewardedLevelUnlockFlow';
import { RewardedHintFlow } from '../services/RewardedHintFlow';

/** Shared notebook layout, full-bounds buttons and ID-based illustration loading. */
export class PuzzleViewShell {
  protected stage!: Node;
  protected layoutScale = 1;
  protected backdropWidth = 720;
  protected backdropHeight = 1280;
  protected readonly ink = new Color(47, 62, 55);
  protected teal = new Color(40, 96, 84);
  protected readonly paper = new Color(255, 250, 237);
  protected cream = new Color(246, 235, 213);
  protected readonly muted = new Color(116, 119, 102);
  protected readonly line = new Color(225, 211, 185);
  protected readonly gold = new Color(239, 181, 87);
  protected readonly red = new Color(164, 68, 57);
  private atlases = new Map<string, { frames: SpriteFrame[]; texture: Texture2D }>();
  private requested = new Set<string>();
  private regionFrames = new Map<string, { frame: SpriteFrame; texture: Texture2D }>();
  private regionRequests = new Set<string>();
  private disposed = false;
  private deductionCaseId = '';
  private testimonyPage = 0;
  protected theme!: PuzzleTheme;

  constructor(private readonly redraw: () => void) {}

  protected redrawPresentation(): void { this.redraw(); }

  protected begin(root: Node, visible: Size, theme: PuzzleTheme): void {
    this.theme = theme;
    this.teal = new Color(...theme.accent);
    this.cream = new Color(...theme.cream);
    this.layoutScale = Math.max(0.1, Math.min(visible.width / 720, (visible.height - 16) / 1280));
    this.backdropWidth = visible.width / this.layoutScale;
    this.backdropHeight = visible.height / this.layoutScale;
    this.stage = new Node('IllustratedPuzzlePresentation');
    this.stage.layer = root.layer;
    this.stage.addComponent(UITransform).setContentSize(720,1280);
    this.stage.setScale(this.layoutScale,this.layoutScale,1);
    root.addChild(this.stage);
    this.panel('paper-background',360,640,this.backdropWidth,this.backdropHeight,this.cream,0);
    this.panel('spine',20,640,3,1232,this.line,0);
  }

  dispose(): void {
    this.disposed = true;
    this.atlases.forEach(atlas => { atlas.frames.forEach(frame => frame.destroy()); atlas.texture.destroy(); });
    this.atlases.clear();
    this.regionFrames.forEach(region => { region.frame.destroy(); region.texture.destroy(); });
    this.regionFrames.clear();
  }

  private loadAtlas(path: string): void {
    if (this.requested.has(path) || this.disposed) return;
    this.requested.add(path);
    resources.load(path,ImageAsset,(error,asset) => {
      if (this.disposed) return;
      if (error) { console.warn('[PuzzleViewShell] Illustration unavailable:',path,error.message); return; }
      const texture = new Texture2D(); texture.image = asset;
      const w=asset.width, h=asset.height;
      const regions=[new Rect(0,0,w,Math.floor(h*0.48))];
      for(let i=0;i<4;i++) regions.push(new Rect(Math.floor((i/4+0.006)*w),Math.floor(h*0.503),Math.floor(w*0.238),Math.floor(h*0.477)));
      const frames=regions.map(rect => { const frame=new SpriteFrame(); frame.texture=texture; frame.rect=rect; frame.originalSize=new Size(rect.width,rect.height); frame.packable=false; return frame; });
      this.atlases.set(path,{frames,texture});
      this.redraw();
    });
  }

  protected portrait(id: string, x: number,y: number,w: number,h: number): void {
    const appearance=characterAppearances[id];
    if (appearance) this.art(appearance.portrait,x,y,w,h,appearance.atlas);
    else this.recordIcon(id,x,y,w,h);
  }

  protected recordIcon(id: string,x: number,y: number,w: number,h: number): void {
    this.panel('record-icon',x,y,w*0.8,h,this.cream,5,this.line);
    this.panel('record-line',x,y+h*0.2,w*0.5,2,this.muted,0);
    const owner=recordOwners[id];
    if (owner) this.portrait(owner,x,y-h*0.06,w*0.52,h*0.55);
    else { this.panel('record-line',x,y-h*0.15,w*0.5,2,this.muted,0); this.panel('record-line',x,y+h*0.02,w*0.5,2,this.muted,0); }
  }

  feedback(message: string, correct: boolean): void {
    if (!this.stage?.isValid) return;
    const toast = this.panel('feedback', 360, 984, 586, 64, correct ? this.teal : this.red, 14);
    const label = this.label(message, 360, 984, 554, 54, 23, this.paper, true);
    // Feedback must not cover a touch target with an input listener.
    [toast, label].forEach(node => {
      const opacity = node.addComponent(UIOpacity);
      tween(opacity).delay(1.15).to(0.25, { opacity: 0 }).call(() => { if (node.isValid) node.destroy(); }).start();
    });
  }

  protected modal(title: string, body: string, primary: string, callback: () => void, secondary?: string, secondaryCallback?: () => void, success = false): void {
    this.shade('modal');
    this.panel('modal-card', 360, 640, 640, 680, this.paper, 26);
    this.panel('modal-badge', 360, 365, 130, 66, success ? this.gold : this.cream, 24);
    this.label(success ? '已结案' : '调查手册', 360, 365, 126, 42, 24, this.teal, true);
    this.label(title, 360, 446, 570, 58, 32, this.teal, true);
    this.label(body, 360, 622, 554, 256, 26, this.ink, false, 'left');
    this.button('modal-action', 360, 822, 554, 76, primary, callback, 'primary', 25);
    if (secondary && secondaryCallback) this.button('modal-secondary', 360, 916, 554, 62, secondary, secondaryCallback, 'light', 23);
  }

  protected shade(name: string): void {
    this.panel(`${name}-shade`, 360, 640, this.backdropWidth, this.backdropHeight, new Color(26, 47, 41, 210), 0).addComponent(BlockInputEvents);
  }

  protected levelUnlockDialog(flow?: RewardedLevelUnlockFlow): void {
    if (!flow?.target) return;
    const id = flow.requestId;
    if (flow.phase === 'offer') {
      this.modal('解锁新案件', `${flow.target.title}\n\n完整观看一次广告，永久解锁本关。\n通关后，下一关也会开放。`, '看广告解锁', () => flow.watch(id), '暂不解锁', () => flow.cancel(id));
    } else {
      this.modal('广告试玩模拟', '当前尚未接入正式广告。\n点击下方按钮模拟完整观看并领取奖励。\n中途关闭不会解锁关卡。', '模拟观看完成并解锁', () => flow.finish(id, true), '中途关闭', () => flow.finish(id, false));
    }
  }

  protected rewardedHintDialog(flow: RewardedHintFlow): void {
    if (flow.dialog === 'closed') return;
    if (flow.dialog === 'choose') {
      this.shade('rewarded-hint');
      this.panel('rewarded-hint-card', 360, 640, 640, 680, this.paper, 26);
      this.label('获得一次提示', 360, 371, 564, 58, 32, this.teal, true);
      this.label('观看广告或分享给朋友，任选一种领取。\n两种方式共用本次挑战的1次机会。\n提示需要自行阅读、填写和确认。', 360, 498, 554, 144, 25, this.ink, false, 'left');
      this.button('hint-choose-ad', 360, 654, 554, 72, '观看广告，获得提示', () => flow.choose('ad'), 'primary', 25);
      this.button('hint-choose-share', 360, 748, 554, 72, '分享给朋友，获得提示', () => flow.choose('share'), 'light', 25);
      this.label('试玩版本：下一步演示领取流程', 360, 831, 554, 38, 21, this.muted);
      this.button('hint-cancel', 360, 916, 554, 62, '暂不领取', () => flow.close(), 'light', 23);
      return;
    }
    if (flow.dialog === 'ad' || flow.dialog === 'share') {
      const source = flow.dialog, requestId = flow.requestId;
      this.modal(source === 'ad' ? '模拟观看广告' : '模拟分享给朋友',
        '试玩演示\n\n完成模拟流程后，领取本次补充线索。\n取消不消耗机会；广告与分享共用一次。\n\n正式服务接入后，以实际完成结果发放。',
        source === 'ad' ? '模拟观看完成，领取提示' : '模拟分享成功，领取提示',
        () => { if (requestId !== null) flow.receiveReward(requestId, 'granted'); },
        '取消领取', () => flow.close());
      return;
    }
    this.modal(flow.dialog === 'hint' ? flow.caption === '提示已用' ? '提示已归档' : '补充线索' : '提示未领取',
      flow.text, '返回推理', () => flow.close());
  }

  /** Shared evidence page for main cases and archive volumes. */
  protected deductionCard(data: {
    caseId?: string; question: string; evidence: FinalDeduction; options: Array<{ id: string; name: string }>;
    selectedAnswerId: string | null; lives: number; hintCaption?: string;
  }, actions: { choose(id: string): void; submit(): void; close(): void; hint?(): void }): void {
    this.shade('deduction');
    const caseId = data.caseId ?? data.question + data.evidence.premise;
    if (this.deductionCaseId !== caseId) { this.deductionCaseId = caseId; this.testimonyPage = 0; }
    this.panel('deduction-card', 360, 640, 688, 1200, this.paper, 24);
    this.label('结案推理', 189, 92, 244, 48, 32, this.teal, true, 'left');
    if (actions.hint) this.button('deduction-hint', 391, 92, 132, 48, data.hintCaption ?? '获得提示', actions.hint, 'light', 21);
    this.label(`剩余生命 ${'♥'.repeat(data.lives)}`, 573, 92, 218, 42, 23, this.red, true);
    this.label(data.evidence.premise, 360, 186, 596, 126, 24, this.ink, false, 'left');
    this.label(data.question, 360, 287, 596, 64, 28, this.teal, true);
    const compact = data.evidence.testimonies.length > 4;
    const manyAnswers = data.options.length > 6;
    const sixWitnesses = data.evidence.testimonies.length === 6;
    const paged = data.evidence.testimonies.length > 6;
    const pageCount = Math.ceil(data.evidence.testimonies.length / 4);
    this.testimonyPage = paged ? Math.max(0, Math.min(pageCount - 1, this.testimonyPage)) : 0;
    const testimonies = paged ? data.evidence.testimonies.slice(this.testimonyPage * 4, this.testimonyPage * 4 + 4) : data.evidence.testimonies;
    testimonies.forEach((testimony, index) => {
      const y = paged ? 376 + index * 108 : sixWitnesses ? 366 + index * 88 : compact ? 376 + index * 106 : 388 + index * 120;
      this.panel(`testimony-${testimony.speakerId}`, 360, y, 616, sixWitnesses ? 82 : compact ? 100 : 112, this.cream, 12);
      this.portrait(testimony.speakerId, 109, y - (sixWitnesses ? 11 : 15), sixWitnesses ? 46 : 54, sixWitnesses ? 46 : 54);
      this.label(testimony.speakerName, 109, y + (sixWitnesses ? 26 : 32), 96, sixWitnesses ? 24 : 30, sixWitnesses ? 19 : 21, this.teal, true);
      this.label(testimony.text, 422, y, 460, sixWitnesses ? 74 : compact ? 88 : 100, sixWitnesses ? 23 : 24, this.ink, false, 'left');
    });
    if (paged) {
      this.button('testimony-previous', 172, 792, 196, 48, '上一页证词', () => { this.testimonyPage--; this.redraw(); }, 'light', 22, this.testimonyPage === 0);
      this.label(`${this.testimonyPage + 1} / ${pageCount}`, 360, 792, 144, 38, 23, this.teal, true);
      this.button('testimony-next', 548, 792, 196, 48, '下一页证词', () => { this.testimonyPage++; this.redraw(); }, 'light', 22, this.testimonyPage === pageCount - 1);
      this.label('请合并两页证词推理，翻页不会清除已选答案。', 360, manyAnswers ? 834 : 840, 604, manyAnswers ? 24 : 30, 20, this.muted);
    }
    data.options.forEach((answer, index) => {
      const x = index % 2 ? 516 : 204;
      const y = manyAnswers ? 878 + Math.floor(index / 2) * 64 : 892 + Math.floor(index / 2) * 74;
      this.button(`answer-${answer.id}`, x, y, 292, manyAnswers ? 54 : 62, answer.name,
        () => actions.choose(answer.id), data.selectedAnswerId === answer.id ? 'primary' : 'light', 24);
    });
    this.label('先选答案，再提交；提交错误扣 1 条生命。', 360, manyAnswers ? 1114 : 1093, 596, manyAnswers ? 22 : 30, 20, this.muted);
    this.button('deduction-submit', 360, manyAnswers ? 1164 : 1146, 600, manyAnswers ? 62 : 68, '正式提交结论', actions.submit,
      'primary', 27, !data.selectedAnswerId);
    this.button('answer-close', 360, manyAnswers ? 1220 : 1210, 600, manyAnswers ? 40 : 48, '返回调查表', actions.close, 'light', 22);
  }

  protected art(index: number, x: number, y: number, w: number, h: number, path = this.theme.atlas): void {
    const node = this.node(`illustration-${index}`, x, y, w, h);
    this.loadAtlas(path);
    const frame = this.atlases.get(path)?.frames[index];
    if (!frame) return;
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = frame;
  }

  /** Draws an exact crop from a source illustration, so one approved concept sheet can supply distinct screens. */
  protected imageRegion(path: string, region: Rect, x: number, y: number, w: number, h: number): void {
    const node = this.node('concept-art', x, y, w, h);
    const key = `${path}:${region.x},${region.y},${region.width},${region.height}`;
    const cached = this.regionFrames.get(key);
    if (cached) {
      const sprite = node.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.spriteFrame = cached.frame;
      return;
    }
    if (this.regionRequests.has(key) || this.disposed) return;
    this.regionRequests.add(key);
    resources.load(path, ImageAsset, (error, asset) => {
      if (this.disposed) return;
      if (error) {
        console.warn('[PuzzleViewShell] Concept art unavailable:', path, error.message);
        return;
      }
      const texture = new Texture2D();
      texture.image = asset;
      const frame = new SpriteFrame();
      frame.texture = texture;
      frame.rect = new Rect(region.x, region.y, region.width, region.height);
      frame.originalSize = new Size(region.width, region.height);
      frame.packable = false;
      this.regionFrames.set(key, { frame, texture });
      this.redraw();
    });
  }

  protected node(name: string, x: number, y: number, w: number, h: number): Node {
    const node = new Node(name);
    node.layer = this.stage.layer;
    node.setPosition(x - 360, 640 - y, 0);
    node.addComponent(UITransform).setContentSize(w, h);
    this.stage.addChild(node);
    return node;
  }

  protected panel(name: string, x: number, y: number, w: number, h: number, color: Color, radius = 12, border?: Color, stroke = 2): Node {
    const node = this.node(name, x, y, w, h);
    const g = node.addComponent(Graphics);
    g.fillColor = color;
    g.roundRect(-w / 2, -h / 2, w, h, radius);
    g.fill();
    if (border) { g.strokeColor = border; g.lineWidth = stroke; g.stroke(); }
    return node;
  }

  protected label(text: string, x: number, y: number, w: number, h: number, font: number, color: Color, bold = false, align: 'left' | 'center' = 'center'): Node {
    const node = this.node('text', x, y, w, h);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = font;
    label.lineHeight = font * 1.4;
    label.color = color;
    label.isBold = bold;
    label.horizontalAlign = align === 'left' ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    return node;
  }

  protected button(name: string, x: number, y: number, w: number, h: number, caption: string, callback: () => void, style: 'primary' | 'light' = 'light', font = 22, disabled = false): Node {
    const fill = disabled ? new Color(229, 222, 205) : style === 'primary' ? this.teal : this.paper;
    const node = this.panel(name, x, y, w, h, fill, 13, style === 'primary' ? undefined : this.line);
    const text = this.label(caption, x, y, w - 20, h - 8, font, disabled ? this.muted : style === 'primary' ? this.paper : this.ink, true);
    // The label shares the full button bounds but has no touch listener.
    text.setParent(node, true);
    this.clickable(node, callback, disabled);
    return node;
  }

  protected clickable(node: Node, callback: () => void, disabled: boolean): void {
    const button = node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.97;
    button.duration = 0.08;
    button.interactable = !disabled;
    if (!disabled) node.on(Button.EventType.CLICK, callback);
  }
}
