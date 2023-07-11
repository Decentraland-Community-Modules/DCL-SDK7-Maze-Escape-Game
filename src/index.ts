/*      mazer demo
    hi an welcome to our demo! this project was constructed for the decentraland
    2023 game jam by thecryptotrader69, echo, and theothercloak. hope you enjoy it!
*/
import { Vector3 } from '@dcl/sdk/math';
import { movePlayerTo } from '~system/RestrictedActions';
import { MazeGameManager } from './maze-game/maze-game-manager';
import { MazeGameMenu } from './maze-game/maze-menu';
import { AudioManager } from './utilities/audio-manager';

/**
 * main function that initializes scene and prepares it for play
 */
export function main() 
{
/*  MenuGroup2D.Instance.Test();*/

  //preload audio manager (just ensures all audio files are prep'd during load)
  AudioManager.Instance;

  //pare pare maze manager
  MazeGameManager.Instance.Initialize();
  
  //add linkage
  MazeGameMenu.Instance.ChatEnd = MazeGameManager.Instance.CallbackStartGame;
  
  //teleport player to start
  movePlayerTo({ newRelativePosition: Vector3.create(0, 0, -5), cameraTarget: Vector3.create(0, 1.5, 8) });
}