const Base_SDK = require("./sdk.base");
const CryptoJS = require("crypto-js");

class VIVO_SDK extends Base_SDK {
    constructor() {
        super();
        this._vivoCfg = qg.__sdk_config.vivoConfig || {};
    }

    init() {
        // 初始化逻辑（保持空）
    }

    // 账号登陆服务器请求，使用token获取用户信息
    _requestUserInfo(token, success, fail, complete) {
        console.log("requestUserInfo token:", token);

        const { appKey, appSecret } = this._vivoCfg;
        const timestamp = Date.now();
        const nonce = Math.floor(Math.random() * 100000000);

        // 获取包名
        let pkgName = '';
        if (global.qg.manifest) {
            pkgName = global.qg.manifest.package;
        } else if (global.qg.getManifestInfoSync) {
            try {
                global.qg.manifest = global.qg.getManifestInfoSync();
                pkgName = global.qg.manifest.package;
            } catch (e) {
                console.warn("获取manifest信息失败:", e);
            }
        } else {
            try {
                const manifestStr = qg.getFileSystemManager().readFileSync('manifest.json', 'utf8');
                global.qg.manifest = JSON.parse(manifestStr);
                pkgName = global.qg.manifest.package;
            } catch (e) {
                console.warn("读取manifest.json失败:", e);
            }
        }
        if (!pkgName) {
            try {
                pkgName = qg.getSystemInfoSync().miniGame.appId;
            } catch (e) {
                console.warn("获取appId失败:", e);
                pkgName = '';
            }
        }

        // 生成签名字符串
        const signMap = { pkgName, appKey, appSecret, timestamp, nonce, token };
        const keys = Object.keys(signMap).sort();
        const signString = keys.map(key => `${key}=${signMap[key]}`).join('&');

        // 计算SHA256签名
        const signature = CryptoJS.SHA256(signString).toString(CryptoJS.enc.Hex);

        const queryStr = `pkgName=${pkgName}&token=${token}&timestamp=${timestamp}&nonce=${nonce}&signature=${signature}&encodeFlag=false`;
        const url = `https://quickgame.vivo.com.cn/api/quickgame/cp/account/userInfo?${queryStr}`;

        qg.request({
            url,
            success: (res) => {
                if (!res || !res.data || !res.data.data || !res.data.data.openId) {
                    console.error("requestUserInfo返回数据异常:", res);
                    const returnData = { code: 400, message: '登录失败' };
                    this._safeCallback(fail, returnData);
                } else {
                    const data = res.data.data;
                    const returnData = {
                        uid: data.openId,
                        avatar: data.biggerAvatar,
                        nickName: data.nickName,
                        token,
                        code: 0
                    };
                    console.log("vivo requestUserInfo 成功:", returnData);
                    this._safeCallback(success, returnData);
                }
            },
            fail: (err) => {
                console.error("requestUserInfo请求失败:", err);
                this._safeCallback(fail, err);
            },
            complete: () => {
                this._safeCallback(complete);
            }
        });
    }

    // 登录接口
    unionLogin({ success, fail, complete }) {
        qg.login({
            success: (res) => {
                const resData = res.uid ? res : res.data;
                if (resData.uid) {
                    const returnData = {
                        uid: resData.uid,
                        avatar: resData.avatar,
                        nickName: resData.nickName,
                        token: resData.token,
                        code: 0
                    };
                    console.log("vivo 登录成功");
                    this._safeCallback(success, returnData);
                } else {
                    // 通过服务器接口获取用户信息
                    this._requestUserInfo(resData.token, success, fail, complete);
                }
            },
            fail: (res) => {
                console.error("vivo 登录失败");
                this._safeCallback(fail, res);
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
                appId: this._vivoCfg.appid,
                productName: productName,
                productDesc: productDesc,

                cpOrderNumber: order.cpOrderNumber,
                orderAmount: order.orderAmount,
                notifyUrl: order.notifyUrl,
                vivoSignature: order.vivoSignature,
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

module.exports = VIVO_SDK;
