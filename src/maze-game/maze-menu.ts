
//handles constructing entry scene and talking stages

import { ColliderLayer, Entity, GltfContainer, InputAction, TextAlignMode, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import Dictionary from "../utilities/collections";
import { Vector3, Quaternion, Color4 } from "@dcl/sdk/math";
import { MENU2D_TYPE, MenuGroup2D, MenuObject2D } from "../utilities/menu-group-2D.ui";
import { MenuConfig } from "./config/menu-config";

//dirty b.c ran out of time
export class MazeGameMenu
{
    //access pocketing
    private static instance:undefined|MazeGameMenu;
    public static get Instance():MazeGameMenu
    {
        //ensure instance is set
        if(MazeGameMenu.instance === undefined)
        {
            MazeGameMenu.instance = new MazeGameMenu();
        }

        return MazeGameMenu.instance;
    }

    //current chat chain being processed, basically # of sessions player has played
    public chatChainIndex:number = -1;
    //current chat object being displayed
    private chatIndex:number = 0;

    //display/interact object
    private entity:Entity;
    public SetEntityState(state:boolean)
    {
        if(!state) Transform.getMutable(this.entity).scale = Vector3.Zero();
        else Transform.getMutable(this.entity).scale = Vector3.create(2,2,2);
    }

    public SetMenuState(state:boolean)
    {
        this.menuParent.IsVisible = state;
    }

    //menu object ref
    private menuParent:MenuObject2D;
    private menuImgContent:MenuObject2D;
    private menuTxtContent:MenuObject2D;
    private menuNextButton:MenuObject2D;

    //callbacks
    //  called when chat has ended
    public ChatEnd:() => void = this.chatEnd;
    private chatEnd():void { console.log("chat has ended but no callback has been assigned"); }

    public constructor()
    {
        console.log("menu obj initializing...");

        //build entry object
        this.entity = engine.addEntity();
        Transform.create(this.entity,
        ({
            position: Vector3.create(0, 0, 2.01),
            scale: Vector3.create(2, 2, 2),
            rotation: Quaternion.fromEulerDegrees(0, 180, 0)
        }));
        GltfContainer.create(this.entity, {
            src: "models/maze-game/maze-entry.glb",
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });

        //primary action -> interact with lock
        pointerEventsSystem.onPointerDown(
            {
                entity: this.entity,
                opts: 
                {
                    hoverText: "[E] - Activate",
                    button: InputAction.IA_ANY,
                    maxDistance: 8
                }
            },
            (e) => {
                if(e.button == InputAction.IA_PRIMARY || e.button == InputAction.IA_POINTER) this.SetChatChain(0);
            }
        );

        //generate display ui menu
        //  chat parent object (toggle this one)
        this.menuParent = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_ENTITY, "parent");
        this.menuParent.BackgroundColour = Color4.create(0.8,0.8,0.8,0.4);
        this.menuParent.PosTop = -160;
        this.menuParent.PosLeft = "30%";
        this.menuParent.Heigth = 130;
        this.menuParent.Width = 460;
        //  img foreground
        var piece:MenuObject2D = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_ENTITY, "img_foreground", ["parent"]);
        piece.BackgroundColour = Color4.create(0.0,0.0,0.0,0.8);
        piece.PosTop = 5;
        piece.PosLeft = 5;
        piece.Heigth = 120;
        piece.Width = 120;
        //  img content
        this.menuImgContent = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_IMAGE, "img_content", ["parent","img_foreground"]);
        this.menuImgContent.BackgroundColour = Color4.create(1.0,1.0,1.0,1);
        this.menuImgContent.PosTop = 0;
        this.menuImgContent.PosLeft = 0;
        this.menuImgContent.Heigth = 120;
        this.menuImgContent.Width = 120;/**/
        //= MenuConfig[this.chatChainIndex][this.chatIndex].Image;
        //  text foreground
        piece = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_ENTITY, "txt_foreground", ["parent"]);
        piece.BackgroundColour = Color4.create(0.0,0.0,0.0,0.8);
        piece.PosTop = 5;
        piece.PosLeft = 130;
        piece.Heigth = 120;
        piece.Width = 325;
        //  text content
        this.menuTxtContent = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_ENTITY, "txt_content", ["parent","txt_foreground"]);
        this.menuTxtContent.BackgroundColour = Color4.create(0.8,0.8,0.8,0.0);
        this.menuTxtContent.PosTop = -10;
        this.menuTxtContent.PosLeft = 5;
        this.menuTxtContent.Heigth = 110;
        this.menuTxtContent.Width = 325;
        this.menuTxtContent.TextValue = "THIS IS TEXT";
        //  click to continue chat button
        piece = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_ENTITY, "txt_preview", ["parent","txt_foreground","txt_content"]);
        piece.BackgroundColour = Color4.create(1.0,0,0.0,0.0);
        piece.PosTop = 15;
        piece.PosLeft = 0;
        piece.Heigth = 110;
        piece.Width = 325;
        piece.TextValue = "\n\n\n\n\n\n*click to continue...*";
        //  next chat button
        this.menuNextButton = MenuGroup2D.Instance.AddMenuObject(MENU2D_TYPE.MENU_BUTTON, "button", ["parent","txt_foreground","txt_content"]);
        this.menuNextButton.BackgroundColour = Color4.create(0.0,1,0.0,0.0);
        this.menuNextButton.PosTop = 0;
        this.menuNextButton.PosLeft = 0;
        this.menuNextButton.Heigth = 110;
        this.menuNextButton.Width = 325;
        this.menuNextButton.TextValue = "\n\n\n\n\n\n*click to continue...*";
        this.menuNextButton.MouseButtonEvent = this.CallbackNextChat;
        
        //hide menu by default
        this.menuParent.IsVisible = false;

        //begin rendering the ui
        MenuGroup2D.Instance.RenderUI();

        console.log("menu obj initialized!");
    }
    
    public SetChatChain(index:number)
    {
        //only allow chain changes (do redo-s)
        if(this.chatChainIndex == index) return;
        //set chain char chain
        this.chatChainIndex = index;
        //display first chat message of tar chain
        this.DisplayChat(0);
    }

    public DisplayChatChainNext()
    {
        //ensure chat chain exists
        if(this.chatChainIndex >= MenuConfig.length) return;
        //display first chat message of next chain
        this.chatChainIndex++;
        this.DisplayChat(0);
    }

    public CallbackNextChat() { MazeGameMenu.Instance.NextChat(); }
    //pushes chat forward
    public NextChat()
    {
        //push state
        this.chatIndex++;
        //ensure there are existing chat objects
        if(this.chatIndex >=  MenuConfig[this.chatChainIndex].length)
        {
            //if game start
            if(this.chatChainIndex == 0) this.ChatEnd();
            //if game end
            else this.SetMenuState(false);
        } 
        else
        {
            //process next chat
            this.DisplayChat(this.chatIndex);
        }
    }
    //sets display for chat
    public DisplayChat(index:number)
    {   
        console.log("displaying chat chain="+this.chatChainIndex+", index="+this.chatIndex);
        this.menuParent.IsVisible = true;
        //set tar chat
        this.chatIndex = index;
        //update display
        this.menuTxtContent.TextValue = MenuConfig[this.chatChainIndex][this.chatIndex].Text;
        if(MenuConfig[this.chatChainIndex][this.chatIndex].Image !== "")
        {
            console.log("displaying image: "+MenuConfig[this.chatChainIndex][this.chatIndex].Image);
            this.menuImgContent.BackgroundImage = MenuConfig[this.chatChainIndex][this.chatIndex].Image;
            this.menuImgContent.IsVisible = true;
        }
        else
        {
            this.menuImgContent.IsVisible = false;
        }
    }

}