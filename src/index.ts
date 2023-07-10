/*      mazer demo
    hi an welcome to our demo! this project was constructed for the decentraland
    2023 game jam by thecryptotrader69, echo, and theothercloak. hope you enjoy it!
*/
import { MazeGameManager } from './maze-game/maze-game-manager';
import { AudioManager } from './utilities/audio-manager';

/**
 * main function that initializes scene and prepares it for play
 */
export function main() 
{
  //prepare audio manager
  AudioManager.Instance;

  //start game
  MazeGameManager.Instance.Initialize();
}