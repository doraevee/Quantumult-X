/*
 * @Author: lxk0301 
 * @Date: 2020-10-21 17:04:04 
 * @Last Modified by:   lxk0301 
 * @Last Modified time: 2020-10-21 17:04:04 
 */
/**
 星推官脚本
 出现任务做完没领取的情况，就再运行一次脚本
 能做完所有的任务，包括自动抽奖,脚本会给内置的shareId助力
 一共17个活动，耗时比较久，surge请加大延迟时间
 支持京东双账号
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 // quantumultx
 [task_local]
 #京东星推官
 2 0 * * * https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js, tag=京东星推官, enabled=true
 // Loon
 [Script]
 cron "2 0 * * *" script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js,tag=京东星推官
 // Surge
 京东星推官 = type=cron,cronexp=2 0 * * *,wake-system=1,timeout=320,script-path=https://raw.githubusercontent.com/lxk0301/scripts/master/jd_xtg.js
 */
const $ = new Env('星推官');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
    cookie = '';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
    cookiesArr.push($.getdata('CookieJD'));
    cookiesArr.push($.getdata('CookieJD2'));
}
const starID = [
    'bolangwutiaoren',
    'oulebyangzi',
    'meiditongliya',
    'chuangweimaobuyi',
    'quechaozhuyilong',
    'haierchenxiao',
    'feilipulixian',
    'feilipurenjialun',
    'feilipuwangziyi',
    'changhongsongyi',
    'jiuyangdenglun',
    'aokesilingengxin',
    'haixinchengguo',
    'fangtai',
    'lgyangzishan',
    'laobansongweilong',
    'haiermaoxiaotong',
];
const shareID = [
    '764b03b5-af6a-4148-80a5-9d990301e6a2',
    '7de5698d-ddaa-43e9-9a0c-aae0633432fc',
    '37f3c242-7f44-4606-9285-35d196ad4f08',
    'a27493e8-0bee-460b-92b8-8209f75a6cb5',
    '113d2da6-5d63-44b5-8990-57834d671fc8',
    '6d8ad408-2406-4f26-9a92-d947ec7d292e',
    '807dbf66-7882-4057-b04f-782f6ff4c82f',
    '5cc9d779-7e05-4569-b2ee-4df80879123e',
    '64ed2074-a37f-43b7-9812-e904018e5c6c',
    '9d4e9e4d-8f3d-48f1-ac52-b61f80dc99e7',
    'ac9d641c-861b-4310-a78a-918b19e24b2a',
    '0c63c649-4f30-4556-a9f8-7f9c73948555',
    '471ec200-ccd9-4cdd-a7d6-961eb6357760',
    '0b177778-06bc-449e-85e0-5935b20f2e3e',
    '8875695c-569b-4a96-ae68-7771941803fd',
    '5d588e40-d52e-4ce6-9ac5-a17d3a45a627',
    '6b66b942-7e21-48c5-b3b7-f4ffa6f59771',
];
const JD_API_HOST = 'https://urvsaggpt.m.jd.com/guardianstar';
!(async() => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { "open-url": "https://bean.m.jd.com/" });
        return;
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
            $.index = i + 1;
            console.log(`\n开始【京东账号${$.index}】${$.UserName}\n`);
            // $.activeId = 'aokesilingengxin';
            // await JD_XTG();
            // // await JD_XTG();
            console.log(`一共${starID.length}个${$.name}任务，耗时会很久，请提前知晓，PC测试耗时：100秒`)
            for (let index = 0; index < starID.length; index++) {
                $.activeId = starID[index];
                $.j = index;
                await JD_XTG();
                await doSupport(shareID[index]);
            }
            console.log(`\n延迟10秒后，再去领取\n`)
            await $.wait(10000);
            for (let index = 0; index < starID.length; index++) {
                $.activeId = starID[index];
                $.j = index;
                await JD_XTG();
            }
            await showMsg();
        }
    }
})()
.catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

function showMsg() {
    $.msg($.name, '', `京东账号${$.index} ${$.UserName}任务已做完`)
}
async function JD_XTG() {
    await getHomePage();
    if ($.homeData.code === 200) {
        const { shopList, venueList, productList, shareId } = $.homeData.data[0];
        console.log(`\n活动${$.j + 1}-[${starID[$.j]}] 助力码\n${shareId}\n`);
        for (let item of shopList) {
            console.log(`\n任务一：关注${item['shopName']}`)
            if (item['shopStatus'] === 0) {
                await doTask('shop', item['shopId'], 0)
            }
            if (item['shopStatus'] === 1) {
                await doTask('shop', item['shopId'], 1)
            }
            if (item['shopStatus'] === 2) {
                await doTask('shop', item['shopId'], 2)
            }
            if (item['shopStatus'] === 4) {
                await doTask('shop', item['shopId'], 4)
            }
        }
        for (let item1 of venueList) {
            console.log(`\n任务二：逛逛${item1['venueName']}`)
            if (item1['venueStatus'] === 1) {
                await doTask('venue', item1['venueId'], 1);
            }
            if (item1['venueStatus'] === 2) {
                await doTask('venue', item1['venueId'], 2);
            }
        }
        for (let item2 of productList) {
            console.log(`\n任务三：逛逛${item2['productName']}`)
            if (item2['productStatus'] === 1) {
                await doTask('product', item2['productId'], 1);
            }
            if (item2['productStatus'] === 2) {
                await doTask('product', item2['productId'], 2);
            }
        }
        console.log(`\n开始抽奖\n`)
        await getDayPrizeStatus(4, `${$.activeId}#1`, 3);
        await getDayPrizeStatus(1, `${$.activeId}#2`, 3);
    }
}

function getHomePage() {
    return new Promise(resolve => {
        $.get(taskUrl('getHomePage'), async(err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        $.homeData = JSON.parse(data);
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function doTask(type, id, status) {
    return new Promise(async resolve => {
        $.post(taskPostUrl(type, id, status), (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    console.log(`做任务结果:${data}`);
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function doSupport(shareId) {
    return new Promise(async resolve => {
        const options = {
            "url": `${JD_API_HOST}/doSupport`,
            "body": `starId=${$.activeId}&shareId=${shareId}`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Host": "urvsaggpt.m.jd.com",
                "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    console.log(`助力结果:${data}`);
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function getDayPrizeStatus(prizeType, prizeId, status) {
    return new Promise(async resolve => {
        const options = {
            "url": `${JD_API_HOST}/getDayPrizeStatus`,
            "body": `starId=${$.activeId}&status=${status}&prizeType=${prizeType}&prizeId=${prizeId}`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Host": "urvsaggpt.m.jd.com",
                "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    console.log(`抽奖结果:${data}`);
                    // data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function taskPostUrl(type, id, status) {
    return {
        url: `${JD_API_HOST}/doTask`,
        body: `starId=${$.activeId}&type=${type}&id=${id}&status=${status}`,
        headers: {
            "Accept": "application/json,text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Cookie": cookie,
            "Host": "urvsaggpt.m.jd.com",
            "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        }
    }
}

function taskUrl(function_id) {
    return {
        url: `${JD_API_HOST}/${function_id}?t=${Date.now()}&starId=${$.activeId}`,
        headers: {
            "Accept": "application/json,text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Cookie": cookie,
            "Host": "urvsaggpt.m.jd.com",
            "Referer": "https://urvsaggpt.m.jd.com/static/index.html",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        }
    }
}
// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t }
        send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) }
        get(t) { return this.send.call(this.env, t) }
        post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) }
        isNode() { return "undefined" != typeof module && !!module.exports }
        isQuanX() { return "undefined" != typeof $task }
        isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon }
        isLoon() { return "undefined" != typeof $loon }
        toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } }
        toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } }
        getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch {}
            return s }
        setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } }
        getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) }
        runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } };
                this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) }
        loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } }
        writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } }
        lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i)
                if (r = Object(r)[t], void 0 === r) return s;
            return r }
        lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) }
        getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e }
        setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s }
        getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null }
        setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null }
        initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) }
        get(t, e = (() => {})) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => {!t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t;
                e(s, i, i && i.body) })) }
        post(t, e = (() => {})) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => {!t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) });
            else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t));
            else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t;
                this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                    e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t;
                    e(s, i, i && i.body) }) } }
        time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t }
        msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } };
            this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))); let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
            h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h) }
        log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) }
        logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) }
        wait(t) { return new Promise(e => setTimeout(e, t)) }
        done(t = {}) { const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }