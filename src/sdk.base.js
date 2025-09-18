class Base_SDK {
    constructor() {}
    init(json) {
        //通过json配置，初始化所需要的参数
    }
    //登陆接口
    //object:success, fail, complete
    unionLogin(object) {}
    //支付接口,orderInfo为JSON字符串
    //object: orderInfo, success, fail, complete
    //orderInfo内两个参数如下
    //openId	string	是	qg.login 成功时获得的用户 token
    //orderAmount  商品价格  单位为分，如商品价格为6元则要传“600”，传“6”或者“600.0”则会报错
    //productId	String	是	商品ID    ***选传，只有荣耀需要
    unionPay(object) {}

    //广告相关
    initRewardedVideoAd() {}
    showRewardedVideoAd() {}
    createBannerAd(isShow = false) {}
    showBannerAd() {}
    hideBannerAd() {}
    destroyBannerAd() {}
}
module.exports = Base_SDK;
