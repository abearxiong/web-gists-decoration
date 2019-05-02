// ==UserScript==
// @name         关于web gists 的装饰
// @name:en      web gists decoration
// @namespace    https://github.com/abearxiong/
// namespace     https://gists.github.com/
// @version      1.0.0
// @icon         https://github.githubassets.com/favicon.ico
// @description  悬浮显示目录
// @homepageURL  https://github.com/abearxiong/web-gists-decoration
// homepage      https://gist.github.com/abearxiong/dab578c4c075993c16757f774ab09927/
// @author       Abearxiong
// @updateURL    https://gist.github.com/abearxiong/dab578c4c075993c16757f774ab09927/raw/7017d54ae01e4475a64ea6af82d23e5d7732beb7/new-web.gists.decoration.user.js
// updateURL     https://github.com/abearxiong/web-gists-decoration/raw/master/web.gists.decoration.user.js
// @supportURL   https://github.com/abearxiong/web-gists-decoration/issues
// @match        https://gist.github.com/*
// grant         none
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceURL
// @grant        GM_getResourceText
// @require     https://cdn.jsdelivr.net/npm/jquery@3.4.0/dist/jquery.min.js
// @require     https://cdn.jsdelivr.net/npm/jquery-ui@1.12.1/ui/widget.min.js
// @resource bootstrap    https://cdn.bootcss.com/twitter-bootstrap/4.3.1/css/bootstrap.min.css
// @run-at document-end  //脚本运行在之后
// ==/UserScript==
// 描述
var $ = jQuery.noConflict( )
//$("head").append(`<link href="https://cdn.bootcss.com/twitter-bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">`) // 现在因为csp问题 关于一些其他的script或者link是不能直接运行在网站上面的
var bootstrap = GM_getResourceText("bootstrap")
//$("head").append(`<style>${bootstrap}</style>`) //添加CSS模块
function cssText(){
    let c= `
<style>
input[type=radio]:checked + label{
color: blue;
}
</style>
`
    return c
}
$("head").append(cssText());
$(document).ready(function() {
    //'use strict';
    //var jq = jQuery.noConflict( ); // $冲突 解决办法
    decoration()
    globalDecoration.decoration()
});
// 路由: 判断gists处于某个页面
var routers = {
    discover: Symbol("discover"),
    edit: Symbol("edit"),
    index: Symbol("index"),
    gists: Symbol("gists")
}
var filesTab = []
var editGistFiles = []
var globalDecoration ={
    decoration: function(){
        let topIcon = $(`<svg t="1556761856290" class="top-icon" style="position:fixed;bottom: 25px;right: 15px;z-index:20" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5236" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32"><defs><style type="text/css"></style></defs><path d="M535.12 442.432v210.016a16 16 0 0 1-16 16h-16.16a16 16 0 0 1-16-16V440.208l-32.88 32.864a16 16 0 0 1-11.312 4.688h-28.304a14.464 14.464 0 0 1-10.24-24.688l97.824-97.808a11.136 11.136 0 0 1 15.744 0l97.808 97.808a14.464 14.464 0 0 1-10.24 24.688h-28.288a16 16 0 0 1-11.312-4.688l-30.64-30.64zM512 800c159.056 0 288-128.944 288-288s-128.944-288-288-288-288 128.944-288 288 128.944 288 288 288z m0 48c-185.568 0-336-150.432-336-336s150.432-336 336-336 336 150.432 336 336-150.432 336-336 336z" p-id="5237" fill="#1296db"></path></svg>`)
        topIcon.css("display","none")
        $("body").append(topIcon)
        this.setting()
    },
    setting: function(){
        let topIcon = $(".top-icon")
        $(window).scroll(function(){
            //console.log("ttt",$(window).scrollTop())
            if($(window).scrollTop()>200){
                topIcon.show();
            }else{
                topIcon.hide()
            }
        })
        topIcon.click(function(){
            //$(window).scoll()
            $("body,html").animate({
                scrollTop:0 //scroll_offset.top //让body的scrollTop等于pos的top，就实现了滚动
            })
        })
        let objs={ header : $('.Header'), footer : $('.footer'), gisthead : $('.gisthead')}
        let setobjs = { header : $("#setting-header"), footer : $("#setting-footer"), gisthead : $("#setting-gisthead")}
        let settingIcon = $(".setting-icon")
        let editIcon = $(".edit-icon")
        let gistsContentSetting = $(".gists-content-setting")
        //console.log(getValue("gistContentSetting"))
        if(getValue("gistContentSetting")){
            gistsContentSetting.hide()
        }
        settingIcon.click(function(){
            let show = getValue("gistContentSetting")
            setValue("gistContentSetting",show=="show"?"":"show")
            gistsContentSetting.slideToggle()
        })
        this.checkbox(objs,setobjs)
    }
    ,checkbox: function(objs,setobjs){
            for(let index in objs){//设置保存的内容勾选
            let checked = getValue(index) || false
            //console.log(index,checked)
            setobjs[index].attr("checked",checked ||false)
            if(checked){
                objs[index].hide()
            }else{
                objs[index].show()
            }
        }
        for(let index in setobjs){
            setobjs[index].change(function(){
                let checked = setobjs[index].is(":checked")
                setValue(index,checked?"checked":"")
                //console.log("index:",index,"setobjs",checked)
                if(checked){
                    objs[index].hide()
                }else{
                    objs[index].show()
                }
            })
        }
    }
}
// 工具
function endwith(){
    var url = document.URL
    if(url.endsWith("/discover")){
        // 是discover页面
        return routers.discover
    }
    if(url.endsWith("/edit")){
        // 是编辑内容
        return routers.edit
    }
    if(url.split('/').length == 4){
        // 是用户首页
        return routers.index
    }
    // 是gists显示页面
    return routers.gists
}
function decoration(){
    let result = endwith()
    switch(result){
        case routers.edit:
            // 装饰编辑页面
            eidtDecorationContent()
            break;
        case routers.gists:
            gistsDecorationContent()
            break
        default:
            break
    }
}
function gistsDecorationContent(){
    let gistContent = $(".gist-content")
    gistContent.prepend(gistsFileShow())
    gistsSetting()
    let body = $("body")
    function gistsFileShow(){
        let files = $(".file")
        //console.log("file个数",files.length,"内容")
        for(let i=0;i<files.length; i++){
            //console.log($(files[i]).attr("id"))
            let filesname = $(files[i]).attr("id")
            let fileTab = {}
            fileTab.id = filesname
            fileTab.name = filesname.slice(5).replace(/-/g,".")
            fileTab.show = false
            fileTab.tab = filesname+"-tab"
            fileTab.content = $(`#${filesname}`)
            filesTab.push(fileTab)
        }
        if(files.length>0)filesTab[0].show = true
        // 判断浏览器语言
        let tabTitle = getLanguageTitle() || "tab of content"
        let div = $("<div></div>")
        let choose = $(`<div class="choose-files"></div>`)
        let turnFile =$(`<div class="turn-files"></div>`)
        filesTab.map(function(val){
            let span = $("<span></span>")
            let link = $(`<label class="choose-gists btn btn-sm" for="${val.id}-tab"> ${val.name}</label>`)
            let inputLink = $(`<input name="choose-radio" type="radio" id="${val.id}-tab" ${val.show?"checked":''} hidden>`)
            inputLink.appendTo(span)
            link.appendTo(span)
            span.appendTo(choose)
            let a = $(`<a class="turn-file btn btn-sm" href="#${val.id}"> ${val.name} </a>`)
            turnFile.append(a)
        })
        turnFile.appendTo(div)
        choose.appendTo(div)
        if(!getValue("gistShowAll")){
            showGist()
            turnFile.css("display","none")
        }
        else{
            showAllGist()
            choose.css("display","none")
        }
        let content = $(`<div class="gists-decoration"></div>`)
        let contentTitle = $(`<div class="gists-decoration-title">${tabTitle}</div>`)
        //contentTitle.appendTo(content)
        let setting = $(`
<form class="gists-content-setting">
<fieldset>
no header:<input id="setting-header" type="checkbox">
no gistshead:<input id="setting-gisthead" type="checkbox">
no comments:<input id="setting-comments" type="checkbox">
no footer:<input id="setting-footer" type="checkbox">
show all gist:<input id="setting-show-all-gist" type="checkbox">
</fieldset>
</form>
`)
        let settingIcon = $(`<svg t="1556706192571" class="setting-icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4701" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M924.4 464.9c-3.4-25.4-25.2-44.6-50.5-44.6-1.2 0-4 0.2-5.2 0.3v0.1c-0.6 0.1-1.2 0.2-1.8 0.2-1.3 0.1-2.7 0.3-4 0.6-0.4 0.1-2.3 0.6-2.7 0.7-20 5.2-40.9-4.1-51.8-21.3-6.4-10.6-8.1-23-4.9-35.1 3.1-11.9 11-22.2 21.9-28.3 11.7-6.8 20.1-17.9 23.5-31.2 3.3-12.8 1.6-26.2-5.9-39.2l-4.1-6c-20.8-26.4-43.5-49.2-69.6-69.6-0.3-0.3-0.7-0.6-1.1-0.9-20.8-16.4-52.8-13-70.3 7.4l-2.1 2.7-3.3 5.1c-10.3 17.1-33.1 25.6-51.7 20.7-24.7-6.6-39.6-31.9-33.1-56.5 0.2-0.7 0.3-1.4 0.5-2.1 6-26.6-10.3-53.5-38.5-61.1-1-0.3-3.9-0.6-5-0.8-32.8-3.8-67.4-3.9-100 0-0.4 0-0.7 0.1-1.1 0.1-13.3 1.5-25.3 8.2-33.6 18.8-8.2 10.3-12 23.6-10.3 38.9 0.1 1 0.3 2.1 0.5 3.1 0.1 0.4 0.6 2.4 0.7 2.7 5 19.5-3.8 40.9-21.3 51.8-0.4 0.2-0.8 0.5-1.1 0.8-21.1 12-50 3.7-62.2-17.6-13.4-22.9-41.2-34.2-70.1-17.8L259 191c-26.7 21-49.8 44.1-70.3 70.4-8.5 10.7-12.3 23.9-10.7 37.3 1.5 12.9 8 24.8 18.2 33.3 0.8 0.7 1.7 1.3 2.6 1.9l5 3.2c17.2 10.4 25.7 31.7 21.5 49.3-0.3 0.8-0.6 1.9-0.8 2.7-5.3 20.4-23.7 34.6-44.5 34.6-3.8 0-7.8-0.5-12.7-1.8-29.1-7.3-54.9 9.8-62.5 38.6-0.2 0.9-0.6 3.7-0.7 4.7-3.9 33.2-3.9 66.8-0.1 99.9 0 0.3 0 0.6 0.1 0.9 2.7 25.4 24 44.6 51.4 44.6 1.2-0.1 3.4-0.2 5.3-0.6 1.4-0.1 2.9-0.3 4.3-0.6 0.7-0.1 1.5-0.3 2.2-0.5 18.6-4.9 41.1 3.8 52 21.3 6.4 10.6 8.1 23 4.9 35.1-3.2 11.9-11 22.2-22 28.4-11.6 6.8-19.9 17.9-23.4 31.2-3.3 12.8-1.6 26.1 6 39.3l4 5.8c20.8 26.5 43.6 49.3 69.9 69.9 0.3 0.2 0.5 0.4 0.8 0.6 20.8 16.4 52.8 13 70.3-7.4l2.1-2.7 3.3-5.1c10.3-17.2 33.2-25.7 51.7-20.7 24.7 6.6 39.6 31.9 33.1 56.5-0.2 0.6-0.3 1.3-0.5 2-5.9 26.3 10 53.2 36.7 60.7 0.6 0.2 2 0.6 2.7 0.7 0.9 0.2 3.2 0.6 4.1 0.7 16.8 1.9 33.8 2.8 50.5 2.8 16.6 0 33.5-1 51.1-3 13.3-1.9 25.1-8.8 33.5-19.5 8.4-10.8 12-24.2 9.9-40-0.2-1.6-0.6-3.1-0.9-4.4-5.1-19.7 3.6-41.2 21.2-52.1 0.4-0.2 0.8-0.5 1.2-0.8 21.1-11.9 50.1-3.7 62.2 17.6 13.5 23.2 42.1 34.1 70.2 17.7l6-4.1c26.7-21 49.7-44.1 70.2-70.4 8.5-10.7 12.3-24 10.7-37.3-1.5-12.9-8-24.8-18.2-33.3-0.8-0.7-1.7-1.3-2.6-1.9l-5-3.2c-17.2-10.4-25.7-31.7-21.5-49.3 0.3-0.8 0.6-1.9 0.9-2.7 5.3-20.4 23.6-34.6 44.5-34.6 3.9 0 7.9 0.5 12.7 1.8 28.8 7.3 54.4-9.4 62.4-38.5 0.5-2.1 0.8-2.9 0.8-5 4.5-31.9 4.7-65.5 0.6-100.1z m-27.8 96.5l-0.3 2.2v0.3c-0.1 0.4-0.2 0.9-0.3 1.3-2.9 10.3-12.2 17.5-22.8 17.5-2 0-3.9-0.3-5.8-0.8l-0.4-0.1-0.4-0.1c-6.3-1.6-12.6-2.4-18.7-2.4-33.3 0-62.6 22.7-71.1 55.2l-0.1 0.3-0.1 0.3c-7.8 31.8 5.8 65.4 33.3 81.9l4.1 2.7c4.8 4 7.8 9.5 8.5 15.4 0.5 4.2 0.1 10.6-4.9 16.9-19.4 24.9-40.9 46.4-65.7 65.9l-4.2 2.8c-3.5 2-7.2 3-11.1 3-8.2 0-16-4.4-20.2-11.6-13-22.9-37.5-37.1-64-37.1-13.2 0-26.2 3.6-37.5 10.5l-0.1 0.1-0.1 0.1c-27.8 17.4-41.4 51.3-33.3 82.4l0.1 0.3 0.1 0.3 0.1 0.4v0.3l0.3 2.1c0.8 6.1-0.9 12.2-4.7 17.1-3.9 5-9.5 8.2-15.7 9.1-15.8 1.8-31.7 2.7-47.1 2.7-15.5 0-31.5-0.9-47.4-2.7l-1.4-0.2c-0.5-0.1-1-0.3-1.5-0.4-12.5-3.5-20-16.4-16.6-28.9v-0.2c10.3-39.2-13.3-79.7-52.7-90.2-6-1.6-12.3-2.4-18.9-2.4-26 0-50.2 13.5-63.5 35.5l-2.7 4.1c-4.7 5.5-11.3 8.7-18.3 8.7-3.5 0-8.9-0.9-14.1-5l-0.1-0.1-0.1-0.1c-24.9-19.4-46.4-40.9-65.9-65.7l-2.8-4.2c-2.9-5.1-3.7-11.2-2.2-17.1 1.6-6.1 5.4-11.2 10.7-14.3 17.1-9.6 29.7-26.1 34.7-45.1 5.1-19.3 2.3-39.2-7.9-56.3l-0.2-0.3-0.2-0.3c-13.7-22-38.2-35.5-63.9-35.5-6.3 0-12.5 0.8-18.5 2.4h-0.2l-0.6 0.2h-1.1l-2.6 0.5c-0.1 0-0.6 0.1-1.7 0.1-11.4 0-21.3-8.8-22.5-20.2v-0.2c-3.7-31.4-3.7-63.1 0-94.5l0.2-1.8 0.2-0.9c2.8-10.5 12.2-18 22.9-18 2 0 3.9 0.3 5.8 0.8l0.4 0.1 0.4 0.1c6.3 1.6 12.6 2.4 18.7 2.4 33.3 0 62.6-22.7 71.1-55.2l0.1-0.3 0.1-0.3c7.8-31.8-5.8-65.4-33.3-81.9l-4.1-2.7c-4.8-4-7.8-9.5-8.5-15.4-0.5-4.2-0.1-10.6 4.9-17 19.4-24.9 40.9-46.4 65.7-65.9l4.3-2.8c3.4-1.9 7.2-3 11.1-3 8.2 0 15.9 4.4 20.2 11.6 13 22.9 37.5 37.1 64 37.1 13.2 0 26.2-3.6 37.5-10.5l0.1-0.1 0.1-0.1c27.6-17.3 41.3-50.9 33.4-81.9-0.1-0.6-0.3-1.1-0.4-1.6v-0.1l-0.3-2.1c-0.8-6.1 0.9-12.2 4.7-17 3.8-4.8 9.2-7.8 15.2-8.5h0.2c15.8-1.9 31.8-2.8 47.3-2.8 15.5 0 31.5 0.9 47.1 2.7l1.8 0.2 0.8 0.2c12.7 3.4 20.4 16.4 17.1 29v0.2c-10.3 39.2 13.3 79.7 52.7 90.2 6 1.6 12.3 2.4 18.9 2.4 26 0 50.2-13.5 63.5-35.5l2.7-4.1c4.7-5.5 11.3-8.7 18.2-8.7 3.5 0 8.9 0.9 14.1 5l0.1 0.1 0.1 0.1c24.9 19.4 46.4 40.9 65.9 65.7l2.8 4.2c2.9 5.1 3.7 11.2 2.2 17.1-1.6 6.1-5.4 11.2-10.7 14.3-17.1 9.6-29.7 26.1-34.7 45.1-5.1 19.3-2.3 39.2 7.9 56.3l0.2 0.3 0.2 0.3c13.7 22 38.2 35.5 63.9 35.5 6.1 0 12.1-0.8 18-2.3 0.5-0.1 1.1-0.3 1.6-0.4h0.8l2.6-0.5c0.1 0 0.6-0.1 1.7-0.1 11.6 0 21.7 8.9 23.3 20.8 3.8 32.3 3.6 63.5-0.5 93.1z" fill="#1296db" p-id="4702"></path><path d="M513.7 403c-68.5 0-124 55.5-124 124 0 7.1 1.1 15 2.3 21.8 0 0.1 0.3 0.1 0.3 0.1 1.5 6 6.6 10.5 13.1 10.5 7.6 0 13.8-6.2 13.8-13.8 0-1.1-0.4-2-0.6-3l0.2-0.1c-0.8-5.1-1.6-10.3-1.6-15.6 0-53.2 43.3-96.5 96.5-96.5s96.5 43.3 96.5 96.5-43.3 96.5-96.5 96.5c-23.6 0-44.9-8.8-61.7-22.9l-0.2 0.2c-2.4-1.9-5.2-3.2-8.5-3.2-7.6 0-13.8 6.2-13.8 13.8 0 4.3 2.1 8 5.2 10.5 0.1 0.1-0.1 0.2 0 0.3 21.5 17.9 48.7 28.9 78.9 28.9 68.5 0 124-55.5 124-124 0.2-68.5-55.4-124-123.9-124z" fill="#1296db" p-id="4703"></path></svg>`)
        //let editIcon = $(`<svg t="1556718087866" class="edit-icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4633" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M187.076923 657.723077l175.261539 175.261538c7.876923 7.876923 19.692308 7.876923 27.56923 0L827.076923 393.846154c7.876923-7.876923 7.876923-19.692308 0-27.569231l-173.292308-173.292308c-7.876923-7.876923-19.692308-7.876923-27.56923 0L187.076923 632.123077c-7.876923 7.876923-7.876923 19.692308 0 25.6zM710.892308 112.246154c-7.876923 7.876923-7.876923 19.692308 0 27.569231l173.292307 173.292307c7.876923 7.876923 19.692308 7.876923 27.569231 0l49.230769-49.230769c31.507692-29.538462 31.507692-76.8 0-108.307692l-92.553846-92.553846c-31.507692-31.507692-80.738462-31.507692-112.246154 0l-45.292307 49.230769z m-669.538462 836.923077c-3.938462 19.692308 13.784615 37.415385 33.476923 33.476923l214.646154-51.2c7.876923-1.969231 13.784615-5.907692 17.723077-9.846154l3.938462-3.938462c3.938462-3.938462 5.907692-17.723077-1.969231-25.6l-177.230769-177.230769c-7.876923-7.876923-21.661538-5.907692-25.6-1.969231l-3.938462 3.938462c-5.907692 5.907692-7.876923 11.815385-9.846154 17.723077L41.353846 949.169231z" p-id="4634" fill="#1296db"></path></svg>`)
        let editIcon = $(`<svg t="1556718766471" class="edit-icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4860" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M331.162352 847.656713 889.919259 288.923342c12.44852-12.45466 12.44852-32.69054 0-45.146223l-67.744917-67.734684-67.713194-67.720358c-12.471033-12.472056-32.69054-12.472056-45.170782 0L150.441361 667.186432c-3.585665 2.915399-6.359848 6.898107-7.786337 11.659551L80.811514 884.612393c-2.619664 8.745175-0.024559 17.810644 6.002714 23.843034l1.676176 1.302669 1.300622 1.674129c6.03239 6.02625 15.09786 8.622378 23.845081 6.009877l205.77255-61.850673C324.226383 854.142427 328.231603 851.303776 331.162352 847.656713zM743.159754 164.754345l45.584198 45.584198 44.719504 44.725644c6.243191 6.237051 6.243191 16.35448 0 22.574135l-79.000262 78.999239L641.578194 243.754606l79.000262-79.000262C726.82267 158.518317 736.924749 158.518317 743.159754 164.754345zM138.203642 860.042811l48.523133-161.420413 432.271144-432.279331 112.882953 112.882953L299.578006 811.536051 138.203642 860.042811z" p-id="4861" fill="#1296db"></path></svg>`)
        div.append(settingIcon)
        div.append(editIcon)
        div.append(setting)
        div.appendTo(content)
        return content
    }
    function gistsSetting (){
        let objs={ comments : $('.discussion-timeline-actions')}
        let setobjs = { comments : $("#setting-comments")}
        let setgistShowAll = $("#setting-show-all-gist")
        let editIcon = $(".edit-icon")
        globalDecoration.checkbox(objs,setobjs)
        setgistShowAll.attr("checked",getValue("gistShowAll") ||false)
        setgistShowAll.change(function(){
            let checked = setgistShowAll.is(":checked")
            setValue("gistShowAll",checked?"checked":"")
            if(checked){
                showAllGist()
            }else{
                showGist()
            }
        })
        editIcon.click(function(){
            let currentUrl = document.URL.replace(/#.*/,"")
            window.location.href = currentUrl +"/edit"
        })
        let chooseGists = $(".choose-gists")
        for(let i = 0;i<chooseGists.length;i++){
            let choose = $(chooseGists[i])
            choose.click(function(){
                for(let index in filesTab){
                    if(i == index){
                        filesTab[index].show = true
                    }else{
                        filesTab[index].show = false
                    }
                }
                showGist()
            })
        }
    }
    function showGist(){
        filesTab.map(function(val,index){
            if(val.show){
                val.content.show()
            }else{
                val.content.hide()
            }
        })
        $(".choose-files").show()
        $(".turn-files").hide()
    }
    function showAllGist(){
        filesTab.map(function(val){
            val.content.show()
        })
        $(".choose-files").hide()
        $(".turn-files").show()
    }
}
function eidtDecorationContent(){
    let showIndex = 0
    editShow()
    function editShow(){
        // 设置
        let gists = $("#gists")
        let div = $(`<div class="edit-decoration"></div>`)
        let setting = $(`
<form class="gists-content-setting">
no header:<input id="setting-header" type="checkbox">
no gistshead:<input id="setting-gisthead" type="checkbox">
no footer:<input id="setting-footer" type="checkbox">
no cancel:<input id="setting-return" type="checkbox">
no 显示所有:<input id="setting-show-all" type="checkbox">
</form>
`)
        let settingIcon = $(`<svg t="1556706192571" class="setting-icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4701" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><defs><style type="text/css"></style></defs><path d="M924.4 464.9c-3.4-25.4-25.2-44.6-50.5-44.6-1.2 0-4 0.2-5.2 0.3v0.1c-0.6 0.1-1.2 0.2-1.8 0.2-1.3 0.1-2.7 0.3-4 0.6-0.4 0.1-2.3 0.6-2.7 0.7-20 5.2-40.9-4.1-51.8-21.3-6.4-10.6-8.1-23-4.9-35.1 3.1-11.9 11-22.2 21.9-28.3 11.7-6.8 20.1-17.9 23.5-31.2 3.3-12.8 1.6-26.2-5.9-39.2l-4.1-6c-20.8-26.4-43.5-49.2-69.6-69.6-0.3-0.3-0.7-0.6-1.1-0.9-20.8-16.4-52.8-13-70.3 7.4l-2.1 2.7-3.3 5.1c-10.3 17.1-33.1 25.6-51.7 20.7-24.7-6.6-39.6-31.9-33.1-56.5 0.2-0.7 0.3-1.4 0.5-2.1 6-26.6-10.3-53.5-38.5-61.1-1-0.3-3.9-0.6-5-0.8-32.8-3.8-67.4-3.9-100 0-0.4 0-0.7 0.1-1.1 0.1-13.3 1.5-25.3 8.2-33.6 18.8-8.2 10.3-12 23.6-10.3 38.9 0.1 1 0.3 2.1 0.5 3.1 0.1 0.4 0.6 2.4 0.7 2.7 5 19.5-3.8 40.9-21.3 51.8-0.4 0.2-0.8 0.5-1.1 0.8-21.1 12-50 3.7-62.2-17.6-13.4-22.9-41.2-34.2-70.1-17.8L259 191c-26.7 21-49.8 44.1-70.3 70.4-8.5 10.7-12.3 23.9-10.7 37.3 1.5 12.9 8 24.8 18.2 33.3 0.8 0.7 1.7 1.3 2.6 1.9l5 3.2c17.2 10.4 25.7 31.7 21.5 49.3-0.3 0.8-0.6 1.9-0.8 2.7-5.3 20.4-23.7 34.6-44.5 34.6-3.8 0-7.8-0.5-12.7-1.8-29.1-7.3-54.9 9.8-62.5 38.6-0.2 0.9-0.6 3.7-0.7 4.7-3.9 33.2-3.9 66.8-0.1 99.9 0 0.3 0 0.6 0.1 0.9 2.7 25.4 24 44.6 51.4 44.6 1.2-0.1 3.4-0.2 5.3-0.6 1.4-0.1 2.9-0.3 4.3-0.6 0.7-0.1 1.5-0.3 2.2-0.5 18.6-4.9 41.1 3.8 52 21.3 6.4 10.6 8.1 23 4.9 35.1-3.2 11.9-11 22.2-22 28.4-11.6 6.8-19.9 17.9-23.4 31.2-3.3 12.8-1.6 26.1 6 39.3l4 5.8c20.8 26.5 43.6 49.3 69.9 69.9 0.3 0.2 0.5 0.4 0.8 0.6 20.8 16.4 52.8 13 70.3-7.4l2.1-2.7 3.3-5.1c10.3-17.2 33.2-25.7 51.7-20.7 24.7 6.6 39.6 31.9 33.1 56.5-0.2 0.6-0.3 1.3-0.5 2-5.9 26.3 10 53.2 36.7 60.7 0.6 0.2 2 0.6 2.7 0.7 0.9 0.2 3.2 0.6 4.1 0.7 16.8 1.9 33.8 2.8 50.5 2.8 16.6 0 33.5-1 51.1-3 13.3-1.9 25.1-8.8 33.5-19.5 8.4-10.8 12-24.2 9.9-40-0.2-1.6-0.6-3.1-0.9-4.4-5.1-19.7 3.6-41.2 21.2-52.1 0.4-0.2 0.8-0.5 1.2-0.8 21.1-11.9 50.1-3.7 62.2 17.6 13.5 23.2 42.1 34.1 70.2 17.7l6-4.1c26.7-21 49.7-44.1 70.2-70.4 8.5-10.7 12.3-24 10.7-37.3-1.5-12.9-8-24.8-18.2-33.3-0.8-0.7-1.7-1.3-2.6-1.9l-5-3.2c-17.2-10.4-25.7-31.7-21.5-49.3 0.3-0.8 0.6-1.9 0.9-2.7 5.3-20.4 23.6-34.6 44.5-34.6 3.9 0 7.9 0.5 12.7 1.8 28.8 7.3 54.4-9.4 62.4-38.5 0.5-2.1 0.8-2.9 0.8-5 4.5-31.9 4.7-65.5 0.6-100.1z m-27.8 96.5l-0.3 2.2v0.3c-0.1 0.4-0.2 0.9-0.3 1.3-2.9 10.3-12.2 17.5-22.8 17.5-2 0-3.9-0.3-5.8-0.8l-0.4-0.1-0.4-0.1c-6.3-1.6-12.6-2.4-18.7-2.4-33.3 0-62.6 22.7-71.1 55.2l-0.1 0.3-0.1 0.3c-7.8 31.8 5.8 65.4 33.3 81.9l4.1 2.7c4.8 4 7.8 9.5 8.5 15.4 0.5 4.2 0.1 10.6-4.9 16.9-19.4 24.9-40.9 46.4-65.7 65.9l-4.2 2.8c-3.5 2-7.2 3-11.1 3-8.2 0-16-4.4-20.2-11.6-13-22.9-37.5-37.1-64-37.1-13.2 0-26.2 3.6-37.5 10.5l-0.1 0.1-0.1 0.1c-27.8 17.4-41.4 51.3-33.3 82.4l0.1 0.3 0.1 0.3 0.1 0.4v0.3l0.3 2.1c0.8 6.1-0.9 12.2-4.7 17.1-3.9 5-9.5 8.2-15.7 9.1-15.8 1.8-31.7 2.7-47.1 2.7-15.5 0-31.5-0.9-47.4-2.7l-1.4-0.2c-0.5-0.1-1-0.3-1.5-0.4-12.5-3.5-20-16.4-16.6-28.9v-0.2c10.3-39.2-13.3-79.7-52.7-90.2-6-1.6-12.3-2.4-18.9-2.4-26 0-50.2 13.5-63.5 35.5l-2.7 4.1c-4.7 5.5-11.3 8.7-18.3 8.7-3.5 0-8.9-0.9-14.1-5l-0.1-0.1-0.1-0.1c-24.9-19.4-46.4-40.9-65.9-65.7l-2.8-4.2c-2.9-5.1-3.7-11.2-2.2-17.1 1.6-6.1 5.4-11.2 10.7-14.3 17.1-9.6 29.7-26.1 34.7-45.1 5.1-19.3 2.3-39.2-7.9-56.3l-0.2-0.3-0.2-0.3c-13.7-22-38.2-35.5-63.9-35.5-6.3 0-12.5 0.8-18.5 2.4h-0.2l-0.6 0.2h-1.1l-2.6 0.5c-0.1 0-0.6 0.1-1.7 0.1-11.4 0-21.3-8.8-22.5-20.2v-0.2c-3.7-31.4-3.7-63.1 0-94.5l0.2-1.8 0.2-0.9c2.8-10.5 12.2-18 22.9-18 2 0 3.9 0.3 5.8 0.8l0.4 0.1 0.4 0.1c6.3 1.6 12.6 2.4 18.7 2.4 33.3 0 62.6-22.7 71.1-55.2l0.1-0.3 0.1-0.3c7.8-31.8-5.8-65.4-33.3-81.9l-4.1-2.7c-4.8-4-7.8-9.5-8.5-15.4-0.5-4.2-0.1-10.6 4.9-17 19.4-24.9 40.9-46.4 65.7-65.9l4.3-2.8c3.4-1.9 7.2-3 11.1-3 8.2 0 15.9 4.4 20.2 11.6 13 22.9 37.5 37.1 64 37.1 13.2 0 26.2-3.6 37.5-10.5l0.1-0.1 0.1-0.1c27.6-17.3 41.3-50.9 33.4-81.9-0.1-0.6-0.3-1.1-0.4-1.6v-0.1l-0.3-2.1c-0.8-6.1 0.9-12.2 4.7-17 3.8-4.8 9.2-7.8 15.2-8.5h0.2c15.8-1.9 31.8-2.8 47.3-2.8 15.5 0 31.5 0.9 47.1 2.7l1.8 0.2 0.8 0.2c12.7 3.4 20.4 16.4 17.1 29v0.2c-10.3 39.2 13.3 79.7 52.7 90.2 6 1.6 12.3 2.4 18.9 2.4 26 0 50.2-13.5 63.5-35.5l2.7-4.1c4.7-5.5 11.3-8.7 18.2-8.7 3.5 0 8.9 0.9 14.1 5l0.1 0.1 0.1 0.1c24.9 19.4 46.4 40.9 65.9 65.7l2.8 4.2c2.9 5.1 3.7 11.2 2.2 17.1-1.6 6.1-5.4 11.2-10.7 14.3-17.1 9.6-29.7 26.1-34.7 45.1-5.1 19.3-2.3 39.2 7.9 56.3l0.2 0.3 0.2 0.3c13.7 22 38.2 35.5 63.9 35.5 6.1 0 12.1-0.8 18-2.3 0.5-0.1 1.1-0.3 1.6-0.4h0.8l2.6-0.5c0.1 0 0.6-0.1 1.7-0.1 11.6 0 21.7 8.9 23.3 20.8 3.8 32.3 3.6 63.5-0.5 93.1z" fill="#1296db" p-id="4702"></path><path d="M513.7 403c-68.5 0-124 55.5-124 124 0 7.1 1.1 15 2.3 21.8 0 0.1 0.3 0.1 0.3 0.1 1.5 6 6.6 10.5 13.1 10.5 7.6 0 13.8-6.2 13.8-13.8 0-1.1-0.4-2-0.6-3l0.2-0.1c-0.8-5.1-1.6-10.3-1.6-15.6 0-53.2 43.3-96.5 96.5-96.5s96.5 43.3 96.5 96.5-43.3 96.5-96.5 96.5c-23.6 0-44.9-8.8-61.7-22.9l-0.2 0.2c-2.4-1.9-5.2-3.2-8.5-3.2-7.6 0-13.8 6.2-13.8 13.8 0 4.3 2.1 8 5.2 10.5 0.1 0.1-0.1 0.2 0 0.3 21.5 17.9 48.7 28.9 78.9 28.9 68.5 0 124-55.5 124-124 0.2-68.5-55.4-124-123.9-124z" fill="#1296db" p-id="4703"></path></svg>`)
        let all = $(`<div class="gist-operate"></div>`)
        // 获取原生
        let add = $(".js-add-gist-file");
        add.text("+")
        add.addClass("btn-sm")
        //add.removeClass("")
        add.removeClass("folat-left")
        let action = $(".form-actions")
        let update = action.children("button")
        let cancel = action.children("a")
        cancel.addClass("btn-sm return-gists")
        cancel.text("返回")
        update.addClass("btn-sm");update.removeClass("btn-primary")
        update.text("更新")
        all.append(add)
        all.append(cancel)
        all.append(update)
        // gist-operate
        let showAll = $(`<span class="show-all-gist btn btn-sm">显示所有</span>`)
        showAll.click(function(){
            showAllGist()
        })
        all.append(showAll)
        div.append(all)
        div.append($(`<div class="choose-gist-edit"></div>`))
        div.append(settingIcon)
        div.append(setting)
        gists.prepend(div)
        editsetting()
    }
    function editsetting(){
        let objs={ editReturn : $('.return-gists'),'edit-setting-show-all':$(".show-all-gist")}
        let setobjs = { editReturn : $("#setting-return"),'edit-setting-show-all':$("#setting-show-all")}
        globalDecoration.checkbox(objs,setobjs)
        getFile()
        $(".js-add-gist-file").on("click",function(){
            getFile() // 刷新内容
            hideAllGist() // 单个页面显示，出现问题然后进行修正
            //editGistFiles.map(function(val,index){
                //console.log("val",index,val)
            //})
        })
    }
    /*
    let editShowAll = $("#setting-show-all")
        let showAll = $(".show-all-gist")
        let checked = getValue("editShowAll")
        editShowAll.attr("checked",checked ||false)
        if(checked){
            showAll.hide()
        }else{
            showAll.show()
        }
        editShowAll.change(function(){
            let checked = editShowAll.is(":checked")
            setValue("editShowAll",checked?"checked":"")
            if(checked){
                showAll.hide()
            }else{
                showAll.show()
            }
        })
    */
    function menu(){
        let gEdit = $(".choose-gist-edit")
        gEdit.empty()
        editGistFiles.map(function(val,index){
            gEdit.append($(`<span> <input name="change-gist-radio" type="radio" id="change-gist-tab-${val.id}" ${val.show?"checked":""} hidden><label class="change-gist btn btn-sm" for="change-gist-tab-${val.id}">${val.name||"未定义"}</label></span>`))
            //console.log(index,val)
        })
        let changeGist = $(".change-gist")
        for(let i = 0;i<changeGist.length;i++){
            let change = $(changeGist[i])
            change.click(function(){
                showGist(i)
            })
        }
    }
    function getFile(){ // 每次更新更新重新绑定，增加和删除操作会修改
        editGistFiles = []
        let gistFiles = $(".js-gist-file")
        console.log("length",gistFiles.length)
        for(let index = 0;index < gistFiles.length;index++){
            let gistFile = $(gistFiles[index])
            let nameField = gistFile.find(".js-gist-filename")
            let name = nameField.val()
            let e = {} //editGistFile
            //gistFile.hide()
            e.show = false
            e.id = index
            e.content = gistFile
            e.name = name
            e.nameField = nameField
            editGistFiles.push(e)
        }
        //showAllGist()
        if(gistFiles.length>0){
            //editGistFiles[showIndex].content.show()
            editGistFiles[showIndex].show = true
        }
        //show()
        menu() //设置菜单
        editGistFiles.map(function(val,index){
            val.nameField.change(function(){
                val.name = val.nameField.val()
                //console.log("index:",index,"val:",val.nameField.val())
                menu()
            })
        })
    }
    function showGist(i){
        editGistFiles.map(function(val,index){
            if(i == index){
                val.show = true
            }else{
                val.show = false
            }
        })
        show()
    }
    function show(){
        editGistFiles.map(function(val,index){
            if(val.show){
                val.content.show()
            }else{
                val.content.hide()
            }
        })
    }
    function showAllGist(){
        editGistFiles.map(function(val,index){
            val.content.show()
        })
    }
    function hideAllGist(){
        editGistFiles.map(function(val,index){
            val.content.hide()
        })
    }
}
function getValue(key){
    // GM.getValue()
    return localStorage.getItem(key)
}
function setValue(key,val){
    localStorage.setItem(key,val)
}
function removeValue(key){
    localStorage.removeItem(key)
}

var tabTitles ={
    "zh": "目录",
    "zh-CN": "目录",
    "en": "tab of content"
}
function getLanguageTitle(){
    var lang = navigator.language //["zh-CN", "en", "zh"]
    //console.log("title",tabTitles[lang])
    return tabTitles[lang]
}