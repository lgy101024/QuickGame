const Base_SDK = require("./sdk.base");
const CryptoJS = require("crypto-js");
let vivoCfg = {}

class VIVO_SDK extends Base_SDK {
    constructor() {
        vivoCfg = qg.__sdk_config.vivoConfig
        super();
    }
    init() {
    }
    //登陆接口
    unionLogin(object) {
        const {
            success,
            fail,
            complete
        } = object;
        qg.login({
            fail: function (res) {
                //登录失败
                console.log("vivo 登陆失败", res);
                try {
                    if (fail) {
                        fail(res);
                    }
                } catch (error) {
                    console.error(error);
                }

                try {
                    if (complete) {
                        complete(res);
                    }
                } catch (error) {
                    console.error(error);
                }
            },
            success: function (res) {
                console.log('login方法返回的值', res)
                //低版本的 vivo 登陆成功返回的是 res.data
                var resData = res.uid ? res : res.data; // 联盟的标准，返回的值就是res

                // 返回用户信息以及token
                let returnData = {} // 返回的值
                if (resData.uid) {
                    returnData = {
                        uid: resData.uid,
                        avatar: resData.avatar,
                        nickName: resData.nickName,
                        token: resData.token,
                        code: 0
                    }
                    try {
                        if (success) {
                            console.log("vivo 登陆成功: ", returnData);
                            success(returnData);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                } else {

                    // 为了获取包名信息，先获取manifest信息
                    if (!global.qg.manifest) {
                        if (global.qg.getManifestInfoSync) {
                          global.qg.manifest = global.qg.getManifestInfoSync()
                        } else {
                            try {
                                const manifestStr = qg.getFileSystemManager().readFileSync('manifest.json', 'utf8')
                                console.log('-----wx----- manifest解析到global中')
                                global.qg.manifest = JSON.parse(manifestStr)
                            } catch (err) { }
                        }
                    }

                    var pkgName = global.qg.manifest ? global.qg.manifest.package : qg.getSystemInfoSync().miniGame.appId

                    // 如果通过login获取不到用户信息，则通过服务器获取
                    // 账号登陆服务器请求，使用token获取用户信息
                    function requestUserInfo(token, success, fail, complete) {
                        console.log("requestUserInfo token : " + token);
                        // 账号登陆签名算法
                        const appKey = vivoCfg.appKey
                        const appSecret = vivoCfg.appSecret
                        const timestamp = new Date().getTime()
                        const nonce = Math.round(Math.random() * 100000000)

                        function getSignatureContent() {
                            const signMap = {
                                pkgName: pkgName,
                                appKey,
                                appSecret,
                                timestamp,
                                nonce,
                                token
                            }
                            const keys = Object.keys(signMap).sort()
                            let signString = keys.map(key => key + '=' + signMap[key]).join('&')
                            return signString
                        }

                        function sign(content) {
                            const serverSignature = sha256(content)
                            return serverSignature
                        }

                        function sha256(content) {
                            const hash = CryptoJS.SHA256(content);
                            const hex = hash.toString(CryptoJS.enc.Hex);
                            return hex
                        }
                        const signatureContent = getSignatureContent()
                        const serverSignature = sign(signatureContent)

                        const str = "pkgName=" + pkgName + "&token=" + token + "&timestamp=" + timestamp + "&nonce=" + nonce + "&signature=" + serverSignature + "&encodeFlag=false";
                        console.log(str)

                        // 请求服务器获取用户信息
                        qg.request({
                            url: "https://quickgame.vivo.com.cn/api/quickgame/cp/account/userInfo?" + str,
                            success: function (e) {
                                if (!e || !e.data || !e.data.data || !e.data.data.openId) {
                                    console.log("requestUserInfo error", e);
                                    returnData = {
                                        code: 400,
                                        message: '登录失败'
                                    }
                                    try {
                                        if (fail) {
                                            fail(returnData);
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                } else {
                                    console.log("requestUserInfo success", e);
                                    returnData = {
                                        uid: e.data.data.openId,
                                        avatar: e.data.data.biggerAvatar,
                                        nickName: e.data.data.nickName,
                                        token: token,
                                        code: 0
                                    }
                                    try {
                                        if (success) {
                                            console.log("vivo 登陆成功: ", returnData);
                                            success(returnData);
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }
                            },
                            fail: function (e) {
                                console.log(e)
                                try {
                                    if (fail) {
                                        fail(e);
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            },
                            complete: function () {
                                try {
                                    if (complete) {
                                        complete();
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        })
                    }

                    requestUserInfo(resData.token, success, fail, complete);
                }
            }
        });
    }


    //支付接口
    //orderAmount  商品价格  单位为分，如商品价格为6元则要传“600”，传“6”或者“600.0”则会报错
    // productName  商品名称
    unionPay(object) {
        const {
            orderInfo,
            success,
            fail,
            complete
        } = object;
        if (orderInfo == null || orderInfo == undefined) {
            console.log("charge orderInfo error");
            return;
        }

        // 统一下单必填的数据（除了sign）
        let sendData = orderInfo
        console.log(`获取支付下单信息请求: ${JSON.stringify(sendData)}`);

        qg.request({
            url: vivoCfg.sdkPayUrl,
            method: 'POST',
            header: {
                "Content-Type": "application/json"
            },
            data: sendData,
            success: function (e) {
                // 获取服务器返回的数据后调用文档的发起支付接口
                let data = e.data && e.data.data;
                console.log("支付下单信息服务器返回的data:", data);
                let returnData = {}
                if (!data) {
                    returnData = {
                        code: 102,
                        message: res.error,
                        result: res.error
                    }
                    try {
                        if (fail) {
                            fail(returnData);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                    return
                }
                console.log("请求下单orderInfo:", data);
                qg.pay({
                    orderInfo: data,
                    // 成功回调函数，结果以 OPPO 小游戏平台通知CP的回调地址为准
                    success: function (res) {
                        console.log('支付成功：', res);
                        returnData = {
                            code: 0,
                            message: '支付成功',
                            result: res.result
                        }
                        if (success) success(returnData);
                    },
                    fail: function (res) {
                        // errCode、errMsg
                        console.log('支付失败：', res);
                        let code = ''
                        if (res.code == -1) { // 支付取消
                            code = 101 // code为101时代表支付取消
                        } else {
                            code = 102 // code为102时代表支付失败
                        }
                        returnData = {
                            code: code,
                            message: res.data && res.data.message,
                            result: res.data
                        }
                        try {
                            if (fail) {
                                fail(returnData);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    },
                    cancel: function (res) {
                        console.log("支付取消")
                        returnData = {
                            code: 101,
                            message: res.data && res.data.message,
                            result: res.data
                        }
                        try {
                            if (fail) {
                                fail(returnData);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    },
                    complete: function () {
                        try {
                            if (complete) {
                                complete();
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            },
            fail: function (e) {
                console.log(e)
                try {
                    if (fail) {
                        fail(e);
                    }
                } catch (error) {
                    console.error(error);
                }

                try {
                    if (complete) {
                        complete();
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        })
    }
}

module.exports = VIVO_SDK;
