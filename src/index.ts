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
  scriptMode: boolean;
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
  debug: Schema.boolean().default(false).description('日志查看更多信息'),
  scriptMode: Schema.boolean().default(false).description('开启剧本模式[测试性]：不能主动后退 + 不能返回首页 + 自动保存进度')
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
      { name: "4.更新说明", child: "在 0.1.0 版本后，引入了 word-core 可选服务，并设置了%转义符%，例如下面是获取时间：\n%getTime%\n\n目前提供的转义符只有：getTime -> 获取时间 rollACGImg -> 获取随机动漫图" },
      {
        name: "5.剧本演示",
        child: [
          {
            name: "1.睡一觉",
            child: [
              {
                name: "1.返回 序章",
                child: [],
                title: "%jumpBranch|5%"
              },
              {
                name: "2.复活",
                child: [],
                title: "%jumpByLostProp|金币*11?5-2-3-2-1-1%"
              }
            ],
            title: "熟睡中饿死了，需要20金币复活，你选择..."
          },
          {
            name: "2.冒险去",
            child: [
              {
                name: "1.打特么的 不怂",
                child: [
                  {
                    name: "1.返回序章",
                    child: "%jumpBranch|5%"
                  }
                ],
                title: "她们把你骗的连裤衩都没了"
              },
              {
                name: "2.不敢打 委婉拒绝",
                child: [
                  {
                    name: "1.返回序章",
                    child: "%jumpBranch|5%"
                  }
                ],
                title: "她们把你打了一顿，抢劫跑人"
              },
              {
                name: "3.一看是怪物 通知卫兵",
                child: [
                  {
                    name: "1.蕉个朋友 给你了",
                    child: [
                      {
                        name: "1.我有 你康康",
                        child: [
                          {
                            name: "1.继续",
                            child: [
                              {
                                name: "1.返回序章",
                                child: "%jumpBranch|5%"
                              }
                            ],
                            title: "因为太饿，吃太多撑死了。结束人生..."
                          }
                        ],
                        title: "%jumpByCheckProp|金币?5-2-3-1-1-1%"
                      },
                      {
                        name: "2.没有 可以白给我吗",
                        child: [
                          {
                            name: "1.返回序章",
                            child: "%jumpBranch|5%"
                          }
                        ],
                        title: "你被打了一顿，然后饿死街头"
                      }
                    ],
                    title: "你游荡在街上，没钱什么也做不了。也没实际的身份证明...\r\n\r\n走了一会，你实在饿得不行。去了一家看起来 是餐厅的地方，老板要确认你是否有钱。你现在："
                  },
                  {
                    name: "2.请给我打钱 谢谢",
                    child: [
                      {
                        name: "1.去买房",
                        child: [
                          {
                            name: "1.继续",
                            child: [
                              {
                                name: "1.返回序章",
                                child: "%jumpBranch|5%"
                              }
                            ],
                            title: "你在 %getTime% 成为了有钱人，在城市中活得滋润。"
                          }
                        ],
                        title: "%jumpByLostProp|金币*11?5-2-3-2-1-1%"
                      },
                      {
                        name: "2.去找工作",
                        child: [
                          {
                            name: "1.返回序章",
                            child: "%jumpBranch|5%"
                          }
                        ],
                        title: "最后你成为了异世界的打工人"
                      }
                    ],
                    title: "%getProp|金币*10%\r\n拿到金币后，卫兵看你衣着特殊，以为你是外地人。推荐你去找份工作看看。你决定："
                  }
                ],
                title: "你发现这个阵容的冒险小队不对劲。马上告知了巡逻的卫兵。她们仓皇逃窜走了...\r\n...经过一番追赶虽然跑了一个，但是女哥布林 Shigma 被抓住了\r\n\r\n“你真走运，”卫兵说，“她们是悬赏的罪犯。一人奖金就有 10 金币呢！”\r\n“是吗？太好了” 你似乎有点期待..."
              }
            ],
            title: "你遇到了一个冒险小队。小队里的人物中一个是爆乳法师 42，一个是 女哥布林 Shigma。\r\n她们邀请你讨伐史莱姆。 你决定...\r\n（刚开始你还未了解这个世界，请谨慎选择...）"
          }
        ],
        title: "<img src=\"https://forum.koishi.xyz/user_avatar/forum.koishi.xyz/lizard/96/2522_2.png\" />\r\n你在 %getTime% 时候被车撞 s 了嗯...\r\n这是一个异世界，你果然...又被撞到异世界里了。依然到了异世界，那就拿出真本事吧！"
      }
    ];
    try {
      await createDirMapByObject(obj, upath);
    } catch (error) {
      console.log(error);
    }
  };
  // 分支缓存
  const userBranch = {}
  // 获得的事件只触发一次
  const onlyOneTemp = {}
  // 持有缓存
  const takeIng = {}
  // 转义符工具
  /**
   * 参数接收规则
   * @session 会话对象
   * @params 参数 通过 | 右侧传入的内容
   * @ev 内容对象
   */
  const transferTool = {
    // 获取当前时间
    getTime: (session) => new Date().toLocaleString().replaceAll("/", "-"),
    // 获取随机动漫图
    rollACGImg(session) {
      return h.image('https://www.dmoe.cc/random.php')
    },
    // 跳转分支
    jumpBranch(session, params: string, ev) {
      userBranch[session.userId] = params?.split('-') || []
      // 通知渲染层 重置界面
      ev.change = true
    },
    // 通过交出持有物跳转分支 xxx>4?1-1-1
    jumpByLostProp(session, params: string, ev) {
      const dict = params.split('?')
      if (this.lostProp(session, dict[0], ev)) {
        userBranch[session.userId] = dict[1]?.split('-') || []
        // 通知渲染层 重置界面
        ev.change = true
      } else {
        userBranch[session.userId].pop()
        // 通知渲染层 重置界面
        ev.change = true
        session.send('不满足要求，请重新选择')
      }
    },
    // 通过查询是否存在持有物跳转分支 xxx>4?1-1-1
    jumpByCheckProp(session, params: string, ev) {
      const dict = params.split('?')
      if (this.querymentProp(session, dict[0], ev)) {
        userBranch[session.userId] = dict[1]?.split('-') || []
        // 通知渲染层 重置界面 
        ev.change = true
      } else {
        userBranch[session.userId].pop()
        // 通知渲染层 重置界面
        ev.change = true
        session.send('不满足要求，请重新选择')
      }
    }
    ,
    // 获得道具 |xxx>4
    getProp(session, params: string, ev) {
      const item = params.split('*')
      const prop = item[0]
      const num = isNaN(Number(item[1])) ? 1 : Number(item[1])
      if (!onlyOneTemp[session.userId]) {
        onlyOneTemp[session.userId] = []
      }
      if (!onlyOneTemp[session.userId].includes(userBranch[session.userId].join('-'))) {
        if (!takeIng[session.userId]) {
          takeIng[session.userId] = {}
        }
        onlyOneTemp[session.userId].push(userBranch[session.userId].join('-'))
        if (takeIng[session.userId][prop] === undefined) {
          takeIng[session.userId][prop] = num
        } else {
          takeIng[session.userId][prop] += num
        }
        session.send('你在事件中得到了' + (num || 1) + `个${prop}`)
      }
    },
    // 失去某物 |xxx>1
    lostProp(session, params: string, ev) {
      const item = params.split('*')
      const prop = item[0]
      const num = isNaN(Number(item[1])) ? 1 : Number(item[1])

      if (!onlyOneTemp[session.userId].includes(userBranch[session.userId].join('-'))) {
        if (!this.querymentProp(session, prop, num || 1)) return false
        takeIng[session.userId][prop] -= num
        if (!takeIng[session.userId][prop]) {
          delete takeIng[session.userId][prop]
        }
        onlyOneTemp[session.userId].push(userBranch[session.userId].join('-'))
        session.send('你在事件中失去了' + (num || 1) + `个${prop}`)
        return true
      }
    },
    // 判断是否存在某物
    querymentProp(session, prop, num = 1) {
      if (!takeIng[session.userId]) {
        takeIng[session.userId] = {}
      }
      if (takeIng[session.userId][prop] === undefined) {
        return false
      }
      if (takeIng[session.userId][prop] < Number(num)) {
        return false
      }
      return true
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
      let change = false;
      if (!goal) {
        callback && callback({ selectMenu, lastPath: '', change, crumbs: '', end });
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
          callback && callback({ selectMenu, lastPath: indePath.join('-'), change, crumbs: PathName.slice(-3).reverse().join('<'), end });
          return true;
        }
        // 如果是菜单对象列表
        if (selectMenu && typeof selectMenu === "object") {
          selectMenu = selectMenu[item - 1].child;
          // 如果下级是内容区
          if (typeof selectMenu === "string") {
            end = true;
            callback && callback({ selectMenu, lastPath: indePath.join('-'), change, crumbs: PathName.slice(-3).reverse().join('<'), end });
            return true;
          }
        }
      });
      end || callback && callback({ selectMenu, title, lastPath: indePath.join('-'), change, crumbs: PathName.slice(-3).reverse().join('<'), end });
    },
    // 菜单渲染到界面
    markScreen(pathLine: string, session) {
      let goalItem = { change: false }
      // 查找对应菜单 获取回调
      this.getMenu(pathLine, (ev: any) => {
        // 分析转义符 %type%
        if (ev.end) {
          ev.selectMenu = ev.selectMenu.replace(/%([^%]*)%/g, (match, capture) => {
            let result = ''
            const temp = capture.split('|')
            if (transferTool[temp[0]]) {
              result = transferTool[temp[0]](session, temp[1], ev) || ''
            }
            return result;
          });
        }
        if (ev.title) {
          ev.title = ev.title.replace(/%([^%]*)%/g, (match, capture) => {
            let result = ''
            const temp = capture.split('|')
            if (transferTool[temp[0]]) {
              result = transferTool[temp[0]](session, temp[1], ev) || ''
            }
            return result;
          });
        }
        goalItem = ev
      })
      return this.format(goalItem, session)
    },
    // 格式化界面输出
    format(goalItem, session) {
      // 通过 change 标识 再一次执行刷新界面操作
      if (goalItem.change) return this.markScreen(userBranch[session.userId].join('-'), session)
      if (!goalItem.selectMenu) {
        return {
          msg: '',
          err: true,
        };
      }
      if (goalItem.end) {
        if (config.scriptMode) {
          return {
            msg: (h.select(goalItem.selectMenu || '', 'img').length > 0 ? '' : "【内容】\n") +
              (goalItem.selectMenu ? `${goalItem.selectMenu.replace(/\\/g, '')}\n\n` : '') +
              '\n\n0 退出' +
              `\n----------------------------\n` +
              (goalItem.crumbs ? `[当前位置]` + `${goalItem.crumbs}\n` : '序章\n'),
            err: false,
            end: goalItem.end,
          };
        } else {
          return {
            msg: goalItem.selectMenu.replace(/\\/g, '') +
              (goalItem.crumbs ? `\n\n[当前位置] ` +
                `${goalItem.crumbs}` : '\n\n主菜单') +
              '\n\nQ 上页\nP 首页\n0 退出',
            err: false,
            end: goalItem.end,
          };
        }
      } else {
        if (config.scriptMode) {
          return {
            msg: (h.select(goalItem.title || '', 'img').length > 0 ? '' : "【内容】\n") +
              (goalItem.title ? `${goalItem.title.replace(/\\/g, '')}\n\n` : '') +
              `${goalItem.selectMenu.map((item) => item.name).join('\n') + '\n\n0 退出'}` +
              `\n----------------------------\n` +
              (goalItem.crumbs ? `[当前位置]\n` + `${goalItem.crumbs}\n` : '序章\n'),
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
    }
  };

  ctx.on('ready', () => {
    selfhelpMap.init();
  });

  ctx
    .command('自助菜单')
    .action(async ({ session }) => {

      if (!userBranch[session.userId]) {
        userBranch[session.userId] = [];
      }
      while (true) {
        config.debug && console.log('当前持有：' + takeIng[session.userId]);
        config.debug && console.log('已获取/失去过道具的分支：' + onlyOneTemp[session.userId]);

        let data = selfhelpMap.markScreen(userBranch[session.userId].join('-'), session);
        if (data.err) {
          userBranch[session.userId].pop();
          let data = selfhelpMap.markScreen(userBranch[session.userId].join('-'), session);
          await session.send('操作不对，请重新输入：\n注意需要输入指定范围的下标');
          await session.send(data.msg);
        }

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
          if (!config.scriptMode) {
            userBranch[session.userId].length = 0
          }
          await session.send(!config.scriptMode ? '长时间未操作，退出自助服务' : "长时间未操作，退出剧本，记录保留");
          break;
        }
        if (!res.trim() || isNaN(Number(res)) && res.toLowerCase() !== 'q' && res.toLowerCase() !== 'p') {
          await session.send('请输入指定序号下标');
          continue;
        }
        if (res == '0') {
          if (!config.scriptMode) {
            userBranch[session.userId].length = 0
          }
          res == '0' && await session.send(!config.scriptMode ? '已退出自助服务' : "已退出剧本，记录保留");
          break;
        }
        if (!config.scriptMode && res.toLowerCase() === 'q') {
          userBranch[session.userId].pop();
        } else if (!config.scriptMode && res.toLowerCase() === 'p') {
          userBranch[session.userId].length = 0;
        } else {
          userBranch[session.userId].push(res);
          // 如果已经末尾
          if (data.end) {
            await session.send('已经到底了!');
            userBranch[session.userId].pop();
          }
        }
      }
    });

  if (config.scriptMode) {
    ctx
      .command('重置进度')
      .action(async ({ session }) => {
        if (!userBranch[session.userId]?.length) {
          await session.send('你的当前进度不需要重置')
        }
        await session.send('是否要重置当前进度？\n 20秒回复：是/否')
        const res = await session.prompt(20000)
        if (res === '是') {
          userBranch[session.userId] = []
          onlyOneTemp[session.userId] = []
          takeIng[session.userId] = {}
          await session.send('已重置当前进度')
        }
      })

    ctx
      .command('当前持有')
      .action(async ({ session }) => {
        const temp = takeIng[session.userId]
        if (!temp || !Object.keys(temp).length) {
          await session.send('你当进度中前还没有任何道具持有...')
        }
        const msg = Object.keys(temp).map(item => {
          return `【${item}】单位：${temp[item]}`
        })
        await session.send('你当前进度中持有:\n' + msg)
      })
  }
}
