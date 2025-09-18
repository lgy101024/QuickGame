const UnionAPI = require("./unionApi");
function Main({config,adInfo}) { 
    console.log("启动统一sdk接口");
    if(qg && qg.unionLogin && qg.unionPay){
        return  // 已经把方法挂载到qg上后就不重新创建了
    }else{
        (new UnionAPI()).init({config,adInfo});
    }
}

window.unionSdkInit = Main;

export default {init:Main}
