# Paper Reader：把论文变成真正能读懂的学习包

> 为一篇论文生成零基础导师讲解、左详解右英文原文的双栏阅读页、忠实中文译文，以及可长期保存的摘要笔记。

<p align="center">
  <a href="README.md">English</a> · <a href="#真实效果">查看真实效果</a> · <a href="#快速开始">快速开始</a> · <a href="SKILL.md">Skill 完整规范</a>
</p>

<p align="center">
  <a href="https://github.com/Starry-Curry/Paper-reader/stargazers"><img src="https://img.shields.io/github/stars/Starry-Curry/Paper-reader?style=for-the-badge&label=Star%20the%20project" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-176b67?style=for-the-badge" alt="MIT License"></a>
  <a href="SKILL.md"><img src="https://img.shields.io/badge/default-4%20reading%20artifacts-c98522?style=for-the-badge" alt="Four default outputs"></a>
</p>

翻译一篇论文，不等于读懂一篇论文。**Paper Reader** 是一个专注于单篇论文精读的 `paper-to-course` Skill：它帮助刚进入一个领域的读者沿着清晰主线理解论文的动机、算法、公式、实验和边界，而不是把原文换一种语言再抛回来。

## 为什么值得一试

- **先建立主线，再进入细节。** 讲解不照抄论文目录，而按“为什么需要 → 最小直觉 → 正式定义 → 公式怎样算 → 算法怎样跑 → 实验是否支持”组织。
- **公式是被教会的，不是被摆出来的。** 公式被分成锚点、桥接和记账三类。每个锚点公式都要解释它解决的问题、先修概念、符号、最小手算例子、不跳步推导、训练/采样位置和常见误解。
- **真正的双栏精读，而非逐句堆叠翻译。** `guided-reader.html` 左栏是面向小白的中文导师详解，右栏是语义对齐的英文原文；每一组都保留章节、页码、图表或公式编号等来源定位。
- **四份能独立使用的产物。** 你可以用讲解建立理解、用双栏页核对原话、连续通读中文译文，或在几个月后用 Markdown 笔记快速回忆。
- **质量检查是流程的一部分。** 构建器会验证译文、笔记和双栏页。若缺少左右对应栏、右栏不是英文原文、存在占位符、链接断开或移动端无法折叠，验证会失败。

## 真实效果

下列图片来自当前 Skill 为论文 *Flow Matching for Generative Modeling* 生成的真实阅读包，并非设计稿。

### 1. 先用一句主线和问题拆解带你进入论文

![Flow Matching 导师式讲解首页，展示问题优先的阅读主线](docs/screenshots/tutorial-overview.png)

### 2. 左侧导师详解，右侧对齐英文原文

![双栏导师阅读器：左侧中文详解，右侧英文原文](docs/screenshots/guided-reader.png)

### 3. 保留论文结构的连续中文阅读版

![中文译文页，保留论文标题、元信息、目录和正文结构](docs/screenshots/translation-reader.png)

同一份示例中还包含公式依赖图，以及对 FM、CFM/Theorem 2、高斯路径、OT-CFM 和 ODE 采样的逐步公式讲解。详见 [SKILL.md](SKILL.md)。

## 每篇论文默认得到什么

| 产物 | 用途 |
| --- | --- |
| `index.html` | 可视化导师式讲解：问题、机制、公式、训练、推理、实验证据和局限都沿一条主线展开。 |
| `guided-reader.html` | 项目特色双栏页：左侧中文导师精讲，右侧语义对齐的英文论文原文。 |
| `translated-paper.html` | 忠实中文阅读版：保留原论文的章节顺序、公式、图表、caption、引用和附录层级。 |
| `paper-notes.md` | 紧凑且独立的阅读笔记：问题、贡献、必要实现、核心证据、局限与可选启发。 |
| `assets/figures/` | 三类页面共用的本地图表、必要裁剪图与明确标注的教学图。 |

## 公式精讲的标准

对于方法型论文，Skill 会先画出公式依赖链，再对每个**锚点公式**执行如下讲解协议：

```text
它解决什么问题？
→ 读懂前需要补什么概念？
→ 原公式怎样念出来？
→ 每个符号、输入和输出分别是什么？
→ 能不能手算一个最小例子？
→ 推导怎样不跳步地走完？
→ 它在训练或推理的哪一步起作用？
→ 初学者最可能误解什么？
```

因此，即使你还不熟悉“取期望”“给定条件”或“解 ODE”，页面也会先补足理解所需的积木，再进入正文。

## 快速开始

### 1. 安装 Skill

克隆本仓库，或通过你的 Skill 管理器从 GitHub URL 安装。对于 Codex，可把仓库根目录放入 skills 目录（或使用 Codex 的 GitHub Skill 安装器）；对于兼容 Claude 的环境，仓库也保留了 `.claude-plugin/` 元数据。

```bash
git clone https://github.com/Starry-Curry/Paper-reader.git paper-to-course
```

### 2. 交给它一篇论文

支持本地 PDF、arXiv/DOI/网页链接、LaTeX 源码或可核验的论文正文。然后这样请求即可：

```text
使用 $paper-to-course 为零基础读者精读这篇论文。
请逐步讲清关键公式，并生成完整的四项阅读产物。
```

### 3. 验证生成包

默认构建会组装讲解页并检查四项阅读产物：

```bash
node scripts/build-all.js ./my-paper-course
```

也可以分别检查：

```bash
node scripts/build-all.js ./my-paper-course --html
node scripts/build-all.js ./my-paper-course --guided
node scripts/build-all.js ./my-paper-course --translation
node scripts/build-all.js ./my-paper-course --notes
```

核心校验脚本不依赖第三方包。旧版幻灯片能力只在显式传入 `--pptx` 时运行；当前项目有意优先把论文阅读做好。

## 可靠性与边界

Paper Reader 要求在生成完整讲解前通读论文；关键事实保留来源定位，并明确区分“论文报告”“导师解读”和“延伸推断”。原论文公式不会与教学化改写混淆，中文译文也不能悄悄缩水成摘要。

它刻意**不**做审稿机器人、复现计划、多论文综述、知识库或通用 PPT 生成器。范围收得足够窄，四项阅读产物才能互相校验、共同服务“读懂一篇论文”这一件事。

## 仓库结构

```text
.
├── SKILL.md                         # 工作流与不可妥协的完成标准
├── agents/openai.yaml               # Codex 侧元信息
├── assets/
│   ├── guided-reader-template/      # 双栏阅读器模板与响应式 CSS
│   └── translation-template/        # 中文连续阅读页模板与 CSS
├── docs/screenshots/                # 本页所用的真实产出截图
├── references/
│   ├── formula-tutorial.md          # 锚点公式精讲协议
│   ├── guided-reader.md             # 左详解 / 右原文契约
│   └── ...
└── scripts/
    ├── build-all.js                 # 四产物构建与校验流程
    ├── validate-guided-reader.js    # 双栏对齐、原文与响应式检查
    ├── validate-translation.js
    └── validate-notes.js
```

## 参与和支持

欢迎提交 Issue 或 PR，尤其欢迎：更多高质量示例论文、更清晰的公式讲解、产物质量检查和无障碍改进。如果它让你少在一篇难论文前卡住一小时，欢迎给项目点一个 [Star](https://github.com/Starry-Curry/Paper-reader/stargazers)；这会帮助我们决定下一步优先改进什么。

## 许可证

[MIT](LICENSE)
