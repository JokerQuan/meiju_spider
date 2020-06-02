const Crawler = require("crawler");
const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

let meijus = new Map();
let doneMeijus = new Map();

let Tags = [];
let Areas = [];
let Types = [];



const baseUrl = "https://www.meijutt.tv";


//定义一个schema
let meijuSchema = mongoose.Schema({
    href:String,        //链接
    title:String,       //标题
    pic_url:String,     //图片地址
    en_title:String,    //原名
    alias_title:String, //别名
    birth_date:String,  //首播日期
    area:String,        //地区
    type:String,        //类型
    tags:String,         //标签
    translator:String,  //翻译
    // screenwriter:String,//编剧
    // director:String,    //导演
    // starring:String,    //主演
    // score:String,       //评分 todo
    // story:String        //剧情 todo
    files: Array
});

let Meiju = mongoose.model("Meiju", meijuSchema);

let CategorySchema = mongoose.Schema({
    tags : Array,
    areas : Array,
    types : Array
});

let CategoryModel = mongoose.model("category", CategorySchema);

mongoose.connect('mongodb://localhost:27017/meiju');
const db = mongoose.connection;
db.on('error', console.error.bind(console, '连接数据库失败'));
db.once('open',()=>{
    console.log("连接数据库成功！！");
    start();
    // c.queue('https://www.meijutt.com/content/meiju24383.html')
});


function addToDB(obj) {
    let myMeiju = new Meiju(obj);
    // myMeiju.save((err, myMeiju) => {
    //     if (err) return console.error(err);
    // });

    Meiju.findOneAndUpdate({href: obj.href}, obj, {upsert: true}, function (error, oldDoc) {

    });
}


function addUrl(elements) {
    for (let i = 0; ; i++) {
        if (elements[i]) {
            if (!doneMeijus.has(elements[i].attribs.href)
                && !meijus.has(elements[i].attribs.href)) {
                const {href, title} = elements[i].attribs;
                if (href && title) {
                    meijus.set(href, title);
                }
            }
        } else {
            break;
        }
    }
}

function setCategorys(type, area, tags) {
    if (type && Types.indexOf(type) === -1) {
        Types.push(type);
    }

    if (area && Areas.indexOf(area) === -1) {
        Areas.push(area);
    }

    if (tags) {
        let tmpTags = tags.split(" ");
        for (let i = 0; i < tmpTags.length; i++) {
            if (tmpTags[i].trim() && Tags.indexOf(tmpTags[i].trim()) === -1) {
                Tags.push(tmpTags[i].trim());
            }
        }
    }
}

function parsePage($, body) {
    //需要存储到数据库的字段
    let meiju = {};

    try {
        //页面连接、标题，此数据用来调度程序执行
        let elements = $('a[href^="/content/meiju"]');
        addUrl(elements);

        meiju.href = $('.fn-left')[0].children[5].attribs.href;
        meiju.title = $('h1')[0].children[0].data;
        meiju.pic_url = $('.o_big_img_bg_b')[0].children[0].attribs.src;

        let details = $('.o_r_contact')[0].children[0];

        meiju.en_title = details.children[1].children[0];
        if (meiju.en_title.next == null) {
            meiju.en_title = '';
        } else {
            meiju.en_title = details.children[1].children[0].next.data;
        }

        meiju.alias_title = details.children[2].children[0];
        if (meiju.alias_title.next == null) {
            meiju.alias_title = '';
        } else {
            meiju.alias_title = details.children[2].children[0].next.data;
        }

        meiju.birth_date = details.children[6].children[0];

        if (meiju.birth_date.next == null) {
            meiju.birth_date = '';
        } else {
            meiju.birth_date = details.children[6].children[0].next.data;
        }

        if (!details.children[7].children[1].children[0]) {
            meiju.translator = '';
        } else {
            meiju.translator = details.children[7].children[1].children[0].data;
        }

        if (details.children[9].children[0].children[1] == undefined) {
            meiju.area = '';
        } else {
            meiju.area = details.children[9].children[0].children[1].data;
        }

        meiju.type = details.children[11].children[1].children[1].data;

        let tags = details.children[8].children[0];
        meiju.tags = '';
        for (let i = 1; i < tags.children.length; i++) {
            meiju.tags += tags.children[i].children[0].data + " ";
        }

        meiju.files = [];
        if ($('.o_list_cn_top_r')[0].next !== null) {
            let fileBox = $('.o_list_cn_top_r')[0].next.children[0].children[0];
            for (let i = 0; i < fileBox.children.length; i++) {
                meiju.files.push({
                    name: fileBox.children[i].children[0].attribs.file_name,
                    url : fileBox.children[i].children[0].attribs.value
                });
            }
        }

        setCategorys(meiju.type, meiju.area, meiju.tags);

        addToDB(meiju);
    } catch (e) {
        console.log(e, meiju.href);
    }
}

function updateCategory () {
    CategoryModel.deleteOne({}, function () {
        let category = new CategoryModel({
            types : Types,
            areas : Areas,
            tags : Tags
        });
        category.save(function (error, doc) {
            // console.log(doc);
        });
    });
}

let c = new Crawler({
    timeout : 15 * 1000,
    retries : 5,
    retryTimeout : 10 * 1000,
    userAgent : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    maxConnections : 5,
    // 这个回调每个爬取到的页面都会触发
    callback : function (error, res, done) {
        if(error){
            console.log(error + 'error');
        }else{
            var $ = res.$;
            parsePage($, res.body);
        }
        done();
    }
});

function start() {
    c.queue(baseUrl);

    let times = 0, tasks = 0;
    let intervalId = setInterval(() => {
        if (meijus.size > 0) {
            times++;
            let meiju = meijus.entries().next().value;

            if (meiju[0]) {
                let href = meiju[0];
                let title = meiju[1];

                c.queue(baseUrl + href);
                tasks++;

                meijus.delete(href);
                doneMeijus.set(href, title);
            }
        } else if (times > 10 && c.queueSize <= 0) {
            clearInterval(intervalId);
            clearInterval(showTaskId);
            updateCategory();
            console.log(`爬取完成，共爬取到${doneMeijus.size}部美剧！`);
            process.exit(0);
        }
    }, parseInt(Math.random() * 10000)); // 0 ~ 10 秒随机事件间隔


    let showTaskId = setInterval(() => {
        console.log(`当前任务数：${c.queueSize}  待爬取：${meijus.size}  已完成：${doneMeijus.size}`);
    }, 5000);
}