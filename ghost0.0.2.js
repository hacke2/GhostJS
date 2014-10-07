/*
 * GhostJS 0.0.2
 *
 * -Begin 2014.8
 *
 * Author: DEMON
 * License MIT
 * Last Modified : 2014.10.2
 * Blog: http://demonc.com
 *
 * Description: I'am not a good Web-Front-End-Developer.
 *              But I Wanna do something make sense.
 *              Just join myself. Get Busy life or Get Busy Die...
 *              
 *              ...缘分写在三生石上面...
 *              <-- 江南 -->
 *              < http://y.qq.com/#type=song&mid=001oGzem0k192p > 
 */

(function (window, alreadyGo) {
    if(!alreadyGo(window)){
        throw new Error("Ghost.js Require Browser");
    }
}(typeof window !== "undefined" ? window : this, function (BrowserGhost) {

    var VERSION = "Ghost 0.0.2",

        global = window,
        doc = document,
        userAgent =global.navigator.userAgent;
    /*
    * Go
    * @ 核心入口
    * @ 最终接入window
    *
    */
    var Go = function (obj) {
         if (obj instanceof Function) {

            /*
            * 装载效果
            *
            * Go(function(){
            *   //code
            * })
            *
            * 在DOM结构绘制完毕就会被加载.
            *
            * Go(function(){
            *   Go.insetScript()
            * });
            *
            *   @ 尾部插入脚本而不会阻塞DOM的绘制
            *   @ 尽量避免用尾部插入JavaScript的方式来重新定义全局某些DOM的样式
            *   @ 尾部加载js控制样式容易造成回流.
            *   @ 尽可控制单个内层DOM.造成重绘,而不是回流.
            * })
            * */

            if (doc.addEventListener) {
                doc.addEventListener("DOMContentLoaded", function () {
                    doc.removeEventListener("DOMContentLoaded", arguments.callee, false);
                    obj();
                }, false);
            } else if (doc.attachEvent) {
                IEContentLoaded(global, obj);
            }
            //尽量不要使用arguments.callee
            //装载时对IE做特殊处理
            function IEContentLoaded(win, func) {
                var d = win.document,
                    done = false;
                //done标记装载状态
                (function () {
                    try {
                        d.documentElement.doScroll('left');
                    } catch (e) {
                        setTimeout(arguments.callee, 10);
                        return;
                    }
                    init();
                })();

                d.onreadystatechange = function () {
                    if (d.readyState === "complete") { d.onreadystatechange = null; init();}
                };

                function init() {
                    //让函数加载只执行一次.
                    if (!done) { done = true; func(); }
                }
            }
        } else if ((obj.nodeType && obj.nodeType == 1) || !(this instanceof Go)) {
            //DOM节点直接进行包装
            return new _Go(obj);
        } else if (obj instanceof Go || obj instanceof _Go) {
            //instancof Go 或者 _Go 则不做任何操作.
            return obj;
        }
    };

    /*
    *
    * 初始声明
    * @ 主要成员Go创建之后,
    * @ 开始初始化
    *
    */
    var MSIE8 = !-[1, ],
        broken = {},

        Go_Array = [],
        Go_Object = {},
        Go_String = "",
        Go_Number = 1,

        push = Go_Array.push,
        unshift = Go_Array.unshift,
        slice = Go_Array.slice,
        splice = Go_Array.splice,
        join = Go_Array.join,
        concat = Go_Array.concat,
        //ECMAScript 5
        nativeforEach = Go_Array.forEach,
        filter = Go_Array.filter;


    var isId = /^#\w+/,
        isClass = /^(\.)(\w+)/,
        isTag = /^\w+/,
        isAll = /^\*$/,
        advSelector = /.+>.+/g,
        qSA = doc.querySelectorAll;

    /*
    *
    * NoSQL DataBase
    * @ NoSQL 事件记录
    * @ 只要有DOM元素是通过 Go(DOM).bind(event,callback) 的方式绑定了事件.就会在Go.NoSQL保存对应的记录
    * @ 在NoSQL中有事件记录的DOM元素
    *       1.可以通过unbind来移除指定绑定函数,
    *           [    ** example **
    *               DOM a 绑定了一个函数名为 func 的函数, 通过 Go(a).unbind(event,func) 移除指定绑定函数
    *           ]
    *       2.可以通过unbind来移除指定同一类型事件,而不影响另一类型类事件
    *           [    ** example **
    *               DOM a 通过bind函数绑定了三类事件, mouseout, click, mouseover
    *               通过 Go(a).unbind("click") 可以批量移除该DOM结构上所有的click触发的函数.
    *               但不影响 mouseout 和 mouseover 其他不相干的事件
    *           ]
    *       3.可以通过unbind一次性移除该DOM上所有事件
    *           [    ** example **
    *               通过 Go(a).unbind() 不传入任何argument.移除所有相关绑定的事件
    *           ]
    * @ NoSQL 存储容器
    * @ NoSQLStack 容器内存状态
    *
    * */
    Go.NoSQL = {};
    Go.NoSQLStack = 0;

    /*
    * GhostStack
    * @ 选择器缓存机制
    * @ 利用缓存极大降低选择器重复选择同一元素时候带来的性能损耗
    * @ 缓存默认存储前3次操作的选择器
    * @ 可以通过Go.PaddingStack 来扩充缓存的上限,一般默认都是3
    * @ 内部机制 Go.pushStack 想缓存中推入选择器
    *
    */
    Go.GhostStack = [];
    Go.pushStack = function(_Go){
        var Stack_Status = Go.GhostStack.length;
        if(Stack_Status >= 3)
            Go.GhostStack.shift();
        push.call(Go.GhostStack,_Go);
    };

    /*
    *
    * Go._NOOP
    * @ 空函数,什么也不做,方便Ghost内部和外部扩展调用.让外部废弃函数都指向_NOOP来避免重复创建无用匿名函数.
    * @ userAgent 浏览器嗅探
    * @ userAgent 不推荐使用
    *
    */
    Go._NOOP = function(){};

    Go.isIE8 = userAgent.indexOf("MSIE 8.0") > 0;
    Go.isIE = userAgent.indexOf("Trident") > 0;
    Go.isChrome = userAgent.indexOf("Chrome") > 0;
    Go.isFireFox = userAgent.indexOf("Firefox") > 0;


    /*
    * _Go
    * @ 选择器包装入口
    * @ 接入Selector函数,工厂对象上创建seletor数组来容纳选择的DOM元素
    * @ 早先0.0.1版本时候Ghost主要是利用对象来存储DOM.
    * @ 默认最是字符串的形式传入elm
    *
    */

     function _Go(elm) {
        if(!elm) return broken;

        var _Go_self = this;
            _Go_self.selector = [];

        //Go.GhostStack中寻找缓存
        var chache_status = false,
            chache = null;

        Go.AryEach(Go.GhostStack,function(e){
            //通过遍历e的选择器方法来判断是否和缓存中的_Go一致
            if (e.selectMethod === elm) {
                chache_status = true;
                chache = e;
            }
        });

        //一旦存在缓存,返回缓存
        if(chache_status && chache)
            return chache;
        else {
            //seletorMethod 选择器方法String 例如 part1>part2>part3 or [ #id .class tag ]
            _Go_self.version = VERSION;

            if (elm.nodeType && elm.nodeType === 1) {
                _Go_self.selector.push(elm);
                _Go_self.selectMethod = elm;
                _Go_self.length = 1;

                Go.pushStack(_Go_self);

            }else {
                _Go_self.selectMethod = elm.toString();
                elm = _Go_self.selectMethod.split(" ");

                Go.AryEach(elm, function (e) {
                    _Go_self.selector = concat.call(_Go_self.selector, GhostSelector(e));
                });

                //选择器最终包含元素的数目
                this.length = _Go_self.selector.length;
                Go.pushStack(_Go_self);
            }
            return _Go_self;
        }
    }

    /*
    * queueSelector
    * @ By DEMON
    * @ Date: 2014.10.1
    * @ Email: wpymoshou3@gmail.com
    * @ Blog: http://demonc.com
    */

    function queueSelector(elmstr,prevResult){
        elmstr = elmstr.split(">");

        if(!prevResult){
            //第一次迭代,只传入了elmString ->  [ part1>part2>part3>part4 ]
            prevResult = [];
            var partfirst = elmstr.shift();     //part1
            var selectorString = elmstr[0];     //part2

            partfirst = GhostSelector(partfirst);

            var result = [],
                model = Go._NOOP;
            if(isTag.test(selectorString)){
                model = equalTagName;
            }else if(isClass.test(selectorString)){
                selectorString = selectorString.substr(1);
                model = hasClass;
            }

            Go.AryEach(partfirst,function(val){
                //先把part1选择到的部分每个元素的子元素全部挑选出来出来
                result = result.concat(Go.ElementChild(val));
            });
            Go.AryEach(result,function(val){
                //根据匹配模式判定是Tag 还是 Class
                //然后比较,子元素中如果tagName 或 className和selectorString匹配.就将它push到结果中.
               if(model(val,selectorString)){
                   push.call(prevResult,val);
               }
            });

            if(elmstr.length === 1){
                // [part2]  没有了 part3后续, 则不进行递归迭代
                return prevResult;
            }else{
                // [part2,part3,part4] 否则递归迭代. prevResult保存了part2的结果.
                elmstr.shift();
                // [part3,part4] 存在后续部分,继续递归调用
                return queueSelector(elmstr.join(">"),prevResult);
            }
        }else{
            // prevResult part2 elms
            var result =[],
                model = Go._NOOP;

            var NextPartSelector = elmstr[0];  // part3
            if(isTag.test(NextPartSelector)){
                model = equalTagName;
            }else if(isClass.test(NextPartSelector)){
                NextPartSelector = NextPartSelector.substr(1);
                model = hasClass;
            }
            Go.AryEach(prevResult,function(val){
                result = result.concat(Go.ElementChild(val));
            });
            prevResult = [];
            Go.AryEach(result,function(val){
                if(model(val,NextPartSelector)){
                    push.call(prevResult,val);
                }
            });
            if(elmstr.length === 1)
                //只剩下part3了
                return prevResult;
            else{
                elmstr.shift(); //[part4]
                return queueSelector(elmstr.join(">"),prevResult);
            }
        }

    }
    /*
    * _Go -> GhostSelector
    * @ 选择器函数入口
    * @ 判断高级拼装选择器
    * @ 判断普通选择器
    *
    * */
    function GhostSelector(elmstr){
        if(advSelector.test(elmstr))
            //高级拼装选择器
           return queueSelector(elmstr);
        else{
            //普通选择器
            if(isTag.test(elmstr))
                return Go.ListAry(doc.getElementsByTagName(elmstr));
            else if(isId.test(elmstr)){
                var result = [];
                push.call(result,doc.getElementById(elmstr.substr(1)));
                return result;
            }else if(isClass.test(elmstr))
                return getClass(elmstr.substr(1));
            else if(isAll.test(elmstr))
                return Go.ListAry(doc.getElementsByTagName("*"));
        }
    }

    /*
    * _Go.prototype
    * @ each 是prototype上的核心函数.
    * @ 所有扩展方法都是基于 _Go.selector. 也就是基于DOM
    * @ 本质是操作DOM元素
    *
    * */
    Go.Extend = _Go.prototype = {
        constructor: _Go,

        each: function (iterator, context) {
            //_Go.prototype.each 是最核心, 最关键的函数, 迭代都只针对selector选择器
            if (this == null || this.length === 0) {
                return this;
            } else if (this.length === 1) {
                if (iterator.call(context, this.selector[0], "0", this) === broken) return;
            } else if (nativeforEach && this.forEach === nativeforEach) {
                this.forEach(iterator, context);
            } else if (this.length === +this.length) {
                for (var i = 0, l= this.length; i < l; i++) {
                    if (iterator.call(context, this.selector[i], i, this) === broken) return;
                }
            } else {
                if (!Object.keys) {
                    //MSD V8 Object Keys
                    Object.keys = (function () {
                        'use strict';
                        var hasOwnProperty = Object.prototype.hasOwnProperty,
                            hasDontEnumBug = !({
                                toString: null
                            }).propertyIsEnumerable('toString'),
                            dontEnums = [
                                'toString',
                                'toLocaleString',
                                'valueOf',
                                'hasOwnProperty',
                                'isPrototypeOf',
                                'propertyIsEnumerable',
                                'constructor'
                            ],
                            dontEnumsLength = dontEnums.length;

                        return function (obj) {
                            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                                throw new TypeError('Object.keys called on non-object');
                            }
                            var result = [],
                                prop, i;
                            for (prop in obj) {
                                if (hasOwnProperty.call(obj, prop)) {
                                    result.push(prop);
                                }
                            }
                            if (hasDontEnumBug) {
                                for (i = 0; i < dontEnumsLength; i++) {
                                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                                        result.push(dontEnums[i]);
                                    }
                                }
                            }
                            return result;
                        };
                    }());
                }
                var keys = Object.keys(this);
                for (var i = 0, l = keys.length; i < l; i++) {
                    if (iterator.call(context, this.selector[keys[i]], keys[i], this) === broken) return;
                }
            }
        },
        signet: function(name,value){
            /*
            * signet
            * @ _Go(x).signet 为选择注入印记.
            * @ 或者取出印记,这种印记模式在某些情况下很常见
            *
            * */
            if(arguments.length == 2)
                this[name] = value;
            else
                return this[name];

            return this;
        },
        at: function(index){
            /*
            * at
            * @ at是_Go.selector(选择器数组)的基础过滤函数
            * @ 传入index可以获取到当前选择器第n个DOM元素. 传入-1表示获取最后一个DOM元素.-2表示倒数第二个DOM元素
            * @ 作为this返回. (_Go)
            * @ 只操作选择器,并且会标记状态  "Ghost.selector.at.Filter()".只有的选择器函数基本如此
            * @ 在selectMethod 添加+at印记, 防止下次构建选择器时,在缓存找到了一个通过at过滤后的_Go缓存,结果错误
            *
            */
            var Self_Selector = this.selector ;
            this.prevSeletor = Self_Selector;
            index = index<0 ? Self_Selector.length+index : index;

            this.selector = [Self_Selector[index]];
            this.length = 1;
            this.status = "Ghost.selector.at.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +at";

            return this;
        },
        back: function(){
            /*
            * back
            * @ 非常核心的功能
            * @ 只通过_Go(x).filterfunction().back()函数就可以返回一个选择器上一步的状态.则避免出现如下代码:
            *               Go("a>b").filter1()  //过滤方式1
            *               //do something
            *               Go("a>b").filter2()  //过滤方式2
            *               //do something
            *               Go("a>b")            //重新又构建一次Go("a>b")
            * @ 使用方法
            * @ Go(elm).at(n).xxx(做一堆事情).back().yyy(在原来的选择器上做事情)
            *
            * @ Go(elm).过滤器1().过滤器2().back() // 返回过滤器1()时候存储的结果
            *
            * @ 注意!!
            *   back 函数只能返回上一步操作
            *   无法连续返回历史多部操作
            *   比如 Go(x).back().back() //非法写法.
            * @
            */
            if(this.prevSeletor){
                this.selector = this.prevSeletor;
                this.selectMethod = this.prevSeletorMethod;
                this.length = this.prevSeletor.length;

                delete this.prevSeletorMethod;
                delete this.prevSeletor;
                delete this.status;
            }
            return this;
        },

        first: function(){
            /*
            * first
            * @ 基于_Go.at(x)
            */
            return this.at(0);
        },

        last:function(){
            /*
            * first
            * @ 基于_Go.at(-x)
            */
            return this.at(-1);
        },
        fix: function(func){
            /*
            * fix
            * @ 过滤出包含指定条件的DOM元素
            * @ 参考ECMAScript 5 中的filter函数工作原理
            */
            this.prevSeletor = this.selector;
            this.status ="Ghost.selector.fix.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +fix";

            this.selector = Go.AryFiler(this.selector,func);
            /*
            Go.AryEach(fix,function(e,index){
                if(func(e,index,self)){
                    push.call(fix,e);
                }
            });
            */
            this.length = this.selector.length;

            return this;
        },
        even:function(){
            /*
            * even
            * @ 基于_Go.fix(func)
            * @ even表示偶数 DOM元素呈现出来的偶数规则,而不是数组呈现出来偶数规则,因为数字索引是0,人们通常数DOM都不会是从0开始, 而是从1
            */
            return this.fix(function(e,index){ return index%2!==0; })
        },

        odd:function(){
            /*
            * odd
            * @ 基于_Go.fix(func)
            * @ odd表示奇数, 但是DOM的呈现则是以奇数规则, 而不是数组奇数规则. 数组索引是从0开始的
            */
            return this.fix(function(e,index){ return index%2===0; })
        },

        next:function(){
            /*
            * next
            * @ next 则是用来获取选择器中,元素的相邻的下一个元素.
            * @ 例如DOM结构是
            *     -> body(#a #b #c)
            *
            *     Go(#b)        //选择器内容为 #b
            *    Go(#b).next   //则选择器内部元素就会改变为 #c
            *
            * @ 支持批量
            *
            */
            var self = this.selector,next =[];
            this.prevSeletor = self;
            this.status ="Ghost.selector.next.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +next";

            Go.AryEach(self,function(e){
                var info = false;
                    e = e.nextSibling;
                while(!info){
                    if(!e){
                        info = true;
                    }else if(e.nodeType && e.nodeType === 1 && e.nodeName !== "SCRIPT"){
                        //同时要避免选择到script标签
                        info = true;
                        push.call(next,e);
                    }else{
                        e = e.nextSibling;
                    }
                }
            });

            this.length = next.length;
            this.selector = next;

            return this;
        },

        prev:function(){
            /*
            * prev
            * @ 与_Go.next()相反
            *
            */
            var self = this.selector,prev =[];
            this.prevSeletor = self;
            this.status ="Ghost.selector.prev.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +prev";

            Go.AryEach(self,function(e){
                var info = false;
                e = e.previousSibling;
                while(!info){
                    if(!e){
                        info = true;
                    }else if(e.nodeType && e.nodeType === 1 && e.nodeName !== "SCRIPT"){
                        //同时要避免选择到script标签
                        info = true;
                        push.call(prev,e);
                    }else{
                        e = e.previousSibling;
                    }
                }
            });

            this.length = prev.length;
            this.selector = prev;

            return this;
        },

        siblings:function(){
            /*
            * siblings
            * @ 选择除自己以外同级下相邻的所有元素. 例如:
            *       -> body(a b c d)
            *       Go(b).siblings  -> [a,c,d]
            * @ _Go.next() 和 _Go.prev()的集合,
            *
            * */
            var self = this.selector,siblings =[];
            this.prevSeletor = self;
            this.status ="Ghost.selector.siblings.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +siblings";

            Go.AryEach(self,function(e){
                var eParentChild = Go.ElementChild(e.parentNode);
                siblings = concat.call(siblings,Go.AryFiler(eParentChild,function(elm){
                     return (elm !== e && elm.nodeName !== "SCRIPT" );
                }));
                //避免选择到script
            });

            this.length = siblings.length;
            this.selector = siblings;

            return this;
        },

        warp: function(){
            /*
            * warp
            * @ 选择器中所包含的元素的所有子元素
            *
            */
            var self = this.selector,warp = [];
            this.prevSeletor = self;
            this.status ="Ghost.selector.warp.Filter()";
            this.prevSeletorMethod = this.selectMethod;
            this.selectMethod = this.selectMethod + " +warp";

            Go.AryEach(self,function(e){
                warp = concat.call(warp,Go.ElementChild(e))
            });

            this.length = warp.length;
            this.selector = warp;

            return this;
        },
        warpClass:function(className){
            /*
            * warpClass
            * @ 选择器元素所包含的子元素中, 包含className类名的元素
            */
            var self = this.warp();
            className = className.substr(1);
            return self.fix(function(e){ return hasClass(e,className) });
        },

        warpTag:function(tagName){
            /*
             * warpTag
             * @ 选择器元素所包含的子元素中, 标签名为tagName的元素
             */
            var self = this.warp();
            tagName = tagName.toUpperCase();
            return self.fix(function(e){ return e.nodeName===tagName });
        },

        ctains:function(name){
            /*
            * ctains
            * @ 基于 _Go.warpTag 和 _Go.warpClass
            */
            if(isTag.test(name))
                return this.warpTag(name);
            else if(isClass.test(name))
                return this.warpClass(name);
            else
                return this;
        },
        obstruct: function(time,callback){
            /*
            * obstruct
            * @ 阻塞JavaScript 线程 time时间.阻塞结束后立马执行回调函数
            * @ 慎用
            */
            callback = callback || Go._NOOP;
            var timeSleep = new Date();
            var now = null;
            do{ now = new Date() }while(now-timeSleep<time);

            timeSleep = null;
            callback();
            return this;
        },
        trash: function(){
            /*
            * trash
            * @ 垃圾回收机制
            * @ Go(x).trash()则会清楚这个选择器,同时包括它在缓存中的占位
            * @ 某些情况下非常有用
            *
            */
            var _trash = this;
            //trash 同样会清除掉Go.GhostStack中的缓存.而下次构建选择器的时候则需要重新构建.而不是在缓存中找到它
            Go.AryEach(Go.GhostStack, function (_Go, index) {
                if (_Go.selectMethod === _trash.selectMethod) {
                    Go.GhostStack.splice(index);
                }
            });
            setTimeout(function(){
                if(!MSIE8){ delete this; }
                _trash = null;
            },0);
            return _trash;
        },

        bind: function (event, callback) {
            /*
            * bind
            * @ 给元素批量绑定事件
            * @ Go.NoSQL 写入事件标记
            */
            this.each(function (e) {
                BindALL(e, event, callback);
            });
            return this
        },

        unbind: function(event,callback){
            /*
            * unbind
            * @ 解除事件绑定操作
            * @ 通过bind来绑定事件的DOM元素,能够获取更加高级的unbind功能
            */
            if(!event){
                this.each(function(e){
                    UnBindALL(e);
                });
            }else if(event && !callback){
                this.each(function(e){
                    UnBindALL(e,event);
                });
            }else{
                this.each(function(e){
                    UnBindALL(e,event,callback);
                });
            }
            return this;
        },

        once: function (event, callback) {
            /*
            * once
            * @ 函数绑定后只执行一次就不再有效
            * @ 不会写入NoSQL
            */
            this.each(function (e) {
                OneBind(e, event, callback);
            });
            return this
        },

        hide: function () {
            /*
            * hide
            * @ 隐藏元素
            */
            this.each(function (e) {
                e.style.display = "none";
            });
            return this
        },

        show: function () {
            this.each(function (e) {
                e.style.display = "block";
            });
            return this
        },

        adClass: function (className) {
            this.each(function (e) {
                if(!hasClass(e,className)){
                    e.className += (e.className?" ":"") + className;
                }
            });
            return this
        },

        rmClass: function (className) {
            this.each(function (e) {
                if(!e.className){
                    return;
                }
                if (hasClass(e,className)) {
                    var newClass = Go.PaddingString(e.className.replace(/[\t\r\n]/g," "));
                    var checkClass = new RegExp(Go.PaddingString(className),"gm");
                    if(hasClass(e,className)){
                        newClass = newClass.replace(checkClass," ");
                    }
                    e.className = Go.Trim(newClass);
                } else if(!className){
                    e.className = "";
                }
            });
            return this
        },

        tgClass: function (className) {
            this.each(function (e) {
                if(!e.className && !className){
                    return;
                }
                var paramClass = className;
                if(paramClass) {
                    if (hasClass(e, paramClass)) {
                        var newClass = Go.PaddingString(e.className.replace(/[\t\r\n]/g, " "));
                        var checkClass = new RegExp(Go.PaddingString(paramClass), "gm");
                        if (hasClass(e, className)) {
                            newClass = newClass.replace(checkClass, " ");
                        }
                        e.className = Go.Trim(newClass);
                    } else {
                        e.className += (e.className ? " " : "") + className;
                    }
                }
            });
            return this
        },
        stStyle: function(styleObj){
            //设置css style内联样式
            //all string obj
            //一定是只能是一个Object
            this.each(function(e){
                for(var k in styleObj){
                    e.style[k] = styleObj[k];
                }
            });
            return this
        },
        gtStyle:function(styleName){
              //只有当元素在文档中有占位的时候,才有可能获取到真实的CSS值
              //以下情况获取不到元素的值
              // 元素通过document.createElement被创建了, 但是没有在文档中占位,也获取不到真实的CSS样式
              var elm = this.selector[0];

              if(styleName.indexOf("-")>0){
                  var styleString = [];
                  styleName = styleName.split("-");

                  push.call(styleString,styleName.shift());
                  Go.AryEach(styleName,function(e){
                      push.call(styleString,upperCaseFirst(e))
                  });

                  return getStyle(elm,styleString.join(""));
              }else{
                  return getStyle(elm,styleName);
              }
        },
        stAttr: function(attrName,attrValue){
            if(typeof attrName === 'object' && attrName instanceof Object){
                /*
                {
                    id:"xxx",
                    className:"xxx"
                    href:"xxxx"
                    data_xx: xxxx
                }
                */
                this.each(function(e){
                   for(var key in attrName){
                       e.setAttribute(key,attrName[key]);
                   }
                });
                return this;
            }
            if(attrName!==""+attrName && attrValue!==""+attrValue){
                //typeof attrName!=="string" && typeof attrValue!=="string"
                //less 7 bit size
                return this;
            }
            this.each(function(e){
                e.setAttribute(attrName,attrValue);
            });

            return this;
        },

        rmAttr: function(attrName){
            if(attrName!==attrName+""){
               return this;
            }
            this.each(function(e){
                e.removeAttribute(attrName);
            });

            return this;
        },
        gtAttr:function(attrName){
            if(attrName!==attrName+""){
                return this
            }

            var attrValue = this.selector[0].getAttribute(attrName);

            return attrValue;
        },

        animate: function (profile, tween, unit,callback, d, t) {
            //unit是必须传入的
            t = t || 2;
            d = d || 200;
            callback = callback || Go._NOOP;
            this.each(function (e) {
                for (var i in profile) {
                    (function (i) {
                        var b = parseInt(e.currentStyle ? e.currentStyle[i] : getComputedStyle(e)[i]),
                            th = t,
                            target = profile[i] - b;
                        var q = setTimeout(queue, t);

                        function queue() {
                            th += t;
                            e.style[i] = Math.ceil(tween(th, b, target, d)) + unit;
                            if (th < d) {
                                setTimeout(queue, t);
                            } else {
                                clearTimeout(q);
                                callback(e);
                            }
                        }
                    })(i);
                }
            });
            return this
        },

        fdIn: function (time, opaci, callBack) {
            callBack = callBack || Go._NOOP;
            time = time || 300;
            this.each(function (e) {
                e.style.display = "block";
                var target = opaci || 1,
                    IEtarget = opaci * 100 || 100,
                    th = 0,
                    a = setTimeout(queue, 2);

                function queue() {
                    th += 2;
                    e.style.opacity = Math.round(Go.Tween.Linear(th, 0, target, time) * 10) / 10;
                    e.style.filter = 'alpha(opacity=' + Go.Tween.Linear(th, 0, IEtarget, time) + ')';
                    if (th < time) {
                        setTimeout(queue, 2);
                    } else {
                        clearTimeout(a);
                        callBack(e);
                    }
                }
            });
            return this;
        },

        fdOut: function (time, callBack) {
            callBack = callBack || Go._NOOP
            time = time || 300;
            this.each(function (e) {
                var th = 0,
                    opcity = Number(e.style.opacity),
                    IEopcity = opcity*100,
                    a = setTimeout(queue, 2);

                function queue() {
                    th += 2;
                    e.style.opacity = Math.round(Go.Tween.Linear(th, opcity, -opcity, time) * 10) / 10;
                    e.style.filter = "alpha(opacity=" + Go.Tween.Linear(th, IEopcity, -IEopcity, time) + ")";
                    if (th < time) {
                        setTimeout(queue, 2);
                    } else {
                        clearTimeout(a);
                        e.style.display = "none";
                        callBack(e);
                    }
                }
            });
            return this;
        },

        insetHTML: function(obj){
            //这个功能支持如下三种情况
            //第一种.Go选择器  不会破坏原有的DOM结构
            //第二种.一个原生的DOM节点 (不能是window,或者#document) . 只会复制一份, 而不会破坏原有的DOM结构
            //第三种.一个纯文本字符串. (自仿造HTML标签, 或者是个纯的innerText, 或者 text节点)
            //新插入的节点不会被绑定任何事件, 即便是被Go选择器选择到的元素

            var getInset ="";
            if(obj instanceof _Go && typeof obj === "object"){
                var InsetAry = [];
                obj.each(function(e){
                    push.call(InsetAry,e.outerHTML);
                });
                getInset = InsetAry.join(" ");
                InsetAry = null;
            }else if(obj.nodeType && obj.nodeType ===1){
                getInset =  obj.outerHTML;
            }else if(obj === ""+obj){
                getInset = obj;
            }

            this.each(function(e){
                e.innerHTML = getInset;
            });

            getInset = null;

            return this;
        },

        gtInHTML:function(){
            return this.selector[0].innerHTML;
        },

        insetText:function(text){
            this.each(function(e){
                e.innerHTML = text;
            });

            return this;
        },
        gtInText:function(){
            var elm = this.selector[0];
            return elm.innerText || elm.textContent;
        },
        rmNode: function(){
            this.each(function(e){
                removeNode(e);
            });

            this.trash()
        },
        apend: function(elms){
            var TargetlastElm = this.selector[0];
            if(typeof elms === 'object' && elms instanceof Array){
                //包含了原生Dom的数组
                Go.AryEach(elms,function(e){
                    TargetlastElm.appendChild(e);
                });

                return this;
            }else if(elms.nodeType && elms.nodeType === 1){
                //是一个原生的DOM Element节点
                TargetlastElm.appendChild(elms);

                return this;
            }else if(elms instanceof _Go){
                //如果是一个被包装的选择器
                elms.each(function(e){
                    TargetlastElm.appendChild(e);
                });

                return this;
            }else if(elms === elms + ""){
                //如果是一个字符串形式的DOM构造结构
                var tmp = doc.createElement("div");

                tmp.innerHTML = elms;
                var trueElement = tmp.firstChild;
                TargetlastElm.appendChild(trueElement);

                return this;
            }
            return this
        },
        w:function(){
            return this.selector[0].offsetWidth;
        },
        h:function(){
            return this.selector[0].offsetHeight;
        },
        gtPos: function(){
            return Go.getPosition(this.selector[0]);
        },
        scTo: function(scrollTime){
            var _Go = this;
            if(!_Go.length) return _Go;
            scrollTime = scrollTime||200;
            var z = {
                el:_Go.selector[0],
                p: Go.getPosition(_Go.selector[0]),
                s: Go.getScroll(),
                t: (new Date()).getTime(),
                scroll: function(t,l){ global.scrollTo(l,t)},
                clear: function(){ window.clearInterval(z.timer);  z.timer = null}
            };

            z.step = function(){
                var time = (new Date).getTime();
                var p = (time - z.t) / scrollTime;
                if (time >= scrollTime + z.t) {
                    z.clear();
                    window.setTimeout(function () {
                        z.scroll(z.p.y, z.p.x)
                    }, 13);
                } else {
                    var st = ((-Math.cos(p * Math.PI) / 2) + 0.5) * (z.p.y - z.s.t) + z.s.t;
                    var sl = ((-Math.cos(p * Math.PI) / 2) + 0.5) * (z.p.x - z.s.l) + z.s.l;
                    z.scroll(st, sl);
                }
            };
            z.timer = global.setInterval(function () {
                z.step();
            }, 13);

            return _Go
        },
        bscTop:function(){
            return global.pageYOffset
                || doc.documentElement.scrollTop
                || doc.body.scrollTop
                || 0;
        },
        bscBtom:function(){
            return doc.body.clientHeight -doc.documentElement.clientHeight - this.bscTop();
        }
    };

    Go.AJAX = function (profile) {
        //  profile
        //  async  .. true 默认是异步
        //  url ..""  ..url 地址参数.必须
        //  method .. "GET" or "POST"
        //  success .. 成功之后的回调
        //  error ..失败时的回调
        //  setHeader ..设置头部.接受一个obj
        //  data .. send 内部设置参数 如果方法为get. data参数即使被写入, 也是无效的. 而如果方法参数是post.则data会通过send的参数发送出去.
        function request(obj) {
            var option = Go.Package({
                url:"",
                async:true,
                method:"GET",
                data:null,
                success:Go._NOOP,
                error:Go._NOOP,
                setHeader:broken
            },obj);

            if (option.method === "GET" && option.data) { /*这里检测一下data存不存在,也就是send 参数*/
                option.data = formatParam(option.data);
                option.url = option.url + (option.url.indexOf('?') == -1 ? "?" : "&") + option.data;
                option.data = null;
            }
            var XHR = createXHR();
            XHR.open(option.method, option.url, option.async);
            XHR.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if (option.setHeader && option.setHeader !== broken) {
                for (var k in option.setHeader) {
                    XHR.setRequestHeader(k, option.setHeader[k]);
                }
            }
            //回调事件
            XHR.onreadystatechange = function () {
                _onStateChanging(XHR, option.success, option.error);
            };
            if (option.method == "POST") { //如果方法为POST 则需要设置Http头部
                XHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded;")
            }
            XHR.send(option.data);
            return XHR;
        }
        return {
            request: request(profile)
        }
    };
    Go.JSONP = function (obj) {
        //  obj的参数
        //  url : ..url路径;
        //  jsonp : ..callBack键, 一般来说, 默认是字符串 "callback"
        //  jsonpCallback : ...callBack 函数名, 也就是Open API中的 ...?callback=CallBack末尾的函数名.
        //  timeout: ..请求超时的最大时间
        //  fail: .. 一旦请求超时发生, 则会执行fail函数,默认参数是一个错误字符串.
        //  success: ..请求成功之后的函数
        //  data: ..内部设置参数

        obj = obj || broken;
        if (obj === broken || !obj.url) {
            throw new Error("JSONP param is no available");
        }
        //设置默认参数
        var options = Go.Package({
            url:"",
            jsonp:"callback",
            jsonpCallback: ('jsonp' + Math.random()).replace(".", ""),
            timeout:1000*10,
            fail:Go._NOOP,
            success:Go._NOOP,
            data:broken
        },obj);
        //data表示跨域请求额外附加的参数,如果这个参数存在, 就会想下面一样的形式存在在url中,一起发送
        //参数格式化. www.xxxx.com?aaa=xxx&bbb=xxxx&callback=CallBackFunctionName
        //预先将data格式化.
        options.url =join.call([
            options.url,
            (options.url.indexOf("?") === -1 ? "?" : '&') ,
            formatParam(options.data),
            "&",
            options.jsonp,"=",options.jsonpCallback ],"");
        //url参数规范化结束
        //因为data只是设置url字段前面的请求参数,而没有后面jsonp = jsonpCallBack参数.所以要个data补上
        options.data[options.jsonp] = options.jsonpCallback;

        //创建全局回调函数
        var head = doc.getElementsByTagName("head")[0];
        window[options.jsonpCallback] = function (gotData) {
            // 清除超时请求的异步回调
            clearTimeout(options.timerSetup);
            head.removeChild(JSONP_script);
            window[options.jsonpCallback] = null;
            // 设置为null 让垃圾回收Param上临时设置用于接受数据的window全局函数
            // 回调success函数
            options.success && options.success(gotData);
        };

        //head 尾部追加script元素
        //先创建script标签,并且将除了callback参数的url地址附加到script标签的src属性中.完成跨域请求脚本.
        var JSONP_script = createElement("script", {
            type: "text/javascript",
            src: options.url
        });
        head.appendChild(JSONP_script);

        //设置一个超时时间, 一旦请求超时.就会抛出fail函数的回调
        if (options.timeout && options.timeout === + options.timeout) {
            options.timerSetup = setTimeout(function () {
                head.removeChild(JSONP_script);
                window[options.jsonpCallback] = null;
                // 回调fail函数
                options.fail && options.fail("JSONP Request TimeOut!");
            }, options.timeout)
        }
    };

    Go.Cookie = function(useroptions){
        //cookies封装
        //Go.Cookie接受一个参数.可以是字符串, 也可以是对象
        //
        /*
         对象设置
         Go.Cookie({
         name:"cookiename"
         value:"cookievalue",
         expires:"过期时间",              //默认是当前事件延长一年 new Date() setDate + 365 这里需要传入一个标准的GMT时间. var t = new Date(); t.setDate(t.getDate + 天数) . t = t.toGMTString()
         path:"/",                       //路径, 默认是当前域名下的全部子路径都可以享受到cookies的作用
         domain:"www.xxx.com",           //域名. 默认是不设置, 默认是当前域
         secure:"任意非空"                //secure只在SSL下才有效,也就是访问必须是以https:// 才可以生成cookies 这里传入任意非false的值都会生效. 默认是false
         });

         字符串设置
         Go.Cookie("name=value;expires=;path=;domain=;secure")

         也可以只传入短参数字符串
         Go.Cookie("name=value")
         */
        if(typeof useroptions === 'object' && useroptions!==broken){
            var time = new Date();
            time.setDate(time.getDate()+365);
            var options = Go.Package({
                "name":"GhostJS",
                "value":"initGhostCookie",
                "expires": time.toGMTString(),
                "path":"/",
                "domain":"",
                "secure":null
            },useroptions);

            var PackAgeCookie = [
                options.name,"=",options.value,";",
                "expires=", options.expires ,";",
                "path=",options.path,";",
                "domain=",options.domain,";"
            ];
            doc.cookie = Go.Trim(PackAgeCookie.join("") + (!options.secure?"":"secure"));
        }else if(useroptions === useroptions+""){
            if(useroptions.indexOf("=")>0){
                //如果字符串包含等于, 则表示需要设置
                doc.cookie = useroptions;
            }else{
                //如果是字符串没有等于, 则表示它需要获取cookies中某个名字对应的值.
                var cookieName = encodeURIComponent(useroptions) + "=",
                    cookieFind = doc.cookie.indexOf(cookieName),
                    cookieValue = null;
                if(cookieFind !== -1){
                    var cookieEnd = doc.cookie.indexOf(";",cookieFind);
                    if(cookieEnd === -1){
                        //如果没有找到分号结尾
                        cookieEnd = doc.cookie.length;
                    }
                    cookieValue = decodeURIComponent(doc.cookie.substring(cookieFind+cookieName.length,cookieEnd));
                }
                return cookieValue;
            }
        }
    };

    Go.Animate = function (e, profile, tween, unit,callBack, d, t) {
        //首先你要清楚, 一个动画.什么在变, 什么是不变
        //而一个模块里.真正在变化的. 只有一个参数.也就是以t为标准的步长参数在不断的变化.
        //而最后无限接近到目标值.d. 由t-d的步长距离,比如步长是1,那么我d就是终点. 可以设置为100,相当于我要走一百步才能到达终点
        //t一定要被d整除, 如果步长是3. 终点是10,那么它就永远到不了终点.

        //s算法, b初始值, c目标值, t步长, d终点 unit
        //e元素. math 算法.比如 Tween.Bounce.easeIn
        //比如profile {
        //      height: xxx ,
        //      width: xxx ,
        //      opacity:x
        // }
        /*
         animation(e, {
         width: 100,
         height: 100
         }, Tween.Bounce.easeOut)
         */
        unit = unit || "";
        t = t || 2;
        d = d || 300;
        callBack = callBack || Go._NOOP;
        for (var i in profile) {
            (function (i) {
                var b = parseInt(e.currentStyle ? e.currentStyle[i] : getComputedStyle(e)[i]),
                    th = t,
                    target = profile[i] - b;
                var q = setTimeout(queue, t);

                function queue() {
                    th += t;
                    e.style[i] = Math.ceil(tween(th, b, target, d)) + unit;
                    if (th < d) {
                        setTimeout(queue, t);
                    } else {
                        clearTimeout(q);
                        callBack(e);
                    }
                }
            })(i);
        }
    };

    /**
     * @return {string}
     */
    //Go.PaddingString 填充字符串首位 增加空格
    Go.PaddingString = function(str){
        return join.call([" ",str," "],"");
    };
    Go.PaddingStack = function(_Go){
        Go.GhostStack.push(_Go);
    };
    //Go.Trim 去除字符串收尾的空格
    Go.Trim = function(str){
        return str.replace(/^\s+|\s+$/gm,"");
    };
    Go.ListAry = function(ary){
        if(MSIE8){
            Go.ListAry = function(Ary){
                //IE8 document.getElementByTagName is NodeList can't use slice.call
                var result = [];
                Go.AryEach(Ary,function(e){
                    push.call(result,e)
                });
                return result;
            }
        }else{
            Go.ListAry = function(Ary){
                return slice.call(Ary);
            }
        }
        return Go.ListAry(ary);
    };
    Go.AryEach = function(ary,callback,context){
        for(var i= 0,l=ary.length;i<l;i++){
            callback(ary[i],i,ary,context);
        }
    };
    Go.AryFiler = function(ary,func){
        if(filter){
            Go.AryFiler = function(ary,func){
                return ary.filter(func)
            };
        }else{
            Go.AryFiler = function(ary,func){
                //ary [1,2,3,4,5]
                //func function(e){ return e!==4 }
                Go.AryEach(ary,function(e,index){
                    if(!func(e)){
                        splice.call(ary,index);
                    }
                });
                return ary;
            };
        }
        return Go.AryFiler(ary,func)
    };
    Go.AryLoop = function(ary){
        var last = ary.pop();
        unshift.call(ary,last);
        return ary;
    };
    Go.AryDart = function(ary){
        var first = ary.shift();
        push.call(ary,first);
        return ary;
    };
    //Go.PackAge非常重要!
    Go.Package = function(oobj,fobj){
        //fobj 优先覆盖 oobj
        //使用oobj来作为控制访问对象.
        //千万不要使用fobj来作为控制访问对象.它只不过是个临时的合并对象
        for(var key in fobj){
            oobj[key] = fobj[key]
        }
        return oobj;
    };
    Go.ElementChild = function(elm){
        var result = [],
            t = elm.childNodes;
        for(var j = 0,k = t.length;j<k;j++){
            if(t[j].nodeType===1){
                //必须是个Element节点
                push.call(result,t[j]);
            }
        }
        return result;
    };
    Go.createElement = function(elmname,profileOBJ){
        var elm = doc.createElement(elmname);
        if (profileOBJ && profileOBJ instanceof Object && profileOBJ !== broken) {
            for (var k in profileOBJ) {
                elm[k] = profileOBJ[k];
            }
        }
        return elm;
    };
    Go.createText = function(text){
        return doc.createTextNode(text);
    };

    //Go.NoSQL WriteStack
    Go.WriteEventGoNoSQLStack = function (elm,stackName,event,func){
        //注入NoSQL的几个必要的条件是
        //1. elm必须有go_nosql的属性 (说明该标签事件已经被注入到Go.NoSQL缓存中);
        //2. elm的这个event事件.是否已经存在于Go.NoSQL.NoSQLStack.event中, 只有存在了这个事件, 才能对它进行添加
        var  NoSQLEventName = "_Go_Event_"+event;
        var  inStack = elm.getAttribute("go_nosql");
        if(inStack && Go.NoSQL[inStack]){

            if(Go.NoSQL[inStack].hasOwnProperty(NoSQLEventName)){
                var  inStackTarget = Go.NoSQL[inStack][NoSQLEventName];
                push.call(inStackTarget,func);
            }else{
                var process = Go.NoSQL[inStack][NoSQLEventName] = [];
                push.call(process,func);
            }
            //如果这个DOM元素已经在Stack中构建的缓存.则我们需要在指定的Stack位置添加绑定事件的函数即可

        }else{
            //如果没有给DOM元素绑定事件时候构建缓存, 那么就新建一个缓存
            var getStackNow = stackName + Go.NoSQLStack.toString(),
                buildEventStack = Go.NoSQL[getStackNow] = {};
                buildEventStack.type = "GhostJS_DOM_Event";
                buildEventStack._Go_DOM = elm;
            buildEventStack[NoSQLEventName] = [];
            push.call(buildEventStack[NoSQLEventName],func);

            elm.setAttribute("go_nosql",getStackNow);
            Go.NoSQLStack++;
        }
    };

    Go.getPosition = function(e){
        var x = 0, y = 0;
        var w = intval(e.style.width);
        var h = intval(e.style.height);
        var wb = e.offsetWidth;
        var hb = e.offsetHeight;
        //只针对x y 做计算
        while (e.offsetParent) {
            x += e.offsetLeft + (e.currentStyle ? intval(e.currentStyle.borderLeftWidth) : 0);  //计算元素距离屏幕左边的距离
            y += e.offsetTop + (e.currentStyle ? intval(e.currentStyle.borderTopWidth) : 0);    //计算元素距离屏幕顶部的距离
            e = e.offsetParent;
        }
        return {
            x: x,        //x坐标.距离屏幕左边多少px的距离
            y: y,       //y距离
            w: w,        //内联样式的宽度 如 style = "width:xxx;";
            h: h,       //内联样式的高度
            wb: wb,     //e元素模型盒子的真实宽度
            hb: hb      //e元素模型盒子的真实高度
        };
    };
    Go.getScroll = function(){
        var t, l, w, h;
        if (document.documentElement && document.documentElement.scrollTop) {
            t = document.documentElement.scrollTop;
            l = document.documentElement.scrollLeft;
            w = document.documentElement.scrollWidth;
            h = document.documentElement.scrollHeight;
        } else if (document.body) {
            t = document.body.scrollTop;
            l = document.body.scrollLeft;
            w = document.body.scrollWidth;
            h = document.body.scrollHeight;
        }
        return {
            t: t,
            l: l,
            w: w,
            h: h
        };
    };
    Go.insetScript = function(scriptUrlary){
        var body = document.getElementsByTagName("body")[0];
        Go.AryEach(scriptUrlary,function(url){
            var scriptTag = Go.createElement("script",{
                type:"text/javascript",
                src:url
            });

            body.appendChild(scriptTag);
        })
    };
    Go.bscTop = function(){
            return global.pageYOffset
                || doc.documentElement.scrollTop
                || doc.body.scrollTop
                || 0;
    };

    function OneBind(e, event, callback) {
        if (doc.addEventListener) {
            OneBind = function (el, eve, call) {
                el.addEventListener(eve, function () {
                    el.removeEventListener(eve, arguments.callee);
                    call.call(el);
                });
            };
        } else {
            OneBind = function (el, eve, call) {
                el.attachEvent("on" + eve, function () {
                    call.call(el);
                    el.detachEvent("on" + eve, arguments.callee);
                });
            };
        }
        return OneBind(e, event, callback);
    }

    function BindALL(e, event, callback){
        if (doc.addEventListener) {
            BindALL = function (elm, ed, cd) {
                elm.addEventListener(ed, cd, false);
                /* if(!elm["_Go_"+ed]){
                    elm["_Go_"+ed] = [];
                }
                elm["_Go_"+ed].push(cd);*/
                //将事件注入原生DOM节点作为标志
                Go.WriteEventGoNoSQLStack(elm,"Go_Event",ed,cd);
            };
            return BindALL(e, event, callback);
        } else if (MSIE8 && doc.attachEvent) {
            BindALL = function (elm, ed, cd) {
                //obj['e'+type+fn] = fn;
                //obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
                elm["e"+ed+cd] = cd;
                elm[ed+cd] = function(){ elm["e"+ed+cd](global.event) };
                elm.attachEvent("on" + ed, elm[ed+cd]);
                Go.WriteEventGoNoSQLStack(elm,"Go_Event",ed,cd);
            };
            return BindALL(e, event, callback);
        } else {
            throw new Error("Browser not support Event Listener.");
        }
    }

    function UnBindALL(e,event,callback){
        /*对于unbind来说.一个元素的解除绑定, 可以是指向解除某个函数 某个事件.所以要根据参数来执行步骤.unbind就会显得非常的复杂*/
        /*DOM元素解绑的时候同样需要将已经注入到Go.NoSQL中的绑定缓存给清理掉*/
        var inStack = e.getAttribute("go_nosql");
        if(arguments.length == 1 && !event ){
            //如果没有指定event事件, 也没有指定解绑的函数,就会将当前DOM元素所有的事件全部解绑.
            //存储记录在Go.NoSQL 事件的指引位置.
            var p =Go.NoSQL[inStack];
            if(doc.removeEventListener){
                for(var events in p ){
                    if(/_Go_Event_(\w+)/i.test(events)){
                        event = events.split("_");
                        var leng = event.length;
                        event = event[leng-1];
                        for(var i= 0,l=p[events].length;i<l;i++){
                            e.removeEventListener(event,p[events][i]);
                        }
                    }
                }
            }else{
                for(var events in p ){
                    if(/_Go_Event_(\w+)/i.test(events)){
                      event = events.split("_");
                        event = event[event.length-1];
                        for(var i= 0,l=p[events].length;i<l;i++){
                            e.detachEvent("on"+event,e[event+p[events][i]]);
                            e[event+p[events][i]]= null;
                        }
                    }
                }
            }
            Go(e).rmAttr("go_nosql");
            delete Go.NoSQL[inStack];
        }else if(event && !callback){
            var GoEvent = "_Go_Event_"+event;
            var pE = Go.NoSQL[inStack][GoEvent];
            if(!pE){
                return;
            }
            if(doc.removeEventListener){
                for(var i= 0,l= pE.length;i<l;i++){
                    e.removeEventListener(event,pE[i],false);
                }
            }else{
                for(var i= 0,l= pE.length;i<l;i++){
                    e.detachEvent("on"+ event,e[event + pE[i]]);
                    e[event+pE[i]] = null;
                }
            }
            delete Go.NoSQL[inStack][GoEvent];
        }else{
            var Go_Event = "_Go_Event_"+event;
            var pIn = Go.NoSQL[inStack][Go_Event];
            if(doc.removeEventListener){
                e.removeEventListener(event,callback,false);
            }else{
                e.detachEvent("on"+event,e[event + callback]);
                e[event + callback] = null;
            }
            for(var i= 0,l=pIn.length;i<l;i++){
                if(pIn[i] == callback){
                    pIn.splice(i,1);
                }
            }
        }
    }
    function hasClass(elm,className){
        return new RegExp(Go.PaddingString(className)).test(Go.PaddingString(elm.className));
    }
    function getClass(elm, tag) {
        //惰性载入的函数设计方式
        if (doc.getElementsByClassName) {
            getClass = function (elm) {
                var result = [],
                    elms = doc.getElementsByClassName(elm);
                Go.AryEach(elms,function(e){
                    push.call(result,e);
                });
                return result;
                //HTML5的方法
            };
            return getClass(elm);
        }
        if (MSIE8 && doc.querySelector) { //IE8方法 比判断querySelector少3个字节.
            getClass = function (elm) {
                var result = [];
                var elms = qSA("." + elm);
                Go.AryEach(elms,function(e){
                   push.call(result,e);
                });
                return result;
            };
            return getClass(elm);
        } else { //兼容方法
            getClass = function (elm, tag) {
                tag = tag || "*";
                var result = {},
                    reg = new RegExp("(^|\\s)" + elm + "(\\s|$)"),
                    tags = doc.getElementsByTagName(tag);
                for (var i = 0, j = 0 ,l = tags.length; i < l; i++) {
                    if (reg.test(tags[i].className)) {
                        result[j] = tags[i]; //key = value;
                        j++;
                    }
                }
                return result;
            };
            return getClass(elm, tag);
        }
    }

    function createXHR() { //创建XHR请求
        if (typeof XMLHttpRequest !== "undefined") {
            createXHR = function () {
                return new XMLHttpRequest();
            }
        } else if (typeof ActiveXObject !== 'undefined') {
            createXHR = function () {
                if (typeof arguments.callee.activeXString != "string") {
                    var version = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp', 'Microsoft.XMLHTTP'];
                    Go.AryEach(version,function(ver){
                        try {
                            var xhr = new ActiveXObject(ver);
                            arguments.callee.activeXString = ver;
                            return xhr;
                        } catch (ex) {
                            Go._NOOP()
                        }
                    });
                }
                return new ActiveXObject(arguments.callee.activeXString);
            }
        } else {
            createXHR = function () {
                throw new Error("No XHR object!");
            }
        }
        return createXHR();
    }

    function _onStateChanging(xhr, success, error) {
        if (xhr.readyState == 4 && xhr.responseText) {
            var s = xhr.status;
            if ((s >= 200 && s < 300) || s == 304) {
                success(xhr.responseText);
            } else {
                error(xhr);
            }
        } else {
            Go._NOOP();
        }
    }

    function createElement(elmname, profileOBJ) {
        var elm = doc.createElement(elmname);
        if (profileOBJ && profileOBJ instanceof Object && profileOBJ !== broken) {
            for (var k in profileOBJ) {
                elm[k] = profileOBJ[k];
            }
        }
        return elm;
    }

    function formatParam(obj) {
        if (obj === ""+obj)
            return obj;
        else if (typeof obj === "object" && obj !== broken) {
            var urlParam,
                arg = [];
            for (var k in obj) {
                push.call(arg,[encodeURIComponent(k),"=",encodeURIComponent(obj[k])].join(""));
            }
            urlParam = arg.join("&");
            return urlParam;
        } else
            return "";
    }

    function Unique(ary) {
        //数组去除重复.
        var b = {},
            result = [];
        for (var i = 0, l = ary.length; i < l; i++) {
            if (!b[ary[i]]) {
                b[ary[i]] = 1;
                result.push(ary[i]);
            }
        }
        b = null;
        return result;
    }

    function RemoveDuplicate(ary) {
        //数组拆分成字符串, 然后删除相同的元素
        //比如 1,1,2,2,3,4,4,5
        //最后只剩下3,5 重复的都要被删除
        var reg = /(\w+\,)\1/g;
        var result = ary.sort();
        result = result.join(",").replace(reg, "").split(",");
        var len = result.length - 1;
        if (result[len] == result[len - 1]) {
            result.pop();
            result.pop();
        }
        return result;
    }

    function RemoveArrayValue(ary,val){
        //在数组中删除指定的值
        var result = [];
        for(var i=0,l=ary.length; i<l;i++){
            if(ary[i] !== val){
                result.push(ary[i]);
            }
        }
        return result;
    }
    function equalTagName(elm,TagString){
        TagString = TagString.toUpperCase();
        return elm.nodeName === TagString;
    }

    function Reverse(ary,callback,context){
        for(var i = ary.length;i--;){
            callback(ary[i],i,ary,context)
        }
    }

    function upperCaseFirst(str){
        return [str.substring(0,1).toUpperCase(),str.substring(1,str.length)].join("");
    }

    function getStyle(elm,styleName){
       if(global.getComputedStyle){
           return global.getComputedStyle(elm,null)[styleName];
       }else{
           return elm.currentStyle[styleName];
       }
    }

    function intval(v) {
        v = parseInt(v);
        return isNaN(v) ? 0 : v;
    }
    function removeNode(e){
        e.parentNode.removeChild(e);
    }

    //ActionScript 3.0 Tween 动画算法
    Go.Tween = {
        Linear: function (t, b, c, d) {
            return c * t / d + b;
        },
        Quad: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * (t /= d) * (t - 2) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                return -c / 2 * ((--t) * (t - 2) - 1) + b;
            }
        },
        Cubic: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t + 2) + b;
            }
        },
        Quart: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * ((t = t / d - 1) * t * t * t - 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
                return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
            }
        },
        Quint: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
            }
        },
        Sine: {
            easeIn: function (t, b, c, d) {
                return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            },
            easeInOut: function (t, b, c, d) {
                return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
            }
        },
        Expo: {
            easeIn: function (t, b, c, d) {
                return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
            },
            easeOut: function (t, b, c, d) {
                return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if (t == 0) return b;
                if (t == d) return b + c;
                if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            }
        },
        Circ: {
            easeIn: function (t, b, c, d) {
                return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
                return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
            }
        },
        Elastic: {
            easeIn: function (t, b, c, d, a, p) {
                if (t == 0) return b;
                if ((t /= d) == 1) return b + c;
                if (!p) p = d * .3;
                if (!a || a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                } else var s = p / (2 * Math.PI) * Math.asin(c / a);
                return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            },
            easeOut: function (t, b, c, d, a, p) {
                if (t == 0) return b;
                if ((t /= d) == 1) return b + c;
                if (!p) p = d * .3;
                if (!a || a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                } else var s = p / (2 * Math.PI) * Math.asin(c / a);
                return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
            },
            easeInOut: function (t, b, c, d, a, p) {
                if (t == 0) return b;
                if ((t /= d / 2) == 2) return b + c;
                if (!p) p = d * (.3 * 1.5);
                if (!a || a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                } else var s = p / (2 * Math.PI) * Math.asin(c / a);
                if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
            }
        },
        Back: {
            easeIn: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * (t /= d) * t * ((s + 1) * t - s) + b;
            },
            easeOut: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            },
            easeInOut: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
                return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
            }
        },
        Bounce: {
            easeIn: function (t, b, c, d) {
                return c - Go.Tween.Bounce.easeOut(d - t, 0, c, d) + b;
            },
            easeOut: function (t, b, c, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return c * (7.5625 * t * t) + b;
                } else if (t < (2 / 2.75)) {
                    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
                } else if (t < (2.5 / 2.75)) {
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
                } else {
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
                }
            },
            easeInOut: function (t, b, c, d) {
                if (t < d / 2) return Go.Tween.Bounce.easeIn(t * 2, 0, c, d) * .5 + b;
                else return Go.Tween.Bounce.easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
            }
        }
    };
    global.Go = global.Ghost = Go;
    return Go;
}));
