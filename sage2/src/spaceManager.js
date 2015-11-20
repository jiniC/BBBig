
var loadConfiguration = require('../server')
var Bounds = require('../src/globals');
//var getWidth = require('../src/globals');
//var getHeight = require('../src/globals');

function DynamicSpaceManager(left,right,up,bottom,width,height) {
    //var section = parent;
	this.left = left;
	this.right = right;
	this.up = up;
	this.bottom = bottom;
	this.width = width;
	this.height = height;
    this.bound = new Bounds(left,right,up,bottom);
    this.fullSpaceList = [];
    this.appList = [];
    this.largestEmptySpaceList = [];
    //this.largestEmptySpaceList.push(this.bound);
    //this.totalArea = getWidth.getWidth() * getHeight.getHeight();
	this.initializeEmptySpace();
}

// hyunhye : largest empty-space 초기화
DynamicSpaceManager.prototype.initializeEmptySpace = function(){

	// load config file - looks for user defined file, then file that matches hostname, then uses default
	var config = loadConfiguration.loadConfiguration();
	
	// config = config;
	var nRows  = config.layout.rows;
	var nCols  = config.layout.columns;
	
	// Bounds 경계 4개생성
	// largestEmptySpaceList에 넣기
	var bound = new Bounds(0,(config.resolution.width*nCols),0,this.up);
	this.largestEmptySpaceList.push(bound);
	
	bound = new Bounds(0,this.left,0,(config.resolution.height*nRows));
	this.largestEmptySpaceList.push(bound);
	
	bound = new Bounds(this.right,(config.resolution.width*nCols),0,(config.resolution.height*nRows));
	this.largestEmptySpaceList.push(bound);
	
	bound = new Bounds(0,(config.resolution.width*nCols),this.bottom,(config.resolution.height*nRows));
	this.largestEmptySpaceList.push(bound);	
	
}
DynamicSpaceManager.prototype.updateBound = function (bound) {
    this.bound = bound;
}
// -----------------------------------
// free type -> find space 
DynamicSpaceManager.prototype.createFullRectangle = function (app) {
    //print "CREATE FULL RECTANGLE... ... ... sail_id=" + str(app.getId())
    //print "app -> " + str(app.left) + " " + str(app.right) + " " + str(app.bottom) + " " + str(app.up)
	var item;
    var aspectRatio = this.width/this.height;
	
    var left = right = up = bottom = 0;
    var max_area = 0;
    var found = false;
	var space;
	
    // because we are looking for best fit. largest area does not guarantee optimal choice
    //for (space in this.largestEmptySpaceList) {
	for(var i=0; i < this.largestEmptySpaceList.length; i++){     
		// ratio = x / y 	
		space = this.largestEmptySpaceList[i];
		
        //공간 크기
        space_width = space.width; // hyunhye : getWidth()
        space_height = space.height; // hyunhye : getHeight()

        // 윈도우 크기 => 비율에 맞춰 줄이기
        app_height = space_width / aspectRatio;
        app_width = space_width;
		
        if (app_height > space_height) {  // 만약 윈도우 크기가 더 크면..
            app_height = space_height; // 윈도우 높이를 공간 높이로 바꾸고
            app_width = space_height * aspectRatio; // 윈도우 너비를 비율에 맞춰 바꾼다.
        }
        // 면적 = 윈도우 높이 * 윈도우 너비
        var area = app_height * app_width;
        if (area > max_area) {// 만약 면적이 최대 면적보다 크면
            max_area = area; // 최대 면적을 현재 면적으로 늘린다.

            //left = space.left + int((space_width - app_width)/2.0)
            //bottom = space.bottom + int((space_height - app_height)/2.0)
            left = space.left;
            bottom = space.bottom;
            // todo? 
            // put into center? - need policy adjustment

            // 바뀐 윈도우의 크기가 원래 윈도우의 크기보다 작으면..
            if ((app_width < app.width) || (app_height < app.height)) {
                right = left + app_width;
                up = bottom + app_height;
            }
            else {
                right = left + app.width;
                up = bottom + app.height;
            }
            found = true; // found를 true로 변경!
            //break;

        }
    }
    if (found == true) {
        // ???? strange stereo 3D.... it is from sageBaseGate...
        if ((up % 2) == 1) {
            up = up - 1;
            bottom = bottom - 1;
        }
        app.left = left;
        app.right = right;
        app.up = up;
        app.bottom = bottom;

		// hyunhye
        //app.resizeWindow(this.left, this.right, this.bottom, this.up);
		
        // sailID???
		var b = new Bounds(app.left, app.right, app.up, app.bottom);
        this.addFullRectangle(b);
        //hyunhye : app.getId()

		item = {elemId: app.id,
							elemLeft: app.left, elemTop: app.up,
							elemWidth: app.right-app.left, elemHeight: app.up-app.bottom,
							force: true, date: new Date()};

    }
	
	console.log(item.elemLeft+" "+item.elemTop+" "+item.elemWidth+" "+item.elemHeight);
	return item;
	
}
DynamicSpaceManager.prototype.searchExpandRectangle = function (app) {
    //print "search exp&& rectangle.... " 
    //print "before-", len(this.largestEmptySpaceList)
    // delete the rectangle with current app
    this.deleteFullRectangle(app)

    //print "after-delete", len(this.largestEmptySpaceList)
    //print "(", app.left, app.right, app.bottom, app.up, ")"
    //for space in this.largestEmptySpaceList :
    //    print space.left, space.right, space.bottom, space.up

    var aspectRatio = app.aspectRatio;
    var left = right = up = bottom = 0;
    var max_area = 0;
    var found = false;

    // because we are looking for best fit. largest area does not guarantee optimal choice
    for (space in this.largestEmptySpaceList) {
        if (!(space.left <= app.left && app.right <= space.right && space.bottom <= app.bottom && app.up <= space.up)) {
            continue;
        }
        var space_width = space.getWidth();
        var space_height = space.getHeight();
        console.log("space--- searching... ", space_width);
        console.log("space--- searching...", space_height);

        // ratio = x / y 
        var app_height = space_width / aspectRatio;
        var app_width = space_width;
        if (app_height > space_height) {
            app_height = space_height;
            app_width = space_height * aspectRatio;
        }

        var area = app_height * app_width;
        if (area > max_area) {
            max_area = area;

            left = space.left + (space_width - app_width) / 2;
            bottom = space.bottom + (space_height - app_height) / 2;
            // todo? 
            // put into center? - need policy adjustment

            right = left + app_width;
            up = bottom + app_height;
            found = true;
        }
    }
    if (found == true) {
        // ???? strange stereo 3D.... it is from sageBaseGate...
        if ((up % 2) == 1) {
            up = up - 1;
            bottom = bottom - 1;
        }
        app.left = left;
        app.right = right;
        app.up = up;
        app.bottom = bottom;
        diff = up - bottom;

        app.resizeWindow(app.left, app.right, app.bottom, app.up);
        this.addFullRectangle(app.id, Bounds(app.left, app.right, app.up, app.bottom));
    }
}
DynamicSpaceManager.prototype.addRectangle = function (app) {
	// hyunhye : Bounds 객체 생성
	
	var b = new Bounds(app.left, app.right, app.up, app.bottom);
    this.addFullRectangle(b)
    // hyunhye : app.getId()
}
DynamicSpaceManager.prototype.updateFullRectangle = function (app) {
    //print "UPDATE FULL RECTANGLE... ... ... sail_id=" + str(app.getId())
    //print "app -> " + str(app.left) + " " + str(app.right) + " " + str(app.bottom) + " " + str(app.up)

    // delete first
    var index = 0;
    for (app_space in this.fullSpaceList) {
        if (app.id == app_space[0]) { //hyunhye : app.getId()
            var space = app_space[1];
            if (space.left == app.left && space.right == app.right && space.up == app.up && space.bottom == app.bottom) {
                // later, depth is also needed to be consider
                // print "same"
                return;
            }

            this.fullSpaceList.pop(index);
            //print "pop && apply previous bounds: " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up)

            if (this.fullSpaceList.length == 0) {
                this.largestEmptySpaceList = [];
                this.largestEmptySpaceList.push(this.bound);
            }
            else {
                this.removeFullRectangle(Bounds(space.left, space.right, space.up, space.bottom));
            }
            // todo -> del app_space
            app_space = [];
            break;
        }
        index += 1;
    }
    this.addFullRectangle(app.id, Bounds(app.left, app.right, app.up, app.bottom));
    // hyunhye : app.getId()

}
DynamicSpaceManager.prototype.deleteFullRectangle = function (app) {
    //print "DELETE FULL RECTANGLE... ... ... sail_id=" + str(app.getId())
    //print "app -> " + str(app.left) + " " + str(app.right) + " " + str(app.bottom) + " " + str(app.up)

    index = 0;
    for (app_space in this.fullSpaceList) {
        if (app.id == app_space[0]) { // hyunhye : app.getId()
            this.fullSpaceList.pop(index);
            app_space = [];
            //print "pop"
            break;
        }
        index += 1;
    }
    var window_count = this.fullSpaceList.length;
    if (window_count == 0) {
        this.largestEmptySpaceList = [];
        this.largestEmptySpaceList.push(this.bound);
    }
    else {
        this.removeFullRectangle(Bounds(app.left, app.right, app.up, app.bottom));
    }
    return window_count;
}
DynamicSpaceManager.prototype.clearRectangles = function () {
    // clear empty && full space list space
    // todo -> del this.largestEmptySpaceList
    this.largestEmptySpaceList = [];
    this.largestEmptySpaceList.push(this.bound);
	// todo : this.bound -> this.bound.getBound()
    //todo -> del this.fullSpaceList
    this.fullSpaceList = [];
}
// -----------------------------------
// dynamic type -> find space 
// currently, care about size
// (app, numApp=0, updateFlag=true)
DynamicSpaceManager.prototype.adjustFullRectangle = function (app) {
    // consider preference position, size
    // ratio = x / y

    var numApp = 0;
    var updateFlag = true;
    var aspectRatio = averageWindowAspectRatio();
    var max_width = this.bound.getWidth() * app.sizeDesire;
    var max_height = max_width / aspectRatio;
    var max_area = max_width * max_height;
    if (max_area == 0) {
        return;
    }

    var expected_area = this.totalArea * app.sizeDesire;
    //print "*** expected_area = " + str(expected_area) + " area = " + str(max_area)
    if (expected_area < max_area) {
        // need to modify agian
        max_height = this.bound.getHeight() * app.sizeDesire;
        max_width = max_height * aspectRatio;
        max_area = max_width * max_height;
        //print "*** re-adjusted... expected_area = " + str(expected_area) + " area = " + str(max_area)
    }
    var a = Math.sqrt(expected_area / max_area);
    max_width = max_width * a;
    max_height = max_width / aspectRatio;
    //print "*** a=" + str(a) + " width=" + str(max_width) + " height=" + str(max_height)

    var left = right = up = bottom = 0;
    max_area = 0;
    var found = false;
    var center_x = 0;
    var center_y = 0;
    var space_width = 0;
    var space_height = 0;
    var app_width = 0;
    var app_height = 0;

    // because we are looking for best fit. largest area does not guarantee optimal choice
    for (space in this.largestEmptySpaceList) {
        space_width = space.getWidth();
        space_height = space.getHeight();

        if (space_width >= max_width && space_height >= max_height) {
            // case-1, max_width && max_height does fit in the space
            app_width = max_width;
            app_height = max_height;
        }
        else {
            if (space_width < max_width) {
                // case-2, max_width is greater than space
                app_height = space_width / aspectRatio;
                app_width = space_width;
                if (app_height > space_height) {
                    // case-2.1, ...
                    app_height = space_height;
                    app_width = space_height * aspectRatio;
                }
            }
            else {
                // case-3,
                app_width = space_height * aspectRatio;
                app_height = space_height;
                if (app_width > space_width) {
                    // case-3.1, ...
                    app_height = space_width / aspectRatio;
                    app_width = space_width;
                }
            }
        }
        var area = app_height * app_width;
        if (area > max_area) {
            max_area = area;

            left = space.left;
            bottom = space.botto;

            //if numApp == 1 : 
            // hyejung
            //left += int((space_width - app_width)/2.0)
            //bottom += int((space_height - app_height)/2.0)

            // todo? 
            // put into center? - need policy adjustment
            center_x = space.getCenterX();
            center_y = space.getCenterY();

            right = left + app_width;
            up = bottom + app_height;
            found = true;
        }
    }
    if (found == true) {
        // ???? strange stereo 3D.... it is from sageBaseGate...
        if ((up % 2) == 1) {
            up = up - 1;
            bottom = bottom - 1;
        }

        if (updateFlag == true) {
            app.left = left;
            app.right = right;
            app.up = up;
            app.bottom = bottom;


            // test mode
            if (this.section.dynamicMode == 2) {
                if (this.section.outSec != None && this.section.inType == USERINPUT_TYPE) {
                    var width = right - left;
                    var height = up - bottom;
                    app.left = center_x - width / 2;
                    app.right = app.left + width;
                    app.bottom = center_y - height / 2;
                    app.up = app.bottom + height;
                }
            }
            else {
                app.resizeWindow(app.left, app.right, app.bottom, app.up);
            }
        }
        // sailID???
        this.addFullRectangle(app.id, Bounds(left, right, up, bottom)); //hyunhye : app.getId()
    }
}

DynamicSpaceManager.prototype.checkAvailableSpace = function () {
    var height = 0;
    var width = 0;
    for (space in this.largestEmptySpaceList) {
        if (space.left == this.bound.left && space.right == this.bound.right) {
            // check it is in bottom || up 
            if (space.bottom == this.bound.bottom || space.up == this.bound.up)
                height += (space.up - space.bottom);
        }
        else if (space.bottom == this.bound.bottom && space.up == this.bound.up)
            if (space.left == this.bound.left || space.right == this.bound.right)
                width += (space.right - space.left);
    }
    if (width > 0)
        width = width / 2;
    if (height > 0)
        height = height / 2;
    return width, height; // todo -> two returns..?
}
// -----------------------------------
// dynamic mode, but manually moved. 
DynamicSpaceManager.prototype.createStaticRectangle = function (app) {
    //print "CREATE STATIC RECTANGLE... ... ... sail_id=" + str(app.getId())
    this.addFullRectangle(app.id, Bounds(app.left, app.right, app.up, app.bottom));
    //hyunhye : app.getId()
}

// -----------------------------------
// MAIN PART : ADD FULL RECTANGLE
DynamicSpaceManager.prototype.addFullRectangle = function (app) {
    //print "ADD FULL RECTANGLE... ... ..."

    // validate space
    // todo -> refine..?
    app = this.refine(app);
	
	// hyunhye : this.fullSpaceList.push(new_app);
    this.fullSpaceList.push(app);
	
    // have list existing rectangles in largestEmptySpaceList that intersect || are adjacent to current app
    var cList = [];
    var index = 0;
    var removeList = [];
    //for (space in this.largestEmptySpaceList) {
	for(var i=0, space; space=this.largestEmptySpaceList[i]; i++){
		
		// !(space.right < app.left || space.left > app.right || space.up < app.bottom || space.bottom > app.up)
        if (space.right >= app.left || space.left <= app.right || space.up >= app.bottom || space.bottom <= app.up) {
			cList.push(space);
            removeList.push(index);
        }
        index += 1;
    }
    // hj
    // ????? really really need this? || not???
    //index = 0
    //for i in removeList : 
    //    this.largestEmptySpaceList.pop(i-index)
    //    index += 1

    var adjacentLESList_left = [];
    var adjacentLESList_right = []
    var adjacentLESList_bottom = [];
    var adjacentLESList_up = [];
    var possibleLESList_left = [];
    var possibleLESList_right = [];
    var possibleLESList_bottom = [];
    var possibleLESList_up = [];
	
    //for (O in cList) {
	for(var i=0, O; O=cList[i]; i++){
        // current app : app  = F
        // if O adjacent to any side e of F && external to F
        // ?????? c||rect || not????
        if (app.left == O.right)
            adjacentLESList_left.push(O);
        else if (app.right == O.left)
            adjacentLESList_right.push(O);
        else if (app.up == O.bottom)
            adjacentLESList_up.push(O);
        else if (app.bottom == O.up)
            adjacentLESList_bottom.push(O);
        else {
			// hyunhye : remove(O);
            // this.largestEmptySpaceList.remove(O);
			for(var j = 0; j < this.largestEmptySpaceList[j] ; j++){
				if(this.largestEmptySpaceList[j] == O)
					this.largestEmptySpaceList.slice(j);
			}
			
            // class Bounds - > left, right, up, bottom
            if (O.left < app.left){     // up left	
                possibleLESList_left.push(Bounds(O.left, app.left, O.up, O.bottom));
			}
            if (O.right > app.right){    // bottom right
                possibleLESList_right.push(Bounds(app.right, O.right, O.up, O.bottom));
			}
            if (O.bottom < app.bottom){  // bottom left 
                possibleLESList_bottom.push(Bounds(O.left, O.right, app.bottom, O.bottom));
			}
            if (O.up > app.up) {        // up right 
                possibleLESList_up.push(Bounds(O.left, O.right, O.up, app.up));
			}
        }
    }
    index = 0;
    var possibleLESList = [];
    //for (P in possibleLESList_left) {
	for(var i=0, P; P=possibleLESList_left[i]; i++){
        // P not enclosed by any space in adjacentLESList[D] || any other space in possible LESList[D]
        if (this.isNotInClosed(P, index, possibleLESList_left, adjacentLESList_left) == true)
            possibleLESList.push(P);
        index += 1;
    }
    index = 0;
    //for (P in possibleLESList_right) {
	for(var i=0, P; P=possibleLESList_right[i]; i++){
        if (this.isNotInClosed(P, index, possibleLESList_right, adjacentLESList_right) == true)
            possibleLESList.push(P);
        index += 1;
    }
    index = 0;
    //for (P in possibleLESList_up) {
	for(var i=0, P; P=possibleLESList_up[i]; i++){
        if (this.isNotInClosed(P, index, possibleLESList_up, adjacentLESList_up) == true)
            possibleLESList.push(P)
        index += 1;
    }
    index = 0;
    //for (P in possibleLESList_bottom) {
	for(var i=0, P; P=possibleLESList_bottom[i]; i++){
        if (this.isNotInClosed(P, index, possibleLESList_bottom, adjacentLESList_bottom) == true)
            possibleLESList.push(P)
        index += 1;
    }
    index = 0;
    //for (P in possibleLESList) {
	for(var i=0, P; P=possibleLESList[i]; i++){
        //if this.isNotInClosed(P, index, possibleLESList, None): 
        //    if this.validate(P) :
        this.largestEmptySpaceList.push(P);
        //print "push..." + str(P.left) + " " + str(P.right) + " " + str(P.bottom)  + " " + str(P.up)
        index += 1;
    }
    // debug
    //'''
    //print "1-(add full rectangle)--------------------------------------- full space (index, width, hegith, area)"
    index = 0;
    //for (app_space in this.fullSpaceList) {
	for(var i=0, app_space; app_space=this.fullSpaceList[i]; i++){
        space = app_space; // hyunhye : app_space[1]
        //print "(" + str(index) + ") " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up)
        index += 1;
    }
    //print "1-(add full rectangle)--------------------------------------- empty space (index, width, hegith, area)"
    index = 0;
    //for (space in this.largestEmptySpaceList) {
	for(var i=0, space; space=this.largestEmptySpaceList[i]; i++){
        var area = space.width * space.height; //hyunhye : space.getWidth() / space.getHeight()
        //print "(" + str(index) + ") " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up) + " : area=" + str(area)
        index += 1; 
    }
    //print "--------------------------------------- end"
    //'''

    //del possibleLESList
    //del possibleLESList_left
    //del possibleLESList_right
    //del possibleLESList_bottom
    //del possibleLESList_up
    //del adjacentLESList_left
    //del adjacentLESList_right
    //del adjacentLESList_bottom
    //del adjacentLESList_up
    //del removeList
    //del cList 

}
DynamicSpaceManager.prototype.removeFullRectangle = function (app) {
    //print "REMOVE FULL RECTANGLE... ... ..."

    // validate space
    // todo -> refine
    app = this.refine(app);

    // (step-1) create new space manager S to represent area of F 
    // todo -> creator...?
    S = DynamicSpaceManager(Bounds(app.left, app.right, app.up, app.bottom));
    // get all full-space rectangles that intersect F && add them to S   
    for (app_space in this.fullSpaceList) {
        var space = app_space[1];
        if (!(space.right <= app.left || app.right <= space.left || space.up <= app.bottom || app.up <= space.bottom)) {
            S.addFullRectangle(-1, Bounds(space.left, space.right, space.up, space.bottom));
            //print "space(intersect) -> " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up)
        }
    }
    // (step-2) adjacentEmptySpaceList = all largest empty-space rectangles adjacent to && external F
    var adjacentEmptySpaceList = [];
    for (O in this.largestEmptySpaceList) {
        if (app.left == O.right || app.right == O.left || app.up == O.bottom || app.bottom == O.up)
            adjacentEmptySpaceList.push(O);
    }
    // there are the only largest empty spaces external to F that need to be processed in this alg||ith. 
    //print "adjacentEmptySpaceList length = " + str(len(adjacentEmptySpaceList))

    // (step-3) ?? edge ?? : for each edge e in left, right,  bottom, up
    // adjList = spaces in possibleLESList adjacent to edge e of F
    // possibleLESList is temp||ary list of empty spaces that could possibly be largest empty spaces; initialize it to the empty space in S
    possibleLESList = S.largestEmptySpaceList;
    //print "possibleLESList length = " + str(len(possibleLESList))
    adjList_left = [];
    // left
    for (O in possibleLESList) {
        if (O.right == app.left)  // modified
            adjList_left.push(O);
    }
    //print "<left> ... " + str(len(adjList_left))
    for (R in adjList_left) {
        //print "R = " + str(R.left) + " " + str(R.right) + " " + str(R.bottom) + " " + str(R.up)
        for (P in adjacentEmptySpaceList) {
            //print "P = " + str(P.left) + " " + str(P.right) + " " + str(P.bottom) + " " + str(P.up)
            // if P adjacent to edge e of R && edge e of F : 
            if (P.right == R.left && P.right == app.left)// modified
                possibleLESList.push(this.combineSpaces(R, P)); // todo -> combine..?
        }
        //if any rectangle in possibleLESList encloses R : 
        if (this.isInClosed(R, possibleLESList))
            possibleLESList.remove(R);
    }
    // todo
    //del adjList_left

    // right 
    var adjList_right = [];
    for (O in possibleLESList) {
        if (O.left == app.right) // modified
            adjList_right.push(O);
    }
    //print "<right> ... " + str(len(adjList))
    for (R in adjList_right) {
        //print "R = " + str(R.left) + " " + str(R.right) + " " + str(R.bottom) + " " + str(R.up)
        for (P in adjacentEmptySpaceList) {
            //print "P = " + str(P.left) + " " + str(P.right) + " " + str(P.bottom) + " " + str(P.up)
            // if P adjacent to edge e of R && edge e of F : 
            if (P.left == R.right && P.left == app.right) // modified
                possibleLESList.push(this.combineSpaces(R, P));
        }
        if (this.isInClosed(R, possibleLESList))
            possibleLESList.remove(R);
    }
    // todo
    //del adjList_right

    // up
    var adjList_up = [];
    for (O in possibleLESList) {
        if (O.bottom == app.up)
            adjList_up.push(O);
    }
    //print "<up> ... " + str(len(adjList))
    for (R in adjList_up) {
        //print "R = " + str(R.left) + " " + str(R.right) + " " + str(R.bottom) + " " + str(R.up)
        for (P in adjacentEmptySpaceList) {
            //print "P = " + str(P.left) + " " + str(P.right) + " " + str(P.bottom) + " " + str(P.up)
            // if P adjacent to edge e of R && edge e of F : 
            if (P.bottom == R.up && P.bottom == app.up)
                possibleLESList.push(this.combineSpaces(R, P));
        }
        if (this.isInClosed(R, possibleLESList))
            possibleLESList.remove(R);
    }
    // todo
    //del adjList_up

    // bottom 
    var adjList_bottom = [];
    for (O in possibleLESList)
        if (O.up == app.bottom)
            adjList_bottom.push(O);
    //print "<bottom> ... " + str(len(adjList))
    for (R in adjList_bottom) {
        //print "R = " + str(R.left) + " " + str(R.right) + " " + str(R.bottom) + " " + str(R.up)
        for (P in adjacentEmptySpaceList) {
            //print "P = " + str(P.left) + " " + str(P.right) + " " + str(P.bottom) + " " + str(P.up)
            // if P adjacent to edge e of R && edge e of F : 
            if (P.up == R.bottom && P.up == app.bottom)
                possibleLESList.push(this.combineSpaces(R, P));
        }
        if (this.isInClosed(R, possibleLESList))
            possibleLESList.remove(R);
    }
    // todo
    //del adjList_bottom

    // (step-4) 
    //print "<step 4> merge...."
    for (R in adjacentEmptySpaceList)
        if (this.isInClosed(R, possibleLESList))
            // need to check - is properly removed || not 
            this.largestEmptySpaceList.remove(R);
    //print "remove..." + str(R.left) + " " + str(R.right) + " " + str(R.bottom)  + " " + str(R.up)
    index = 0;
    for (R in possibleLESList) {
        if (this.isNotInClosed(R, index, possibleLESList, None))
            if (this.validate(R))
                this.largestEmptySpaceList.push(R);
        //print "push..." + str(R.left) + " " + str(R.right) + " " + str(R.bottom)  + " " + str(R.up)
        index += 1;
    }
    // debug
    // print "(remove full rectangle)--------------------------------------- full space (index, width, hegith, area)"
    console.log("(remove full rectangle)--------------------------------------- full space (index, width, hegith, area)");
    index = 0;
    for (app_space in this.fullSpaceList) {
        space = app_space[1];
        //print "(" + str(index) + ") " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up)
        console.log("(" + str(index) + ") " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up));
        index += 1;
    }
    //print "(remove full rectangle)--------------------------------------- empty space (index, width, hegith, area)"
    console.log("(remove full rectangle)--------------------------------------- empty space (index, width, hegith, area)");
    index = 0;
    for (space in this.largestEmptySpaceList) {
        var area = space.getWidth() * space.getHeight();
        //print "(" + str(index) + ") " + str(space.left) + " " + str(space.right) + " " + str(space.bottom) + " " + str(space.up) + " : area=" + str(area)
        //console.log();
        index += 1;
    }
    console.log("--------------------------------------- end");


    // todo -> ?????
    //del possibleLESList 
    //del adjacentEmptySpaceList 
    //del S

}
DynamicSpaceManager.prototype.isInClosed = function (P, possibleLESList) {
    for (possible in possibleLESList)
        if (possible.left == P.left && P.right == possible.right && possible.bottom == P.bottom && P.up == possible.up)
            continue;
        else if (possible.left <= P.left && P.right <= possible.right && possible.bottom <= P.bottom && P.up <= possible.up)
            return true;
    return false;
}
DynamicSpaceManager.prototype.isNotInClosed = function (P, i, possibleLESList, adjacentLESList) {
    //print "not in closed.... " + str(len(possibleLESList)) 
    j = 0;
    for (possible in possibleLESList) {
        if (i != j) {
            //print P.left, P.right, P.bottom, P.up
            //print possible.left, possible.right, possible.bottom, possible.up
            if (possible.left <= P.left && P.right <= possible.right && possible.bottom <= P.bottom && P.up <= possible.up)
                return false;
        }
        j += 1;
    }
    if (adjacentLESList != null) {
        for (adjacent in adjacentLESList)
            if (adjacent.left <= P.left && P.right <= adjacent.right && adjacent.bottom <= P.bottom && P.up <= adjacent.up)
                return false;
    }
    return true;
}
DynamicSpaceManager.prototype.refine = function (space) {
    if (this.bound.left > space.getLeft())
        space.left = this.bound.left;
    if (this.bound.right < space.right)
        space.right = this.bound.right;
    if (this.bound.bottom > space.bottom)
        space.bottom = this.bound.bottom;
    if (this.bound.up < space.up)
        space.up = this.bound.up;
    return space;
}
DynamicSpaceManager.prototype.validate = function (space) {
    if (space.getHeight() <= 1)
        return false;
    if (space.left < 0 || space.right < 0 || space.bottom < 0 || space.up < 0)
        return false;
    return true;
}
DynamicSpaceManager.prototype.min = function (a, b) {
    if (a < b)
        return a;
    return b;
}
DynamicSpaceManager.prototype.max = function (a, b) {
    if (a > b)
        return a;
    return b;
}
DynamicSpaceManager.prototype.combineSpaces = function (rec1, rec2) {
    if (rec1.left == rec2.right || rec1.right == rec2.left) {
        //tmp = Bounds(this.min(rec1.left, rec2.left), this.max(rec1.right, rec2.right), this.min(rec1.up, rec2.up), this.max(rec1.bottom, rec2.bottom)) 
        //print "combine space 1:" + str(tmp.left) + " " + str(tmp.right) + " " + str(tmp.bottom) + " " + str(tmp.up)

        return Bounds(this.min(rec1.left, rec2.left), this.max(rec1.right, rec2.right), this.min(rec1.up, rec2.up), this.max(rec1.bottom, rec2.bottom));
    }
    else if (rec1.bottom == rec2.up || rec1.up == rec2.bottom)
        //tmp = Bounds(this.max(rec1.left, rec2.left), this.min(rec1.right, rec2.right), this.max(rec1.up, rec2.up), this.min(rec1.bottom, rec2.bottom)) 
        //print "combine space 2:" + str(tmp.left) + " " + str(tmp.right) + " " + str(tmp.bottom) + " " + str(tmp.up)

        return Bounds(this.max(rec1.left, rec2.left), this.min(rec1.right, rec2.right), this.max(rec1.up, rec2.up), this.min(rec1.bottom, rec2.bottom));
    return null; // todo -> None...?
}

DynamicSpaceManager.prototype.getApp = function (app, windows, Dir) {
    var minW = app.right - app.left;
    var minH = app.up - app.bottom;
    for (space in windows) {
        var width = space.right - space.left;
        var height = space.up - space.bottom;
        if (minW > width)
            minW = width;
        if (minH > height)
            minH = height;
    }
    var index_range_list = [];
    var i_begin;
    var i_end;
    var j_begin;
    var j_end;
    var l;
    for (space in windows) {
        if (space == app) continue;
        i_begin = space.left / minW;
        i_end = space.right / minW;
        j_begin = space.bottom / minH;
        j_end = space.up / minH;
        l = [space.id, i_begin, i_end, j_begin, j_end];
        index_range_list.push(l);
    }
    i_begin = app.left / minW;
    i_end = app.right / minW;
    j_begin = app.bottom / minH;
    j_end = app.up / minH;
    // right... 
    var app_list = [];
    if (Dir == LEFT) {
        var idx = 0;
        for (app_space in index_range_list) {
            // find app on right
            if ((app_space[3] >= j_begin && app_space[3] <= j_end) || (app_space[4] >= j_begin && app_space[4] >= j_end)) {
                if (app_space[2] <= i_begin) {
                    var temp_index = 0;
                    var added = false;
                    for (i in app_list) {
                        var temp_app = index_range_list[i];
                        if (temp_app[2] < app_space[2]) {
                            app_list.insert(temp_index, idx);
                            added = true;
                            break;
                        }
                        temp_index += 1;
                    }
                    if (added == false)
                        app_list.push(idx);
                }
            }
            idx += 1;
        }
    }
    else if (Dir == RIGHT) {
        var idx = 0
        for (app_space in index_range_list) {
            // find app on right
            if ((app_space[3] >= j_begin && app_space[3] <= j_end) || (app_space[4] >= j_begin && app_space[4] >= j_end)) {
                if (app_space[1] >= i_end) {
                    var temp_index = 0;
                    var added = false;
                    for (i in app_list) {
                        var temp_app = index_range_list[i]
                        if (temp_app[1] > app_space[1]) {
                            app_list.insert(temp_index, idx);
                            added = true;
                            break;
                        }
                        temp_index += 1;
                    }
                    if (added == false)
                        app_list.push(idx)
                }
            }
            idx += 1;
        }
    }
    else if (Dir == up) {
        var idx = 0;
        for (app_space in index_range_list) {
            // find app on right
            if ((app_space[1] >= i_begin && app_space[1] <= i_end) || (app_space[2] >= i_begin && app_space[2] >= i_end)) {
                if (app_space[3] >= j_end) {
                    var temp_index = 0;
                    var added = false;
                    for (i in app_list) {
                        var temp_app = index_range_list[i];
                        if (temp_app[3] > app_space[3]) {
                            app_list.insert(temp_index, idx);
                            added = true;
                            break;
                        }
                        temp_index += 1;
                    }
                    if (added == false)
                        app_list.push(idx);
                }
            }
            idx += 1;
        }
    }
    else { // BOTTOM
        var idx = 0;
        for (app_space in index_range_list) {
            // find app on right
            if ((app_space[1] >= i_begin && app_space[1] <= i_end) || (app_space[2] >= i_begin && app_space[2] >= i_end)) {
                if (app_space[4] <= j_begin) {
                    var temp_index = 0;
                    var added = false;
                    for (i in app_list) {
                        var temp_app = index_range_list[i];
                        if (temp_app[4] < app_space[4]) {
                            app_list.insert(temp_index, idx);
                            added = true;
                            break;
                        }
                        temp_index += 1;
                    }
                    if (added == false)
                        app_list.push(idx);
                }
            }
            idx += 1
        }
    }
    if (len(app_list) > 0)
        var idx = app_list[0];
    var app_space = index_range_list[idx];
    //print app_space 
    console.log(app_space);
    return app_space[0];

    // todo
    // del index_range_list
    //del app_list
    return null;
    //return None; // todo -> None..?
}
DynamicSpaceManager.prototype.shove = function (app, windows) {
    var minW = app.right - app.left;
    var minH = app.up - app.bottom;
    for (space in windows) {
        var width = space.right - space.left;
        var height = space.up - space.bottom;
        if (minW > width)
            minW = width;
        if (minH > height)
            minH = height;
    }
    var index_range_list = [];
    var maxRows = 0;
    var maxCols = 0;
    for (space in windows) {
        var i_begin = space.left / minW;
        var i_end = space.right / minW;
        var j_begin = space.bottom / minH;
        var j_end = space.up / minH;
        if (i_end > maxCols)
            maxCols = i_end;
        if (j_end > maxRows)
            maxRows = j_end;
        var l = [space.id, i_begin, i_end, j_begin, j_end]; // hyunhye : space.getId()
        //space.setDynamicIndex(i_begin, j_begin)
        index_range_list.push(l);
    }
    // s||ting
    var index_list = [];
    for (app_space in index_range_list) {
        var app_idx = app_space[1] * maxCols + app_space[3];
        var added = false;
        var idx = 0;
        for (w in index_list) {
            if (w[0] > app_idx) {
                var l = [app_idx, app_space[0], app_space[1], app_space[2], app_space[3], app_space[4]];
                index_list.insert(idx, l);
                added = true;
                break;
            }
            idx += 1;
        }
        if (added == false) {
            l = [app_idx, app_space[0], app_space[1], app_space[2], app_space[3], app_space[4]];
            index_list.push(l);
        }
    }
    for (app_space in index_range_list) {
        //del app_space //todo
    }
    //del index_range_list //todo

    console.log("s||ted ... result");
    // print "s||ted ... result"
    for (app_space in index_list) {
        //print app_space
        console.log(app_space);
    }

    var app_i_begin = app.left / minW;
    var app_i_end = app.right / minW;
    var app_j_begin = app.bottom / minH;
    var app_j_end = app.up / minH;
    var wId = app.id; // hyunhye : app.getId()
    var left_list = [];
    var right_list = [];
    var up_list = [];
    var bottom_list = [];
    for (app_space in index_list) {
        if (app_space[1] == wId)
            continue;
        if (app_j_begin >= app_space[5]) // dowm
            bottom_list.push(app_space);
        else if (app_j_end <= app_space[4]) // up
            up_list.push(app_space);
        else {
            if (app_i_begin >= app_space[3]) { // left
                // s||ting... 
                var idx = 0;
                i = app_space[2];
                //print app_space;
                console.log(add_space);
                added = false;
                for (ileft in left_list) {
                    if (ileft[2] > i) {
                        left_list.insert(idx, app_space);
                        added = true;
                        break;
                    }
                    idx += 1;
                }
                if (added == false)
                    left_list.push(app_space);
            }
            else {
                var idx = 0;
                i = app_space[3];
                added = false;
                console.log(app_space);
                //print app_space
                for (iright in right_list) {
                    if (iright[3] < i) {
                        right_list.insert(idx, app_space);
                        added = true;
                        break;
                    }
                    idx += 1;
                }
                if (added == false) {
                    right_list.push(app_space);
                }
            }
        }
    }
    // print "left:"
    // for(app_space in left_list)
    //     print app_space;
    // print "right:"
    // for(app_space in right_list)
    //     print app_space;
    // print "bottom:"
    // for app_space in bottom_list :
    //    print app_space
    // print "up:"
    // for app_space in up_list :
    //    print app_space

    this.clearRectangles();
    // run for the bottom 
    for (app_space in bottom_list) {
        wId = app_space[1];
        var w = this.getWindow(wId, windows);
        var space = this.getBottomSpace(w);
        if (space) {
            height = w.up - w.bottom;
            w.bottom = space.bottom;
            w.up = w.bottom + height;
            w.resizeWindow(w.left, w.right, w.bottom, w.up);
        }
        this.addFullRectangle(w.id, Bounds(w.left, w.right, w.up, w.bottom)); // hyunhye : w.getId()
    }
    // run for the up 
    var max = len(up_list);
    var idx = max - 1;
    for (i in range(max)) {
        var app_space = up_list[idx];
        wId = app_space[1];
        var w = this.getWindow(wId, windows);
        var space = this.getupSpace(w);
        if (space) {
            height = w.up - w.bottom;
            w.up = space.up;
            w.bottom = w.up - height;
            w.resizeWindow(w.left, w.right, w.bottom, w.up);
        }
        this.addFullRectangle(w.id, Bounds(w.left, w.right, w.up, w.bottom)); // hyunhye : w.getId()
        idx -= 1;
    }

    // run for the left 
    for (app_space in left_list) {
        wId = app_space[1];
        var w = this.getWindow(wId, windows);
        var space = this.getLeftSpace(w);
        if (space) {
            width = w.right - w.left;
            w.left = space.left;
            w.right = w.left + width;
            w.resizeWindow(w.left, w.right, w.bottom, w.up);
        }
        this.addFullRectangle(w.id, Bounds(w.left, w.right, w.up, w.bottom)); // hyunhye : w.getId()
    }
    // run for the right 
    for (app_space in right_list) {
        wId = app_space[1]
        var w = this.getWindow(wId, windows);
        var space = this.getRightSpace(w);
        if (space) {
            width = w.right - w.left;
            w.right = space.right;
            w.left = w.right - width;
            w.resizeWindow(w.left, w.right, w.bottom, w.up);
        }
        this.addFullRectangle(w.id, Bounds(w.left, w.right, w.up, w.bottom)); // hyunhye : w.getId()
    }
    //del up_list
    //del bottom_list
    //del left_list
    //del right_list
    //del index_list

    this.searchExpandRectangle(app); // todo -> &&..?  
}

DynamicSpaceManager.prototype.runSort = function (windows, moveObj) {
    var minW = 999999;
    var minH = 999999;
    for (space in windows) {
        var width = space.right - space.left;
        var height = space.up - space.bottom;
        if (minW > width)
            minW = width;
        if (minH > height)
            minH = height;
    }
    var index_range_list = [];
    var maxRows = 0;
    var maxCols = 0;
    for (space in windows) {
        if (space == moveObj) continue;
        var i_begin = space.left / minW;
        var i_end = space.right / minW;
        var j_begin = space.bottom / minH;
        var j_end = space.up / minH;
        if (i_end > maxCols)
            maxCols = i_end;
        if (j_end > maxRows)
            maxRows = j_end;
        var l = [space.id, i_begin, i_end, j_begin, j_end]; // hyunhye : space.getId()
        //space.setDynamicIndex(i_begin, j_begin)
        index_range_list.push(l);
    }
    // s||ting
    var index_list = [];
    for (app_space in index_range_list) {
        var app_idx = app_space[1] * maxCols + app_space[3];
        var added = false;
        var idx = 0;
        for (w in index_list) {
            if (w[0] > app_idx) {
                var l = [app_idx, app_space[0], app_space[1], app_space[2], app_space[3], app_space[4]];
                index_list.insert(idx, l);
                added = true;
                break;
            }
            idx += 1;
        }
        if (added == false) {
            var l = [app_idx, app_space[0], app_space[1], app_space[2], app_space[3], app_space[4]];
            index_list.push(l);
        }
    }

    for (app_space in index_range_list) {
        //del app_space
    }
    //del index_range_list 

    if (len(index_list) > 0) {
        var app_space = index_list[0];
        return app_space[1];
    }

    //del index_list 
    return -1;

}
DynamicSpaceManager.prototype.getBottomSpace = function (app) {
    // find space, it includes me, && lowest one
    var low_y = app.bottom;
    var retObj = null;
    for (space in this.largestEmptySpaceList) {
        if (!(space.left <= app.left && app.right <= space.right && space.bottom <= app.bottom && app.up <= space.up)) {
            continue;
        }
        if (low_y > space.bottom) {
            low_y = space.bottom;
            retObj = space;
        }
    }
    if (retObj == null) {
        for (space in this.largestEmptySpaceList) {
            if (!(space.bottom < app.bottom && app.up < space.up)) {
                continue;
            }
            if (low_y > space.bottom) {
                low_y = space.bottom;
                retObj = space;
            }
        }
    }
    return retObj;
}
DynamicSpaceManager.prototype.getupSpace = function (app) {
    // find space, it includes me, && lowest one
    var up_y = app.up;
    var retObj = null;
    for (space in this.largestEmptySpaceList) {
        if (!(space.left <= app.left && app.right <= space.right && space.bottom <= app.bottom && app.up <= space.up)) {
            continue;
        }
        if (up_y < space.up) {
            up_y = space.up;
            retObj = space;
        }
    }
    if (retObj == null) {
        for (space in this.largestEmptySpaceList) {
            if (!(space.bottom < app.bottom && app.up < space.up)) {
                continue;
            }
            if (up_y > space.up) {
                up_y = space.up;
                retObj = space;
            }
        }
    }
    return retObj;
}
DynamicSpaceManager.prototype.getLeftSpace = function (app) {
    // find space, it includes me, && lowest one
    var left_x = app.left;
    var retObj = null;
    for (space in this.largestEmptySpaceList) {
        if (!(space.left <= app.left && app.right <= space.right && space.bottom <= app.bottom && app.up <= space.up)) {
            continue;
        }
        if (left_x > space.left) {
            left_x = space.left;
            retObj = space;
        }
    }
    if (retObj == null) {
        for (space in this.largestEmptySpaceList) {
            if (!(space.left < app.left && app.right < space.right)) {
                continue;
            }
            if (left_x > space.left) {
                left_x = space.left;
                retObj = space;
            }
        }
    }
    return retObj;
}
DynamicSpaceManager.prototype.getRightSpace = function (app) {
    // find space, it includes me, && lowest one
    var right_x = app.right;
    var retObj = null;
    for (space in this.largestEmptySpaceList) {
        if (!(space.left <= app.left && app.right <= space.right && space.bottom <= app.bottom && app.up <= space.up)) {
            continue;
        }
        if (right_x < space.right) {
            right_x = space.right;
            retObj = space;
        }
    }
    if (retObj == null) {
        for (space in this.largestEmptySpaceList) {
            if (!(space.left < app.left && app.right < space.right)) {
                continue;
            }
            if (right_x > space.right) {
                right_x = space.right;
                retObj = space;
            }
        }
    }
    return retObj;
}

DynamicSpaceManager.prototype.getWindow = function (wId, windows) {
    for (w in windows) {
        if (wId == w.id) // hyunhye : w.getId()
            return w;
    }
    return null;
}

module.exports = DynamicSpaceManager;
