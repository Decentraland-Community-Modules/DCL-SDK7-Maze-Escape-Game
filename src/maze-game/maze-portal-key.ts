import { Animator, AudioSource, ColliderLayer, Entity, GltfContainer, InputAction, Material, MeshCollider, MeshRenderer, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import { Vector3, Quaternion, Color4 } from "@dcl/sdk/math";
import { ITEM_COLOURS } from "./config/maze-game-config";

export class MazePortalKey
{
    IsCollected:boolean = false;
    Index:number;

    entity:Entity;
    entityBeacon:Entity;

    scaleDef = {x:0.2, y:0.6, z:0.2};

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
        //set up renderer
        MeshRenderer.setSphere(this.entity);
        MeshCollider.setSphere(this.entity, ColliderLayer.CL_POINTER);
        //apply material
        Material.setPbrMaterial(this.entity, {
            albedoColor: ITEM_COLOURS[this.Index],
            metallic: 0.8,
            roughness: 0.1
        });
        //one of these days we will actually have working modular materials for custom shapes....
        /*GltfContainer.create(this.entity, {
            src: "models/maze-game/maze-key.glb",
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });*/
        //create key beacon entity
        this.entityBeacon = engine.addEntity();
        Transform.create(this.entityBeacon,
        ({
            parent: this.entity,
            position: Vector3.create(0, 8, 0),
            scale: Vector3.create(0.25, 20, 0.25),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //set up renderer
        MeshRenderer.setSphere(this.entityBeacon);
        //apply material
        Material.setPbrMaterial(this.entityBeacon, {
            emissiveColor: ITEM_COLOURS[this.Index],
            emissiveIntensity: 4,
        });

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
}