const OPPO_SDK = require("./sdk.oppo");
const VIVO_SDK = require("./sdk.vivo")
const MI_SDK = require("./sdk.mi");
const HONOR_SDK = require("./sdk.honor")
let AD_INFO = {}


class UnionAPI {
    constructor() { }
    init({config,adInfo}) {
        console.log("data  >>>>>>>>");
        qg.__sdk_config = config // 把配置挂载到qg上
        AD_INFO = adInfo || {}
        //获取渠道名称
        this.provider = qg.getProvider();
        console.log(this.provider); // "OPPO"
        this.readJSON();
        qg.unionLogin = this.sdk.unionLogin;
        qg.unionPay = this.sdk.unionPay;
        qg.adInfo = this.adInfo // 把广告配置信息挂载在qg上
    }
    isOPPO() {
        return this.provider === PLATFORM_OPPO;
    }
    isVIVO() {
        return this.provider === PLATFORM_VIVO;
    }
    isXIAOMI() {
        let platformMi = PLATFORM_XIAOMI.toLocaleLowerCase()
        let currPlatform = this.provider.toLocaleLowerCase();
        return platformMi.includes(currPlatform);
    }
    isHONOR() {
        return this.provider === PLATFORM_HONOR;
    }
    readJSON() {
        if (this.isOPPO()) {
            this.sdk = new OPPO_SDK();
            this.adInfo = AD_INFO.oppo // 记录广告配置信息
        } else if (this.isVIVO()) {
            this.sdk = new VIVO_SDK();
            this.adInfo = AD_INFO.vivo // 记录广告配置信息
        } else if (this.isXIAOMI()) {
            this.sdk = new MI_SDK();
            this.adInfo = AD_INFO.mi // 记录广告配置信息
        } else if (this.isHONOR()) {
            this.sdk = new HONOR_SDK()
            this.adInfo = AD_INFO.honor
        }
    }
}
UnionAPI.prototype.test = function () {
    console.log("data  >>>>>>>>2");
};
const PLATFORM_OPPO = "OPPO";
const PLATFORM_VIVO = "vivo";
const PLATFORM_XIAOMI = "XIAOMI,REDMI";
const PLATFORM_HONOR = "HONOR";

module.exports = UnionAPI;
