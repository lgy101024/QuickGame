const OPPO_SDK = require("./sdk.oppo");
const VIVO_SDK = require("./sdk.vivo");
const MI_SDK = require("./sdk.mi");
const HONOR_SDK = require("./sdk.honor");

const PLATFORM_MAP = {
    OPPO: {
        sdk: OPPO_SDK,
        adKey: "oppo",
        aliases: ["OPPO"]
    },
    VIVO: {
        sdk: VIVO_SDK,
        adKey: "vivo",
        aliases: ["VIVO"]
    },
    XIAOMI: {
        sdk: MI_SDK,
        adKey: "mi",
        aliases: ["XIAOMI", "REDMI"]
    },
    HONOR: {
        sdk: HONOR_SDK,
        adKey: "honor",
        aliases: ["HONOR"]
    }
};

class UnionAPI {
    constructor() {
        this.sdk = null;
        this.adInfo = {};
        this.provider = "";
        this.AD_INFO = {};
    }

    init({ config, adInfo }) {
        if (typeof qg === "undefined" || !qg.getProvider) {
            console.error("qg对象不存在或不支持getProvider方法");
            return;
        }

        console.log("初始化数据 >>>>>>>>");

        qg.__sdk_config = config || {};
        this.AD_INFO = adInfo || {};

        this.provider = qg.getProvider() || "";
        console.log("当前平台:", this.provider);

        this.loadSDKAndAdInfo();

        if (this.sdk) {
            qg.unionLogin = this.sdk.unionLogin.bind(this.sdk);
            qg.unionPay = this.sdk.unionPay.bind(this.sdk);
            qg.adInfo = this.adInfo;
        } else {
            console.warn("未找到匹配的平台SDK，unionLogin和unionPay未绑定");
        }
    }

    loadSDKAndAdInfo() {
        const providerUpper = this.provider.toUpperCase();

        for (const key in PLATFORM_MAP) {
            const platform = PLATFORM_MAP[key];
            if (platform.aliases.some(alias => alias.toUpperCase() === providerUpper)) {
                this.sdk = new platform.sdk();
                this.adInfo = this.AD_INFO[platform.adKey] || {};
                return;
            }
        }

        // 未匹配到平台
        this.sdk = null;
        this.adInfo = {};
        console.warn(`未识别的平台: ${this.provider}`);
    }

    isPlatform(platformKey) {
        if (!this.provider) return false;
        const providerUpper = this.provider.toUpperCase();
        const platform = PLATFORM_MAP[platformKey];
        if (!platform) return false;
        return platform.aliases.some(alias => alias.toUpperCase() === providerUpper);
    }

    isOPPO() {
        return this.isPlatform("OPPO");
    }

    isVIVO() {
        return this.isPlatform("VIVO");
    }

    isXIAOMI() {
        return this.isPlatform("XIAOMI");
    }

    isHONOR() {
        return this.isPlatform("HONOR");
    }

    test() {
        console.log("测试方法调用 >>>>>>>>2");
    }
}

module.exports = UnionAPI;
