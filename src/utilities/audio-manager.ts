import { AudioSource, AvatarAnchorPointType, AvatarAttach, Entity, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

/*      AUDIO MANAGER
    controls audio components in-scene, mainly lobby (game idle) and
    battle (during wave) music.

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: TheCryptoTrader69@gmail.com
*/
export class AudioManager
{
    //access pocketing
    private static instance:undefined|AudioManager;
    public static get Instance():AudioManager
    {
        //ensure instance is set
        if(AudioManager.instance === undefined)
        {
            AudioManager.instance = new AudioManager();
        }

        return AudioManager.instance;
    }

    private static audioStrings:string[] = [
        "audio/sfx_stage_change.wav"
    ];

    parentEntity:Entity;

    //lobby music
    private audioObjectLobby:Entity;
    private soundEffects:Entity[];

    //constructor
    constructor()
    {
        //parental entity
        this.parentEntity = engine.addEntity();
        Transform.create(this.parentEntity,
        ({
            position: Vector3.create(0,0,0),
            scale: Vector3.create(1,1,1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        AvatarAttach.create(this.parentEntity,{
            anchorPointId: AvatarAnchorPointType.AAPT_NAME_TAG,
        })

        //lobby music
        this.audioObjectLobby = engine.addEntity();
        Transform.create(this.audioObjectLobby,
        ({
            parent: this.parentEntity,
            position: Vector3.create(0,0,0),
            scale: Vector3.create(1,1,1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        AudioSource.create(this.audioObjectLobby, {
            audioClipUrl: "audio/music_scene.mp3",
            loop: true,
            playing: true,
            volume: 0.5,
        });

        //create sound entities
        this.soundEffects = []
        for (let i = 0; i < AudioManager.audioStrings.length; i++) {
            //entity
            const soundEntity = engine.addEntity();
            Transform.create(soundEntity,
            ({
                parent: this.parentEntity,
                position: Vector3.create(0,0,0),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0, 0, 0)
            }));
            //audio source
            AudioSource.create(soundEntity, {
                audioClipUrl: AudioManager.audioStrings[i],
                loop: false,
                playing: false,
                volume: 5
            });
            //add to collection
            this.soundEffects.push(soundEntity);
        }
    }

    PlaySound(index:number)
    {
        //reset the place state to play from start
        AudioSource.getMutable(this.soundEffects[index]).playing = false;
        AudioSource.getMutable(this.soundEffects[index]).playing = true;
    }
}