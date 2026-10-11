# Case 01 第二阶段本地验收

## 完成范围

保留第一阶段招聘摘要、两项个人设计判断、锚点及视觉体系；更新中文和英文 Case 01。没有修改首页、Case 02、Case 03、简历、原始研究或实验数据。没有 commit、push、部署。

最终来源见 [来源对应表](case01-phase2-source-map.md)。来源报告与补充记录经人工交叉对照，问卷有效样本由原工作簿重新筛选核算。

## 关键文案与事实对照

| 之前 | 现在及证据边界 | 网站 / 下载案例 / 求职 PDF |
|---|---|---|
| Pilot 与 Round 2 四人 | Pilot 1 独立报告；正式10 = Round 2四人 + P05–P10六人 | 测试章节 / 案例14页 / 求职6页 |
| 纠正、拒绝、安全停止尚未正式测试 | 历史中文已产生版本化观察，纠正仍有缺陷；英文后期修复仅作者QA | 摘要、核心体验、证据板 / 案例14–20页 / 求职5–6页 |
| 隐私、时间编辑为主要迭代 | P07 Recovery矛盾、P08字段路由、P09返回一致性、P10连续状态回退；保留早期证据折叠入口 | 迭代故事 / 案例18页 / 求职6页 |
| 没有问卷依据 | N=20有效问卷：13/20选纠正事实、11/20选补充重新判断、17/20选假设拒绝后立即或最多一步结束 | 两项个人判断 / 案例3页 / 求职4页 |
| 主要早期V1.5展示 | 冻结最终英文素材；清楚标注作者QA及中文测试版本差异 | 概览、核心体验、迭代图片 / 案例15–19页 / 求职5–6页 |
| 旧FINAL-v3案例，8.6MB | 2026-09-13包的FINAL_PREVIDEO_CLEAN，21页，1.93MB；字节与源文件一致 | 中英文下载入口 |
| 完整PDF15页，第6页只有早期四人 | 仍15页，只更新第3–6页；其余11页像素、文本、链接一致 | public/chang-li-portfolio.pdf，约3.69MB |

任务分母保持独立：补充主流程5/6独立、P09协助；6/6理解辅助角色、决定权、拒绝和本次隐私；时间编辑仅P06/P08/P10，3/3独立。P10状态回退为一项具体缺陷，不是群体比例。不存在最终英文参与者验证、压力降低、真实存储、临床或上线成果主张。

## 验收证据

目录：`C:/Users/ROG/.codex/visualizations/2026/10/11/01a12ad2-9799-7ce0-9551-247a5d8837b1/case01-phase2`

- Edge真实渲染：1440×1000、390×1000；英文1440补充检查。
- `edge-qa.json`：无横向溢出、脚本错误、HTTP失败、坏图、重复ID、缺失锚点。版本折叠、历史材料折叠、摘要跳转、移动导航及桌面大图/Escape正常。
- 最终页面高度：桌面16417px，手机27136px。第一阶段结束16329/27365px，桌面增加88px，手机减少229px。
- `download-qa.json`：最终构建两份PDF均HTTP200，下载哈希与本地最终文件一致。以这个记录为最终PDF字节验收；较早Edge整页记录中的PDF体积来自压缩前构建。
- `pdf-qa.json`：15页；修改3–6页；其余11页与原件渲染像素、文字及链接一致。字体子集压缩前后全部15页像素、文字一致。
- `scope-qa.json`：203个基准文件中，仅4个预期已有文件发生变化；其他网站与研究文件不变。新增最终案例PDF与源包字节一致。
- 最终 `npm run build` 通过。Vite开发预览曾被PowerPoint临时文件锁中断；最终使用不监听源文件的构建预览完成验收，未修改Vite配置。
- 本轮Case01文本diff检查通过；研究草稿预先存在的尾随空格未改动。

## 变更清单

已有文件：
- public/cases/should-i-work-out-today.html
- public/cases/should-i-work-out-today.css
- public/en/cases/should-i-work-out-today.html
- public/chang-li-portfolio.pdf

新增内容：
- public/assets/should-i-work-out-today/final-en/：13张原项目冻结PNG，未生成或改绘界面。
- public/assets/should-i-work-out-today/Li_Chang_Should_I_Work_Out_Today_Case_Study_2026_FINAL_PREVIDEO_CLEAN.pdf
- docs/case01-phase2-source-map.md、docs/case01-phase2-review.md
- output/pdf/chang-li-portfolio-case01-phase2.pdf：完整求职PDF验收副本，与public版本相同。
- output/source/case01-phase2/：可编辑15页PPTX副本、源修改记录、本地更新/导出/验收脚本。桌面原始PPTX未覆盖。导出PDF为中间文件。

工作树Case01累计diff（包含第一阶段）：4个已有文件，252行新增、160行删除；PDF从10,554,530变为3,691,816字节。中文页面及CSS相对第一阶段的精确diff另见 `phase2-only.diff`。其他已存在未提交改动不属于本轮。

## 保留疑问

- Pilot/P01–P04原始材料仍未完整映射到个人记录；早期结果注明来自留存研究者总结。
- P05–P10依据保留日志与汇总，没有找到完整原始录音。本轮未新增或重构引语。
- 最终英文没有参与者回归测试；215条作者路由检查不能单独证明所有状态值持续正确。
- 当前实时Figma未独立重查；本轮素材、节点身份与交付边界来自冻结最终包及保存的原型结构记录。

停止于本地验收，等待用户审核后另行决定发布。
