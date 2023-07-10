import { Entity, engine, Transform, GltfContainer, ColliderLayer, Animator } from "@dcl/sdk/ecs";
import { Vector3, Quaternion } from "@dcl/sdk/math";

export class MazeTile
{
    private static MAZE_TILE_MODEL:string = "models/maze-game/maze-tile.glb";
    private static MAZE_TILE_ANIMS:string[] = [
        "anim_on","anim_off","anim_idle",
        "anim_collisions_on","anim_collisions_off","anim_collisions_idle"
    ];

    IsWall:boolean = false;

    entity:Entity;

    constructor()
    {
        //create object
        this.entity = engine.addEntity();
        Transform.create(this.entity,
        ({
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(2, 2, 2),//(0.1, 0.1, 0.1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //create model
        GltfContainer.create(this.entity, {
            src: MazeTile.MAZE_TILE_MODEL,
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });
        //add animator
        Animator.create(this.entity, {
            states:[
                { name: MazeTile.MAZE_TILE_ANIMS[0], clip: MazeTile.MAZE_TILE_ANIMS[0], playing: false, loop: false },
                { name: MazeTile.MAZE_TILE_ANIMS[1], clip: MazeTile.MAZE_TILE_ANIMS[1], playing: false, loop: false },
                { name: MazeTile.MAZE_TILE_ANIMS[2], clip: MazeTile.MAZE_TILE_ANIMS[2], playing: false, loop: false },
                { name: MazeTile.MAZE_TILE_ANIMS[3], clip: MazeTile.MAZE_TILE_ANIMS[3], playing: false, loop: false },
                { name: MazeTile.MAZE_TILE_ANIMS[4], clip: MazeTile.MAZE_TILE_ANIMS[4], playing: false, loop: false },
                { name: MazeTile.MAZE_TILE_ANIMS[5], clip: MazeTile.MAZE_TILE_ANIMS[5], playing: false, loop: false },
            ]
        });
    }

    public Reset()
    {
        this.IsWall = false;

        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[0]).playing = false;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[1]).playing = false;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[2]).playing = true;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[3]).playing = false;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[4]).playing = false;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[5]).playing = true;
    }

    /** changes the wall state of this tile */
    public SetState(state:boolean)
    {
        //only update if there is a change in state
        if(this.IsWall == state) return;
        this.IsWall = state;

        //update animations
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[0]).playing = this.IsWall;   //turn wall on
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[1]).playing = !this.IsWall;  //turn wall off
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[2]).playing = false;
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[3]).playing = this.IsWall;   //turn collider on
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[4]).playing = !this.IsWall;  //turn collider off
        Animator.getClip(this.entity, MazeTile.MAZE_TILE_ANIMS[5]).playing = false;
    }
}