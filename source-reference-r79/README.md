# 航天基地源几何在线对照 r79

公开入口：<https://rmlearners.github.io/3D_hangtian-preview/source-reference-r79/?lod=2>。`lod=0` 为高清几何，加载量更大。

本页为《三角洲行动》航天基地的三维参考数据查看器。位置、方向和体量来自获授权使用的 [MapleEve/DF3dMapTool](https://github.com/MapleEve/DF3dMapTool) Space City 数据包，固定在提交 `794c1a95ca7cebe9b12f53ce34b391fb92b39b17`。页面运行时从上游固定版本的 CDN 加载加密数据和解码所需的公开源码；本仓库不托管原始数据包或密钥。Three.js 固定为 0.186.0。

页面中的黄色线条是本项目旧手工模型的近似配准轮廓，仅用于定位差异，不是地图实测边界。矩形裁切也不是游戏空气墙。参考数据、可打印封闭网格、STL/3MF 和实体打印验证是不同阶段。

跨设备打开需要网络和支持 WebGL 的浏览器。若页面停在加载中，先检查浏览器控制台中的上游数据请求。未缓存的分块若被 CDN 拒绝，页面会改从固定版本的 GitHub Contents API 读取；这两个来源都不可达时无法显示几何。

