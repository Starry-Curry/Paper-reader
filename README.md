# paper-to-course

A focused Skill for reading and understanding one academic paper in Chinese.

Default outputs:

- `index.html` — a mentor-style explanation of the paper's reasoning, algorithms, equations, training/inference flow, and evidence;
- `guided-reader.html` — a characteristic reader with beginner-friendly mentor explanation on the left and aligned English paper source on the right;
- `translated-paper.html` — a faithful Chinese translation that preserves the source structure;
- `paper-notes.md` — concise summary-style reading notes;
- `assets/figures/` — shared source figures and necessary teaching diagrams.

Slides, an additional sentence-level English–Chinese translation reader, reproduction plans, peer reviews, and multi-paper surveys are outside the default workflow.

## Input

Provide a paper PDF, arXiv/DOI/web link, LaTeX source, or verifiable paper text. A title alone is not sufficient when the full paper cannot be retrieved reliably.

## Default build

```bash
node scripts/build-all.js ./my-paper-course
```

This assembles `index.html` and validates `guided-reader.html`, `translated-paper.html`, and `paper-notes.md`.

Select a single output when needed:

```bash
node scripts/build-all.js ./my-paper-course --html
node scripts/build-all.js ./my-paper-course --translation
node scripts/build-all.js ./my-paper-course --guided
node scripts/build-all.js ./my-paper-course --notes
node scripts/validate-guided-reader.js ./my-paper-course/guided-reader.html
node scripts/validate-translation.js ./my-paper-course/translated-paper.html
node scripts/validate-notes.js ./my-paper-course/paper-notes.md
```

Legacy slide scripts remain for compatibility and run only with the explicit `--pptx` flag.

## Key files

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
    └── paper-elements.md
```
