const Base_SDK = require("./sdk.base");

class OPPO_SDK extends Base_SDK {
    constructor() {
        super();
        this._oppoCfg = qg.__sdk_config.oppoConfig || {};
    }

    init(json) {
        // 初始化逻辑（保持空）
    }

    // 登录接口
    unionLogin({ success, fail, complete }) {
        let returnData = {};
        qg.login({
            success: (res) => {
                console.log('oppo 登陆成功');
                qg.__token___ = res.token;
                returnData = {
                    uid: res.uid,
                    avatar: res.avatar,
                    nickName: res.nickName,
                    token: res.token,
                    code: 0
                };
                this._safeCallback(success, returnData);
            },
            fail: (res) => {
                console.error("oppo 登陆失败");
                this._safeCallback(fail, res);
            },
            complete: () => {
                this._safeCallback(complete);
            }
        });
    }

    // 支付接口
    unionPay({ param, success, fail, complete }) {
        const payFun = () => {
            const { getOrder } = param;

            getOrder().then(order => {
                if (!order) {
                    return;
                }
                qg.pay({
                    appId: this._oppoCfg.appid,
                    token: qg.__token___,
                    timestamp: order.timestamp,
                    orderNo: order.orderId,
                    paySign: order.paySign,
                    success: (payRes) => {
                        const returnData = {
                            payRes: payRes,
                            orderId: order.orderId,
                        }
                        this._safeCallback(success, returnData);
                    },
                    fail: (payRes) => {
                        const returnData = {
                            msg: payRes.code === 301004 ? "支付取消" : "支付失败",
                            payRes: payRes,
                            orderId: order.orderId,
                        };
                        this._safeCallback(fail, returnData);
                    },
                    complete: () => {
                        this._safeCallback(complete);
                    }
                });
            });
        };

        if (qg.__token___) {
            payFun();
        } else {
            qg.login({
                success: (res) => {
                    qg.__token___ = res.token;
                    payFun();
                },
                fail: () => {
                    const returnData = { code: 102, message: '登录失败导致支付失败' };
                    this._safeCallback(fail, returnData);
                    this._safeCallback(complete, returnData);
                }
            });
        }
    }
}

module.exports = OPPO_SDK;
