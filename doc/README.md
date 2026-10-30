# SVG 编辑器 Phase 1

## 架构方案

使用 TypeScript 面向对象实现 CLI SVG 编辑器。`model` 封装图形与树操作；`commands` 实现 Command 和历史；`application` 管理文档与 IO 接口；`cli` 解析、分发与显示；`infrastructure` 实现 XML 与文件读写；`main.ts` 组装依赖。

依赖方向：model 不依赖其他业务模块；application 依赖 model；commands 依赖 application/model；cli 依赖 commands/application/model；infrastructure 依赖 application/model；入口可依赖所有模块。测试可以依赖公开模块。图见 architecture.puml。

使用 Composite 统一操作叶子与容器，Command 统一编辑与撤销。命令名和图形类型的分发分别集中于 CommandRegistry、ShapeFactory，两处为后续插件注册重构点。不实现 box 或动态插件加载。

变化点：未来新增图形通过工厂和多态图形扩展；新增交互通道复用命令；文件存储与 SVG 转换通过接口隔离。暂不建立完整插件生命周期，控制本阶段范围。

## 过程记录

- 初始目录仅有 phase_cli_1.md。先确定模块职责、撤销边界、跨容器分组和 SVG 导入范围，再实施。
- 计划逐步完成工程、模型、命令、IO 与验收，各阶段单独提交。

## 一致性自查

实施完成后补充实际目录、依赖抽样和修订结果。

## 质量保证手段

计划验证模型递归操作、撤销重做、错误原子性、XML 往返和 CLI 示例，并运行 TypeScript 严格检查与构建。结果在验收后补充。
