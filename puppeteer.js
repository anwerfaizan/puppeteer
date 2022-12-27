// npm init -y
// npm install minimist
// npm install puppeteer
// node exercise.js --url=https://www.hackerrank.com --config=config.json

let minimist=require("minimist");
let args=minimist(process.argv);
let puppeteer=require("puppeteer");
let fs=require("fs");

let configjson=fs.readFileSync(args.config,"utf-8");
let configjso=JSON.parse(configjson);

async function run()
{
    let browser=await puppeteer.launch({
        headless:false,
        args:[
            '--start-maximized'
        ],
        defaultViewport:null
    });

    let pages=await browser.pages();
    let page=pages[0];

    await page.goto(args.url);

    // await page.waitForSelector("a[data-event-action='Login']");
    // await page.click("a[data-event-action='Login']");

    await page.waitForSelector("a[href='/access-account/']");
    await page.click("a[href='/access-account/']");

    await page.waitForSelector("a[href='/login/']");
    await page.click("a[href='/login/']");

    // await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    // await page.click("a[href='https://www.hackerrank.com/login']");

    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']",configjso.userid,{delay:50});

    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']",configjso.password,{delay:50});

    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");

    // find number of pages
    await page.waitForSelector("a[data-attr1='Last']");
    let numPages=await page.$eval("a[data-attr1='Last']",function(atag)
    {
        let totalPages=parseInt(atag.getAttribute("data-page"));
        return totalPages;
    });

    for(let i=1;i<=numPages;i++)
    {
        await HandleAllContestsOfOnePage(page,browser);
        if(i!=numPages)
        {
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }

    async function HandleAllContestsOfOnePage(page,browser){
    //find all urls of same page
    await page.waitForSelector("a.backbone.block-center");
    let curls=await page.$$eval("a.backbone.block-center", function(atags)
    {
        let urls=[];
        for(let i=0;i<atags.length;i++)
        {
            let url=atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    });


    for(let i=0;i<curls.length;i++)
    {
        let ctab=await browser.newPage();
        await saveModeratorInContest(ctab,args.url + curls[i],configjso.moderator);
        await ctab.close();
        await page.waitForTimeout(2000);
    }
}

    async function saveModeratorInContest(ctab,fullurl,moderator)
    {
        await ctab.bringToFront();
        await ctab.goto(fullurl);
        await ctab.waitForTimeout(2000);

        // click on  moderator tab
        await ctab.waitForSelector("li[data-tab='moderators']");
        await ctab.click("li[data-tab='moderators']")

        // type in moderator
            await ctab.waitForSelector("input#moderator");
            await ctab.type("input#moderator",moderator,{delay:50});

            await ctab.keyboard.press["Enter"];
    }
}
run();