const Base_SDK = require('./sdk.base');

class MI_SDK extends Base_SDK {
    constructor() {
        super();
        this._miCfg = qg.__sdk_config.miConfig || {};
    }

    init(json) {
        // 初始化逻辑
    }

    unionLogin(object) {
        const { success, fail, complete, isProfileRequired } = object;
        const waitLoginProcess = new Promise((resolve, reject) => {
            console.log('isProfileRequired: ', isProfileRequired);
            qg.login({
                fail: (res) => {
                    reject(res);
                },
                success: (resData) => {
                    resData = resData.data;
                    const targetRes = {
                        ...resData,
                        token: resData.token || resData.session,
                        uid: resData.appAccountId,
                        nickName: resData.nickName || '',
                        avatar: resData.avatar || ''
                    };
                    if (targetRes.nickName || targetRes.avatar) {
                        resolve(targetRes);
                    } else if (isProfileRequired) {
                        qg.getUserInfo({
                            complete: (res) => {
                                targetRes.nickName = res.userInfo.nickName || '';
                                targetRes.avatar = res.userInfo.avatarUrl || '';
                                resolve(targetRes);
                            }
                        });
                    } else {
                        resolve(targetRes);
                    }
                }
            });
        });

        waitLoginProcess
            .then((res) => {
                console.log("xiaomi 登录成功:", res);
                this._safeCallback(success, res);
            })
            .catch((err) => {
                this._safeCallback(fail, err);
            })
            .finally(() => {
                this._safeCallback(complete);
            });
    }

    // 支付接口
    unionPay({ param, success, fail, complete }) {
        const { getOrder } = param;

        getOrder().then(order => {
            if (!order) {
                return;
            }
            const orderInfo = {
                appId: this._miCfg.appid,
                appAccountId: appAccountId,
                session: session,

                cpOrderId: order.cpOrderId,
                cpUserInfo: order.cpUserInfo,
                displayName: order.displayName,
                feeValue: order.feeValue,
                sign: order.sign,
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

module.exports = MI_SDK;
