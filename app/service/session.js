/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-07-24 16:16:48
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2018-07-26 10:23:29
 */
'use strict';
const Service = require('egg').Service;

class SessionService extends Service {

  /**
   * 获取数据库操作对象
   *
   * @return {Session} 数据库操作对象
   * @memberof SessionService
   */
  getSessionModel() {
    return this.ctx.model.Session;
  }

  /**
   * 插入数据到数据库,通过OpenId查找数据，如果存在更新，否则插入
   *
   * @param {*} sessionObj session对象
   * @return {Promise} 插入后的promise对象
   * @memberof SessionService
   */
  async insert(sessionObj) {
    if (sessionObj) {
      return this.getSessionModel()
        .findOneAndUpdate({ openId: sessionObj.openId }, sessionObj, { upsert: true });
    }
    return Promise.reject(new Error('sessionObj 为空'));
  }

  /**
   * 通过openId 查找Session
   *
   * @param {*} openId openId 唯一
   * @return {Promise} 查找后Promise对象
   * @memberof SessionService
   */
  async findByOpenId(openId) {
    if (openId) {
      return this.getSessionModel()
        .findOne({
          openId,
        });
    }

    return Promise.reject(new Error('openId 为空'));
  }

  /**
   * 通过sessionId 查找session信息
   *
   * @param {*} JSESSIONID session值
   * @return {Promise} 查找后promise对象
   * @memberof SessionService
   */
  async findBySessionId(JSESSIONID) {
    if (JSESSIONID) {
      return this.getSessionModel()
        .findOne({
          JSESSIONID,
        });
    }

    return Promise.reject(new Error('sessionId 为空'));

  }
}

module.exports = SessionService;
