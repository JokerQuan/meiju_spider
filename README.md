## 美剧爬虫项目
### 开发环境
Node.js v10.16.0

npm 6.9.0

### 主要功能

目标网站：[美剧天堂](https://www.meijutt.com)

主要获取数据为[前端](https://github.com/JokerQuan/meiju-client)和[服务端](https://github.com/JokerQuan/meiju-server)项目服务，第一次做爬虫功能，没有任何代码结构，全写在一个js文件里了。

可重复运行，不会有重复数据。

### 开发环境运行（Windows）

1. 安装 MongoDB、MongoDB Campass（可视化管理数据） 

    [MongoDB官网](https://www.mongodb.com/)

2. 克隆到本地

    > git clone https://github.com/JokerQuan/meiju_spider.git

3. 安装依赖

    > npm i

4. 运行
    > node node_crawler.js

    node_crawler.js 为源代码文件，第234行指定了爬虫循环的间隔时间，根据运行环境可自行更改。

### 生产环境运行（Linux）

1. 安装 MongoDB

    [MongoDB官网](https://www.mongodb.com/)

2. 克隆到本地或服务器，安装依赖（同开发环境）

3. 安装 pm2（方便管理 node 进程）

    > npm install -g pm2

4. 运行

    > pm2 start $文件路径/meiju_spider/node_crawler.js --name "$进程名称"

    > 例：pm2 start /meiju_projects/meiju_spider/node_crawler.js --name "spider"

    node_crawler.js 为源代码文件，第234行指定了爬虫循环的间隔时间，根据运行环境可自行更改。

5. pm2 基本命令

    > pm2 list （查看 pm2 启动的进程列表）

    > pm2 logs （查看 pm2 启动的进程日志）

    > pm2 start|stop id|name （通过进程的 id 或 name 启动/停止进程）

