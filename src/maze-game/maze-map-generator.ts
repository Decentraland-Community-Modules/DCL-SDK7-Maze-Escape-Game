import Dictionary, { List } from "../utilities/collections";

//contains stuff for maze gen
//this is a leaps n bounds node linking method so maze runs can get long
//woulda added in some run len checks but works atm so meh
export namespace MazeGenerator
{
    var found:boolean = false;
    //maze size factor
    var MazeSizeX:number = 0;
    var MazeSizeY:number = 0;
    //maze data map, true=wall false=walkable
    export var wallDict:Dictionary<MazeWall> = new Dictionary<MazeWall>();
    export class MazeWall { public IsWall:boolean = false; } 
    //creates a new maze of the given size
    export function GenerateMaze(sizeX:number, sizeY:number)
    {
        //define size
        MazeSizeX = sizeX; MazeSizeY = sizeY;
        //regenerate maze
        //  enable all walls
        for (let x = 0; x < MazeSizeX; x++) {
            for (let y = 0; y < MazeSizeY; y++) {
                if(!wallDict.containsKey(GetNodeIndex(x,y))) wallDict.addItem(GetNodeIndex(x,y), new MazeWall());
                wallDict.getItem(GetNodeIndex(x,y)).IsWall = true;
            }
        }
        //  list of all nodes that need to be processed
        var nodeList:List<string> = new List<string>();
        //  push starter location (middle of game)
        nodeList.addItem(GetNodeIndex((MazeSizeX-1)/2,(MazeSizeY-1)/2));
        //  ensure we process ALL walls
        while (nodeList.size() > 0) {
            //grab next random wall index from processing list
            const randomWall = nodeList.getItem(getRandomNumber(0, nodeList.size() - 1));
            const curPos = randomWall.split('_').map(Number);
            //console.log("processing tile x="+curPos[0]+", y="+curPos[1])
            
            //pick a random direction and begin processing
            found = false;
            var direction:number = getRandomNumber(0, 3);
            for (let i = 0; i < 4; i++) {
                //roll over for direction
                direction++;
                if(direction >= 4) direction = 0;
                //console.log("direction="+direction)

                switch(direction)
                {
                    //left
                    case 0:
                        //ensure tile exists
                        if(curPos[0] - 2 < 0) continue;
                        //ensure tile is viable (less than 2 connecting paths)
                        if(GetNodePathCount(curPos[0] - 2, curPos[1]) >= 1) continue;
                        //path to node
                        wallDict.getItem(GetNodeIndex(curPos[0] - 1, curPos[1])).IsWall = false;
                        wallDict.getItem(GetNodeIndex(curPos[0] - 2, curPos[1])).IsWall = false;
                        //add node to listing
                        nodeList.addItem(GetNodeIndex(curPos[0] - 2, curPos[1]));
                    break;
                    //right
                    case 1:
                        //ensure tile exists
                        if(curPos[0] + 2 >= MazeSizeX) continue;
                        //ensure tile is viable (less than 2 connecting paths)
                        if(GetNodePathCount(curPos[0] + 2, curPos[1]) >= 1) continue;
                        //path to node
                        wallDict.getItem(GetNodeIndex(curPos[0] + 1, curPos[1])).IsWall = false;
                        wallDict.getItem(GetNodeIndex(curPos[0] + 2, curPos[1])).IsWall = false;
                        //add node to listing
                        nodeList.addItem(GetNodeIndex(curPos[0] + 2, curPos[1]));
                    break;
                    //down
                    case 2:
                        //ensure tile exists
                        if(curPos[1] - 2 < 0) continue;
                        //ensure tile is viable (less than 2 connecting paths)
                        if(GetNodePathCount(curPos[0], curPos[1] - 2) >= 1) continue;
                        //path to node
                        wallDict.getItem(GetNodeIndex(curPos[0], curPos[1] - 1)).IsWall = false;
                        wallDict.getItem(GetNodeIndex(curPos[0], curPos[1] - 2)).IsWall = false;
                        //add node to listing
                        nodeList.addItem(GetNodeIndex(curPos[0], curPos[1] - 2));
                    break;
                    //up
                    case 3:
                        //ensure tile exists
                        if(curPos[1] + 2 >= MazeSizeY) continue;
                        //ensure tile is viable (less than 2 connecting paths)
                        if(GetNodePathCount(curPos[0], curPos[1] + 2) >= 1) continue;
                        //path to node
                        wallDict.getItem(GetNodeIndex(curPos[0], curPos[1] + 1)).IsWall = false;
                        wallDict.getItem(GetNodeIndex(curPos[0], curPos[1] + 2)).IsWall = false;
                        //add node to listing
                        nodeList.addItem(GetNodeIndex(curPos[0], curPos[1] + 2));
                    break;
                }
                //if a valid addition was found, halt
                if(found)
                {
                    //console.log("added new node at dir: "+direction);
                    break;
                }
            }
            //if no viable tile was found, remove node from listing
            if(!found)
            {
                //console.log("node exhausted: "+randomWall);
                nodeList.removeItem(randomWall);
            }
        }
        //debug log output based on the created maze
        /*var log:string = "\n";
        for (let x = 0; x < MazeSizeX; x++) {
            for (let y = 0; y < MazeSizeY; y++) {
                if(!wallDict.getItem(GetNodeIndex(x,y)).IsWall) log += "O ";
                else log += "X ";
            }
            log += "\n";
        }
        log += "\nSize X="+MazeSizeX.toString()+", Y="+MazeSizeY.toString();
        console.log(log);*/
    }
    //helper for processing
    function getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // 
    export function GetNodeIndex(x:number, y:number): string {
        return x+"_"+y;
    }
    //returns the number of non-walls that exist around the tile (anything outside of the tile set counts as a path, making a full encasement)
    function GetNodePathCount(x:number, y:number): number
    {
        var surrounding:number = 0;
        if (x - 1 < 0 || !wallDict.getItem(GetNodeIndex(x - 1, y)).IsWall) surrounding++;
        if (x + 1 >= MazeSizeX || !wallDict.getItem(GetNodeIndex(x + 1, y)).IsWall) surrounding++;
        if (y - 1 < 0 || !wallDict.getItem(GetNodeIndex(x, y - 1)).IsWall) surrounding++;
        if (y + 1 >= MazeSizeY || !wallDict.getItem(GetNodeIndex(x, y + 1)).IsWall) surrounding++;
        return surrounding;
    }
}