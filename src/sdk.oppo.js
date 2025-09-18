const Base_SDK = require("./sdk.base");
let oppoCfg = {}
class OPPO_SDK extends Base_SDK {
    constructor() {
        oppoCfg = qg.__sdk_config.oppoConfig
        super();
    }
    init(json) {
        //初始化
    }
    //登陆接口 
    unionLogin(object) {
        const { success, fail, complete } = object;
        let returnData = {} // 返回的值
        qg.login({
            fail: function (res) {
                //登录失败
                console.log("OPPO 登陆失败", res);
                returnData = res
                try {
                    if (fail) {
                        fail(returnData);
                    }
                } catch (error) {
                    console.error(error);
                }
       
            },
            success: function (res) {
                console.log('login方法返回的值',res)
                var resData = res; // 联盟的标准，返回的值就是res
                qg.__token___ = resData.token // 把token挂载在全局变量qg上
                returnData = {
                    uid:resData.uid,
                    avatar:resData.avatar,
                    nickName:resData.nickName,
                    token:resData.token,
                    code:0
                }
                try {
                    if (success) {
                        success(returnData);
                    }
                } catch (error) {
                    console.error(error);
                }
            },
            complete(){
                try {
                    if (complete) {
                        complete(returnData);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
    }
    //支付接口
    //orderAmount  商品价格  单位为分，如商品价格为6元则要传“600”，传“6”或者“600.0”则会报错
    // productName  商品名称
    unionPay(object) {
        let payFun = ()=>{
            const { orderInfo, success, fail, complete } = object;
            if (orderInfo == null || orderInfo == undefined) {
                console.log("charge orderInfo error");
                return;
            }
            const { orderAmount, productId, productName, extInfo } = orderInfo;
            // 统一下单必填的数据（除了sign）
            let sendData = {
                token: qg.__token___,
                price: orderAmount,
                productId: productId,
                productName:productName,
                appVersion: "1.0.0", //"1.0.0"
                engineVersion: qg.getSystemInfoSync().COREVersion, //"1045"
                extInfo
            };
            console.log(`--- sendData: ${JSON.stringify(sendData)}`);
            let xhr = new XMLHttpRequest();
            // 小游戏示例专用的服务器接口，完成统一下单接口的请求，CP 不可用
            // 注：CP 需要自己搭建服务器接口，调用小游戏文档里的统一下单接口完成签名等操作后获取平台返回的时间戳、订单号、支付签名，再返回数据给小游戏发起支付
            // 注：服务器向平台请求统一下单接口完成签名等操作具体可参考 server 文件夹里的代码
            xhr.open("POST", oppoCfg.sdkPayUrl);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status<400) {
                    // 获取服务器返回的数据后调用文档的发起支付接口
                    let response = JSON.parse(xhr.response)
                    let data = response.data;
                    let code = response.code;
                    let returnData = {}
                    if(code !== '200'){
                        let res = response
                        returnData = {code:102,message:res.message,result:res.message}
                        try {
                            if (fail) {
                                fail(returnData);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                        try {
                            if (complete) {
                                complete(returnData);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                        return
                    }
                    qg.pay({
                        orderInfo: {
                            // 联盟传参统一放在orderInfo字段中
                            appId: oppoCfg.appid,
                            // 登录接口返回的token
                            token: qg.__token___,
                            // 时间戳
                            timestamp: data.timestamp,
                            // 订单号
                            orderNo: data.orderNo,
                            // 支付签名，需要由服务器生成向平台发起统一下单接口后返回
                            paySign: data.paySign,
                        },
                        // 成功回调函数，结果以 OPPO 小游戏平台通知CP的回调地址为准
                        success(res) {
                            console.log(JSON.stringify(res.data));
                            returnData = {code:res.code,message:'支付成功',result:res.orderId}
                            if (success) success(returnData);
                        },
                        fail(res) {
                            // errCode、errMsg
                            console.log(JSON.stringify(res));
                            let code = ''
                            if(res.code == 301004){ // 支付取消
                                code = 101  // code为101时代表支付取消
                            }else{
                                code = 102  // code为102时代表支付失败
                            }
                            returnData = {code:code,message:res.data,result:res.data}
                            if (fail) fail(returnData);
                        },
                        complete(res) {
                            if (complete) complete(returnData);
                        },
                    });
                } else if(xhr.readyState == 4) {
                    console.log(JSON.parse(xhr.response));
                }
            };
            xhr.send(JSON.stringify(sendData));
        }
        if(qg.__token___){ // 如果有token则直接进行支付
            payFun()
        }else{ // 如果没有token则进行获取,然后再进行支付
            qg.login({
                success(res){
                    qg.__token___ = res.token
                    payFun()
                },
                fail(){
                    let returnData = {code:102,message:'登录失败导致支付失败'}
                    try {
                        if (fail) {
                            fail(returnData);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                    try {
                        if (complete) {
                            complete(returnData);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            })
        }
        
    }
}

module.exports = OPPO_SDK;
