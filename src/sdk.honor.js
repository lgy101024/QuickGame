const Base_SDK = require("./sdk.base");

class HONOR_SDK extends Base_SDK {
    constructor() {
        super();
        this._honorConfig = qg.__sdk_config.honorConfig || {};
    }

    init(json) {
        // 初始化逻辑，可以根据需要扩展
        console.log('HONOR_SDK 初始化参数:', json);
    }

    // 登录接口
    unionLogin({ success, fail, complete, needAuthCode = false, isProfileRequired = false } = {}) {
        qg.login({
            needAuthCode,
            isProfileRequired,
            fail: (res) => {
                console.error("honor 登录失败");
                this._safeCallback(fail, res);
            },
            success: (res) => {
                try {
                    const resData = res.data;
                    console.log("honor 登录成功");
                    this._safeCallback(success, resData);
                } catch (error) {
                    console.error('处理登录成功回调时异常');
                    this._safeCallback(fail, error);
                }
            },
            complete: () => {
                this._safeCallback(complete);
            }
        });
    }

    // 支付接口
    unionPay({ param, success, fail, complete }) {
        const { productName, productDesc, getOrder } = param;
        getOrder().then(order => {
            if (!order) {
                return;
            }
            const orderInfo = {
                appId: this._honorConfig.appid,
                cpId: cpId,
                productId: productId,
                productName: productName,
                productDesc: productDesc,

                publicKey: order.publicKey,
                orderAmount: order.orderAmount,
                developerPayload: order.developerPayload,
                bizOrderNo: order.bizOrderNo,
                needSandboxTest: 0,
            };
            qg.pay({
                orderInfo,
                success: (payRes) => {
                    this._safeCallback(success, {
                        payRes: payRes,
                        orderId: orderInfo.cpOrderNumber,
                    });
                },
                fail: (payRes) => {
                    this._safeCallback(fail, payRes);
                },
                cancel: (payRes) => {
                    this._safeCallback(fail, payRes);
                },
                complete: () => {
                    this._safeCallback(complete);
                }
            });
        });
    }
}

module.exports = HONOR_SDK;
