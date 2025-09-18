const Base_SDK = require("./sdk.base")
let honorConfig = {}

class HONOR_SDK extends Base_SDK {
    constructor() {
        honorConfig = qg.__sdk_config.honorConfig
        super();
    }
    init(json) {
        //初始化
    }
    //登陆接口
    unionLogin(object) {
        const { success, fail, complete, needAuthCode = false, isProfileRequired = false } = object;
        qg.login({
            needAuthCode: needAuthCode,
            isProfileRequired: isProfileRequired,
            fail: function (res) {
                //登录失败
                try {
                    console.log("HONOR 登陆失败", res);
                    if (fail && typeof fail === 'function') {
                        fail(res);
                    }
                    if (complete && typeof complete === 'function') {
                        complete(res);
                    }
                } catch (error) {
                    console.log(error)
                }
            },
            success: function (res) {
                try {
                    console.log('login方法返回的值', res)
                    const resData = res.data; // 联盟的标准，返回的值就是res
                    console.log("HONOR 登陆成功,获取到 token : " + JSON.stringify(res));
                    if (success && typeof success === 'function') {
                        success(resData)
                    }
                    if (complete && typeof complete === 'function') {
                        complete()
                    }
                } catch (error) {
                    console.log(error)
                }
            },
        });
    }
    //支付接口
    //orderAmount  商品价格  单位为分，如商品价格为6元则要传“600”，传“6”或者“600.0”则会报错
    unionPay(object) {
        const { orderInfo, success, fail, complete } = object;
        if (orderInfo == null || orderInfo == undefined) {
            console.log("charge orderInfo error");
            return;
        }
        let returnData = null
        qg.pay({
            orderInfo: orderInfo,
            success(res) {
                console.log(JSON.stringify(res.data));
                returnData = { code: 0, message: '支付成功', result: res.data }
                if (success) success(returnData);
            },
            fail(res) {
                console.log(JSON.stringify(res));
                returnData = { code: res.errCode, message: res.errMsg, result: '' }
                if (fail) fail(returnData);
            },
            complete(res) {
                if (complete) complete(returnData);
            },
        });
    }
}

module.exports = HONOR_SDK;
