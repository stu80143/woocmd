const uniqid = require('uniqid');
const Chat = require('./Chat.js');
const chalk = require("chalk");
const readline = require("readline");


/**
 * 建立客戶端
 */
class WooClient {
    /**
     * 建構
     * @param {string} session1 _wootalk_session
     * @param {string} id
     */
    constructor(session1, id) {
        this.roomID = uniqid('room-');
        this.chat = new Chat(id+':1');
        this.session1 = session1;
        this.messageCount = 0;
        this.messageCreate = new Date();
    }

    /**
     * 初始化
     */
    init() {
        console.log(chalk.red("WooClient Init"));
        this.chat.listMsg = (data) =>{
          this.messageCount++;
          console.log(this.messageCount)
          if(this.messageCount % 10 === 0)
          {
              console.log(chalk.red("離開 cmdleave"));
          }

          this.messageCreate = new Date();
          // 印出對方訊息
          this.chat.printMessage(data.message,(msg)=>{

          });

        };


        this.chat.listAction = (status) => {
            console.log(status);

            this.chat.sellMsg(status, (msg)=>{
            });

            if (status === 'chat_otherleave') {
                console.log(chalk.red('chat_otherleave'));
                this.restart();
            }

            if (status === 'chat_botcheck') {
                console.log(chalk.red('chat_botcheck'));
            }
        }

        this.chat.init({
            'Cookie': `_wootalk_session=${this.session1};`,
        });


        const nowDate = new Date();
        this.messageCreate = nowDate;
        setTimeout(()=>{
            if (this.messageCreate === nowDate && this.messageCount === 0) {
                this.restart();
            }
        }, 20000);

        setInterval(()=>{
            if (new Date().getTime() - this.messageCreate.getTime() > 1000 * 60 * 3) {
                this.restart();
            }
        }, 1000);
    }

    /**
     * 重新配對聊天
     */
    restart() {
        const nowDate = new Date();
        this.messageCreate = nowDate;
        this.chat.leaveChat();

        setTimeout(()=>{
            console.log(chalk.red("restart->leaveChat->beforeStart"));
                this.roomID = uniqid('room-');
                this.messageCount = 0;
                this.chat.startChat();
        }, 3000);


        setTimeout(()=>{
            if (this.messageCreate === nowDate && this.messageCount === 0) {
                this.restart();
            }
        }, 20000);

        setTimeout(()=>{
            if (this.messageCreate === nowDate && this.messageCount < 6) {
                this.restart();
            }
        }, 120*1000);
    }
}

module.exports = WooClient;
