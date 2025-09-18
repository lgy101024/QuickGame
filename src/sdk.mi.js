const Base_SDK = require('./sdk.base');
const httpRequest = require('./utils/request');
let miCfg = {}

class MI_SDK extends Base_SDK {
  constructor() {
    miCfg = qg.__sdk_config.miConfig
    super();
  }
  init(json) {
    //初始化
  }
  unionLogin(object) {
    const { success, fail, complete, isProfileRequired } = object;
    const waitLoginProcess = new Promise((resolve, reject) => {
      console.log('isProfileRequired: ', isProfileRequired);
      qg.login({
        fail: function (res) {
          // 登录失败.
          // 这里要统一返回参数，和OVRE的标准保持一致
          reject(res);
        },
        success: function (resData) {
          resData = resData.data;
          // 定义统一后的数据
          const targetRes = {
            ...resData,
            token: resData.token || resData.session,
            uid: resData.appAccountId,
            nickName: resData.nickName || '',
            avatar: resData.avatar || ''
          };
          if (targetRes.nickName || targetRes.avatar) {
            // 小米会在新版本上返回nickName和avatar字段
            // 在有值的情况下直接返回，不在显式获取用户授权
            resolve(targetRes);
          } else if (isProfileRequired) {
            // 这里补齐用户信息nickName、avatar
            qg.getUserInfo({
              complete: function (res) {
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
    let res = null;
    waitLoginProcess
      .then((re) => {
        success && success(re);
        res = re;
      })
      .catch((err) => {
        // 统一返回信息
        res = { code: 400, message: '未知错误' };
        fail && fail(targetRes);
      })
      .finally(() => {
        complete && complete(res);
      });
  }
  // 登陆到CP自己的服务器
  // 按照 VIVO 和小米的思路，将CP和自己服务器交互的逻辑拆分开来。
  gameUserLoginToServer(data) {
    return new Promise((resolve, reject) => {
      if (data.session || data.token) {
        // 登陆成功
        // CP自己服务端的API请求
        httpRequest(
          'http://fe.hy.g.mi.com/tinygame/login',
          { provider: qg.getProvider(), ...data },
          { config: 'config', method: 'post' }
        )
          .then((res) => {
            console.log('CP自己的登陆逻辑完成');
            resolve(res);
          })
          .catch((err) => {
            console.log('登陆异常');
            reject(err);
          });
      }
    });
  }
  //支付接口
  // orderAmount
  // productld
  // extInfo
  // uid
  unionPay(object) {
    const { orderInfo, success, fail, complete } = object;
    console.log(
      'CP自己的创建订单逻辑，可以参考服务端sdk，对参数进行签名等处理'
    );
    httpRequest(
      miCfg.sdkPayUrl,
      { ...orderInfo },
      { config: 'config', method: 'post' }
    )
      .then((res) => {
        // 开始拉起收银台
        let resData = res.data.data;
        let orderInfo = {
          cpOrderId: resData.productld,
          cpUserInfo: JSON.stringify(resData.extInfo) || '{}',
          feeValue: resData.orderAmount,
          displayName: '钻石'
        };
        console.log('orderInfo: ', orderInfo);
        qg.pay({
          orderInfo: { ...orderInfo },
          complete: (data) => {
            const { resultStatus, memo } = data;
            console.log(data);
            if (resultStatus === '9000') {
              console.log('支付完成');
              let targetRes = { code: 0, message: '支付成功' };
              success && success(targetRes);
              complete && complete(targetRes);
            } else {
              // TODO 各家统一返回值
              console.log('支付未成功');
              let targetRes = { code: resultStatus, message: memo };
              fail && fail(targetRes);
              complete && complete(targetRes);
            }
          }
        });
      })
      .catch((err) => {
        // 订单创建异常，CP自己排查
        // TODO 各家统一返回值
        fail && fail(data);
        complete && complete(data);
      });
  }
  // 这里是直接替代qg.pay()接口的参数， 直接调起收银台，上面的封装太复杂了
  // 这个不纳入标准
  // 如果不需要在服务端创建订单，可以直接参考这个实现
  unionPayPure(object) {
    const { orderInfo, success, fail, complete } = object;
    const { orderAmount, productld, extInfo, uid } = orderInfo;
    // 直接使用入参，不在请求服务端
    let targetOrderInfo = {
      cpOrderId: productld,
      cpUserInfo: extInfo || '{}',
      feeValue: orderAmount,
      displayName: '钻石'
    };
    console.log('orderInfo: ', orderInfo);
    qg.pay({
      orderInfo: { ...targetOrderInfo },
      complete: (data) => {
        const { resultStatus, memo } = data;
        console.log(data);
        if (resultStatus === '9000') {
          console.log('支付完成');
          let targetRes = { code: 0, message: '支付成功' };
          success && success(targetRes);
          complete && complete(targetRes);
        } else {
          // TODO 各家统一返回值
          console.log('支付未成功');
          let targetRes = { code: resultStatus, message: memo };
          fail && fail(data);
          complete && complete(data);
        }
      }
    });
  }
}
module.exports = MI_SDK;
