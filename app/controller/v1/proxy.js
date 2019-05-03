/*
 * @Author: Rhymedys/Rhymedys@gmail.com
 * @Date: 2018-07-27 10:35:34
 * @Last Modified by: Rhymedys
 * @Last Modified time: 2019-05-03 09:36:26
 */

'use strict';
const fs = require('fs');
const Controller = require('egg').Controller;
const response = require('../../extend/response');
const uuidv1 = require('uuid/v1');
const tokenUtils = require('../../extend/token');
const crypto = require('crypto');


class ProxyController extends Controller {

    async get() {
        const {
            ctx,
        } = this;

        const {
            url
        } = ctx.request;

        console.log(ctx.request)

        const urlArray = url.replace('/test-proxy/proxy/', '').split('/')


        if (urlArray.length > 1) {

            const checkDomainAndPathInApiConfigRes = await this.checkDomainAndPathInApiConfig(
                urlArray[0],
            )

            if (checkDomainAndPathInApiConfigRes) {
                const {
                    domainAndProjejectPath,
                    loginPath,
                    loginMethod,
                    loginData
                } = checkDomainAndPathInApiConfigRes

                let {
                    auth
                } = checkDomainAndPathInApiConfigRes


                const fetch = async () => {
                    if (!auth) {
                        auth = await this.login(urlArray[0], loginPath, loginMethod, loginData)
                        await fetch()
                    } else {
                        const wholeUrl = urlArray.slice(1).join('/')
                        const apiRes = await ctx.curl(
                            `https://${domainAndProjejectPath}/${wholeUrl}`, {
                                headers: {
                                    Cookie: `JSESSIONID=${auth}`
                                },
                                method: 'GET',
                                dataType: 'json',
                            }
                        )

                        if (apiRes.data && apiRes.data.resultCode !== 410001) {
                            response.snedOther(ctx, apiRes.data)
                        } else if (fetch.retryCount <= 6) {
                            fetch.retryCount += 1
                            auth = undefined
                            await fetch()
                        } else {
                            response.sendFail(ctx, '该借口登录配置错误')
                        }
                    }
                }
                fetch.retryCount = 0

                await fetch()

            } else {
                response.sendFail(ctx, '请求路径，配置有误')
            }
        } else {
            response.sendFail(ctx, '请求路径有误')
        }



    }

    async post() {
        const {
            ctx,
        } = this;

        const {
            url,
            body,
            header
        } = ctx.request;

        console.log(ctx.request)

        const urlArray = url.replace('/test-proxy/proxy/', '').split('/')


        if (urlArray.length > 1) {

            const checkDomainAndPathInApiConfigRes = await this.checkDomainAndPathInApiConfig(
                urlArray[0],
            )

            if (checkDomainAndPathInApiConfigRes) {
                const {
                    domainAndProjejectPath,
                    loginPath,
                    loginMethod,
                    loginData,
                    loginContentType
                } = checkDomainAndPathInApiConfigRes

                let {
                    auth
                } = checkDomainAndPathInApiConfigRes


                const fetch = async () => {
                    if (!auth) {
                        auth = await this.login({
                            appId: urlArray[0],
                            loginPath,
                            loginMethod,
                            loginData,
                            loginContentType
                        })
                        await fetch()
                    } else {
                        const wholeUrl = urlArray.slice(1).join('/')
                        const contentType = header['content-type'] && header['content-type'] === 'application/json' ? 'json' : undefined
                        const apiRes = await ctx.curl(
                            `https://${domainAndProjejectPath}/${wholeUrl}`, {
                                headers: {
                                    Cookie: `JSESSIONID=${auth}`
                                },
                                contentType,
                                method: 'POST',
                                dataType: 'json',
                                data: body
                            }
                        )

                        if (apiRes.data && apiRes.data.resultCode !== 410001) {
                            response.snedOther(ctx, apiRes.data)
                        } else if (fetch.retryCount <= 6) {
                            fetch.retryCount += 1
                            auth = undefined
                            await fetch()
                        } else {
                            response.sendFail(ctx, '该借口登录配置错误')
                        }
                    }
                }
                fetch.retryCount = 0

                await fetch()

            } else {
                response.sendFail(ctx, '请求路径，配置有误')
            }
        } else {
            response.sendFail(ctx, '请求路径有误')
        }
    }


    /**
     * @description 登录
     * @param {*} appId
     * @param {*} loginPath
     * @param {*} loginMethod
     * @param {*} loginData
     * @returns
     * @memberof ProxyController
     */
    async login({
        appId,
        loginPath,
        loginMethod,
        loginData,
        loginContentType
    }) {
        const {
            ctx
        } = this

        console.log(loginData)

        const loginRes = await ctx.curl(
            loginPath,
            {
                method: loginMethod,
                dataType: 'json',
                contentType: loginContentType,
                data: JSON.parse(loginData)
            }
        )

        console.log(loginRes)

        const {
            data
        } = loginRes
        if (Object.prototype.toString.call(data) === '[object Object]') {

            if (data.resultCode === 0 && loginRes.headers['set-cookie'] && loginRes.headers['set-cookie'][0]) {
                const JSESSIONIDReg = new RegExp(/^JSESSIONID=.*?\;/)
                let match = loginRes.headers['set-cookie'][0].match(JSESSIONIDReg)
                if (match) {
                    match = match[0].replace('JSESSIONID=', '').replace(';', '')

                    await ctx.service.api.insert({
                        appId,
                        auth: match
                    })

                    return match[0]
                }
            } else {
                response.send(ctx, data, data.resultCode, data.resultDesc)
            }
        } else {
            response.sendFail(ctx, '登录失败')
        }
    }



    /**
     * @description 查配置
     * @param {*} appId
     * @returns
     * @memberof ProxyController
     */
    async checkDomainAndPathInApiConfig(appId) {
        const {
            ctx
        } = this

        let res
        if (!appId) {
            res = false
        } else {
            res = await ctx.service.api.findByAppId(appId)
        }


        return res
    }

}

module.exports = ProxyController;
