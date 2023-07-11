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
    constructor(index:number, par:Entity)
    {
        this.Index = index;

        //create rotational axis
        this.entityRot = engine.addEntity();
        Transform.create(this.entityRot,
        ({
            parent: par,
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(0.5, 0.5, 0.5),
            rotation: Quaternion.fromEulerDegrees(0, (60*this.Index), 0)
        }));
        //create tile entity
        this.entityPos = engine.addEntity();
        Transform.create(this.entityPos,
        ({
            parent: this.entityRot,
            position: Vector3.create(0, 0.9, 2.01),
            scale: Vector3.create(0.3, 0.3, 0.05),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
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