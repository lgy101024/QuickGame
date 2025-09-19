class Base_SDK {
    constructor() { }
    init(json) {
        //通过json配置，初始化所需要的参数
    }
    // 私有方法，安全调用单个回调
    _safeCallback(callback, data) {
        try {
            if (typeof callback === 'function') {
                callback(data);
            }
        } catch (error) {
            console.error("回调函数执行异常:", JSON.stringify(error));
        }
    }

    //登录
    unionLogin(object) {
        throw new Error('unionLogin 方法需要子类实现');
    }

    //支付
    unionPay(object) {
        throw new Error('unionPay 方法需要子类实现');
    }

    //广告相关
    initRewardedVideoAd() { }
    showRewardedVideoAd() { }
    createBannerAd(isShow = false) { }
    showBannerAd() { }
    hideBannerAd() { }
    destroyBannerAd() { }
}
module.exports = Base_SDK;
