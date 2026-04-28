# 工作记忆

## 项目概况
- **项目名**: Zhiyuan（志愿填报助手）
- **技术栈**: Node.js/Express后端 + Flutter移动应用 + PostgreSQL(Neon) + Railway部署
- **定位**: 面向高三学生家长的AI智能高考志愿填报辅助工具（仅供亲友免费使用）
- **首期覆盖**: 新高考"3+1+2"省份（广东/湖南/湖北/河北/辽宁/福建/江苏/重庆）

## 当前状态（2026-04-22）
已完成两个阶段工作：
1. **第一阶段**: 数据库一致性修复（统一表名/字段名，150+处修改）
2. **第二阶段**: 数据脚本修复（适配新的universities/majors/admission_scores表结构）

## 关键修复记录
- 表名: schools→universities, school_scores→admission_scores, school_majors→university_majors
- 字段: is_985/is_211布尔→level数组, category→type
- 核心脚本: crawl-schools.js, crawl-majors.js, generate-scores.js, import-all-data.js, verify-data.js, verify-schools-majors.js

## 待做
- 在Neon数据库执行migrate-prod.sql建表
- 运行import-all-data.js导入种子数据
- 前后端联调测试推荐流程
