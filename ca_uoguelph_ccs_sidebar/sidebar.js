/**
 * News & Events Sidebar Zimlet
 * Copyright 2011 University of Guelph - Computing and Communication Services
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @overview Displays news and upcoming events.
 * @author M. Brent Harp
 */

function ca_uoguelph_ccs_sidebarHandlerObject () {}

ca_uoguelph_ccs_sidebarHandlerObject.prototype = new ZmZimletBase ();
ca_uoguelph_ccs_sidebarHandlerObject.prototype.constructor = ca_uoguelph_ccs_sidebarHandlerObject;

ca_uoguelph_ccs_sidebarHandlerObject.prototype.dateFormat = new AjxDateFormat (I18nMsg.formatDateShort);
ca_uoguelph_ccs_sidebarHandlerObject.prototype.timeFormat = new AjxDateFormat (I18nMsg.formatTimeShort);

ca_uoguelph_ccs_sidebarHandlerObject.HELP_URL = 'HelpUrl';

ca_uoguelph_ccs_sidebarHandlerObject.HIDE_PATTERN = /^~/;

ca_uoguelph_ccs_sidebarHandlerObject.APP_MAIL = 'Mail';

ca_uoguelph_ccs_sidebarHandlerObject.APP_CALENDAR = 'Calendar';

ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_MENU = 'sidebarMenu';
ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_ON   = 'sidebarOn';
ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_OFF  = 'sidebarOff';

ca_uoguelph_ccs_sidebarHandlerObject.prototype.getText = function (key)
{
    return this.getMessage(key) || key;
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.init = function ()
{
    var self = this;

    this.visible = false;
    this.appId = ca_uoguelph_ccs_sidebarHandlerObject.APP_MAIL;
    this.show = new Object();
    this.show[this.appId] = true;

    this.dwtRoot = new DwtComposite
    ({
        parent: this.getShell(),
        posStyle: Dwt.ABSOLUTE_STYLE
    });
    this.dwtRoot.getHtmlElement().style.overflowY = 'auto';
    this.dwtRoot.getHtmlElement().style.overflowX = 'hidden';
    this.dwtRoot.setZIndex (300);

    this.dwtLabelTop = new DwtButton
    ({
        parent: this.dwtRoot,
        id: 'ca_uoguelph_ccs_sidebar_tree_top'
    });
    this.dwtLabelTop.setToolTipContent(this.getText("HideEvents"));
    this.dwtLabelTop.setText(this.getText("Events"));
    this.dwtLabelTop.setImage ("Date");
    this.dwtLabelTop.setHoverImage("RightArrow");
    this.dwtLabelTop.setSize("100%",30);
    this.dwtLabelTop.addListener (
        DwtEvent.ONMOUSEUP,
        new AjxListener (this, this.setShow, false)
        );


    this.dwtTree = new DwtTree
    ({
        parent: this.dwtRoot
    });

    //this.dwtTree.getHtmlElement().style.overflowY = 'auto';
    //this.dwtTree.getHtmlElement().style.overflowX = 'hidden';


    this.dwtHelp = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("Help"),
        selectable: false,
        singleClickAction: true
    });
    this.dwtHelp.addListener
    (
        DwtEvent.ONMOUSEUP,
        new AjxListener (this, this.showHelp)
        );


    this.dwtToday = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("Today"),
        className: "overviewHeader"
    });
    new DwtTreeItem (this.dwtToday, 0, this.getText("Loading"));
    this.dwtToday.enableSelection(false);
    this.dwtToday.setData("show_pref", "show_today");
    this.dwtToday.setData("show_pref_default", "true");
    this.dwtToday.setExpanded(this.getShowPref(this.dwtToday));

    this.dwtTomorrow = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("Tomorrow"),
        className: "overviewHeader"
    });
    new DwtTreeItem (this.dwtTomorrow, 0, this.getText("Loading"));
    this.dwtTomorrow.enableSelection(false);
    this.dwtTomorrow.setData("show_pref", "show_tomorrow");
    this.dwtTomorrow.setData("show_pref_default", "true");
    this.dwtTomorrow.setExpanded(this.getShowPref(this.dwtTomorrow));

    this.dwtThisWeek = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("ThisWeek"),
        className: "overviewHeader"
    });
    new DwtTreeItem (this.dwtThisWeek, 0, this.getText("Loading"));
    this.dwtThisWeek.enableSelection(false);
    this.dwtThisWeek.setData("show_pref", "show_thisweek");
    this.dwtThisWeek.setData("show_pref_default", "false");
    this.dwtThisWeek.setExpanded(this.getShowPref(this.dwtThisWeek));

    this.dwtTasks = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("Tasks"),
        className: "overviewHeader"
    });
    new DwtTreeItem (this.dwtTasks, 0, this.getText("Loading"));
    this.dwtTasks.enableSelection(false);
    this.dwtTasks.setData("show_pref", "show_tasks");
    this.dwtTasks.setData("show_pref_default", "false");
    this.dwtTasks.setExpanded(this.getShowPref(this.dwtTasks));

    this.dwtNews = new DwtTreeItem
    ({
        parent: this.dwtTree,
        text: this.getText("News"),
        className: "overviewHeader"
    });
    new DwtTreeItem (this.dwtNews, 0, this.getText("Loading"));
    this.dwtNews.enableSelection(false);
    this.dwtNews.setData("show_pref", "show_news");
    this.dwtNews.setData("show_pref_default", "false");
    this.dwtNews.setExpanded(this.getShowPref(this.dwtNews));

    /* Remove class from sidebar ad */
    document.getElementById('skin_td_sidebar_ad').className = "";

    /* Create Resize handler. */
    this.getShell().addControlListener(new AjxListener (this, this.resize));

    this.setVisible (false);

    /* Check if the mini calendar is enabled. */
    if (appCtxt.get(ZmSetting.CAL_ALWAYS_SHOW_MINI_CAL)) {
        /* If the mini calendar is enabled, intercept mini calendar updates and update us as well. */
        var highlightMiniCal = ZmMiniCalCache.prototype.highlightMiniCal;
        ZmMiniCalCache.prototype.highlightMiniCal = function (dateArr) {
            self.update ();
            highlightMiniCal.call (this, dateArr);
        };
    } else {
        /* Otherwise, just update now.*/
        this.update();
    }

    this.dwtTree.addTreeListener (new AjxListener(this, this.onTreeEvent));
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.onShowView = function (view) {

    var viewId;

    viewId = appCtxt.getViewTypeFromId(view);

    // Hide when not in mail view

    if (viewId == ZmId.VIEW_CONVLIST || viewId == ZmId.VIEW_TRAD) {

        this.setVisible(true);

    } else {

        this.setVisible(false);

    }

};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.initializeToolbar = function(app, toolbar, controller, viewId)
{
    viewId = appCtxt.getViewTypeFromId(viewId);

    if (viewId == ZmId.VIEW_CONVLIST || viewId == ZmId.VIEW_TRAD) {
        var button = toolbar.getOp(ZmOperation.VIEW_MENU);
        var menu = this.dwtMenu = button.getMenu(true);

        if (menu) {

            menu.createSeparator();
            var btnSidebarOn = menu.createMenuItem(ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_ON, {
                text:         this.getText("sidebarOn"),
                radioGroupId: ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_MENU,
                style:        DwtMenuItem.RADIO_STYLE
            });
            btnSidebarOn.addSelectionListener(new AjxListener(this, this.onSidebarMenu, ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_ON));
            var btnSidebarOff = menu.createMenuItem(ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_OFF, {
                text:         this.getText("sidebarOff"),
                radioGroupId: ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_MENU,
                style:        DwtMenuItem.RADIO_STYLE
            });
            btnSidebarOff.addSelectionListener(new AjxListener(this, this.onSidebarMenu, ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_OFF));
        }
    }
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.onSidebarMenu = function(action)
{
    this.setShow(ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_ON === action);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.getShowPref = function (treeItem)
{
    return ((this.getUserProperty(treeItem.getData("show_pref")) ||
             treeItem.getData("show_pref_default")) != "false");
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.onTreeEvent = function (ev)
{
    if (this.updating == true)
    {
    // do nothing
    }
    else if (ev.detail == DwtTree.ITEM_EXPANDED)
    {
        if(this.getShowPref(ev.item) != true) {
            this.setUserProperty(ev.item.getData("show_pref"), "true", true);
            this.update();
        }
    }
    else if (ev.detail == DwtTree.ITEM_COLLAPSED)
    {
        if(this.getShowPref(ev.item) != false)
            this.setUserProperty(ev.item.getData("show_pref"), "false", true);
    }
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.onSelectApp = function (id)
{
    this.setAppId (id);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.updateTreeItem = function (parent,
    startTime,
    endTime,
    showDate)
{
    var params = {
        start:startTime,
        end:endTime,
        fanoutAllDay:true
    };
    var controller = AjxDispatcher.run("GetCalController");
    var events = controller.getApptSummaries(params);

    // Filter out wrong appointments due to bug 80558
    // http://bugzilla.zimbra.com/show_bug.cgi?id=80558

    tmp = new AjxVector();

    for (i = 0; i < events.size(); i = i + 1) {

        currentAppt = events.get(i);

        if (
            (currentAppt.getStartTime() >= startTime) &&
            (currentAppt.getEndTime() <= endTime)
        ) {
            tmp.add(currentAppt);
        }

    }

    events = tmp;

    this.apptSummaries = events;

    parent.removeChildren();

    var displayCount = 0;
    var oldwhen = null;
    for (var i = 0; i < events.size(); i++) {
        var event = events.get(i);
        var folder = event.getFolder();
        if (folder.getName().match(ca_uoguelph_ccs_sidebarHandlerObject.HIDE_PATTERN)) {
            continue;
        }
        var what = event.getName();
        var where = event.getLocation();
        var when = ((showDate ? this.dateFormat : this.timeFormat)
            .format(event.startDate));

        if ((oldwhen != null) && (oldwhen != when)) {

            parent.addSeparator();

        }

        oldwhen = when;

        var color = folder.rgb || ZmOrganizer.COLOR_VALUES[folder.color];
        var img = ["CalendarFolder", color].join(',color=');
        var text = ((!showDate && event.isAllDayEvent()) ?
            what : [when, what].join(' '));

        if (text.length > 20) {

            text = text.slice(0,17) + "...";

        }

        var item = new DwtTreeItem
        ({
            parent: parent,
            text: text,
            imageInfo: img,
            selectable: false,
            singleClickAction: true
        });
        item.setToolTipContent (event.getToolTip());
        item.addListener
        (
            DwtEvent.ONMOUSEUP,
            new AjxListener (this, this.showEvent, event)
            );
        displayCount++;
    }

    if (displayCount == 0) {
        new DwtTreeItem
        ({
            parent: parent,
            text: this.getText("NoEvents"),
            selectable: false
        });
    }
    else {
        this.notify() ;
    }

    parent.setExpanded(this.getShowPref(parent));
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.collectNewsFolders = function (list, root)
{
    if (!root)
    {
        return list;
    }

    if (root.type == ZmOrganizer.FOLDER && root.url
        && !root.getName().match(ca_uoguelph_ccs_sidebarHandlerObject.HIDE_PATTERN))
        {
        var folder = new ZmFolder(root);
        list.push(folder.createQuery());
    }

    var kids = root.children._array;
    var kidslen = kids.length;

    if (kidslen > 0)
    {
        for (var i = 0; i < kidslen; i++) {
            this.collectNewsFolders (list, kids[i]);
        }
    }

    return list;
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.updateNews = function ()
{
    var rootFolder = appCtxt.getFolderTree().root;
    var newsFolders = [];
    this.collectNewsFolders(newsFolders, rootFolder);

    if (newsFolders.length == 0)
    {
        this.dwtNews.removeChildren();
        new DwtTreeItem
        ({
            parent: this.dwtNews,
            text: this.getText("NoFeeds"),
            selectable: false
        });
        this.dwtNews.setExpanded (this.getShowPref(this.dwtNews));
        return;
    }

    var query = newsFolders.join(" OR ");

    // create the json object for the search request
    var jsonObj = {
        SearchRequest:{
            _jsns:"urn:zimbraMail"
        }
    };
    var request = jsonObj.SearchRequest;
    request.sortBy = ZmSearch.DATE_DESC;
    ZmTimezone.set(request, AjxTimezone.DEFAULT);
    request.locale = {
        _content: AjxEnv.DEFAULT_LOCALE
    };
    request.offset = 0;
    request.types = ZmSearch.TYPE[ZmItem.MSG];
    request.query = query;
    request.offset = 0;
    request.limit = 10;

    var searchParams = {
        jsonObj:jsonObj,
        asyncMode:true,
        callback:new AjxCallback(this, this.showNewsItems, null),
        errorCallback:new AjxCallback(this, this.errorCallback)
    };
    appCtxt.getAppController().sendRequest(searchParams);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.errorCallback = function ()
{
    // do nothing
    };

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showNewsItems = function (items, result)
{
    var parent = this.dwtNews;

    parent.removeChildren();

    var response = result.getResponse().SearchResponse;
    var responseMsgList;
    if (response) {
        responseMsgList = response[ZmList.NODE[ZmItem.MSG]];
    }
    var numMsgs;
    if (!response || !responseMsgList ||
        (numMsgs = responseMsgList.length) == 0)
        {
        new DwtTreeItem
        ({
            parent: parent,
            text: this.getText("NoNews"),
            selectable: false
        });
        parent.setExpanded (this.getShowPref(parent));
        return;
    }

    for (var i = 0; i < numMsgs; i++) {
        var item = responseMsgList[i];
        var img = "RSS";
        var text = item.su;

        if (text.length > 20) {

            text = text.slice(0,17) + "...";

        }

        var leaf = new DwtTreeItem
        ({
            parent: parent,
            text: text,
            imageInfo: img,
            selectable: false,
            singleClickAction: true
        });
        leaf.setToolTipContent(text);
        leaf.addListener
        (
            DwtEvent.ONMOUSEUP,
            new AjxListener (this, this.showNewsItem, item)
            );
    }

    parent.setExpanded(this.getShowPref(parent));

    this.notify();
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.updateTasks = function ()
{
    // create the json object for the search request
    var jsonObj = {
        SearchRequest:{
            _jsns:"urn:zimbraMail"
        }
    };
    var request = jsonObj.SearchRequest;
    request.sortBy = ZmSearch.DUE_DATE_ASC;
    ZmTimezone.set(request, AjxTimezone.DEFAULT);
    request.locale = {
        _content: AjxEnv.DEFAULT_LOCALE
    };
    request.offset = 0;
    request.types = ZmSearch.TYPE[ZmItem.TASK];
    request.query = "in:Tasks";
    request.offset = 0;
    request.limit = 100;
    request.allowableTaskStatus = "COMP,NEED,INPR,WAITING,DEFERRED";

    var searchParams = {
        jsonObj:jsonObj,
        asyncMode:true,
        callback:new AjxCallback(this, this.showTasks, null),
        errorCallback:new AjxCallback(this, this.errorCallback)
    };
    appCtxt.getAppController().sendRequest(searchParams);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showTasks = function (items, result)
{
    var parent = this.dwtTasks;

    parent.removeChildren();

    var response = result.getResponse().SearchResponse;
    var responseTaskList;
    if (response) {
        responseTaskList = response[ZmList.NODE[ZmItem.TASK]];
    }
    var numTasks;
    if (!response || !responseTaskList ||
        (numTasks = responseTaskList.length) == 0)
        {
        new DwtTreeItem
        ({
            parent: parent,
            text: this.getText("NoTasks"),
            selectable: false
        });
        parent.setExpanded (this.getShowPref(parent));
        return;
    }

    var now = new Date().getTime();

    for (var i = 0; i < numTasks; i++) {
        var item = responseTaskList[i];
        if (item.status == "COMP")
            continue;
        var iColor = ZmOrganizer.C_GREEN;
        var dueIn = item.dueDate - now;
        if (dueIn < 0)
            iColor = ZmOrganizer.C_RED;
        else if (dueIn < 1000 * 60 * 60 * 24)
            iColor = ZmOrganizer.C_ORANGE;
        var colColor = ZmOrganizer.COLOR_VALUES[iColor];
        var img = ["TaskList", colColor].join(',color=');
        var text = item.name;

        if (text.length > 20) {

            text = text.slice(0,17) + "...";

        }

        var leaf = new DwtTreeItem
        ({
            parent: parent,
            text: text,
            imageInfo: img,
            selectable: false,
            singleClickAction: true
        });
        leaf.setToolTipContent(text);
        leaf.addListener(
            DwtEvent.ONMOUSEUP,
            new AjxListener (
                this,
                this.showTaskItem,
                [ item.id ]
            )
        );
    }

    parent.setExpanded(this.getShowPref(parent));

    this.notify();
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showEvent = function (event)
{
    var ctrl = AjxDispatcher.run("GetCalController");
    ctrl.show();
    ctrl._viewMgr.setDate(event.startDate, 0, true);
    this.setAppId(ca_uoguelph_ccs_sidebarHandlerObject.APP_CALENDAR);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showNewsItem = function (item)
{
    var ctrl = AjxDispatcher.run("GetMsgController");
    ctrl.show (new ZmMailMsg(item.id), null, null, true);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.update = function ()
{
    if (this.show[this.appId] != true)
        return;

    if (this.updating)
        return ;

    this.updating = true;

    var startDate = new Date();
    var startTime = startDate.getTime();
    startDate.setHours(0, 0, 0, 0);
    var endTime = startDate.getTime() + 1000 * 60 * 60 * 24;
    if (this.getShowPref(this.dwtToday)){
        this.updateTreeItem (this.dwtToday, startTime, endTime, false);
    }

    startTime = endTime;
    endTime = endTime + 1000 * 60 * 60 * 24;
    if (this.getShowPref(this.dwtTomorrow)){
        this.updateTreeItem (this.dwtTomorrow, startTime, endTime, false);
    }

    startTime = endTime;
    endTime = endTime + 1000 * 60 * 60 * 24 * 5;
    if (this.getShowPref(this.dwtThisWeek)) {
        this.updateTreeItem (this.dwtThisWeek, startTime, endTime, true);
    }

    if (this.getShowPref(this.dwtTasks)) {
        this.updateTasks ();
    }

    if (this.getShowPref(this.dwtNews)) {
        this.updateNews ();
    }

    this.updating = false;
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.setVisible = function (visible) {
    this.visible = visible ;
    /* Hide/show the sidebar */
    var ad = document.getElementById('skin_td_sidebar_ad');
    ad.className = ""; /* remove outer_ad style */
    ad.style.display = (visible ? 'table-cell' : 'none');
    /* Resize */
    this.resize();
    /* Show/hide controls */
    this.dwtRoot.setVisibility (visible);
    /* Trick other applications into resizing. */
    var shell = DwtControl.fromElementId(window._dwtShellId);
    shell._currWinSize.x = 0;
    shell._currWinSize.y = 0;
    DwtShell._resizeHdlr () ;
    /* Update menu */
    if (this.dwtMenu) {
        this.dwtMenu.getMenuItem(ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_ON).setChecked(visible, true);
        this.dwtMenu.getMenuItem(ca_uoguelph_ccs_sidebarHandlerObject.SIDEBAR_OFF).setChecked(!visible, true);
    }
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.setShow = function (show) {
    this.show[this.appId] = show;
    this.update();
    this.notify();
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.setAppId = function (id)
{
    if (this.appId != id)
    {
        this.appId = id;
        this.update();
        this.notify();
    }
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.notify = function ()
{
    this.setVisible (this.show[this.appId] == true);
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.resize = function ()
{
    var rect;
    if (this.visible) {
        rect = Dwt.getBounds(document.getElementById('skin_td_sidebar_ad'));
        this.dwtRoot.setLocation (rect.x + 8, rect.y);
        this.dwtRoot.setSize(rect.width - 8, rect.height);
    }
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showHelp = function () {
    window.open(this.getText(ca_uoguelph_ccs_sidebarHandlerObject.HELP_URL));
};

ca_uoguelph_ccs_sidebarHandlerObject.prototype.showTaskItem =
    function (itemId, evt) {

        var item;

        item = appCtxt.getById(itemId);

        if (!item) {

            AjxTimedAction.scheduleAction(
                new AjxTimedAction(
                    this,
                    this.showTaskItem,
                    [
                        itemId, evt
                    ]
                ),
                1000
            );

            return;

        }

        AjxDispatcher.run("GetTaskController").show(
            item,
            2
        );
    };