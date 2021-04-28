const puppeteer = require('puppeteer');
const HTMLDecoderEncoder = require('html-encoder-decoder');
const chalk = require('chalk');

const readline = require("readline");

const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const width = 250;
const height = 250;


/**
 * 聊天視窗
 */
class Chat {
    /**
     * 聊天建構
     */
    constructor(id) {
        this.id = id;
        this.page = null;
        this.lastMessageTime = 0;
    }

    startChat(){
        this.page.evaluate(()=>{
            clickStartChat();
            document.querySelector('.mfp-container').click();
        }).catch((err)=>{});
    }

    /**
     * 發送聊天訊息
     * @param  {string}   message 訊息
     * @param  {function} next    回傳函數
     */
    sellMsg(message, next = ()=>{}) {
        const page = this.page;
        r1.question("", function (enterName) {
            if (enterName === "cmdleave")
            {
                console.log(chalk.red("User Leave"));
                page.evaluate( () => {
                    document.querySelector('#messageInput').value = '';
                    document.querySelector('input[value=離開]').click();
                    // changePerson();
                    document.querySelector('#popup-yes').click();
                    setTimeout(()=>{
                        document.querySelector('#ensureText').value = 'leave';
                        document.querySelector('#popup-yes').click();
                    }, 1000);
                });
            }
            else
            {
                page.evaluate((enterName) => {
                        document.querySelector('#messageInput').value = enterName;
                        document.querySelector('input[value=傳送]').click();
                }, enterName);
            }

        });
        next(message);
    }

    /*
     * 離開聊天室
     */
    leaveChat() {
        console.log(chalk.red("leaveChat..."));
        this.page.evaluate(() => {
            document.querySelector('#messageInput').value = '';
            document.querySelector('input[value=離開]').click();
            // changePerson();
            document.querySelector('#popup-yes').click();
            setTimeout(()=>{
                document.querySelector('#ensureText').value = 'leave';
                document.querySelector('#popup-yes').click();
            }, 1000);
        });
    }

    init(headers){
        console.log('Chat Init');
        (async()=>{
            const browser = await puppeteer.launch({
                headless: false,
                args:[
                    `--window-size=${width},${height}`,
                ],
                slowMo:100,
            });
            this.page = await browser.newPage();
            await this.page.setViewport({width, height: height-150});
            await this.page.setExtraHTTPHeaders(headers);
            await this.page.goto('https://wootalk.today/');

            const client = await this.page._client;

            client.on('Network.webSocketCreated', ({requestId, url}) => {
                // console.log('Network.webSocketCreated', requestId, url)
            });

            client.on('Network.webSocketClosed', ({requestId, timestamp}) => {
                // console.log('Network.webSocketClosed', requestId, timestamp)
            });

            client.on('Network.webSocketFrameSent', ({requestId, timestamp, response}) => {
                // console.log('Network.webSocketFrameSent', requestId, timestamp, response.payloadData)
            });

            client.on('Network.webSocketFrameReceived', ({requestId, timestamp, response}) => {
                console.log(`【${this.id}】`, "reqID:"+requestId, "time:"+timestamp, "resp_payloadData:"+response.payloadData);

                if (response.payloadData.indexOf('[["update_state"') === 0) {
                    const aRegExp =/\{.*\}/;
                    const updateState = JSON.parse(response.payloadData.match(aRegExp));
                    const data = updateState.data;

                    if (data.typing) {
                        this.listTyping(true);
                    } else {
                        this.listTyping(false);
                    }
                }
                if (response.payloadData.indexOf('[["new_message"') === 0) {
                    // console.log("response payload new message === 0");
                    const aRegExp =/\{.*\}/;
                    const newMessage = JSON.parse(response.payloadData.match(aRegExp));
                    const data = newMessage.data;
                    //  發出訊息
                    this.sellMsg(data.status, (msg)=>{
                    });

                    if (data.sender === 2) {
                        if (this.lastMessageTime != data.time) {
                            data.message = HTMLDecoderEncoder.decode(data.message);
                            this.listMsg(data);
                        }
                        this.lastMessageTime = data.time;
                    }
                    if (data.sender === 0) {
                        this.listAction(data.status);
                        if (data.status === 'announce') {
                            // this.sellMsg("");
                            // console.log('announce');
                            // this.page.evaluate(() => {
                            //     if (document.querySelector('#messageInput').value === 'typing') document.querySelector('#messageInput').value = '';
                            //     document.querySelector('input[value=傳送]').click();
                            //     // sendMessage();
                            // });
                        }
                    }
                    if (data.length === 1) {
                        this.listAction(data[0].status);
                    }
                }
            });
        })();
    }

    /**
     * 監聽聊天訊息
     */
    listMsg() {}

    /**
     * 監聽正在輸入
     */
    listTyping() {}

    /**
     * 監聽動作
     * @param  {string} status 動作名稱
     */
    listAction(status) {}

    /**
     * 印出聊天訊息
     * @param  {string}   message 訊息
     * @param  {function} next    回傳函數
     */
    printMessage(message, next = ()=>{}) {
        console.log(chalk.yellow(message+"\n"));
        next(message);
    }
}

module.exports = Chat;
