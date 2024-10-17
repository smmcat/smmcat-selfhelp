import { Context, Schema, h } from 'koishi';
import fs from 'fs/promises';
import path from 'path';
import { createPathMapByDir, createDirMapByObject } from './mapTool';
export const name = 'smmcat-selfhelp';
import { } from 'koishi-plugin-word-core';

export interface Config {
  mapAddress: string;
  overtime: number;
  debug: boolean;
}

export const usage = `
通过创建文件夹生成对应映射关系的多级菜单选项的简单自助菜单插件

 - result.text 中的内容代表最终的回复
 - title.text 中的内容代表该层级菜单的标题

只要上述文件放置在对应文件夹中，就会有对应的效果

当启用[word-core](/market?keyword=word-core)与[word-core-grammar-basic](/market?keyword=word-core-grammar-basic)插件后，可以将回复接入词库解析
`;

export const Config: Schema<Config> = Schema.object({
  mapAddress: Schema.string().default('./data/selfHelp').description('菜单结构放置位置'),
  overtime: Schema.number().default(30000).description('菜单访问的超时时间'),
  debug: Schema.boolean().default(false).description('日志查看更多信息')
});

export const inject = {
  optional: ['word']
};

export function apply(ctx: Context, config: Config) {
  // 模板内容
  const addTemplate = async (upath) => {
    const obj = [
      {
        name: "1.自助服务",
        child: [
          {
            name: "1.实例问题",
            title: "这是通过 title.text 生成的提示标题",
            child: [
              { name: "1.koishi实例无法启动", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183327.png?x-oss-process=image/resize,h_130') + "可以社区发帖求助" },
              { name: "2.无法访问插件市场", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183224.png?x-oss-process=image/resize,h_130') + "在 market 插件的配置项设置镜像源" }
            ]
          },
          { name: "2.插件问题", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183321.png?x-oss-process=image/resize,h_130') + "插件问题找插件作者啊" }
        ]
      },
      {
        name: "2.自由内容",
        child: [
          { name: "1.快乐", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183237.png?x-oss-process=image/resize,h_130') + "但是并不快乐" },
          { name: "2.喜欢", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183237.png?x-oss-process=image/resize,h_130') + "这可能是最后的帮助" },
          {
            name: "3.学习",
            title: "这是一个目录下的标题",
            child: [
              { name: "1.女装的优雅姿态", child: h.image('https://static.kivo.wiki/images/students/%E9%99%86%E5%85%AB%E9%AD%94%20%E9%98%BF%E9%9C%B2/gallery/%E5%88%9D%E5%A7%8B%E7%AB%8B%E7%BB%98%E5%B7%AE%E5%88%86/QQ%E6%88%AA%E5%9B%BE20211115183327.png?x-oss-process=image/resize,h_130') + '通过女装可以锻炼自己，锻炼兄弟' }
            ]
          }
        ]
      },
      { name: "3.说明文档", child: "这是 smmcat-helpself 的默认结构，您可以通过 result.text 文件创建最终给定的回复" },
      { name: "4.更新说明", child: "在 0.1.0 版本后，引入了 word-core 可选服务，并设置了%转义符%，例如下面是获取时间：\n%getTime%\n\n目前提供的转义符只有：getTime -> 获取时间 rollACGImg -> 获取随机动漫图" }
    ];
    try {
      await createDirMapByObject(obj, upath);
    } catch (error) {
      console.log(error);
    }
  };

  // 转义符工具
  const transferTool = {
    getTime(session) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    rollACGImg(session) {
      return h.image('https://www.dmoe.cc/random.php')
    }
  }


  const selfhelpMap = {
    // 基地址
    upath: path.join(ctx.baseDir, config.mapAddress),
    mapInfo: [],
    // 初始化路径
    async initPath() {
      try {
        // 是否创建对应内容
        await fs.access(this.upath);
      } catch (error) {
        try {
          // 添加演示模板
          await fs.mkdir(this.upath, { recursive: true });
          await addTemplate(this.upath);
        } catch (error) {
          console.error(error);
        }
      }
    },
    // 初始化菜单结构
    async init() {
      await this.initPath();
      this.mapInfo = createPathMapByDir(this.upath);
      config.debug && console.log(JSON.stringify(this.mapInfo, null, ' '));
      config.debug && console.log("[smmcat-selfhelp]:自助菜单构建完成");
    },
    getMenu(goal: string, callback?: (event) => void) {

      let selectMenu = this.mapInfo;
      let end = false;
      let indePath = [];
      let PathName = [];
      if (!goal) {
        callback && callback({ selectMenu, lastPath: '', crumbs: '', end });
        return;
      }
      let title = null;
      const indexList = goal.split('-').map(item => Number(item));
      indexList.some((item: number) => {
        // 储存路径值
        indePath.push(item);
        PathName.push(selectMenu[item - 1]?.name.length > 6 ? selectMenu[item - 1]?.name.slice(0, 6) + '...' : selectMenu[item - 1]?.name);
        title = selectMenu[item - 1]?.title || null;
        // 超过范围
        if (selectMenu.length < item) {
          selectMenu = undefined;
          // 还原正确路径值
          indePath.pop();
          PathName.pop();
          callback && callback({ selectMenu, lastPath: indePath.join('-'), crumbs: PathName.slice(-3).reverse().join('<'), end });
          return true;
        }
        // 如果是菜单对象列表
        if (selectMenu && typeof selectMenu === "object") {
          selectMenu = selectMenu[item - 1].child;
          // 如果下级是内容区
          if (typeof selectMenu === "string") {
            end = true;
            callback && callback({ selectMenu, lastPath: indePath.join('-'), crumbs: PathName.slice(-3).reverse().join('<'), end });
            return true;
          }
        }
      });
      end || callback && callback({ selectMenu, title, lastPath: indePath.join('-'), crumbs: PathName.reverse().slice(-3).join('<'), end });
    },
    // 菜单渲染到界面
    markScreen(pathLine: string, session) {
      let goalItem = {}
      // 查找对应菜单 获取回调
      this.getMenu(pathLine, (ev: any) => {
        // 分析转义符 %type%
        if (ev.end) {
          ev.selectMenu = ev.selectMenu.replace(/%([a-z|A-Z]+)%/g, (match, capture) => {
            let result = ''
            if (transferTool[capture]) {
              result = transferTool[capture](session)
            }
            return result;
          });
        }
        if (ev.title) {
          ev.title = ev.title.replace(/%([a-z|A-Z]+)%/g, (match, capture) => {
            let result = ''
            if (transferTool[capture]) {
              result = transferTool[capture](session)
            }
            return result;
          });
        }
        goalItem = ev
      })
      return this.format(goalItem)
    },
    // 格式化界面输出
    format(goalItem) {
      if (!goalItem.selectMenu) {
        return {
          msg: '',
          err: true
        };
      }
      if (goalItem.end) {
        return {
          msg: goalItem.selectMenu.replace(/\\/g, '') +
            (goalItem.crumbs ? `\n\n[当前位置] ` +
              `${goalItem.crumbs}` : '\n\n主菜单') +
            '\n\nQ 上页\nP 首页\n0 退出',
          err: false,
          end: goalItem.end
        };
      } else {
        return {
          msg: (goalItem.crumbs ? `[当前位置]\n` + `${goalItem.crumbs}\n` : '主菜单\n') +
            `----------------------------\n` +
            (goalItem.title ? `${goalItem.title}\n\n` : '') +
            `${goalItem.selectMenu.map((item) => item.name).join('\n') + '\n\nQ 上页\nP 首页\n0 退出'}` +
            `\n----------------------------\n`,
          err: false,
          end: goalItem.end
        };
      }
    }
  };

  ctx.on('ready', () => {
    selfhelpMap.init();
  });

  ctx
    .command('自助菜单')
    .action(async ({ session }) => {
      const proce = [];
      while (true) {
        const data = selfhelpMap.markScreen(proce.join('-'), session);
        if (data.err) {
          proce.pop();
          const data = selfhelpMap.markScreen(proce.join('-'), session);
          await session.send('操作不对，请重新输入：\n注意需要输入指定范围的下标');
          await session.send(data.msg);
        }

        // 原先猫老师的源码
        // await session.send(data.msg)

        if (ctx.word) {
          const msg = await ctx.word.driver.parMsg(data.msg, { saveDB: 'smm' }, session);
          if (msg) {
            await session.send(msg);
          }
        } else {
          await session.send(data.msg);
        }

        const res = await session.prompt(config.overtime);
        if (res === undefined) {
          await session.send('长时间未操作，退出自助服务');
          break;
        }
        if (!res.trim() || isNaN(Number(res)) && res.toLowerCase() !== 'q' && res.toLowerCase() !== 'p') {
          await session.send('请输入指定序号下标');
          continue;
        }
        if (res == '0') {
          res == '0' && await session.send('已退出自助服务');
          break;
        }
        if (res.toLowerCase() === 'q') {
          proce.pop();
        } else if (res.toLowerCase() === 'p') {
          proce.length = 0;
        } else {
          proce.push(res);
          // 如果已经末尾
          if (data.end) {
            await session.send('已经到底了!');
            proce.pop();
          }
        }
      }
    });
}
