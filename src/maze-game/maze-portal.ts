import { Animator, AudioSource, Billboard, BillboardMode, ColliderLayer, Entity, Font, GltfContainer, InputAction, MeshCollider, MeshRenderer, TextShape, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import { Vector3, Quaternion, Color4 } from "@dcl/sdk/math";

export class MazePortal
{
    state:number = 0;

    entity:Entity;
    displayEntity:Entity;
    displayText:Entity;
    soundEntities:Entity[];

    private static audioStrings:string[] = [
        "audio/sfx_stage_change.wav",
        "audio/sfx_victory.wav",
        "audio/sfx_stage_change.wav"
    ];

    private static stateStrings:string[] = [
        "THE PORTAL CALLS",//initialization
        "FIND THE KEYS",//active
        "YOU HAVE ESCAPED"//victory
    ];

    //callbacks
    //  called when lock is selected
    public Interact:() => void = this.interact;
    private interact():void { console.log("interact not set on portal"); }

    //constructor
    //  sets up key object/count text for use
    constructor(par:Entity)
    {
        //create portal entity
        this.entity = engine.addEntity();
        Transform.create(this.entity,
        ({
            parent: par,
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(2, 2, 2),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        GltfContainer.create(this.entity, {
            src: "models/maze-game/maze-portal.glb",
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });

        //primary action -> interact with lock
        pointerEventsSystem.onPointerDown(
            {
                entity: this.entity,
                opts: 
                {
                    hoverText: "[E] - Portal",
                    button: InputAction.IA_ANY,
                    maxDistance: 8
                }
            },
            (e) => {
                if(e.button == InputAction.IA_PRIMARY || e.button == InputAction.IA_POINTER) this.Interact();
            }
        );

        //TODO add skull
        //create display entity
        this.displayEntity = engine.addEntity();
        Transform.create(this.displayEntity, {
            parent: this.entity,
            position: Vector3.create(0, 1, 0),
        })
        // text label
        this.displayText = engine.addEntity();
        Transform.create(this.displayText, {
            parent: this.displayEntity,
            position: Vector3.create(0, 0 ,0), 
        });
        TextShape.create(this.displayText, {
            text: "GAME_STATE_TEXT", 
            font: Font.F_MONOSPACE,
            textColor: { r: 1, g: 1, b: 1, a:1 },
            fontSize: 3,
            outlineWidth: 0.15,
            outlineColor:{ r: 0, g: 0, b: 0 },
        });
        Billboard.create(this.displayText);

        //create sound entities
        this.soundEntities = []
        for (let i = 0; i < MazePortal.audioStrings.length; i++) {
            //entity
            const soundEntity = engine.addEntity();
            Transform.create(soundEntity,
            ({
                parent: this.entity,
                position: Vector3.create(0,0,0),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0, 0, 0)
            }));
            //audio source
            AudioSource.create(soundEntity, {
                audioClipUrl: MazePortal.audioStrings[i],
                loop: false,
                playing: false
            });
            //add to collection
            this.soundEntities.push(soundEntity);
        }
    }

    public SetState(state:number)
    {
        this.state = state;
        TextShape.getMutable(this.displayText).text = MazePortal.stateStrings[this.state];
    }

    public PlaySound(index:number)
    {
        //reset the place state to play from start
        AudioSource.getMutable(this.soundEntities[index]).playing = false;
        AudioSource.getMutable(this.soundEntities[index]).playing = true;
    }
}