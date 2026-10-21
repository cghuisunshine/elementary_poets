# 诗词学习讲解

`study-source.txt` 是手工编写的中文讲解。每篇包括题意、按原文顺序的白话与赏读，以及按语境分组的字词注释。三首现代补充篇目保持不收正文，提供对应内容层次的讲解。

运行 `python3 content/build-study-data.py` 生成网页使用的 `study-data.js`。编译检查全部 114 篇是否齐全、古诗原文每个分句是否有对应译解，以及每个汉字是否被对应字词释义覆盖。添加或调整原文时，应同时更新讲解并重新生成。

`@题目|题意|赏析` 开始一篇，下一行使用 `词语=释义；词语=释义`，之后每行是 `各句白话以/分隔|本层赏读`。采用最长词语优先的匹配，保留固定词语，不机械拆开专名和复合词。原文有异文、古今异义或释义争议时，在讲解中说明。

核对与延伸阅读：

- 香港教育局《积累与感兴：小学古诗文诵读材料选编》：https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/resources/primary/lang/jilei.html
- 《鹿柴》注释（返景、但、复）：https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/chi-edu/resources/primary/lang/jilei_shi_pdf/jilei_shi_027.pdf
- 《迢迢牵牛星》对照阅读：https://www.gushiwen.cn/shiwenv_7f09a756c9c0.aspx
- 《浣溪沙·游蕲水清泉寺》词义与赏析：https://www.gushiwen.cn/mingju/juv_978ab5cac5d2.aspx

白话与赏读是本项目的学习性改写，并非以上材料的整篇转载。教材的异文、读音与篇目安排以学生所用课本为准。
