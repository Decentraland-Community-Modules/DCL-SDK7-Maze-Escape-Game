import { Animator, AudioSource, ColliderLayer, Entity, GltfContainer, InputAction, MeshCollider, MeshRenderer, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";

export class MazePortalKey
{
    IsCollected:boolean = false;
    Index:number;

    entity:Entity;
    soundEntities:Entity[];

    scaleDef = {x:0.2, y:0.6, z:0.2};

    private static audioStrings:string[] = [
        "audio/sfx_key_clicked.wav",
        "audio/sfx_key_slotted.wav"
    ];

    //callbacks
    //  called when key is selected
    public Interact:(key:MazePortalKey) => void = this.interact;
    private interact(key:MazePortalKey):void { console.log("interact not set on key"); }

    //constructor
    //  sets up key object/count text for use
    constructor(index:number)
    {
        this.Index = index;

        //create key entity
        this.entity = engine.addEntity();
        Transform.create(this.entity,
        ({
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(0.2, 0.6, 0.2),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //one of these days we will actually have working modular materials....
        /*GltfContainer.create(this.entity, {
            src: "models/maze-game/maze-key.glb",
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });*/
        MeshRenderer.setSphere(this.entity);
        MeshCollider.setSphere(this.entity, ColliderLayer.CL_POINTER);
        //MeshCollider.getMutable(this.entity)

        //primary action -> interact with key
        pointerEventsSystem.onPointerDown(
            {
                entity: this.entity,
                opts: 
                {
                    hoverText: "[E] - Key "+this.Index,
                    button: InputAction.IA_ANY,
                    maxDistance: 12
                }
            },
            (e) => {
                if(e.button == InputAction.IA_PRIMARY || e.button == InputAction.IA_POINTER) this.Interact(this);
            }
        );

        //create sound entities
        this.soundEntities = []
        for (let i = 0; i < MazePortalKey.audioStrings.length; i++) {
            //entity
            const soundEntity = engine.addEntity();
            Transform.create(soundEntity,
            ({
                position: Vector3.create(0,0,0),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0, 0, 0)
            }));
            Transform.getMutable(soundEntity).parent = this.entity;
            //audio source
            AudioSource.create(soundEntity, {
                audioClipUrl: MazePortalKey.audioStrings[i],
                loop: false,
                playing: false,
                volume: 0.5,
            });
            //add to collection
            this.soundEntities.push(soundEntity);
        }
    }

    public Reset()
    {
        this.IsCollected = false;
        this.SetState(true);
    }

    public SetState(state:boolean)
    {
        if(state) Transform.getMutable(this.entity).scale = Vector3.create(this.scaleDef.x, this.scaleDef.y, this.scaleDef.z);
        else  Transform.getMutable(this.entity).scale = Vector3.Zero();
    }

    public PlaySound(index:number)
    {
        //reset the place state to play from start
        AudioSource.getMutable(this.soundEntities[index]).playing = false;
        AudioSource.getMutable(this.soundEntities[index]).playing = true;
    }
}