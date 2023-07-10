import { Animator, ColliderLayer, Entity, GltfContainer, InputAction, MeshCollider, MeshRenderer, Transform, engine, pointerEventsSystem } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";

export class MazePortalLock 
{
    IsFilled:boolean = false;
    Index:number;

    entityRot:Entity;
    entityPos:Entity;

    //callbacks
    //  called when lock is selected
    public Interact:(lock:MazePortalLock) => void = this.interact;
    private interact(lock:MazePortalLock):void { console.log("interact not set on lock"); }

    //constructor
    //  sets up tile object/count text for use
    constructor(index:number)
    {
        this.Index = index;

        //create rotational axis
        this.entityRot = engine.addEntity();
        Transform.create(this.entityRot,
        ({
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(1, 1, 1),
            rotation: Quaternion.fromEulerDegrees(0, 30+(60*this.Index), 0)
        }));
        //create tile entity
        this.entityPos = engine.addEntity();
        Transform.create(this.entityPos,
        ({
            parent: this.entityRot,
            position: Vector3.create(0, 1.14, 2.25),
            scale: Vector3.create(0.3, 0.3, 0.15),
            rotation: Quaternion.fromEulerDegrees(-60, 0, 0)
        }));
        /*GltfContainer.create(this.entity, {
            src: "models/maze-game/maze-lock.glb",
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });*/
        MeshRenderer.setBox(this.entityPos);
        MeshCollider.setBox(this.entityPos);

        //primary action -> interact with lock
        pointerEventsSystem.onPointerDown(
            {
                entity: this.entityPos,
                opts: 
                {
                    hoverText: "[E] - Lock "+this.Index,
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
        this.IsFilled = false;
    }
}