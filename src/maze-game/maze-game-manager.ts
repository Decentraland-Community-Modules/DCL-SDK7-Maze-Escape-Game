import { Animator, ColliderLayer, Entity, GltfContainer, Material, MeshCollider, MeshRenderer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { MazeGenerator } from "./maze-map-generator";
import { Vector3, Quaternion, Color4 } from "@dcl/sdk/math";
import { MazePortalLock } from "./maze-portal-lock";
import { MazePortalKey } from "./maze-portal-key";
import { movePlayerTo } from "~system/RestrictedActions";
import { MazeTile } from "./maze-tile";
import { MazePortal } from "./maze-portal";
import { AUDIO_SOUNDS, AudioManager } from "../utilities/audio-manager";
import { ITEM_COLOURS } from "./config/maze-game-config";
import { MazeGameMenu } from "./maze-menu";

/*      TIMER DISPLAY SYSTEM
    used to alternate between maze map states

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
const DelayAmount:number = 25;
//custom component def, might add score timer if enough time
const MazeTimerData = { curDelta:Schemas.Number }
//create component def
const MazeTimerComponent = engine.defineComponent("MazeTimerComponent", MazeTimerData);

/**     MAZE GAME MANAGER
    handles the maze game states and displays, generating a maze and placing keys around it.
    the player must collect all keys to escape the maze.
 
  
    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
 */
export class MazeGameManager
{
    //debug logs are generated when true
    public static IsDebugging:boolean = true;
    //access pocketing
    private static instance:undefined|MazeGameManager;
    public static get Instance():MazeGameManager
    {
        //ensure instance is set
        if(MazeGameManager.instance === undefined)
        {
            MazeGameManager.instance = new MazeGameManager();
        }

        return MazeGameManager.instance;
    }

    private gameState:number = 0;

    /** maze width */
    private mazeWidth:number = 27;
    /** maze height */
    private mazeHeight:number = 27;

    /** starting location of the player */
    public StartLocation = { PosX:0, PosY:0, PosZ:0 }

    /** number of maze alternatives to generate per game */
    private mazeAlternatives:number = 3;
    /** currently displayed maze alternative */
    private mazeAlternative:number = 0;
    /** maze data for swaps */
    private mazeMaps:boolean[][][] = [];

    /** amount of space added between tiles */
    public MazeTileSpacing:number = 4//0.2;
    /** parental object for maze */
    public MazeParentObject:Entity;
    /** roof object for maze */
    public MazeRoofObject:Entity;
    /** collection of all maze objects */
    public MazeTileObjects:MazeTile[][];

    /** portal object */
    public PortalObject:MazePortal;
    /** portal lock interactable objects */
    public PortalLocks:MazePortalLock[];
    /** portal lock key objects */
    public PortalKeys:MazePortalKey[];

    /** returns the position of a tile based on the given coord */
    public CalculatePosition(x:number, y:number)
    {
      return Vector3.create
      (
        (x-((this.mazeWidth-1)/2)) * this.MazeTileSpacing, 
        -0.35, 
        (y-((this.mazeHeight-1)/2)) * this.MazeTileSpacing
      );
    }

    //standard initialization
    constructor()
    {
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: initializing...");
        //create parent object
        this.MazeParentObject = engine.addEntity();
        Transform.create(this.MazeParentObject,
        ({
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(1, 1, 1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //create roof object
        this.MazeRoofObject = engine.addEntity();
        Transform.create(this.MazeRoofObject,
        ({
            parent: this.MazeParentObject,
            position: Vector3.create(0, 8, 0),
            scale: Vector3.create(116, 3, 116),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //MeshRenderer.setBox(this.MazeRoofObject);
        MeshCollider.setBox(this.MazeRoofObject);

        //generate maze objects
        this.MazeTileObjects = [];
        for (let x = 0; x < this.mazeWidth; x++) {
            this.MazeTileObjects[x] = [];
            for (let y = 0; y < this.mazeHeight; y++) {
                //create tile object
                const tile:MazeTile = new MazeTile();
                //place objects
                Transform.getMutable(tile.entity).position = this.CalculatePosition(x, y);
                //assign to collection
                this.MazeTileObjects[x][y] = tile;
                //if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: map tile placed x="+x+" y="+y+", position="
                //    +Transform.get(tile).position.x+","+Transform.get(tile).position.y+","+Transform.get(tile).position.z);
            }
        }

        //generate portal object
        this.PortalObject = new MazePortal(this.MazeParentObject);
        this.PortalObject.Interact = this.CallbackInteractPortal;

        //generate portal locks
        this.PortalLocks = [];
        for (let i = 0; i < 6; i++) {
            //create lock
            this.PortalLocks.push(new MazePortalLock(i, this.PortalObject.entity));
            this.PortalLocks[i].Interact = this.CallbackInteractLock;
            //apply material
            Material.setPbrMaterial(this.PortalLocks[i].entityPos, {
                albedoColor: ITEM_COLOURS[i],
                metallic: 0.8,
                roughness: 0.1
            });
        }

        //generate portal keys
        this.PortalKeys = [];
        for (let i = 0; i < 6; i++) {
            //create key    
            this.PortalKeys.push(new MazePortalKey(i));
            this.PortalKeys[i].Interact = this.CallbackInteractKey;
        }
        
        //create timer system
        //  create engine entity with component
        this.timingEntity = engine.addEntity();
        MazeTimerComponent.create(this.timingEntity, { curDelta: 0 });
        //  add timer system
        engine.addSystem(this.timerProcessing);
        
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: initialized, map size x="+this.mazeWidth+" y="+this.mazeHeight);
    }


    //component for time processing/maze swaps
    private timingEntity:Entity;
    timerProcessing = function MazeTimerSystem(dt: number)
    {
        //process every entity that has this component
        for (const [entity] of engine.getEntitiesWith(MazeTimerComponent)) 
        {
            let timerDisplayComponent = MazeTimerComponent.getMutable(entity);
            
            timerDisplayComponent.curDelta += dt;
            if(timerDisplayComponent.curDelta >= DelayAmount)
            {
            timerDisplayComponent.curDelta -= DelayAmount;
            MazeGameManager.Instance.CallbackNextAlternative();
            }
        }
    }

    /** sets the entry state of the game, ready to play */
    public Initialize()
    {
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: game scene resetting...");
        //update game state, prepared
        this.gameState = 0;

        //hide menu obj
        MazeGameMenu.Instance.SetEntityState(true);

        //reset tiles
        for (let x = 0; x < this.mazeWidth; x++) {
            for (let y = 0; y < this.mazeHeight; y++) {
                this.MazeTileObjects[x][y].Reset();
            }
        }

        //update portal
        this.PortalObject.SetState(0);

        //reset locks
        for (let i = 0; i < 6; i++) {
            //material to matte
            Material.setPbrMaterial(this.PortalLocks[i].entityPos, {
                albedoColor: ITEM_COLOURS[i],
                metallic: 0.8,
                roughness: 0.1
            });
        }

        //hide keys
        for (let i = 0; i < 6; i++) {
            this.PortalKeys[i].SetState(false);
        }

        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: game scene reset!");
    }

    /** starts a new game, teleporting the player to the start location */
    public CallbackStartGame() { MazeGameManager.Instance.StartGame(); }
    public StartGame()
    {
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: new game starting...");

        //hide menu obj
        MazeGameMenu.Instance.SetEntityState(false);
        MazeGameMenu.Instance.SetMenuState(false);

        //generate maze alternatives
        this.mazeMaps = [];
        //  process each maze alternative
        for (let index = 0; index < this.mazeAlternatives; index++) {
            //generate an alternative
            MazeGenerator.GenerateMaze(this.mazeWidth, this.mazeHeight);
            //process width
            this.mazeMaps[index] = [];
            for (let x = 0; x < this.mazeWidth; x++) {
                //process height
                this.mazeMaps[index][x] = [];
                for (let y = 0; y < this.mazeHeight; y++) {
                    this.mazeMaps[index][x][y] = MazeGenerator.wallDict.getItem(MazeGenerator.GetNodeIndex(x, y)).IsWall;
                }
            }
        }
        
        //modify maze maps to increase the size of the start location
        const centerX = Math.floor(this.mazeWidth / 2);
        const centerY = Math.floor(this.mazeHeight / 2);
        for (let index = 0; index < this.mazeAlternatives; index++) {
            for (let x = centerX-1; x <= centerX+1; x++) {
                for (let y = centerY-1; y <= centerY+1; y++) {
                    this.mazeMaps[index][x][y] = false;
                }
            }
        }

        //reset tiles
        for (let x = 0; x < this.mazeWidth; x++) {
            for (let y = 0; y < this.mazeHeight; y++) {
                this.MazeTileObjects[x][y].Reset();
            }
        }
        //set first alternative
        this.SetMazeAlternatives(0);

        //update portal
        this.PortalObject.SetState(1);

        //reset portal locks
        for (let i = 0; i < 6; i++) {
            this.PortalLocks[i].Reset();
        }

        //reset portal keys
        for (let i = 0; i < 6; i++) {
            this.PortalKeys[i].Reset();
            //get a random tile along the rim
            const tilePos:number[] = this.GetRandomEdgeTile(i);
            //place key as child
            Transform.getMutable(this.PortalKeys[i].entity).parent = this.MazeTileObjects[tilePos[0]][tilePos[1]].entity;
            Transform.getMutable(this.PortalKeys[i].entity).position = Vector3.create(0,1,0);
            //ensure key-tile is always open
            for (let index = 0; index < this.mazeAlternatives; index++) {
                this.mazeMaps[index][tilePos[0]][tilePos[1]] = false;
            }

            //position places all keys at the start of map
            /*Transform.getMutable(this.PortalKeys[i].entity).position = Vector3.create(3, 1.5, -4+(1*i));*/
        }

        //reset timer data
        MazeTimerComponent.getMutable(this.timingEntity).curDelta = 0;
        //start game processing
        this.gameState = 1;
        //play start sound
        AudioManager.Instance.PlaySound(AUDIO_SOUNDS.GAME_START);

        //teleport player to start
        movePlayerTo({ newRelativePosition: Vector3.create(0, 0, -5), cameraTarget: Vector3.create(0, 1.5, 8) });

        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: started new game!");
    }

    /** ends the game */
    public EndGame()
    {
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: game over, ended on maze map="+this.mazeAlternative);
        
        //show menu obj
        MazeGameMenu.Instance.SetEntityState(true);
        MazeGameMenu.Instance.SetMenuState(true);
        //display exit chat
        MazeGameMenu.Instance.SetChatChain(1);
        
        //update state, game over
        this.gameState = 2;
        //play end sound
        AudioManager.Instance.PlaySound(AUDIO_SOUNDS.GAME_END);

        //update portal
        this.PortalObject.SetState(2);

        //process every tile object in the maze
        for (let x = 0; x < this.mazeWidth; x++) {
            for (let y = 0; y < this.mazeHeight; y++) {
                this.MazeTileObjects[x][y].SetState(false);
            }
        }

        //teleport player to start
        movePlayerTo({ newRelativePosition: Vector3.create(0, 0, -5), cameraTarget: Vector3.create(0, 1.5, 8) });
    }

    /** maze alteration processing */
    public CallbackNextAlternative() { MazeGameManager.Instance.NextAlternative(); }
    public NextAlternative()
    {
        //ensure the game is in session
        if(this.gameState != 1) return;

        //push next alternative
        this.SetMazeAlternatives(this.mazeAlternative+1);
    }
    public SetMazeAlternatives(index:number)
    {
        //roll over inbound value
        if(index > this.mazeAlternatives-1) index = 0;
        //play sound
        AudioManager.Instance.PlaySound(AUDIO_SOUNDS.STAGE_CHANGED);

        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: iterating to next maze map old="+this.mazeAlternative+", new="+index);
        //process every tile object in the maze
        for (let x = 0; x < this.mazeWidth; x++) {
            for (let y = 0; y < this.mazeHeight; y++) {
                //update animations
                this.MazeTileObjects[x][y].SetState(this.mazeMaps[index][x][y]);
            }
        }
        this.mazeAlternative = index;

        //debug log output based on the current maze
        /*var log:string = "\n";
        for (let x = 0; x < this.mazeWidth; x++) {
            for (let y = 0; y < this.mazeHeight; y++) {
                if(!this.MazeTileObjects[x][y].IsWall) log += "O ";
                else log += "X ";
            }
            log += "\n";
        }
        log += "\nSize X="+this.mazeWidth+", Y="+this.mazeHeight;
        console.log(log);*/
    }

    /** key processing */
    public CallbackInteractPortal() { MazeGameManager.Instance.InteractPortal(); }
    public InteractPortal() {
        //process based on game state
        switch(this.gameState)
        {
            //game is initialized/waiting game start
            case 0:
                this.StartGame();
                break;
            //game is on-going
            case 1:
                
                break;
            //game is over
            case 2:
                this.Initialize();
                break;
        }
    }

    /** key processing */
    public CallbackInteractKey(key:MazePortalKey) { MazeGameManager.Instance.InteractKey(key); }
    public InteractKey(key:MazePortalKey) {
        //ensure key has not been collected
        if(key.IsCollected) return;
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: interacted with key id="+key.Index);

        //collect and hide the key
        key.IsCollected = true;
        //Transform.getMutable(key.entity).position = Vector3.Zero();
        Transform.getMutable(key.entity).scale = Vector3.Zero();
        //place sound
        AudioManager.Instance.PlaySound(AUDIO_SOUNDS.KEY_PICKUP);
    }

    /** lock processing */
    public CallbackInteractLock(lock:MazePortalLock) { MazeGameManager.Instance.InteractLock(lock); }
    public InteractLock(lock:MazePortalLock) {
        //ensure lock is not filled and player has required key
        if(lock.IsFilled || !this.PortalKeys[lock.Index].IsCollected) return;
        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: interacted with lock id="+lock.Index);

        //fill lock
        lock.IsFilled = true;

        //lock material to emission
        Material.setPbrMaterial(lock.entityPos, {
            emissiveColor: ITEM_COLOURS[lock.Index],
            emissiveIntensity: 2
        });
        //place sound
        AudioManager.Instance.PlaySound(AUDIO_SOUNDS.KEY_SLOTTED);

        //process win condition
        for (let i = 0; i < 6; i++) {
            if(!this.PortalLocks[i].IsFilled) return;
        }
        //end the game
        this.EndGame();
    }

    private locRadius:number = 3;
    /** returns random tile of given edge */
    public GetRandomEdgeTile(edge:number):number[]
    {
        //index roll over
        while(edge >= 4) { edge -= 4; }

        var coord:number[] = [0,0];
        switch(edge)
        {
            //top
            case 0:
                coord[0] = Math.floor(this.MazeTileObjects.length-(Math.random()*this.locRadius))-1;
                coord[1] = Math.floor(Math.random()*(this.MazeTileObjects[0].length*0.9))+1;
                break;
            //right
            case 1:
                coord[0] = Math.floor(Math.random()*(this.MazeTileObjects.length*0.9))+1;
                coord[1] = Math.floor(this.MazeTileObjects[0].length-(Math.random()*this.locRadius))-1;
                break;
            //bot
            case 2:
                coord[0] = Math.floor(Math.random()*this.locRadius)+1;
                coord[1] = Math.floor(Math.random()*(this.MazeTileObjects[0].length*0.9))+1;
                break;
            //left
            case 3:
                coord[0] = Math.floor(Math.random()*(this.MazeTileObjects.length*0.9))+1;
                coord[1] = Math.floor(Math.random()*this.locRadius)+1;
                break;
        }

        if(MazeGameManager.IsDebugging) console.log("Maze Game Manager: got random tile edge="+edge+" x="+coord[0]+", y="+coord[1]);
        //deviation will fail with smaller maps, ensure key exists within maze
        if(coord[0]>=this.MazeTileObjects.length) coord[0]-=2;
        if(coord[1]>=this.MazeTileObjects[0].length) coord[1]-=2;
        return coord;
    }
}