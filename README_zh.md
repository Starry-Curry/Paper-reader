# paper-to-course

面向单篇学术论文的中文阅读辅导 Skill。

默认只生成四类产物：

- `index.html`：面向初学者的导师式讲解，重点说明论文主线、算法、公式、训练/推理流程和实验结论；
- `guided-reader.html`：左侧零基础导师详解、右侧对齐英文原文的特色双栏阅读页；
- `translated-paper.html`：按原论文结构忠实翻译的中文阅读版；
- `paper-notes.md`：适合复习和归档的简要摘要式笔记；
- `assets/figures/`：四类产物共享的原论文图表和必要教学图。

PPT、额外中英逐句翻译对照页、论文复现、评审报告、多论文综述等能力暂不属于默认流程。

## 输入

可提供论文 PDF、arXiv/DOI/网页链接、LaTeX 源码或可核验的论文正文。若只提供题目而不能可靠取得全文，应先补充原文，不能根据题目猜测论文内容。

## 讲解原则

- 先建立“问题 → 旧方法瓶颈 → 核心改变 → 机制 → 证据 → 边界”的主线。
- 章节数量和图示形式由论文决定，不套固定六模块。
- 算法讲清输入、状态、处理步骤和输出；训练与推理分别说明。
- 先画公式依赖图；锚点公式逐步讲清问题、先修概念、读法、符号、最小手算例子、推导、算法位置和常见误解。
- 实验数字回扣具体研究问题，区分论文事实、导师解释和延伸推断。
- 图示只用于解释流程、层级、递进、依赖或实验趋势，不作装饰。

## 默认构建

```bash
node scripts/build-all.js ./my-paper-course
```

默认组装 `index.html`，并验证 `guided-reader.html`、`translated-paper.html` 与 `paper-notes.md`。

也可单独检查：

```bash
node scripts/build-all.js ./my-paper-course --html
node scripts/build-all.js ./my-paper-course --translation
node scripts/build-all.js ./my-paper-course --guided
node scripts/build-all.js ./my-paper-course --notes
node scripts/validate-guided-reader.js ./my-paper-course/guided-reader.html
node scripts/validate-translation.js ./my-paper-course/translated-paper.html
node scripts/validate-notes.js ./my-paper-course/paper-notes.md
```

旧版 PPT 脚本仍为兼容性保留，但仅在明确传入 `--pptx` 时运行。

## 关键文件

```text
paper-to-course/
├── SKILL.md
├── assets/
│   ├── guided-reader-template/
│   └── translation-template/
├── scripts/
│   ├── build-all.js
│   ├── validate-guided-reader.js
│   ├── validate-translation.js
│   └── validate-notes.js
└── references/
    ├── explanation-design.md
    ├── formula-tutorial.md
    ├── guided-reader.md
    ├── method-explanation.md
    ├── translation-guide.md
    ├── reading-notes.md
    ├── paper-elements.md
    ├── styles.css
    ├── main.js
    ├── _base.html
    └── _footer.html
```
